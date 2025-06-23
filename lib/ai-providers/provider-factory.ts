// /lib/ai-providers/provider-factory.ts

import { createClient } from '@/lib/supabase/server';
import { OpenAIProvider } from './openai-provider';
import { GroqProvider } from './groq-provider';
import { AIProvider, UserSubscription } from './types';
import { USER_TIER_CONFIG, SYSTEM_PROMPTS } from './config';

export class ProviderFactory {
  static async getProviderForUser(userId: string): Promise<{
    provider: AIProvider;
    systemPrompt: string;
    subscription: UserSubscription;
  }> {
    const supabase = await createClient();
    
    // Get user profile with subscription info
    const { data: profile, error } = await supabase
      .from('user_profiles')
      .select('subscription_tier, monthly_message_count, message_reset_date')
      .eq('id', userId)
      .single();
    
    if (error || !profile) {
      console.error('Error fetching user profile:', error);
      // Default to free tier if error
      return {
        provider: new GroqProvider('LLAMA3_70B_VERSATILE'),
        systemPrompt: SYSTEM_PROMPTS.LLAMA,
        subscription: {
          tier: 'free',
          monthlyMessageCount: 0,
          messageResetDate: new Date()
        }
      };
    }
    
    // Check if message count needs reset (monthly)
    const resetDate = new Date(profile.message_reset_date);
    const now = new Date();
    if (now.getMonth() !== resetDate.getMonth() || now.getFullYear() !== resetDate.getFullYear()) {
      // Reset message count for new month
      await supabase
        .from('user_profiles')
        .update({
          monthly_message_count: 0,
          message_reset_date: now.toISOString()
        })
        .eq('id', userId);
      
      profile.monthly_message_count = 0;
    }
    
    const tier = (profile.subscription_tier || 'free') as keyof typeof USER_TIER_CONFIG;
    const tierConfig = USER_TIER_CONFIG[tier];
    
    // Check message limits for free tier
    if (tier === 'free' && tierConfig.monthlyMessageLimit) {
      if (profile.monthly_message_count >= tierConfig.monthlyMessageLimit) {
        throw new Error('Monthly message limit reached. Please upgrade to Premium for unlimited messages.');
      }
    }
    
    // Create appropriate provider based on tier
    let provider: AIProvider;
    let systemPrompt: string;
    
    if (tier === 'free') {
      provider = new GroqProvider('LLAMA3_70B_VERSATILE');
      systemPrompt = SYSTEM_PROMPTS.LLAMA;
    } else {
      provider = new OpenAIProvider('GPT_4_TURBO');
      systemPrompt = SYSTEM_PROMPTS.GPT4;
    }
    
    return {
      provider,
      systemPrompt,
      subscription: {
        tier,
        monthlyMessageCount: profile.monthly_message_count || 0,
        messageResetDate: new Date(profile.message_reset_date)
      }
    };
  }
  
  static async incrementMessageCount(userId: string): Promise<void> {
    const supabase = await createClient();
    
    // Increment message count
    const { error } = await supabase.rpc('increment_message_count', {
      user_id: userId
    });
    
    if (error) {
      console.error('Error incrementing message count:', error);
    }
  }
  
  static async checkMessageLimit(userId: string): Promise<{
    canSendMessage: boolean;
    remainingMessages: number | null;
    tier: string;
  }> {
    const supabase = await createClient();
    
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('subscription_tier, monthly_message_count')
      .eq('id', userId)
      .single();
    
    if (!profile) {
      return { canSendMessage: true, remainingMessages: 50, tier: 'free' };
    }
    
    const tier = (profile.subscription_tier || 'free') as keyof typeof USER_TIER_CONFIG;
    const tierConfig = USER_TIER_CONFIG[tier];
    
    if (!tierConfig.monthlyMessageLimit) {
      // Unlimited messages
      return { canSendMessage: true, remainingMessages: null, tier };
    }
    
    const remaining = tierConfig.monthlyMessageLimit - (profile.monthly_message_count || 0);
    
    return {
      canSendMessage: remaining > 0,
      remainingMessages: Math.max(0, remaining),
      tier
    };
  }
}