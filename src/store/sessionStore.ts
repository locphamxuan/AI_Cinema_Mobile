import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { storage, STORAGE_KEYS } from '../lib/storage';
import { adaptUserProfile } from '../lib/apiAdapter';
import { MIN_PASSWORD } from '../lib/authForm';
import { authService } from '../services';
import { apiClient } from '../services/apiClient';
import type { BEUserDto } from '../types/api';
import type { UserProfile } from '../types/auth';
import { useAccountStore } from './accountStore';
import { useUiStore } from './uiStore';

const NETWORK_ERROR = 'Không kết nối được máy chủ. Kiểm tra mạng rồi thử lại.';
const errorMessage = (e: unknown) => (e instanceof Error && e.message) || NETWORK_ERROR;

type AuthResult = { success: boolean; error?: string; redirectUrl?: string; role?: string };

interface SessionState {
  isAuthenticated: boolean;
  user: UserProfile | null;
  login: (email: string, password: string) => Promise<AuthResult>;
  /** One tap: a new Google email opens a member account; the BE refuses staff accounts. */
  loginWithGoogle: (idToken: string) => Promise<{ success: boolean; error?: string }>;
  register: (name: string, email: string, password: string, dateOfBirth: string) => Promise<AuthResult>;
  logout: () => Promise<void>;
  /** The persisted "signed in" flag can outlive the session: confirms it with GET /auth/me. */
  verifySession: () => Promise<void>;
}

/** Drops the account from every store: sign-out, a rejected refresh token or a stale session. */
export function signOutEverywhere() {
  useSessionStore.setState({ isAuthenticated: false, user: null });
  useAccountStore.getState().reset();
}

/** Opens the member's session; whether they have a plan is the BE's answer (loadAccountData), not the profile's. */
async function startSession(user: BEUserDto) {
  const profile = adaptUserProfile(user);
  useAccountStore.getState().reset();
  useSessionStore.setState({ isAuthenticated: true, user: { ...profile, role: 'user', isVIP: false } });
  useUiStore.getState().closeAuthModal();
  await useAccountStore.getState().loadAccountData();
}

/**
 * Who is signed in. Tokens live in the apiClient storage; this store keeps only the signed-in flag
 * and the profile, never a password.
 */
export const useSessionStore = create<SessionState>()(
  persist(
    (set, get) => ({
      isAuthenticated: false,
      user: null,

      login: async (email, password) => {
        try {
          const res = await authService.login({ email: email.trim().toLowerCase(), password });
          if (res.success && res.data?.user) {
            await startSession(res.data.user);
            return { success: true, redirectUrl: '/', role: 'user' };
          }
          return { success: false, error: res.message || 'Email hoặc mật khẩu chưa đúng.' };
        } catch (e) {
          return { success: false, error: errorMessage(e) };
        }
      },

      loginWithGoogle: async (idToken) => {
        try {
          const res = await authService.googleLogin({ idToken });
          if (res.success && res.data?.user) {
            await startSession(res.data.user);
            return { success: true };
          }
          return { success: false, error: res.message };
        } catch (e) {
          return { success: false, error: errorMessage(e) };
        }
      },

      register: async (name, email, password, dateOfBirth) => {
        const trimmedEmail = email.trim().toLowerCase();
        const trimmedName = name.trim();
        const trimmedDob = dateOfBirth.trim();
        if (!trimmedEmail || !password || !trimmedName || !trimmedDob) {
          return { success: false, error: 'Điền đủ họ tên, ngày sinh, email và mật khẩu.' };
        }
        if (password.length < MIN_PASSWORD) {
          return { success: false, error: 'Mật khẩu cần 8 đến 72 ký tự, có cả chữ và số.' };
        }
        try {
          const res = await authService.register({ fullName: trimmedName, email: trimmedEmail, password, dateOfBirth: trimmedDob });
          if (res.success && res.data?.user) {
            await startSession(res.data.user);
            return { success: true };
          }
          return { success: false, error: res.message || 'Chưa tạo được tài khoản. Thử lại sau ít phút.' };
        } catch (e) {
          return { success: false, error: errorMessage(e) };
        }
      },

      logout: async () => {
        await authService.logout();
        signOutEverywhere();
      },

      verifySession: async () => {
        if (!get().isAuthenticated) return;
        const profileRes = await authService.getProfile();
        if (profileRes.success) {
          set((s) => ({ user: s.user ? { ...s.user, ...profileRes.data } : profileRes.data }));
          await useAccountStore.getState().loadAccountData();
        } else if (profileRes.statusCode === 401) {
          await apiClient.clearSession();
          signOutEverywhere();
        }
      },
    }),
    {
      // The key and version of the single store this one was split from, so members stay signed in.
      name: 'ai_cinema_mobile_app_store',
      version: 2,
      storage: createJSONStorage(() => AsyncStorage),
      migrate: async (persistedState: unknown) => {
        await Promise.all([
          storage.remove(STORAGE_KEYS.AUTH_TOKEN),
          storage.remove(STORAGE_KEYS.USER_DATA),
          storage.remove(STORAGE_KEYS.WALLET_DATA),
        ]);
        return { ...(persistedState as Partial<SessionState>), isAuthenticated: false, user: null };
      },
      partialize: (state) => ({ isAuthenticated: state.isAuthenticated, user: state.user }),
    },
  ),
);

// A refresh token the backend rejects means the session is over on every screen.
apiClient.onSessionExpired(signOutEverywhere);
