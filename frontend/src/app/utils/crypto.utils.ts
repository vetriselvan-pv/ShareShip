const SHARESHIP_SALT = 'shareship-auth-salt-v1';

/**
 * Client-side Password Encryption
 * Encrypts the password using AES-GCM before network transmission
 * so credentials are never sent as raw plaintext over the wire.
 */
export async function encryptPassword(password: string): Promise<string> {
  if (!password) return '';

  try {
    if (typeof window !== 'undefined' && window.crypto && window.crypto.subtle) {
      const enc = new TextEncoder();
      const saltBytes = enc.encode(SHARESHIP_SALT);
      const keyHash = await window.crypto.subtle.digest('SHA-256', saltBytes);
      const cryptoKey = await window.crypto.subtle.importKey(
        'raw',
        keyHash,
        { name: 'AES-GCM' },
        false,
        ['encrypt']
      );

      const iv = window.crypto.getRandomValues(new Uint8Array(12));
      const data = enc.encode(password);
      const ciphertextBuffer = await window.crypto.subtle.encrypt(
        { name: 'AES-GCM', iv },
        cryptoKey,
        data
      );

      // Combine IV (12 bytes) + Ciphertext and Auth Tag
      const combined = new Uint8Array(iv.length + ciphertextBuffer.byteLength);
      combined.set(iv, 0);
      combined.set(new Uint8Array(ciphertextBuffer), iv.length);

      // Convert to Base64
      let binary = '';
      const len = combined.byteLength;
      for (let i = 0; i < len; i++) {
        binary += String.fromCharCode(combined[i]);
      }
      return btoa(binary);
    }
  } catch (err) {
    console.warn('AES-GCM encryption fallback to base64 encoding', err);
  }

  // Fallback encoding if Web Crypto API is unavailable
  return btoa(unescape(encodeURIComponent(password)));
}
