// /lib/encryption/messages.ts
import { createClient } from '@/lib/supabase/server';
import { getUserEncryptionKey, getUserPrivacyMode } from './keys';
import { encryptMessage, decryptMessage, packEncryptedData, unpackEncryptedData } from './hybrid';

// At the top of the file, make sure all interfaces are exported
export interface EncryptedMessage {
  content?: string;
  encrypted_content?: string;
  encryption_type: 'none' | 'hybrid' | 'e2ee';
}

export interface ProcessedMessage extends EncryptedMessage {
  id: string;
  session_id: string;
  sender_id: string | null;
  sender_type: string;
  created_at: string;
}

/**
 * Encrypts a message before storing in the database
 */
export async function encryptMessageContent(
  userId: string,
  content: string
): Promise<{ encrypted_content: string; encryption_type: 'hybrid' | 'none' }> {
  // Check user's privacy mode
  const privacyMode = await getUserPrivacyMode(userId);
  
  // If not in regular mode or no encryption key, store unencrypted
  if (privacyMode !== 'regular') {
    return { encrypted_content: content, encryption_type: 'none' };
  }
  
  // Get user's encryption key
  const userKey = await getUserEncryptionKey(userId);
  if (!userKey) {
    console.warn(`No encryption key found for user ${userId}, storing unencrypted`);
    return { encrypted_content: content, encryption_type: 'none' };
  }
  
  try {
    // Encrypt the message
    const { encrypted, iv, tag } = encryptMessage(content, userKey);
    const packedData = packEncryptedData(encrypted, iv, tag);
    
    return {
      encrypted_content: packedData,
      encryption_type: 'hybrid'
    };
  } catch (error) {
    console.error('Error encrypting message:', error);
    // Fallback to unencrypted
    return { encrypted_content: content, encryption_type: 'none' };
  }
}

/**
 * Decrypts a message after retrieving from the database
 */
export async function decryptMessageContent(
  userId: string,
  message: EncryptedMessage,
  userKey?: Buffer | null
): Promise<string> {
  // If not encrypted, return as is
  if (message.encryption_type === 'none' || !message.encrypted_content) {
    return message.content || message.encrypted_content || '';
  }
  
  // If E2EE, return encrypted content (client will decrypt)
  if (message.encryption_type === 'e2ee') {
    return message.encrypted_content;
  }
  
  // Handle hybrid encryption
  if (message.encryption_type === 'hybrid') {
    // Use provided key or fetch it
    const key = userKey || await getUserEncryptionKey(userId);
    if (!key) {
      console.error(`No encryption key found for user ${userId}`);
      return '[Message encrypted - key not found]';
    }
    
    try {
      const { encrypted, iv, tag } = unpackEncryptedData(message.encrypted_content);
      return decryptMessage(encrypted, key, iv, tag);
    } catch (error) {
      console.error('Error decrypting message:', error);
      return '[Message encrypted - decryption failed]';
    }
  }
  
  return message.content || '';
}

/**
 * Processes messages for a session, decrypting as needed with parallel processing
 */
export async function processMessagesForUser(
  userId: string,
  messages: ProcessedMessage[]
): Promise<ProcessedMessage[]> {
  // Get user key once for all messages
  const userKey = await getUserEncryptionKey(userId);
  
  // Process messages in parallel for better performance
  const decryptionPromises = messages.map(async (message) => {
    if (message.encryption_type === 'none') {
      return message;
    } else if (message.encryption_type === 'hybrid') {
      // Decrypt hybrid encrypted messages
      const decryptedContent = await decryptMessageContent(userId, message, userKey);
      return {
        ...message,
        content: decryptedContent,
        // Don't send encrypted content to client
        encrypted_content: undefined
      };
    } else if (message.encryption_type === 'e2ee') {
      // For E2EE, send encrypted content as is (client will decrypt)
      return {
        ...message,
        content: message.encrypted_content,
        encrypted_content: undefined
      };
    }
    return message;
  });
  
  // Wait for all decryptions to complete
  return Promise.all(decryptionPromises);
}

/**
 * Saves a message with encryption
 */
export async function saveEncryptedMessage(
  sessionId: string,
  userId: string,
  senderType: 'user' | 'ai' | 'partner',
  content: string,
  actualSenderId?: string
): Promise<void> {
  const supabase = await createClient();
  
  console.log(`saveEncryptedMessage called - userId: ${userId}, actualSenderId: ${actualSenderId}, senderType: ${senderType}`);
  
  // Check if encryption should be applied
  const privacyMode = await getUserPrivacyMode(userId);
  const shouldEncrypt = privacyMode === 'regular';
  
  console.log(`Privacy mode for user ${userId}: ${privacyMode}, shouldEncrypt: ${shouldEncrypt}`);
  
  // Use actualSenderId if provided (for couples sessions), otherwise use userId
  const senderId = actualSenderId || userId;
  
  let messageData: Record<string, unknown> = {
    session_id: sessionId,
    sender_id: senderType === 'ai' ? null : senderId,
    sender_type: senderType,
  };
  
  if (shouldEncrypt) {
    // Encrypt both user and AI messages when in regular privacy mode
    const { encrypted_content, encryption_type } = await encryptMessageContent(userId, content);
    messageData = {
      ...messageData,
      encrypted_content,
      encryption_type,
      content: encryption_type === 'none' ? content : null
    };
  } else {
    // No encryption when not in regular privacy mode
    messageData = {
      ...messageData,
      content,
      encryption_type: 'none'
    };
  }
  
  const { error } = await supabase
    .from('messages')
    .insert(messageData);
    
  if (error) {
    console.error('Error saving message:', error);
    throw new Error('Failed to save message');
  }
}