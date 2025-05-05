// src/services/keycloak/keycloak.ts
import Keycloak from 'keycloak-js';
import { useAuthStore } from '@/stores/authStore';

// Fix for email property not being recognized in token
interface ExtendedTokenParsed {
  email?: string;
  exp?: number;
  iat?: number;
  nonce?: string;
  sub?: string;
  session_state?: string;
  realm_access?: { roles: string[] };
  resource_access?: string[];
}

// Handle window access for server-side rendering
const isClient = typeof window !== 'undefined';

// Keycloak configuration
const keycloakConfig = {
  url: process.env.NEXT_PUBLIC_KEYCLOAK_URL,
  realm: process.env.NEXT_PUBLIC_KEYCLOAK_REALM,
  clientId: process.env.NEXT_PUBLIC_KEYCLOAK_CLIENT_ID,
  clientSecret: process.env.NEXT_PUBLIC_KEYCLOAK_CLIENT_SECRET,
  onLoad: 'login-required' as const,
  pkceMethod: 'S256' as const,
  redirectUri: process.env.NEXT_PUBLIC_KEYCLOAK_REDIRECT_URI,
  silentCheckSsoRedirectUri: isClient
    ? window.location.origin + '/silent-check-sso.html'
    : '',
  checkLoginIframe: false
};

class KeycloakService {
  private keycloak: Keycloak.KeycloakInstance;

  constructor() {
    if (!isClient) {
      // Create a minimal placeholder during SSR
      this.keycloak = {} as Keycloak.KeycloakInstance;
      return;
    }
    this.keycloak = new Keycloak(keycloakConfig);
  }

  private setUserData() {
    // Use the extended interface to handle the email field
    const tokenParsed = this.keycloak.tokenParsed as ExtendedTokenParsed;

    const user = {
      accountNo: tokenParsed?.sub || '',
      email: tokenParsed?.email || '',
      role: tokenParsed?.realm_access?.roles || [],
      exp: tokenParsed?.exp || 0
    };
    useAuthStore.getState().auth.setUser(user);
    useAuthStore.getState().auth.setAccessToken(this.keycloak.token || '');
  }

  async initialize() {
    if (!isClient) {
      console.warn('Keycloak initialization skipped on server side');
      return false;
    }

    try {
      // Check if already initialized
      if (this.keycloak.authenticated !== undefined) {
        console.log('Keycloak already initialized');
        return this.keycloak.authenticated;
      }

      console.log('Initializing Keycloak...');

      // Create init options with proper typing
      const initOptions = {
        onLoad: 'login-required',
        checkLoginIframe: false,
        // Type assertion to handle pkceMethod
        pkceMethod: 'S256',
        enableLogging: true,
        silentCheckSsoRedirectUri:
          window.location.origin + '/silent-check-sso.html'
      } as any; // Use type assertion to bypass TypeScript constraints

      const authenticated = await this.keycloak.init(initOptions);

      console.log('Keycloak authenticated:', authenticated);

      if (authenticated) {
        this.setUserData();
        this.setupTokenRefresh();
        if (this.keycloak.token) {
          sessionStorage.setItem('auth_access_token', this.keycloak.token);
        }
      }

      return authenticated;
    } catch (error) {
      console.error('Keycloak initialization failed', error);
      return false;
    }
  }

  login() {
    if (!isClient) return Promise.resolve();
    return this.keycloak.login();
  }

  logout() {
    if (!isClient) return Promise.resolve();
    // Reset auth store and logout
    useAuthStore.getState().auth.reset();
    return this.keycloak.logout({
      redirectUri: window.location.origin
    });
  }

  private setupTokenRefresh() {
    this.keycloak.onTokenExpired = async () => {
      try {
        const refreshed = await this.keycloak.updateToken(30);
        if (refreshed) {
          console.log('Token successfully refreshed');
          this.setUserData();
        } else {
          console.warn(
            'Token refresh unsuccessful, user may need to log in again.'
          );
          this.login();
        }
      } catch (error) {
        console.error('Token refresh failed, redirecting to login.', error);
        this.login();
      }
    };
  }

  isAuthenticated() {
    if (!isClient) return false;
    return this.keycloak.authenticated || false;
  }

  getToken() {
    if (!isClient) return null;
    return this.keycloak.token;
  }

  getUserInfo() {
    if (!isClient) return null;
    return this.keycloak.tokenParsed;
  }

  hasRealmRole(role: string) {
    if (!isClient) return false;
    return this.keycloak.hasRealmRole(role);
  }
}

export const keycloakService = new KeycloakService();
