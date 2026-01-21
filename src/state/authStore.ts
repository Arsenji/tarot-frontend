'use client';

/**
 * GLOBAL AUTH STATE (single source of truth).
 *
 * Required shape:
 * authState = { token: string | null, isReady: boolean }
 *
 * Auth is READY when:
 * - Telegram init finished
 * - token resolved (exists OR explicitly null)
 *
 * Restrictions:
 * - MUST NOT call subscription-status or contain tarot business logic
 */
import { useEffect, useState } from 'react';
import { getValidAuthToken, isTokenValid } from '@/utils/auth';

export type AuthState = {
  token: string | null;
  isReady: boolean;
  loading: boolean;
  error?: string;
};

let state: AuthState = {
  token: null,
  isReady: false,
  loading: false,
};

const listeners = new Set<() => void>();
let inFlight: Promise<void> | null = null;

function emit() {
  for (const l of listeners) l();
}

function setState(partial: Partial<AuthState>) {
  state = { ...state, ...partial };
  emit();
}

export function getAuthSnapshot(): AuthState {
  return state;
}

export function subscribeAuth(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

async function initTelegramWebApp(): Promise<void> {
  try {
    const TWA = await import('@twa-dev/sdk');
    const WebApp = (TWA as any).WebApp || (TWA as any).default?.WebApp;
    WebApp?.ready?.();
    WebApp?.expand?.();
  } catch {
    // ok outside Telegram
  }
}

export async function bootstrapAuth(): Promise<void> {
  if (inFlight) return inFlight;

  setState({ loading: true });
  inFlight = (async () => {
    try {
      await initTelegramWebApp();

      const token = await getValidAuthToken();
      const valid = !!token && isTokenValid();
      const finalToken = valid ? token : null;

      setState({ token: finalToken, isReady: true, error: undefined });
      console.log(`Auth: ready, token = ${finalToken ? finalToken.slice(0, 12) + '…' : 'null'}`);
      return;
    } catch {
      setState({ token: null, isReady: true, error: 'AUTH_FAILED' });
      console.log('Auth: ready, token = null');
    } finally {
      setState({ loading: false });
    }
  })().finally(() => {
    inFlight = null;
  });

  return inFlight;
}

export function useAuthStatus(): AuthState {
  const [snap, setSnap] = useState<AuthState>(getAuthSnapshot());

  useEffect(() => {
    return subscribeAuth(() => setSnap(getAuthSnapshot()));
  }, []);

  return snap;
}

