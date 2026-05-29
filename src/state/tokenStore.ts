'use client';

import { apiService } from '@/services/api';
import { useEffect, useState } from 'react';
import { getAccessToken } from '@/utils/auth';
import {
  THREE_CARDS_TOKEN_COST,
  YES_NO_TOKEN_COST,
} from '@/constants/tokenPackages';

export type WalletInfo = {
  tokensBalance: number;
  freeYesNoUsed: number;
  freeThreeCardsUsed: number;
  freeYesNoRemaining: number;
  freeThreeCardsRemaining: number;
  yesNoTokenCost: number;
  threeCardsTokenCost: number;
  canUseDailyAdvice: boolean;
  cooldowns?: {
    dailyAdviceMsRemaining: number;
    yesNoMsRemaining?: number;
    threeCardsMsRemaining?: number;
    dailyAdviceHoursRemaining?: number;
  };
};

export type TarotType = 'daily' | 'yesNo' | 'threeCards';

export type CooldownEndsAt = {
  daily?: number;
};

export type TokenState = {
  isLoaded: boolean;
  loaded: boolean;
  loading: boolean;
  error?: string;
  walletInfo: WalletInfo | null;
  cooldownEndsAt: CooldownEndsAt;
};

export type TarotAvailability = {
  allowed: boolean;
  nextAvailableAt?: Date;
  reason?: 'loading' | 'error' | 'cooldown' | 'insufficient_tokens';
  tokenCost?: number;
};

let state: TokenState = {
  isLoaded: false,
  loaded: false,
  loading: false,
  walletInfo: null,
  cooldownEndsAt: {},
};

const listeners = new Set<() => void>();
let inFlight: Promise<void> | null = null;

const RETRY_DELAY_MS = 3000;
const MAX_FETCH_ATTEMPTS = 2;
const CACHE_TTL = 2 * 60 * 60 * 1000;

function emit() {
  for (const l of listeners) l();
}

function setState(partial: Partial<TokenState>) {
  const next = { ...state, ...partial } as TokenState;
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

export function getWalletSnapshot(): TokenState {
  return state;
}

export function subscribeWallet(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function safeGetCachedWallet(): { ts: number; walletInfo: WalletInfo } | null {
  try {
    if (typeof window === 'undefined') return null;
    const cached = localStorage.getItem('walletStatusCache');
    if (!cached) return null;
    const parsed = JSON.parse(cached);
    const ts = typeof parsed?.ts === 'number' ? parsed.ts : null;
    const walletInfo = parsed?.walletInfo ?? null;
    if (!ts || !walletInfo) return null;
    return { ts, walletInfo };
  } catch {
    return null;
  }
}

function safeSetCachedWallet(info: WalletInfo, ts: number) {
  try {
    if (typeof window === 'undefined') return;
    localStorage.setItem('walletStatusCache', JSON.stringify({ ts, walletInfo: info }));
  } catch {
    // ignore
  }
}

function computeCooldownEndsAt(info: WalletInfo, baseTs: number): CooldownEndsAt {
  const dailyMs =
    typeof info?.cooldowns?.dailyAdviceMsRemaining === 'number'
      ? info.cooldowns.dailyAdviceMsRemaining
      : null;
  return {
    daily: dailyMs != null && dailyMs > 0 ? baseTs + dailyMs : undefined,
  };
}

export function applyWalletInfo(info: WalletInfo | null | undefined, opts?: { ts?: number }): void {
  if (!info) return;
  const ts = typeof opts?.ts === 'number' ? opts.ts : Date.now();
  safeSetCachedWallet(info, ts);
  setState({
    walletInfo: info,
    cooldownEndsAt: computeCooldownEndsAt(info, ts),
    isLoaded: true,
    loading: false,
    error: undefined,
  });
}

export function applyCooldownOverride(type: TarotType, nextAvailableAtMs: number): void {
  if (type !== 'daily' || !Number.isFinite(nextAvailableAtMs)) return;
  setState({
    cooldownEndsAt: { ...state.cooldownEndsAt, daily: nextAvailableAtMs },
  });
}

function delay(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

async function fetchWalletFromServer(): Promise<{ ok: boolean; info?: WalletInfo; error?: string }> {
  try {
    const resp = await apiService.getWalletStatus();
    const info = resp.walletInfo ?? (resp.data as WalletInfo | undefined);
    if (resp.success && info) {
      return { ok: true, info };
    }
    return { ok: false, error: resp.error || 'Failed to load wallet status' };
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Failed to load wallet status';
    return { ok: false, error: msg };
  }
}

export type BootstrapWalletOptions = { force?: boolean };

export function bootstrapWalletStatus(opts?: BootstrapWalletOptions): Promise<void> {
  const force = !!opts?.force;

  if (inFlight && !force) return inFlight;

  if (inFlight && force) {
    const pending = inFlight;
    inFlight = null;
    void pending.catch(() => {});
  }

  const cached = safeGetCachedWallet();
  if (cached) {
    const isFresh = Date.now() - cached.ts < CACHE_TTL;
    setState({
      walletInfo: cached.walletInfo,
      cooldownEndsAt: computeCooldownEndsAt(cached.walletInfo, cached.ts),
      ...(isFresh ? { isLoaded: true, error: undefined } : {}),
    });
  }

  setState({ loading: true, error: undefined });

  const run = async () => {
    const token = getAccessToken();
    if (!token) {
      setState({
        loading: false,
        walletInfo: null,
        isLoaded: false,
        error: undefined,
        cooldownEndsAt: {},
      });
      return;
    }

    for (let attempt = 0; attempt < MAX_FETCH_ATTEMPTS; attempt++) {
      if (attempt > 0) await delay(RETRY_DELAY_MS);

      const result = await fetchWalletFromServer();

      if (result.ok && result.info) {
        const ts = Date.now();
        safeSetCachedWallet(result.info, ts);
        setState({
          walletInfo: result.info,
          cooldownEndsAt: computeCooldownEndsAt(result.info, ts),
          isLoaded: true,
          loading: false,
          error: undefined,
        });
        return;
      }

      if (state.isLoaded) {
        setState({ loading: false, error: undefined });
        return;
      }
    }

    setState({
      walletInfo: null,
      isLoaded: false,
      loading: false,
      error: 'Не удалось загрузить баланс. Проверьте сеть и попробуйте снова.',
      cooldownEndsAt: {},
    });
  };

  const p = run().finally(() => {
    if (inFlight === p) inFlight = null;
  });
  inFlight = p;
  return p;
}

function getDailyAvailability(wallet: WalletInfo, cooldownEndsAt: CooldownEndsAt): TarotAvailability {
  const endsAt = cooldownEndsAt.daily;
  if (typeof endsAt === 'number' && Date.now() < endsAt) {
    return { allowed: false, nextAvailableAt: new Date(endsAt), reason: 'cooldown' };
  }
  if (wallet.canUseDailyAdvice) return { allowed: true };
  const ms = wallet.cooldowns?.dailyAdviceMsRemaining;
  if (ms != null && ms > 0) {
    return { allowed: false, nextAvailableAt: new Date(Date.now() + ms), reason: 'cooldown' };
  }
  return { allowed: false, reason: 'cooldown' };
}

function getYesNoAvailability(wallet: WalletInfo): TarotAvailability {
  const cost = wallet.yesNoTokenCost ?? YES_NO_TOKEN_COST;
  if (wallet.freeYesNoRemaining > 0) return { allowed: true };
  if (wallet.tokensBalance >= cost) return { allowed: true, tokenCost: cost };
  return { allowed: false, reason: 'insufficient_tokens', tokenCost: cost };
}

function getThreeCardsAvailability(wallet: WalletInfo): TarotAvailability {
  const cost = wallet.threeCardsTokenCost ?? THREE_CARDS_TOKEN_COST;
  if (wallet.freeThreeCardsRemaining > 0) return { allowed: true };
  if (wallet.tokensBalance >= cost) return { allowed: true, tokenCost: cost };
  return { allowed: false, reason: 'insufficient_tokens', tokenCost: cost };
}

export function getTarotAvailability(type: TarotType): TarotAvailability {
  const snap = getWalletSnapshot();
  if (!snap.loaded) return { allowed: false, reason: 'loading' };
  if (snap.error && !snap.loading) return { allowed: false, reason: 'error' };

  const wallet = snap.walletInfo;
  if (!wallet) return { allowed: false, reason: 'loading' };

  switch (type) {
    case 'daily':
      return getDailyAvailability(wallet, snap.cooldownEndsAt);
    case 'yesNo':
      return getYesNoAvailability(wallet);
    case 'threeCards':
      return getThreeCardsAvailability(wallet);
    default:
      return { allowed: false };
  }
}

export function useWalletStatus(): TokenState {
  const [snap, setSnap] = useState<TokenState>(getWalletSnapshot());

  useEffect(() => {
    return subscribeWallet(() => setSnap(getWalletSnapshot()));
  }, []);

  return snap;
}

/** @internal Vitest only */
export function __resetTokenStoreForTests(): void {
  state = {
    isLoaded: false,
    loaded: false,
    loading: false,
    walletInfo: null,
    cooldownEndsAt: {},
    error: undefined,
  };
  inFlight = null;
  emit();
}
