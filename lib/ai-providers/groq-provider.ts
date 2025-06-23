// /lib/ai-providers/groq-provider.ts

import Groq from 'groq-sdk';
import { AIProvider, ChatMessage, ChatCompletionOptions, TokenUsage } from './types';
import { AI_MODELS } from './config';

export class GroqProvider implements AIProvider {
  private client: Groq;
  public name: string = 'groq';
  public model: string;
  private modelConfig: typeof AI_MODELS[keyof typeof AI_MODELS];

  constructor(modelKey: keyof typeof AI_MODELS = 'LLAMA3_70B_VERSATILE') {
    const apiKey = process.env.GROQ_API_KEY;
    
    if (!apiKey) {
      console.error('GROQ_API_KEY is not set in environment variables');
      throw new Error('GROQ_API_KEY is required');
    }
    
    console.log('Initializing Groq with API key:', apiKey.substring(0, 10) + '...');
    
    this.client = new Groq({
      apiKey: apiKey,
    });
    
    this.modelConfig = AI_MODELS[modelKey];
    this.model = this.modelConfig.model;
    console.log('Using Groq model:', this.model);
  }

  async chat(messages: ChatMessage[], options?: ChatCompletionOptions): Promise<string> {
    try {
      const completion = await this.client.chat.completions.create({
        messages,
        model: this.model,
        temperature: options?.temperature ?? 0.7,
        max_tokens: options?.maxTokens ?? 1000,
        top_p: options?.topP ?? 1,
        stream: false,
      });

      return completion.choices[0]?.message?.content || '';
    } catch (error) {
      console.error('Groq chat error:', error);
      if (error instanceof Error) {
        console.error('Error message:', error.message);
        console.error('Error stack:', error.stack);
      }
      throw new Error('Failed to get response from Groq');
    }
  }

  async *stream(messages: ChatMessage[], options?: ChatCompletionOptions): AsyncGenerator<string, void, unknown> {
    try {
      console.log('Starting Groq stream with messages:', messages.length);
      
      const stream = await this.client.chat.completions.create({
        messages,
        model: this.model,
        temperature: options?.temperature ?? 0.7,
        max_tokens: options?.maxTokens ?? 1000,
        top_p: options?.topP ?? 1,
        stream: true,
      });

      console.log('Groq stream created successfully');

      for await (const chunk of stream) {
        const content = chunk.choices[0]?.delta?.content || '';
        if (content) {
          yield content;
        }
      }
      
      console.log('Groq stream completed');
    } catch (error) {
      console.error('Groq streaming error details:', error);
      if (error instanceof Error) {
        console.error('Error name:', error.name);
        console.error('Error message:', error.message);
        console.error('Error stack:', error.stack);
        
        // Check for specific error types
        if (error.message.includes('401')) {
          throw new Error('Invalid Groq API key. Please check your GROQ_API_KEY environment variable.');
        } else if (error.message.includes('429')) {
          throw new Error('Groq rate limit exceeded. Please try again later.');
        }
      }
      throw new Error('Failed to stream response from Groq: ' + (error instanceof Error ? error.message : 'Unknown error'));
    }
  }

  estimateTokens(text: string): number {
    // More accurate token estimation for Mixtral
    // Mixtral uses similar tokenization to GPT models
    // Rough estimate: ~1 token per 4 characters for English text
    return Math.ceil(text.length / 4);
  }

  calculateCost(inputTokens: number, outputTokens: number): number {
    const inputCost = (inputTokens / 1000) * this.modelConfig.costPer1kTokens.input;
    const outputCost = (outputTokens / 1000) * this.modelConfig.costPer1kTokens.output;
    
    return inputCost + outputCost;
  }

  // Helper method to track token usage
  async chatWithUsage(messages: ChatMessage[], options?: ChatCompletionOptions): Promise<{
    content: string;
    usage: TokenUsage;
  }> {
    const inputText = messages.map(m => m.content).join(' ');
    const inputTokens = this.estimateTokens(inputText);
    
    const content = await this.chat(messages, options);
    const outputTokens = this.estimateTokens(content);
    
    const totalTokens = inputTokens + outputTokens;
    const cost = this.calculateCost(inputTokens, outputTokens);
    
    return {
      content,
      usage: {
        inputTokens,
        outputTokens,
        totalTokens,
        cost
      }
    };
  }
}