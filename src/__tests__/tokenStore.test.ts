import { describe, it, expect, beforeEach, vi } from 'vitest';

vi.mock('@/services/api', () => ({
  apiService: {
    getWalletStatus: vi.fn(),
  },
}));

vi.mock('@/utils/auth', () => ({
  getAccessToken: vi.fn(() => 'mock-token'),
}));

import {
  getWalletSnapshot,
  applyWalletInfo,
  getTarotAvailability,
  __resetTokenStoreForTests,
  type TarotType,
} from '@/state/tokenStore';

const baseWallet = {
  tokensBalance: 0,
  freeYesNoUsed: 0,
  freeThreeCardsUsed: 0,
  freeYesNoRemaining: 3,
  freeThreeCardsRemaining: 3,
  yesNoTokenCost: 5,
  threeCardsTokenCost: 10,
  canUseDailyAdvice: true,
  cooldowns: { dailyAdviceMsRemaining: 0 },
};

function resetStoreState() {
  __resetTokenStoreForTests();
  applyWalletInfo(baseWallet);
}

describe('tokenStore', () => {
  beforeEach(() => {
    localStorage.clear();
    resetStoreState();
  });

  it('returns loaded state after applyWalletInfo', () => {
    applyWalletInfo({ ...baseWallet, tokensBalance: 25 });
    const snap = getWalletSnapshot();
    expect(snap.isLoaded).toBe(true);
    expect(snap.walletInfo?.tokensBalance).toBe(25);
  });

  it('stores wallet in localStorage cache', () => {
    applyWalletInfo({ ...baseWallet, tokensBalance: 10 });
    const cached = JSON.parse(localStorage.getItem('walletStatusCache')!);
    expect(cached.walletInfo.tokensBalance).toBe(10);
  });

  it('allows yes/no with free attempts', () => {
    expect(getTarotAvailability('yesNo').allowed).toBe(true);
  });

  it('blocks yes/no when no free attempts and insufficient tokens', () => {
    applyWalletInfo({
      ...baseWallet,
      freeYesNoRemaining: 0,
      freeYesNoUsed: 3,
      tokensBalance: 2,
    });
    const avail = getTarotAvailability('yesNo');
    expect(avail.allowed).toBe(false);
    expect(avail.reason).toBe('insufficient_tokens');
  });

  it('blocks daily advice on cooldown', () => {
    const ts = Date.now();
    applyWalletInfo(
      {
        ...baseWallet,
        canUseDailyAdvice: false,
        cooldowns: { dailyAdviceMsRemaining: 3600000 },
      },
      { ts }
    );
    const avail = getTarotAvailability('daily');
    expect(avail.allowed).toBe(false);
    expect(avail.reason).toBe('cooldown');
  });
});
