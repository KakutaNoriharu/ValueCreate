import * as SecureStore from 'expo-secure-store';
import { create } from 'zustand';
import type { TokenResponse, User } from '../types';

const TOKEN_KEY = 'nnc_access_token';

interface AuthState {
  token: string | null;
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;

  setAuth: (res: TokenResponse) => Promise<void>;
  setToken: (token: string) => Promise<void>;
  setUser: (user: User) => void;
  loadToken: () => Promise<void>;
  logout: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  token: null,
  user: null,
  isLoading: true,
  isAuthenticated: false,

  setAuth: async (res: TokenResponse) => {
    await SecureStore.setItemAsync(TOKEN_KEY, res.access_token);
    set({
      token: res.access_token,
      isAuthenticated: true,
      user: {
        user_id: res.user_id,
        nickname: res.nickname,
        auth_type: res.auth_type,
        email_verified: res.email_verified,
        contamination_pt: 0,
        character_stage: 'pure',
        streak_days: 0,
        is_banned: false,
        show_contamination: true,
        show_university: true,
        notif_obituary: true,
        notif_reminder: true,
        notif_parent_bot: false,
        contact_email: '',
        created_at: new Date().toISOString(),
      },
    });
  },

  setToken: async (token: string) => {
    await SecureStore.setItemAsync(TOKEN_KEY, token);
    set({ token, isAuthenticated: true });
  },

  setUser: (user: User) => {
    set({ user });
  },

  loadToken: async () => {
    try {
      const token = await SecureStore.getItemAsync(TOKEN_KEY);
      if (token) {
        set({ token, isAuthenticated: true, isLoading: false });
        // fetch user profile in background
        try {
          const { api } = await import('../services/api');
          const user = await api.get<User>('/api/users/me');
          set({ user });
        } catch {
          // token may be expired — logout silently
          await SecureStore.deleteItemAsync(TOKEN_KEY);
          set({ token: null, isAuthenticated: false, user: null });
        }
      } else {
        set({ token: null, isAuthenticated: false, isLoading: false });
      }
    } catch {
      set({ token: null, isAuthenticated: false, isLoading: false });
    }
  },

  logout: async () => {
    await SecureStore.deleteItemAsync(TOKEN_KEY);
    set({ token: null, user: null, isAuthenticated: false });
  },
}));
