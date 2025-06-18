// /lib/encryption/keys.ts
import { createClient } from '@/lib/supabase/server';
import { 
  generateUserKey, 
  encryptUserKey, 
  decryptUserKey,
  packEncryptedData,
  unpackEncryptedData
} from './hybrid';

const MASTER_KEY = process.env.MASTER_ENCRYPTION_KEY!;

if (!MASTER_KEY) {
  throw new Error('MASTER_ENCRYPTION_KEY environment variable is not set');
}

/**
 * Creates and stores an encryption key for a new user
 */
export async function createUserEncryptionKey(userId: string): Promise<void> {
  const supabase = await createClient();
  
  // Generate a new key for the user
  const userKey = generateUserKey();
  
  // Encrypt the user's key with the master key
  const { encrypted, iv, tag, salt } = encryptUserKey(userKey, MASTER_KEY);
  
  // Pack the encrypted data
  const packedKey = packEncryptedData(encrypted, iv, tag);
  
  // Store in database
  const { error } = await supabase
    .from('user_encryption_keys')
    .insert({
      user_id: userId,
      encrypted_key: `${salt}:${packedKey}`
    });
    
  if (error) {
    console.error('Error creating user encryption key:', error);
    throw new Error('Failed to create user encryption key');
  }
}

/**
 * Retrieves and decrypts a user's encryption key
 */
export async function getUserEncryptionKey(userId: string): Promise<Buffer | null> {
  try {
    const supabase = await createClient();
    
    console.log(`Getting encryption key for user: ${userId}`);
    
    // First, let's check if the user exists
    const { data: userData, error: userError } = await supabase.auth.admin.getUserById(userId).catch(() => ({ data: null, error: 'Not admin' }));
    console.log('User lookup result:', userData ? 'User found' : 'User not found or not admin');
    
    // Get the encrypted key from database
    const { data, error } = await supabase
      .from('user_encryption_keys')
      .select('*')  // Select all columns for debugging
      .eq('user_id', userId)
      .maybeSingle();
      
    console.log('Encryption key query result:', { data, error });
      
    if (error) {
      console.error('Error retrieving user encryption key:', error);
      return null;
    }
    
    if (!data) {
      console.log(`No encryption key found for user ${userId}`);
      // Let's check if any keys exist at all
      const { data: allKeys } = await supabase
        .from('user_encryption_keys')
        .select('user_id')
        .limit(5);
      console.log('Sample of existing user IDs with keys:', allKeys?.map(k => k.user_id));
      return null;
    }
    
    console.log(`Found encryption key for user ${userId}`);
    
    // Extract salt and packed data
    const [salt, ...packedParts] = data.encrypted_key.split(':');
    const packedData = packedParts.join(':');
    
    // Unpack the encrypted data
    const { encrypted, iv, tag } = unpackEncryptedData(packedData);
    
    // Decrypt the user's key
    const decryptedKey = decryptUserKey(encrypted, MASTER_KEY, iv, tag, salt);
    console.log(`Successfully decrypted key for user ${userId}`);
    return decryptedKey;
  } catch (error) {
    console.error('Error in getUserEncryptionKey:', error);
    return null;
  }
}

/**
 * Checks if a user has an encryption key
 */
export async function userHasEncryptionKey(userId: string): Promise<boolean> {
  const supabase = await createClient();
  
  const { data, error } = await supabase
    .from('user_encryption_keys')
    .select('id')
    .eq('user_id', userId)
    .single();
    
  return !error && !!data;
}

/**
 * Sets a user's privacy mode
 */
export async function setUserPrivacyMode(
  userId: string, 
  mode: 'regular' | 'maximum'
): Promise<void> {
  const supabase = await createClient();
  
  // Update privacy mode
  const { error } = await supabase
    .from('user_profiles')
    .update({ privacy_mode: mode })
    .eq('id', userId);
    
  if (error) {
    console.error('Error updating privacy mode:', error);
    throw new Error('Failed to update privacy mode');
  }
  
  // If setting to regular mode and no key exists, create one
  if (mode === 'regular') {
    const hasKey = await userHasEncryptionKey(userId);
    if (!hasKey) {
      await createUserEncryptionKey(userId);
    }
  }
}

/**
 * Gets a user's privacy mode
 */
export async function getUserPrivacyMode(userId: string): Promise<'regular' | 'maximum' | null> {
  const supabase = await createClient();
  
  const { data, error } = await supabase
    .from('user_profiles')
    .select('privacy_mode')
    .eq('id', userId)
    .single();
    
  if (error || !data) {
    return null;
  }
  
  return data.privacy_mode as 'regular' | 'maximum';
}