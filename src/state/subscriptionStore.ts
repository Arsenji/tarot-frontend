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

export type TarotType = 'daily' | 'yesNo' | 'threeCards';

export type CooldownEndsAt = {
  daily?: number;
  yesNo?: number;
  threeCards?: number;
};

export type SubscriptionState = {
  // canonical flag required by spec
  isLoaded: boolean;
  // backward-compat alias
  loaded: boolean;
  loading: boolean;
  error?: string;
  subscriptionInfo: SubscriptionInfo;
  // Absolute timestamps (ms since epoch) when cooldown ends.
  // Derived from backend-provided msRemaining + the moment we received/cached the status.
  cooldownEndsAt: CooldownEndsAt;
};

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
  isLoaded: false,
  loaded: false,
  loading: false,
  subscriptionInfo: LOCKED_DEFAULT,
  cooldownEndsAt: {},
};

const listeners = new Set<() => void>();
let inFlight: Promise<void> | null = null;

function emit() {
  for (const l of listeners) l();
}

function setState(partial: Partial<SubscriptionState>) {
  const next = { ...state, ...partial } as SubscriptionState;
  // keep flags in sync
  next.isLoaded = !!(partial.isLoaded ?? partial.loaded ?? next.isLoaded);
  next.loaded = next.isLoaded;
  state = next;
  emit();
}

export function getSubscriptionSnapshot(): SubscriptionState {
  return state;
}

export function subscribeSubscription(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function safeGetCachedInfo(): { ts: number; subscriptionInfo: SubscriptionInfo } | null {
  try {
    if (typeof window === 'undefined') return null;
    const cached = localStorage.getItem('subscriptionStatusCache');
    if (!cached) return null;
    const parsed = JSON.parse(cached);
    const ts = typeof parsed?.ts === 'number' ? parsed.ts : null;
    const subscriptionInfo = parsed?.subscriptionInfo ?? null;
    if (!ts || !subscriptionInfo) return null;
    return { ts, subscriptionInfo };
  } catch {
    return null;
  }
}

function safeSetCachedInfo(info: SubscriptionInfo, ts: number) {
  try {
    if (typeof window === 'undefined') return;
    localStorage.setItem('subscriptionStatusCache', JSON.stringify({ ts, subscriptionInfo: info }));
  } catch {
    // ignore
  }
}

function computeCooldownEndsAt(info: any, baseTs: number): CooldownEndsAt {
  // Convert backend msRemaining -> absolute cooldown end timestamp.
  const dailyMs = typeof info?.cooldowns?.dailyAdviceMsRemaining === 'number' ? info.cooldowns.dailyAdviceMsRemaining : null;
  const yesNoMs = typeof info?.cooldowns?.yesNoMsRemaining === 'number' ? info.cooldowns.yesNoMsRemaining : null;
  const threeMs = typeof info?.cooldowns?.threeCardsMsRemaining === 'number' ? info.cooldowns.threeCardsMsRemaining : null;

  return {
    daily: dailyMs != null && dailyMs > 0 ? baseTs + dailyMs : undefined,
    yesNo: yesNoMs != null && yesNoMs > 0 ? baseTs + yesNoMs : undefined,
    threeCards: threeMs != null && threeMs > 0 ? baseTs + threeMs : undefined,
  };
}

export function applySubscriptionInfo(info: any, opts?: { ts?: number }): void {
  if (!info) return;
  const ts = typeof opts?.ts === 'number' ? opts.ts : Date.now();
  safeSetCachedInfo(info, ts);
  setState({
    subscriptionInfo: info,
    cooldownEndsAt: computeCooldownEndsAt(info, ts),
    isLoaded: true,
    loading: false,
    error: undefined,
  });
}

export function bootstrapSubscriptionStatus(): Promise<void> {
  if (inFlight) return inFlight;

  const cached = safeGetCachedInfo();
  if (cached) {
    setState({
      subscriptionInfo: cached.subscriptionInfo,
      cooldownEndsAt: computeCooldownEndsAt(cached.subscriptionInfo, cached.ts),
    });
  }

  setState({ loading: true });
  inFlight = (async () => {
    const token = getAccessToken();
    if (!token) {
      // do NOT mark loaded; we must wait for token, then request immediately
      console.log('Subscription: waiting for token');
      setState({ loading: false });
      return;
    }

    console.log('Subscription: requesting status');
    const resp = await apiService.getTarotSubscriptionStatus();

    const info = (resp as any).subscriptionInfo ?? (resp.data as any)?.subscriptionInfo;
    if (resp.success && info) {
      console.log('Subscription: loaded');
      const ts = Date.now();
      safeSetCachedInfo(info, ts);
      setState({
        subscriptionInfo: info,
        cooldownEndsAt: computeCooldownEndsAt(info, ts),
        isLoaded: true,
        loading: false,
        error: undefined,
      });
      return;
    }

    // Любая ошибка (включая 401) не должна ломать UI: применяем fallback locked.
    console.log('Subscription: failed, fallback applied');
    setState({
      subscriptionInfo: LOCKED_DEFAULT,
      isLoaded: true,
      loading: false,
      error: resp.error || 'Failed to load subscription status',
      cooldownEndsAt: {},
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

function isFreeUser(info: any): boolean {
  // "free user" == user without active subscription
  return !info?.hasSubscription;
}

function getFreeUsedFlag(info: any, type: TarotType): boolean {
  // For free users, remainingX counters MUST NOT be used for blocking.
  // Backend typically provides per-spread usage flags + cooldowns.
  switch (type) {
    case 'daily':
      return !!info?.freeDailyAdviceUsed;
    case 'yesNo':
      return !!info?.freeYesNoUsed;
    case 'threeCards':
      return !!info?.freeThreeCardsUsed;
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

function computeFreeUserAvailability(info: any, type: TarotType, cooldownEndsAt: CooldownEndsAt): TarotAvailability {
  // Business rules (FREE):
  // - each spread is available once per 24h
  // - availability is determined ONLY by time (lastUsedAt + 24h)
  // We model this using backend-provided cooldowns (ms remaining) and per-spread used flags.
  const used = getFreeUsedFlag(info, type);
  if (!used) return { allowed: true };

  const endsAt = cooldownEndsAt?.[type];
  if (typeof endsAt === 'number') {
    if (Date.now() >= endsAt) return { allowed: true };
    return { allowed: false, nextAvailableAt: new Date(endsAt) };
  }

  // Fallbacks (should be rare):
  // - if cooldown endsAt isn't available, prefer canUse* flags (time-derived)
  // - NEVER use remaining* counters to block free users
  if (getCanUse(info, type)) return { allowed: true };

  const msRemaining = getCooldownMsRemaining(info, type);
  if (msRemaining != null && msRemaining > 0) return { allowed: false, nextAvailableAt: new Date(Date.now() + msRemaining) };

  return { allowed: false };
}

export function getTarotAvailability(type: TarotType): TarotAvailability {
  const snap = getSubscriptionSnapshot();
  if (!snap.loaded || snap.loading) return { allowed: false };
  // If subscription bootstrap failed and fallback was applied, keep the UI locked
  // (we must not grant access based on incomplete/unknown status).
  if (snap.error) return { allowed: false };

  const info = snap.subscriptionInfo;
  // Business rules (PAID): always allowed, no cooldowns.
  if (!isFreeUser(info)) return { allowed: true };

  // Business rules (FREE): block ONLY while cooldown is active.
  return computeFreeUserAvailability(info, type, snap.cooldownEndsAt);
}

export function useSubscriptionStatus(): SubscriptionState {
  const [snap, setSnap] = useState<SubscriptionState>(getSubscriptionSnapshot());

  useEffect(() => {
    return subscribeSubscription(() => setSnap(getSubscriptionSnapshot()));
  }, []);

  return snap;
}

