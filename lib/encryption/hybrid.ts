// /lib/encryption/hybrid.ts
import crypto from 'crypto';

const ALGORITHM = 'aes-256-gcm';
const SALT_LENGTH = 32;
const IV_LENGTH = 16;
const KEY_LENGTH = 32;
const ITERATIONS = 100000;

/**
 * Derives an encryption key from a password using PBKDF2
 */
export function deriveKey(password: string, salt: Buffer): Buffer {
  return crypto.pbkdf2Sync(password, salt, ITERATIONS, KEY_LENGTH, 'sha256');
}

/**
 * Generates a random salt
 */
export function generateSalt(): Buffer {
  return crypto.randomBytes(SALT_LENGTH);
}

/**
 * Encrypts data using AES-256-GCM
 */
export function encrypt(text: string, key: Buffer): {
  encrypted: string;
  iv: string;
  tag: string;
} {
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
  
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  
  const tag = cipher.getAuthTag();
  
  return {
    encrypted,
    iv: iv.toString('hex'),
    tag: tag.toString('hex')
  };
}

/**
 * Decrypts data using AES-256-GCM
 */
export function decrypt(
  encryptedData: string,
  key: Buffer,
  iv: string,
  tag: string
): string {
  const decipher = crypto.createDecipheriv(
    ALGORITHM,
    key,
    Buffer.from(iv, 'hex')
  );
  
  decipher.setAuthTag(Buffer.from(tag, 'hex'));
  
  let decrypted = decipher.update(encryptedData, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  
  return decrypted;
}

/**
 * Encrypts a user's encryption key with the master key
 */
export function encryptUserKey(userKey: Buffer, masterKey: string): {
  encrypted: string;
  iv: string;
  tag: string;
  salt: string;
} {
  const salt = generateSalt();
  const derivedKey = deriveKey(masterKey, salt);
  const result = encrypt(userKey.toString('hex'), derivedKey);
  
  return {
    ...result,
    salt: salt.toString('hex')
  };
}

/**
 * Decrypts a user's encryption key with the master key
 */
export function decryptUserKey(
  encryptedKey: string,
  masterKey: string,
  iv: string,
  tag: string,
  salt: string
): Buffer {
  const derivedKey = deriveKey(masterKey, Buffer.from(salt, 'hex'));
  const decrypted = decrypt(encryptedKey, derivedKey, iv, tag);
  return Buffer.from(decrypted, 'hex');
}

/**
 * Generates a new encryption key for a user
 */
export function generateUserKey(): Buffer {
  return crypto.randomBytes(KEY_LENGTH);
}

/**
 * Encrypts a message with a user's key
 */
export function encryptMessage(message: string, userKey: Buffer): {
  encrypted: string;
  iv: string;
  tag: string;
} {
  return encrypt(message, userKey);
}

/**
 * Decrypts a message with a user's key
 */
export function decryptMessage(
  encryptedMessage: string,
  userKey: Buffer,
  iv: string,
  tag: string
): string {
  return decrypt(encryptedMessage, userKey, iv, tag);
}

/**
 * Combines IV and tag with encrypted content for storage
 */
export function packEncryptedData(encrypted: string, iv: string, tag: string): string {
  return `${iv}:${tag}:${encrypted}`;
}

/**
 * Extracts IV, tag, and encrypted content from packed data
 */
export function unpackEncryptedData(packedData: string): {
  encrypted: string;
  iv: string;
  tag: string;
} {
  const [iv, tag, ...encryptedParts] = packedData.split(':');
  return {
    iv,
    tag,
    encrypted: encryptedParts.join(':')
  };
}