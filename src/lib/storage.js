import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

/**
 * Token lives in the device keychain; everything else (user profile, chosen
 * server) in AsyncStorage. Both wrapped so a storage failure never crashes UI.
 */
const TOKEN_KEY = 'xetax.access_token';
const REFRESH_KEY = 'xetax.refresh_token';
const USER_KEY = 'xetax.user';
const SERVER_KEY = 'xetax.server';

/** SecureStore only exists on iOS/Android; on web (dev preview) fall back to AsyncStorage. */
const secure = Platform.OS !== 'web';

export const storage = {
  async getToken() {
    try {
      if (secure) return await SecureStore.getItemAsync(TOKEN_KEY);
      return await AsyncStorage.getItem(TOKEN_KEY);
    } catch {return null;}
  },
  async setToken(token) {
    try {
      if (secure) {
        if (token) await SecureStore.setItemAsync(TOKEN_KEY, token);else
        await SecureStore.deleteItemAsync(TOKEN_KEY);
      } else if (token) await AsyncStorage.setItem(TOKEN_KEY, token);else
      await AsyncStorage.removeItem(TOKEN_KEY);
    } catch {/* ignore */}
  },
  async getRefreshToken() {
    try {
      if (secure) return await SecureStore.getItemAsync(REFRESH_KEY);
      return await AsyncStorage.getItem(REFRESH_KEY);
    } catch {return null;}
  },
  async setRefreshToken(token) {
    try {
      if (secure) {
        if (token) await SecureStore.setItemAsync(REFRESH_KEY, token);else
        await SecureStore.deleteItemAsync(REFRESH_KEY);
      } else if (token) await AsyncStorage.setItem(REFRESH_KEY, token);else
      await AsyncStorage.removeItem(REFRESH_KEY);
    } catch {/* ignore */}
  },
  async getJson(key) {
    try {const raw = await AsyncStorage.getItem(key);return raw ? JSON.parse(raw) : null;} catch {return null;}
  },
  async setJson(key, value) {
    try {
      if (value === null || value === undefined) await AsyncStorage.removeItem(key);else
      await AsyncStorage.setItem(key, JSON.stringify(value));
    } catch {/* ignore */}
  },
  USER_KEY,
  SERVER_KEY
};
