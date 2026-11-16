import crypto from 'crypto';
import { env } from '../config/env.js';

/**
 * Derives a consistent 256-bit (32 bytes) key from the configured secret.
 */
function getDerivedKey(): Buffer {
  const secret = env.APP_AES_SECRET;
  return crypto.createHash('sha256').update(secret).digest();
}

let cachedKey: Buffer | null = null;
function getKey(): Buffer {
  if (!cachedKey) {
    cachedKey = getDerivedKey();
  }
  return cachedKey;
}

export interface EncryptedEnvelope {
  encrypted: true;
  v: number;
  payload: string;
}

/**
 * Encrypts an object, array, or string into AES-256-GCM.
 * Output format: Base64( 12-byte IV + Ciphertext + 16-byte Auth Tag )
 */
export function encryptPayload(data: unknown): string {
  const key = getKey();
  const text = typeof data === 'string' ? data : JSON.stringify(data);
  const iv = crypto.randomBytes(12);

  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
  const ciphertext = Buffer.concat([cipher.update(text, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();

  // Combine IV (12 bytes) + Ciphertext + Tag (16 bytes)
  const combined = Buffer.concat([iv, ciphertext, tag]);
  return combined.toString('base64');
}

/**
 * Wraps data into a typed encrypted JSON envelope.
 */
export function wrapEncryptedEnvelope(data: unknown): EncryptedEnvelope {
  return {
    encrypted: true,
    v: 1,
    payload: encryptPayload(data),
  };
}

/**
 * Decrypts an AES-256-GCM Base64 string payload.
 * Expects: Base64( 12-byte IV + Ciphertext + 16-byte Auth Tag )
 */
export function decryptPayload<T = any>(base64Payload: string): T {
  if (!base64Payload || typeof base64Payload !== 'string') {
    throw new Error('Invalid encrypted payload: string expected');
  }

  const key = getKey();
  const buf = Buffer.from(base64Payload, 'base64');

  if (buf.length < 28) {
    throw new Error('Invalid encrypted payload: buffer too short');
  }

  const iv = buf.subarray(0, 12);
  const tag = buf.subarray(buf.length - 16);
  const ciphertext = buf.subarray(12, buf.length - 16);

  const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
  decipher.setAuthTag(tag);

  const decryptedStr = Buffer.concat([
    decipher.update(ciphertext),
    decipher.final(),
  ]).toString('utf8');

  try {
    return JSON.parse(decryptedStr) as T;
  } catch {
    return decryptedStr as unknown as T;
  }
}

/**
 * Checks if a request body is an encrypted envelope.
 */
export function isEncryptedEnvelope(body: unknown): body is EncryptedEnvelope {
  return (
    typeof body === 'object' &&
    body !== null &&
    (body as any).encrypted === true &&
    typeof (body as any).payload === 'string'
  );
}
