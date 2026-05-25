import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';

interface SupabaseStorage {
  getItem: (key: string) => Promise<string | null>;
  setItem: (key: string, value: string) => Promise<void>;
  removeItem: (key: string) => Promise<void>;
}

const SECURE_STORE_KEY_PATTERN = /[^A-Za-z0-9._-]/g;

function normaliseKey(key: string): string {
  return key.replace(SECURE_STORE_KEY_PATTERN, '_');
}

const nativeSecureStorage: SupabaseStorage = {
  getItem: (key) => SecureStore.getItemAsync(normaliseKey(key)),
  setItem: (key, value) => SecureStore.setItemAsync(normaliseKey(key), value),
  removeItem: (key) => SecureStore.deleteItemAsync(normaliseKey(key)),
};

function isPkceKey(key: string): boolean {
  return key.includes('code-verifier');
}

function createWebHybridStorage(): SupabaseStorage {
  const memory = new Map<string, string>();

  return {
    async getItem(key) {
      if (isPkceKey(key)) {
        return typeof window !== 'undefined'
          ? window.sessionStorage.getItem(key)
          : null;
      }
      return memory.get(key) ?? null;
    },
    async setItem(key, value) {
      if (isPkceKey(key)) {
        if (typeof window !== 'undefined') window.sessionStorage.setItem(key, value);
        return;
      }
      memory.set(key, value);
    },
    async removeItem(key) {
      if (isPkceKey(key)) {
        if (typeof window !== 'undefined') window.sessionStorage.removeItem(key);
        return;
      }
      memory.delete(key);
    },
  };
}

export const secureStorage: SupabaseStorage =
  Platform.OS === 'web' ? createWebHybridStorage() : nativeSecureStorage;
