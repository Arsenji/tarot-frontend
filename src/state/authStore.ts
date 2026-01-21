'use client';

/**
 * Auth bootstrap store.
 *
 * Responsibilities:
 * - acquire access token (JWT) and persist it (localStorage via utils/auth)
 * - expose isAuthenticated flag for the rest of the app
 *
 * Restrictions:
 * - MUST NOT call subscription-status or contain tarot business logic
 */
import { useEffect, useState } from 'react';
import { getValidAuthToken, isTokenValid } from '@/utils/auth';

export type AuthState = {
  loading: boolean;
  isAuthenticated: boolean;
  token: string | null;
  error?: string;
};

let state: AuthState = {
  loading: false,
  isAuthenticated: false,
  token: null,
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

export async function bootstrapAuth(): Promise<void> {
  if (inFlight) return inFlight;

  setState({ loading: true });
  inFlight = (async () => {
    try {
      const token = await getValidAuthToken();
      const ok = !!token && isTokenValid();
      if (ok) {
        console.log('AuthBootstrap: token acquired');
        setState({ token, isAuthenticated: true, error: undefined });
      } else {
        console.log('AuthBootstrap: no token');
        setState({ token: null, isAuthenticated: false, error: 'NO_TOKEN' });
      }
    } catch (e) {
      console.log('AuthBootstrap: failed');
      setState({ token: null, isAuthenticated: false, error: 'AUTH_FAILED' });
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

