// /app/api/chat/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { ProviderFactory } from '@/lib/ai-providers';
import { THERAPIST_SYSTEM_PROMPT } from '@/lib/prompts';
import { saveEncryptedMessage } from '@/lib/encryption/messages';

const COUPLES_SYSTEM_PROMPT = `You are a warm, empathetic couples therapist trained in Emotionally Focused Therapy (EFT) and the Gottman Method. Your role is to facilitate healthy communication between partners, helping them understand each other better and work through challenges together.

Always:
- Address both partners equally and fairly
- Help them express feelings in non-blaming ways
- Encourage active listening and validation
- Highlight positive interactions and strengths
- Guide them toward understanding, not winning
- Keep responses concise and focused (2-3 paragraphs max)
- Use inclusive language that makes both feel heard

Never:
- Take sides or show favoritism
- Make assumptions about who is "right"
- Give relationship advice that could be harmful
- Diagnose relationship problems
- Encourage separation unless safety is a concern

Focus on:
- "I feel" statements instead of "You always"
- Understanding each partner's perspective
- Finding common ground
- Building empathy between partners`;

export async function POST(request: NextRequest) {
  try {
    const { messages, mode = 'solo', sessionId, userId } = await request.json();

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json(
        { error: 'Messages array is required' },
        { status: 400 }
      );
    }

    // Get authorization header to pass to internal API calls
    const authHeader = request.headers.get('authorization');
    const cookieHeader = request.headers.get('cookie');

    // Authenticate user if userId is provided
    if (userId) {
      const supabase = await createClient();
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      
      if (authError || !user || user.id !== userId) {
        return NextResponse.json(
          { error: 'Unauthorized' },
          { status: 401 }
        );
      }
    }

    // Check message limit and get provider
    let provider, subscription, limitCheck;
    
    if (userId) {
      // Check if user can send message
      limitCheck = await ProviderFactory.checkMessageLimit(userId);
      
      if (!limitCheck.canSendMessage) {
        return NextResponse.json(
          {
            error: 'Message limit reached',
            remainingMessages: 0,
            tier: limitCheck.tier,
            message: 'You\'ve reached your monthly message limit. Please upgrade to Premium for unlimited messages.'
          },
          { status: 429 }
        );
      }
      
      // Get the appropriate provider for this user
      const providerInfo = await ProviderFactory.getProviderForUser(userId);
      provider = providerInfo.provider;
      subscription = providerInfo.subscription;
    } else {
      // Unauthenticated users get Groq (free tier experience)
      const { GroqProvider } = await import('@/lib/ai-providers/groq-provider');
      provider = new GroqProvider();
      subscription = { tier: 'free' };
      limitCheck = { canSendMessage: true, remainingMessages: 50, tier: 'free' };
    }

    // Determine system prompt based on mode
    const systemPrompt = mode === 'couple' ? COUPLES_SYSTEM_PROMPT : THERAPIST_SYSTEM_PROMPT;

    // Format messages for the AI provider
    const formattedMessages = [
      { role: 'system' as const, content: systemPrompt },
      ...messages
    ];

    // Create a streaming response
    let assistantMessage = '';
    const encoder = new TextEncoder();
    
    const stream = new ReadableStream({
      async start(controller) {
        try {
          // Stream the response
          for await (const chunk of provider.stream(formattedMessages)) {
            assistantMessage += chunk;
            controller.enqueue(encoder.encode(chunk));
          }
          
          controller.close();
          console.log('Streaming complete, assistantMessage length:', assistantMessage.length);

          // After streaming is complete, save the AI message
          if (sessionId && userId) {
            console.log('Have sessionId and userId, attempting to save...');
            try {
              console.log(`Saving AI message for session ${sessionId}, mode: ${mode}`);
              
              // Import and directly call saveEncryptedMessage instead of HTTP request
              const { saveEncryptedMessage } = await import('@/lib/encryption/messages');
              
              // Save the AI message directly
              await saveEncryptedMessage(
                sessionId,
                userId,
                'ai',
                assistantMessage
              );
              
              console.log('AI message saved successfully');
            } catch (error) {
              console.error('Error saving AI message:', error);
            }
          }

          // Increment message count after successful response (for authenticated users)
          if (userId) {
            await ProviderFactory.incrementMessageCount(userId);
          }
          
        } catch (error) {
          console.error('Streaming error:', error);
          controller.error(error);
        }
      },
    });

    // Return the stream with appropriate headers
    return new Response(stream, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Cache-Control': 'no-cache',
        'X-Model-Used': provider.model,
        'X-Provider': provider.name,
        'X-User-Tier': subscription?.tier || 'unknown',
        'X-Remaining-Messages': limitCheck?.remainingMessages?.toString() || 'unlimited'
      },
    });
    
  } catch (error) {
    console.error('Error in chat API:', error);
    
    // Check if it's a message limit error
    if (error instanceof Error && error.message.includes('limit reached')) {
      return NextResponse.json(
        { 
          error: error.message,
          upgrade: true 
        },
        { status: 429 }
      );
    }
    
    return NextResponse.json(
      { error: 'Failed to process chat request' },
      { status: 500 }
    );
  }
}