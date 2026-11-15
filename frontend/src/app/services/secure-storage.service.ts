import { Injectable } from '@angular/core';
import { SecureStoragePlugin } from 'capacitor-secure-storage-plugin';

@Injectable({
  providedIn: 'root',
})
export class SecureStorageService {
  /**
   * Securely saves a string value.
   * On iOS uses Keychain.
   * On Android uses KeyStore with EncryptedSharedPreferences.
   * On Web falls back to encoded browser storage.
   */
  async setItem(key: string, value: string): Promise<boolean> {
    try {
      const res = await SecureStoragePlugin.set({ key, value });
      return res.value;
    } catch (err) {
      console.warn(`[SecureStorage] Failed to set "${key}":`, err);
      return false;
    }
  }

  /**
   * Retrieves a securely stored string value by key.
   * Returns `null` if the key does not exist or cannot be read.
   */
  async getItem(key: string): Promise<string | null> {
    try {
      const res = await SecureStoragePlugin.get({ key });
      return res.value;
    } catch {
      // Rejection is expected when key does not exist
      return null;
    }
  }

  /**
   * Removes a specific item from secure storage.
   */
  async removeItem(key: string): Promise<boolean> {
    try {
      const res = await SecureStoragePlugin.remove({ key });
      return res.value;
    } catch {
      return false;
    }
  }

  /**
   * Clears all secure storage entries managed by this plugin.
   */
  async clear(): Promise<boolean> {
    try {
      const res = await SecureStoragePlugin.clear();
      return res.value;
    } catch (err) {
      console.warn('[SecureStorage] Clear error:', err);
      return false;
    }
  }

  /**
   * Lists all stored keys in secure storage.
   */
  async keys(): Promise<string[]> {
    try {
      const res = await SecureStoragePlugin.keys();
      return res.value || [];
    } catch {
      return [];
    }
  }

  /**
   * Serializes and securely stores an object as JSON.
   */
  async setObject<T>(key: string, value: T): Promise<boolean> {
    try {
      const jsonStr = JSON.stringify(value);
      return await this.setItem(key, jsonStr);
    } catch (err) {
      console.warn(`[SecureStorage] Failed to serialize "${key}":`, err);
      return false;
    }
  }

  /**
   * Retrieves and deserializes a JSON object from secure storage.
   */
  async getObject<T>(key: string): Promise<T | null> {
    const raw = await this.getItem(key);
    if (!raw) return null;
    try {
      return JSON.parse(raw) as T;
    } catch (err) {
      console.warn(`[SecureStorage] Failed to parse JSON for "${key}":`, err);
      return null;
    }
  }
}
