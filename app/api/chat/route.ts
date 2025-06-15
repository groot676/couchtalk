import { NextRequest, NextResponse } from 'next/server';
import { openai, MODEL } from '@/lib/openai';
import { THERAPIST_SYSTEM_PROMPT } from '@/lib/prompts';

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
    const { messages, mode = 'solo' } = await request.json();

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
    const stream = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of completion) {
            const content = chunk.choices[0]?.delta?.content || '';
            if (content) {
              controller.enqueue(new TextEncoder().encode(content));
            }
          }
          controller.close();
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