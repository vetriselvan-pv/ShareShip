import { environment } from '../../environments/environment';

const DEFAULT_SECRET = 'shareship_aes_secret_key_v1_2026_secured';

let cachedKey: CryptoKey | null = null;

async function getCryptoKey(): Promise<CryptoKey> {
  if (cachedKey) return cachedKey;
  const secret = environment.aesSecret || DEFAULT_SECRET;
  const enc = new TextEncoder();
  const keyHash = await window.crypto.subtle.digest('SHA-256', enc.encode(secret));
  cachedKey = await window.crypto.subtle.importKey(
    'raw',
    keyHash,
    { name: 'AES-GCM' },
    false,
    ['encrypt', 'decrypt']
  );
  return cachedKey;
}

function uint8ArrayToBase64(bytes: Uint8Array): string {
  let binary = '';
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

function base64ToUint8Array(base64: string): Uint8Array {
  const binary = atob(base64);
  const len = binary.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

/**
 * Encrypts an object or string into AES-256-GCM Base64 string.
 * Output: Base64( 12-byte IV + Ciphertext + 16-byte Auth Tag )
 */
export async function encryptPayload(data: unknown): Promise<string> {
  if (typeof window === 'undefined' || !window.crypto || !window.crypto.subtle) {
    throw new Error('Web Crypto API is not available');
  }

  const key = await getCryptoKey();
  const text = typeof data === 'string' ? data : JSON.stringify(data);
  const enc = new TextEncoder();
  const iv = window.crypto.getRandomValues(new Uint8Array(12));

  const ciphertextBuffer = await window.crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    key,
    enc.encode(text)
  );

  const combined = new Uint8Array(iv.length + ciphertextBuffer.byteLength);
  combined.set(iv, 0);
  combined.set(new Uint8Array(ciphertextBuffer), iv.length);

  return uint8ArrayToBase64(combined);
}

/**
 * Decrypts an AES-256-GCM Base64 string payload into the original typed object.
 */
export async function decryptPayload<T = any>(base64Payload: string): Promise<T> {
  if (typeof window === 'undefined' || !window.crypto || !window.crypto.subtle) {
    throw new Error('Web Crypto API is not available');
  }

  const key = await getCryptoKey();
  const combined = base64ToUint8Array(base64Payload);

  if (combined.byteLength < 28) {
    throw new Error('Invalid encrypted payload: buffer too short');
  }

  const iv = new Uint8Array(combined.slice(0, 12));
  const ciphertextAndTag = new Uint8Array(combined.slice(12));

  const decryptedBuffer = await window.crypto.subtle.decrypt(
    { name: 'AES-GCM', iv: iv as unknown as BufferSource },
    key,
    ciphertextAndTag as unknown as BufferSource
  );

  const text = new TextDecoder().decode(decryptedBuffer);
  try {
    return JSON.parse(text) as T;
  } catch {
    return text as unknown as T;
  }
}

/**
 * Wraps data into a typed encrypted JSON envelope.
 */
export async function wrapEncryptedEnvelope(data: unknown): Promise<{ encrypted: true; v: number; payload: string }> {
  const payload = await encryptPayload(data);
  return {
    encrypted: true,
    v: 1,
    payload,
  };
}

/**
 * Safely decrypts a response if it is an encrypted envelope; returns as-is otherwise.
 */
export async function safeDecryptResponse<T = any>(data: any): Promise<T> {
  if (data && typeof data === 'object' && data.encrypted === true && typeof data.payload === 'string') {
    return await decryptPayload<T>(data.payload);
  }
  return data as T;
}

/**
 * Client-side Password Encryption
 * Encrypts password using AES-256-GCM before transmission.
 */
export async function encryptPassword(password: string): Promise<string> {
  if (!password) return '';
  try {
    return await encryptPayload(password);
  } catch (err) {
    console.warn('AES-GCM password encryption fallback:', err);
    return btoa(unescape(encodeURIComponent(password)));
  }
}
