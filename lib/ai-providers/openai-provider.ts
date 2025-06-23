// /lib/ai-providers/openai-provider.ts

import OpenAI from 'openai';
import { AIProvider, ChatMessage, ChatCompletionOptions, TokenUsage } from './types';
import { AI_MODELS } from './config';

export class OpenAIProvider implements AIProvider {
  private client: OpenAI;
  public name: string = 'openai';
  public model: string;
  private modelConfig: typeof AI_MODELS[keyof typeof AI_MODELS];

  constructor(modelKey: keyof typeof AI_MODELS = 'GPT_4_TURBO') {
    this.client = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY || '',
    });
    
    this.modelConfig = AI_MODELS[modelKey];
    this.model = this.modelConfig.model;
  }

  async chat(messages: ChatMessage[], options?: ChatCompletionOptions): Promise<string> {
    try {
      const completion = await this.client.chat.completions.create({
        model: this.model,
        messages,
        temperature: options?.temperature ?? 0.7,
        max_tokens: options?.maxTokens ?? 1000,
        top_p: options?.topP ?? 1,
        frequency_penalty: 0.5,
        presence_penalty: 0.5,
      });

      return completion.choices[0]?.message?.content || '';
    } catch (error) {
      console.error('OpenAI chat error:', error);
      throw new Error('Failed to get response from OpenAI');
    }
  }

  async *stream(messages: ChatMessage[], options?: ChatCompletionOptions): AsyncGenerator<string, void, unknown> {
    try {
      const stream = await this.client.chat.completions.create({
        model: this.model,
        messages,
        temperature: options?.temperature ?? 0.7,
        max_tokens: options?.maxTokens ?? 1000,
        top_p: options?.topP ?? 1,
        frequency_penalty: 0.5,
        presence_penalty: 0.5,
        stream: true,
      });

      for await (const chunk of stream) {
        const content = chunk.choices[0]?.delta?.content || '';
        if (content) {
          yield content;
        }
      }
    } catch (error) {
      console.error('OpenAI streaming error:', error);
      throw new Error('Failed to stream response from OpenAI');
    }
  }

  estimateTokens(text: string): number {
    // OpenAI's rough token estimation
    // More accurate would be to use tiktoken library
    return Math.ceil(text.length / 4);
  }

  calculateCost(inputTokens: number, outputTokens: number): number {
    const inputCost = (inputTokens / 1000) * this.modelConfig.costPer1kTokens.input;
    const outputCost = (outputTokens / 1000) * this.modelConfig.costPer1kTokens.output;
    
    return inputCost + outputCost;
  }

  // Get actual token usage from OpenAI response
  async chatWithUsage(messages: ChatMessage[], options?: ChatCompletionOptions): Promise<{
    content: string;
    usage: TokenUsage;
  }> {
    try {
      const completion = await this.client.chat.completions.create({
        model: this.model,
        messages,
        temperature: options?.temperature ?? 0.7,
        max_tokens: options?.maxTokens ?? 1000,
        top_p: options?.topP ?? 1,
        frequency_penalty: 0.5,
        presence_penalty: 0.5,
      });

      const usage = completion.usage;
      const content = completion.choices[0]?.message?.content || '';
      
      return {
        content,
        usage: {
          inputTokens: usage?.prompt_tokens || 0,
          outputTokens: usage?.completion_tokens || 0,
          totalTokens: usage?.total_tokens || 0,
          cost: this.calculateCost(
            usage?.prompt_tokens || 0,
            usage?.completion_tokens || 0
          )
        }
      };
    } catch (error) {
      console.error('OpenAI chat with usage error:', error);
      throw new Error('Failed to get response from OpenAI');
    }
  }
}