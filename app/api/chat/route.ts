// /app/api/chat/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { openai, MODEL } from '@/lib/openai';
import { THERAPIST_SYSTEM_PROMPT } from '@/lib/prompts';
import { createClient } from '@/lib/supabase/server';
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

    const systemPrompt = mode === 'couple' ? COUPLES_SYSTEM_PROMPT : THERAPIST_SYSTEM_PROMPT;

    const completion = await openai.chat.completions.create({
      model: MODEL,
      messages: [
        { role: 'system', content: systemPrompt },
        ...messages
      ],
      temperature: 0.7,
      max_tokens: 500,
      stream: true,
    });

    // Create a ReadableStream to send the response
    let assistantMessage = '';
    const stream = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of completion) {
            const content = chunk.choices[0]?.delta?.content || '';
            if (content) {
              assistantMessage += content;
              controller.enqueue(new TextEncoder().encode(content));
            }
          }
          controller.close();
          console.log('Streaming complete, assistantMessage length:', assistantMessage.length);

          
          // After streaming is complete, save the AI message
          if (sessionId && userId) {
            console.log('Have sessionId and userId, attempting to save...');
            try {
              console.log(`Saving AI message for session ${sessionId}, mode: ${mode}`);
              
              // Let the messages API handle the encryption logic
              const saveResponse = await fetch(new URL('/api/messages', request.url).toString(), {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  sessionId,
                  userId,  // Pass the current user ID
                  content: assistantMessage,
                  senderType: 'ai'
                }),
              });
              
              if (!saveResponse.ok) {
                const error = await saveResponse.text();
                console.error('Failed to save AI message:', error);
              } else {
                console.log('AI message saved successfully');
              }
            } catch (error) {
              console.error('Error saving AI message:', error);
            }
          }
        } catch (error) {
          controller.error(error);
        }
      },
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Cache-Control': 'no-cache',
      },
    });
  } catch (error) {
    console.error('Error in chat API:', error);
    return NextResponse.json(
      { error: 'Failed to process chat request' },
      { status: 500 }
    );
  }
}