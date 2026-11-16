import { Injectable } from '@angular/core';
import { environment } from '../../environments/environment';

export interface EncryptedEnvelope {
  encrypted: true;
  v: number;
  payload: string;
}

@Injectable({
  providedIn: 'root',
})
export class CryptoService {
  private cachedKey: CryptoKey | null = null;
  private readonly secret: string = environment.aesSecret || 'shareship_aes_secret_key_v1_2026_secured';

  private async getKey(): Promise<CryptoKey> {
    if (this.cachedKey) {
      return this.cachedKey;
    }

    const enc = new TextEncoder();
    const keyHash = await window.crypto.subtle.digest('SHA-256', enc.encode(this.secret));
    this.cachedKey = await window.crypto.subtle.importKey(
      'raw',
      keyHash,
      { name: 'AES-GCM' },
      false,
      ['encrypt', 'decrypt']
    );
    return this.cachedKey;
  }

  /**
   * Encrypts any data payload into an AES-256-GCM Base64 string.
   * Output: Base64( 12-byte IV + Ciphertext + 16-byte Auth Tag )
   */
  async encrypt(data: unknown): Promise<string> {
    if (typeof window === 'undefined' || !window.crypto || !window.crypto.subtle) {
      throw new Error('Web Crypto API is not available in current environment');
    }

    const key = await this.getKey();
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

    return this.uint8ArrayToBase64(combined);
  }

  /**
   * Wraps data into a typed encrypted JSON envelope.
   */
  async wrapEncryptedEnvelope(data: unknown): Promise<EncryptedEnvelope> {
    const payload = await this.encrypt(data);
    return {
      encrypted: true,
      v: 1,
      payload,
    };
  }

  /**
   * Decrypts an AES-256-GCM Base64 string payload into the original typed object.
   */
  async decrypt<T = any>(base64Payload: string): Promise<T> {
    if (typeof window === 'undefined' || !window.crypto || !window.crypto.subtle) {
      throw new Error('Web Crypto API is not available in current environment');
    }

    const key = await this.getKey();
    const combined = this.base64ToUint8Array(base64Payload);

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
   * Checks if an object is an encrypted envelope.
   */
  isEncryptedEnvelope(obj: unknown): obj is EncryptedEnvelope {
    return (
      typeof obj === 'object' &&
      obj !== null &&
      (obj as any).encrypted === true &&
      typeof (obj as any).payload === 'string'
    );
  }

  private uint8ArrayToBase64(bytes: Uint8Array): string {
    let binary = '';
    const len = bytes.byteLength;
    for (let i = 0; i < len; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
  }

  private base64ToUint8Array(base64: string): Uint8Array {
    const binary = atob(base64);
    const len = binary.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    return bytes;
  }
}
