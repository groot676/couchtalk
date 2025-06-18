// /app/api/messages/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { saveEncryptedMessage, processMessagesForUser } from '@/lib/encryption/messages';
import { getUserEncryptionKey, getUserPrivacyMode } from '@/lib/encryption/keys';

export async function POST(request: NextRequest) {
  try {
    const { sessionId, userId, content, senderType, actualSenderId } = await request.json();

    if (!sessionId || !userId || !content || !senderType) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const supabase = await createClient();
    
    // Check if this is a couples session
    const { data: coupleSession } = await supabase
      .from('couple_sessions')
      .select('partner1_id')
      .eq('session_id', sessionId)
      .single();
    
    // CRITICAL: For couples sessions, ALWAYS use partner1's ID for encryption
    let encryptionUserId = userId;
    if (coupleSession && coupleSession.partner1_id) {
      encryptionUserId = coupleSession.partner1_id;
      console.log(`Couples session detected. Using partner1 (${encryptionUserId}) for encryption instead of ${userId}`);
    }
    
    // For tracking who actually sent the message
    const senderId = actualSenderId || userId;
    
    console.log(`Saving message:
      Session: ${sessionId}
      Encryption User: ${encryptionUserId}
      Actual Sender: ${senderId}
      Sender Type: ${senderType}`);
    
    // Save the message with encryption
    await saveEncryptedMessage(sessionId, encryptionUserId, senderType, content, senderId);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in POST /api/messages:', error);
    return NextResponse.json(
      { error: 'Failed to save message' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const sessionId = searchParams.get('sessionId');
    const userId = searchParams.get('userId');

    if (!sessionId || !userId) {
      return NextResponse.json(
        { error: 'Session ID and User ID are required' },
        { status: 400 }
      );
    }

    const supabase = await createClient();
    
    // Get all messages for the session
    const { data: messages, error } = await supabase
      .from('messages')
      .select('*')
      .eq('session_id', sessionId)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Error fetching messages:', error);
      throw error;
    }

    // Check if this is a couples session
    const { data: coupleSession } = await supabase
      .from('couple_sessions')
      .select('partner1_id')
      .eq('session_id', sessionId)
      .single();
    
    // Determine which user's key to use for decryption
    let decryptionUserId = userId;
    if (coupleSession && coupleSession.partner1_id) {
      decryptionUserId = coupleSession.partner1_id;
      console.log(`Couples session detected. Using partner1 (${decryptionUserId}) for decryption`);
    }
    
    // Process and decrypt messages
    const processedMessages = await processMessagesForUser(decryptionUserId, messages || []);
    
    return NextResponse.json({ messages: processedMessages });
  } catch (error) {
    console.error('Error in GET /api/messages:', error);
    return NextResponse.json(
      { error: 'Failed to fetch messages' },
      { status: 500 }
    );
  }
}