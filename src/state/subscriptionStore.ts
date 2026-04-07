'use client';

/**
 * Global subscription/availability store (single source of truth).
 * - Never use a fake "all locked" snapshot on API failure (avoids false blocks on cold start).
 * - Until loaded=true, UI must show loading — not lock icons.
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
  isLoaded: boolean;
  loaded: boolean;
  loading: boolean;
  error?: string;
  /** null until first successful load from server or valid cache hydrate */
  subscriptionInfo: SubscriptionInfo | null;
  cooldownEndsAt: CooldownEndsAt;
};

export type TarotAvailability = {
  allowed: boolean;
  nextAvailableAt?: Date;
  reason?: 'loading' | 'error';
};

let state: SubscriptionState = {
  isLoaded: false,
  loaded: false,
  loading: false,
  subscriptionInfo: null,
  cooldownEndsAt: {},
};

const listeners = new Set<() => void>();
let inFlight: Promise<void> | null = null;

const RETRY_DELAY_MS = 3000;
const MAX_FETCH_ATTEMPTS = 2;
const CACHE_TTL = 2 * 60 * 60 * 1000; // 2 hours

function emit() {
  for (const l of listeners) l();
}

function setState(partial: Partial<SubscriptionState>) {
  const next = { ...state, ...partial } as SubscriptionState;
  if ('isLoaded' in partial || 'loaded' in partial) {
    next.isLoaded = !!(partial.isLoaded ?? partial.loaded);
    next.loaded = next.isLoaded;
  } else {
    next.isLoaded = state.isLoaded;
    next.loaded = state.loaded;
  }
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

function delay(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

async function fetchSubscriptionFromServer(): Promise<{ ok: boolean; info?: any; error?: string }> {
  try {
    const resp = await apiService.getTarotSubscriptionStatus();
    const info = (resp as any).subscriptionInfo ?? (resp.data as any)?.subscriptionInfo;
    if (resp.success && info) {
      return { ok: true, info };
    }
    return { ok: false, error: resp.error || 'Failed to load subscription status' };
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Failed to load subscription status';
    return { ok: false, error: msg };
  }
}

export type BootstrapSubscriptionOptions = { force?: boolean };

export function bootstrapSubscriptionStatus(opts?: BootstrapSubscriptionOptions): Promise<void> {
  const force = !!opts?.force;

  if (inFlight && !force) return inFlight;

  if (inFlight && force) {
    const pending = inFlight;
    inFlight = null;
    void pending.catch(() => {});
  }

  const cached = safeGetCachedInfo();
  if (cached) {
    const isFresh = Date.now() - cached.ts < CACHE_TTL;
    setState({
      subscriptionInfo: cached.subscriptionInfo,
      cooldownEndsAt: computeCooldownEndsAt(cached.subscriptionInfo, cached.ts),
      ...(isFresh ? { isLoaded: true, error: undefined } : {}),
    });
    if (isFresh) {
      console.log('Subscription: unlocked from fresh cache');
    }
  }

  setState({ loading: true, error: undefined });

  const run = async () => {
    const token = getAccessToken();
    if (!token) {
      console.log('Subscription: waiting for token');
      setState({
        loading: false,
        subscriptionInfo: null,
        isLoaded: false,
        error: undefined,
        cooldownEndsAt: {},
      });
      return;
    }

    for (let attempt = 0; attempt < MAX_FETCH_ATTEMPTS; attempt++) {
      if (attempt > 0) {
        console.log('Subscription: retry after delay', attempt);
        await delay(RETRY_DELAY_MS);
      }

      console.log('Subscription: requesting status', { attempt });
      const result = await fetchSubscriptionFromServer();

      if (result.ok && result.info) {
        const ts = Date.now();
        safeSetCachedInfo(result.info, ts);
        setState({
          subscriptionInfo: result.info,
          cooldownEndsAt: computeCooldownEndsAt(result.info, ts),
          isLoaded: true,
          loading: false,
          error: undefined,
        });
        return;
      }

      if (state.isLoaded) {
        console.log('Subscription: server failed, keeping cached data');
        setState({ loading: false, error: undefined });
        return;
      }
    }

    console.log('Subscription: failed after retries — staying unloaded (no false lock)');
    setState({
      subscriptionInfo: null,
      isLoaded: false,
      loading: false,
      error: 'Не удалось загрузить статус. Проверьте сеть и попробуйте снова.',
      cooldownEndsAt: {},
    });
  };

  const p = run().finally(() => {
    if (inFlight === p) inFlight = null;
  });
  inFlight = p;
  return p;
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
  return !info?.hasSubscription;
}

function getFreeUsedFlag(info: any, type: TarotType): boolean {
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
  const endsAt = cooldownEndsAt?.[type];
  if (typeof endsAt === 'number') {
    if (Date.now() >= endsAt) return { allowed: true };
    return { allowed: false, nextAvailableAt: new Date(endsAt) };
  }

  const used = getFreeUsedFlag(info, type);
  if (!used) return { allowed: true };

  if (getCanUse(info, type)) return { allowed: true };

  const msRemaining = getCooldownMsRemaining(info, type);
  if (msRemaining != null && msRemaining > 0) return { allowed: false, nextAvailableAt: new Date(Date.now() + msRemaining) };

  return { allowed: false };
}

export function applyCooldownOverride(type: TarotType, nextAvailableAtMs: number): void {
  if (!Number.isFinite(nextAvailableAtMs)) return;
  setState({
    cooldownEndsAt: { ...state.cooldownEndsAt, [type]: nextAvailableAtMs },
  });
}

export function getTarotAvailability(type: TarotType): TarotAvailability {
  const snap = getSubscriptionSnapshot();
  if (!snap.loaded) {
    return { allowed: false, reason: 'loading' };
  }
  if (snap.error && !snap.loading) {
    return { allowed: false, reason: 'error' };
  }

  const info = snap.subscriptionInfo;
  if (!info) {
    return { allowed: false, reason: 'loading' };
  }
  if (!isFreeUser(info)) return { allowed: true };

  return computeFreeUserAvailability(info, type, snap.cooldownEndsAt);
}

export function useSubscriptionStatus(): SubscriptionState {
  const [snap, setSnap] = useState<SubscriptionState>(getSubscriptionSnapshot());

  useEffect(() => {
    return subscribeSubscription(() => setSnap(getSubscriptionSnapshot()));
  }, []);

  return snap;
}

/** @internal Vitest only — resets module state */
export function __resetSubscriptionStoreForTests(): void {
  state = {
    isLoaded: false,
    loaded: false,
    loading: false,
    subscriptionInfo: null,
    cooldownEndsAt: {},
    error: undefined,
  };
  inFlight = null;
  emit();
}
