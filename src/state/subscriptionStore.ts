'use client';

/**
 * Global subscription/availability store (single source of truth).
 *
 * Requirements:
 * - one request to /api/tarot/subscription-status at app start (shared promise)
 * - pessimistic lock: until loaded=true, all tarot types are blocked
 * - no availability calculations in components
 */
import { apiService } from '@/services/api';
import { useEffect, useState } from 'react';
import { getAccessToken } from '@/utils/auth';

export type SubscriptionInfo = any;

export type SubscriptionState = {
  loaded: boolean;
  loading: boolean;
  error?: string;
  subscriptionInfo: SubscriptionInfo;
};

export type TarotType = 'daily' | 'yesNo' | 'threeCards';

export type TarotAvailability = {
  allowed: boolean;
  nextAvailableAt?: Date;
};

const LOCKED_DEFAULT: SubscriptionInfo = {
  hasSubscription: false,
  canUseDailyAdvice: false,
  canUseYesNo: false,
  canUseThreeCards: false,
  remainingDailyAdvice: 0,
  remainingYesNo: 0,
  remainingThreeCards: 0,
};

let state: SubscriptionState = {
  loaded: false,
  loading: false,
  subscriptionInfo: LOCKED_DEFAULT,
};

const listeners = new Set<() => void>();
let inFlight: Promise<void> | null = null;

function emit() {
  for (const l of listeners) l();
}

function setState(partial: Partial<SubscriptionState>) {
  state = { ...state, ...partial };
  emit();
}

export function getSubscriptionSnapshot(): SubscriptionState {
  return state;
}

export function subscribeSubscription(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function safeGetCachedInfo(): SubscriptionInfo | null {
  try {
    if (typeof window === 'undefined') return null;
    const cached = localStorage.getItem('subscriptionStatusCache');
    if (!cached) return null;
    const parsed = JSON.parse(cached);
    return parsed?.subscriptionInfo ?? null;
  } catch {
    return null;
  }
}

function safeSetCachedInfo(info: SubscriptionInfo) {
  try {
    if (typeof window === 'undefined') return;
    localStorage.setItem('subscriptionStatusCache', JSON.stringify({ ts: Date.now(), subscriptionInfo: info }));
  } catch {
    // ignore
  }
}

export function bootstrapSubscriptionStatus(): Promise<void> {
  if (inFlight) return inFlight;

  const cached = safeGetCachedInfo();
  if (cached) setState({ subscriptionInfo: cached });

  setState({ loading: true });
  inFlight = (async () => {
    const token = getAccessToken();
    if (!token) {
      console.log('TarotBootstrap: skipped (no token)');
      setState({
        subscriptionInfo: LOCKED_DEFAULT,
        loaded: true, // приложение должно открываться даже без токена
        loading: false,
        error: 'NO_TOKEN',
      });
      return;
    }

    console.log('TarotBootstrap: requesting subscription-status');
    const resp = await apiService.getTarotSubscriptionStatus();

    const info = (resp as any).subscriptionInfo ?? (resp.data as any)?.subscriptionInfo;
    if (resp.success && info) {
      console.log('TarotBootstrap: success');
      safeSetCachedInfo(info);
      setState({ subscriptionInfo: info, loaded: true, loading: false, error: undefined });
      return;
    }

    // Любая ошибка (включая 401) не должна ломать UI: применяем fallback locked.
    console.log('TarotBootstrap: failed, fallback applied');
    setState({
      subscriptionInfo: LOCKED_DEFAULT,
      loaded: true,
      loading: false,
      error: resp.error || 'Failed to load subscription status',
    });
  })().finally(() => {
    inFlight = null;
  });

  return inFlight;
}

function getCanUse(info: any, type: TarotType): boolean {
  switch (type) {
    case 'daily':
      return !!info?.canUseDailyAdvice;
    case 'yesNo':
      return !!info?.canUseYesNo;
    case 'threeCards':
      return !!info?.canUseThreeCards;
    default:
      return false;
  }
}

function getCooldownMsRemaining(info: any, type: TarotType): number | null {
  const cooldowns = info?.cooldowns;
  if (!cooldowns) return null;
  switch (type) {
    case 'daily':
      return typeof cooldowns.dailyAdviceMsRemaining === 'number' ? cooldowns.dailyAdviceMsRemaining : null;
    case 'yesNo':
      return typeof cooldowns.yesNoMsRemaining === 'number' ? cooldowns.yesNoMsRemaining : null;
    case 'threeCards':
      return typeof cooldowns.threeCardsMsRemaining === 'number' ? cooldowns.threeCardsMsRemaining : null;
    default:
      return null;
  }
}

export function getTarotAvailability(type: TarotType): TarotAvailability {
  const snap = getSubscriptionSnapshot();
  if (!snap.loaded || snap.loading) return { allowed: false };

  const info = snap.subscriptionInfo;
  if (info?.hasSubscription) return { allowed: true };

  const allowed = getCanUse(info, type);
  if (allowed) return { allowed: true };

  const msRemaining = getCooldownMsRemaining(info, type);
  const nextAvailableAt = msRemaining && msRemaining > 0 ? new Date(Date.now() + msRemaining) : undefined;
  return { allowed: false, nextAvailableAt };
}

export function useSubscriptionStatus(): SubscriptionState {
  const [snap, setSnap] = useState<SubscriptionState>(getSubscriptionSnapshot());

  useEffect(() => {
    return subscribeSubscription(() => setSnap(getSubscriptionSnapshot()));
  }, []);

  return snap;
}

