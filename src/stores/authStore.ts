// src/stores/authStore.ts
import { create } from 'zustand';

const ACCESS_TOKEN = 'auth_access_token';
const USER_INFO = 'auth_user_info';

interface AuthUser {
  accountNo: string;
  email: string;
  role: string[];
  exp: number;
}

interface AuthState {
  auth: {
    user: AuthUser | null;
    setUser: (user: AuthUser | null) => void;
    accessToken: string;
    setAccessToken: (accessToken: string) => void;
    isAuthenticated: () => boolean;
    resetAccessToken: () => void;
    reset: () => void;
  };
}

// Helper to check if we're running on the client
const isClient = typeof window !== 'undefined';

// Helper to check token expiry
const isTokenExpired = (exp: number | undefined): boolean => {
  if (!exp) return true;
  return Date.now() / 1000 > exp;
};

export const useAuthStore = create<AuthState>((set, get) => ({
  auth: {
    user: null,
    accessToken: '',
    setUser: (user: AuthUser | null): void => {
      set((state) => ({ ...state, auth: { ...state.auth, user } }));
      if (isClient) {
        if (user) {
          sessionStorage.setItem(USER_INFO, JSON.stringify(user));
        } else {
          sessionStorage.removeItem(USER_INFO);
        }
      }
    },
    setAccessToken: (accessToken: string): void => {
      set((state) => ({ ...state, auth: { ...state.auth, accessToken } }));
      if (isClient) {
        sessionStorage.setItem(ACCESS_TOKEN, accessToken);
      }
    },
    isAuthenticated: (): boolean => {
      const user = get().auth.user;
      return user !== null && !isTokenExpired(user.exp);
    },
    resetAccessToken: (): void => {
      set((state) => ({ ...state, auth: { ...state.auth, accessToken: '' } }));
      if (isClient) {
        sessionStorage.removeItem(ACCESS_TOKEN);
      }
    },
    reset: (): void => {
      set((state) => ({
        ...state,
        auth: { ...state.auth, user: null, accessToken: '' }
      }));
      if (isClient) {
        sessionStorage.removeItem(ACCESS_TOKEN);
        sessionStorage.removeItem(USER_INFO);
      }
    }
  }
}));

// Hydrate store from sessionStorage on client
if (isClient) {
  const storedToken = sessionStorage.getItem(ACCESS_TOKEN) || '';
  const storedUser: AuthUser | null = sessionStorage.getItem(USER_INFO)
    ? JSON.parse(sessionStorage.getItem(USER_INFO)!)
    : null;

  // Only hydrate if token/user exists and token is not expired
  useAuthStore.setState((state) => ({
    auth: {
      ...state.auth,
      user: storedUser && !isTokenExpired(storedUser.exp) ? storedUser : null,
      accessToken: storedToken
    }
  }));
}
