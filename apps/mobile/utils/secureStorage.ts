import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';

/**
 * プラットフォーム横断のトークン保存ヘルパー。
 *
 * expo-secure-store は Web では利用できず例外を投げるため、
 * Web では localStorage にフォールバックする。
 * （ネイティブ: SecureStore / Web: localStorage）
 */

export async function setSecureItem(key: string, value: string): Promise<void> {
  if (Platform.OS === 'web') {
    try {
      window.localStorage.setItem(key, value);
    } catch {
      // localStorage が使えない環境（SSR等）では握りつぶす
    }
    return;
  }
  await SecureStore.setItemAsync(key, value);
}

export async function getSecureItem(key: string): Promise<string | null> {
  if (Platform.OS === 'web') {
    try {
      return window.localStorage.getItem(key);
    } catch {
      return null;
    }
  }
  return SecureStore.getItemAsync(key);
}

export async function deleteSecureItem(key: string): Promise<void> {
  if (Platform.OS === 'web') {
    try {
      window.localStorage.removeItem(key);
    } catch {
      // noop
    }
    return;
  }
  await SecureStore.deleteItemAsync(key);
}
