// /lib/ai-providers/types.ts

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface ChatCompletionOptions {
  temperature?: number;
  maxTokens?: number;
  topP?: number;
}

export interface TokenUsage {
  inputTokens: number;
  outputTokens: number;
  totalTokens: number;
  cost: number;
}

export interface AIProvider {
  name: string;
  model: string;
  
  // Non-streaming chat
  chat(messages: ChatMessage[], options?: ChatCompletionOptions): Promise<string>;
  
  // Streaming chat
  stream(messages: ChatMessage[], options?: ChatCompletionOptions): AsyncGenerator<string, void, unknown>;
  
  // Token counting and cost calculation
  estimateTokens(text: string): number;
  calculateCost(inputTokens: number, outputTokens: number): number;
}

export interface UserSubscription {
  tier: 'free' | 'premium' | 'pro';
  monthlyMessageCount: number;
  messageResetDate: Date;
  customerId?: string;
  subscriptionId?: string;
}