'use client';

/**
 * Telegram WebApp auth helpers.
 * Goal: provide a valid JWT for backend requests (stored in localStorage).
 */

export interface AuthTokenData {
  token: string;
  expires?: number | string;
}

function getApiBaseUrl(): string {
  return process.env.NODE_ENV === 'production'
    ? 'https://tarot-tg-backend.onrender.com'
    : 'http://localhost:3001';
}

export const isTokenValid = (): boolean => {
  try {
    if (typeof window === 'undefined') return false;
    const token = localStorage.getItem('authToken');
    const expires = localStorage.getItem('tokenExpires');
    if (!token || !expires) return false;

    const nowMs = Date.now();
    const raw = parseInt(expires);
    if (!raw || Number.isNaN(raw)) return false;

    // Backend may return expires in seconds; Date.now() is ms.
    const expiresMs = raw < 1_000_000_000_000 ? raw * 1000 : raw;
    return nowMs < expiresMs;
  } catch {
    return false;
  }
};

export const clearAuthTokens = (): void => {
  if (typeof window === 'undefined') return;
  localStorage.removeItem('authToken');
  localStorage.removeItem('tokenExpires');
};

/**
 * Synchronous access-token getter.
 * IMPORTANT: must NOT trigger any network requests.
 */
export const getAccessToken = (): string | null => {
  if (typeof window === 'undefined') return null;
  if (!isTokenValid()) return null;
  return localStorage.getItem('authToken');
};

export const getAuthToken = async (): Promise<string | null> => {
  try {
    if (typeof window === 'undefined') return null;

    let token = localStorage.getItem('authToken');
    if (token) return token;

    // initData can appear either on window.Telegram or via SDK
    let initData: string | undefined = (window as any).Telegram?.WebApp?.initData;
    if (!initData) {
      try {
        const TWA = await import('@twa-dev/sdk');
        const WebApp = (TWA as any).WebApp || (TWA as any).default?.WebApp;
        WebApp?.ready?.();
        initData = WebApp?.initData;
      } catch {
        // ignore
      }
    }

    if (!initData) return null;

    const resp = await fetch(`${getApiBaseUrl()}/api/auth/telegram`, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ initData }),
    });

    if (!resp.ok) return null;

    const authData: any = await resp.json();
    token = authData?.data?.token || authData?.token || null;
    const expires = authData?.data?.expires || authData?.expires;

    if (token) {
      localStorage.setItem('authToken', token);
      if (expires) {
        const raw = typeof expires === 'string' ? parseInt(expires) : expires;
        const expiresMs = raw < 1_000_000_000_000 ? raw * 1000 : raw;
        localStorage.setItem('tokenExpires', expiresMs.toString());
      }
    }

    return token;
  } catch {
    return null;
  }
};

export const getValidAuthToken = async (): Promise<string | null> => {
  if (typeof window === 'undefined') return null;
  if (!isTokenValid()) {
    clearAuthTokens();
    return await getAuthToken();
  }
  return localStorage.getItem('authToken');
};

