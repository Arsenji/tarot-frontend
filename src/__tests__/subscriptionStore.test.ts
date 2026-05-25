import { describe, it, expect, beforeEach, vi } from 'vitest';

vi.mock('@/services/api', () => ({
  apiService: {
    getWalletStatus: vi.fn(),
    getTarotSubscriptionStatus: vi.fn(),
  },
}));

vi.mock('@/utils/auth', () => ({
  getAccessToken: vi.fn(() => 'mock-token'),
}));

import {
  getSubscriptionSnapshot,
  applySubscriptionInfo,
  getTarotAvailability,
  __resetSubscriptionStoreForTests,
} from '@/state/subscriptionStore';

const baseWallet = {
  tokensBalance: 50,
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
  __resetSubscriptionStoreForTests();
  applySubscriptionInfo(baseWallet);
}

describe('subscriptionStore (token compatibility layer)', () => {
  beforeEach(() => {
    localStorage.clear();
    resetStoreState();
  });

  it('returns loaded state after applySubscriptionInfo', () => {
    applySubscriptionInfo({ ...baseWallet, tokensBalance: 25 });
    const snap = getSubscriptionSnapshot();
    expect(snap.isLoaded).toBe(true);
    expect(snap.walletInfo?.tokensBalance).toBe(25);
  });

  it('allows all spreads with sufficient tokens and free attempts', () => {
    for (const type of ['daily', 'yesNo', 'threeCards'] as const) {
      expect(getTarotAvailability(type).allowed).toBe(true);
    }
  });

  it('blocks yes/no when insufficient tokens', () => {
    applySubscriptionInfo({
      ...baseWallet,
      freeYesNoRemaining: 0,
      tokensBalance: 0,
    });
    expect(getTarotAvailability('yesNo').allowed).toBe(false);
    expect(getTarotAvailability('yesNo').reason).toBe('insufficient_tokens');
  });
});
