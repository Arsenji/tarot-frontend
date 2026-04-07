import { describe, it, expect, beforeEach, vi } from 'vitest';

// Mock api service and auth before importing the store
vi.mock('@/services/api', () => ({
  apiService: {
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
  type TarotType,
} from '@/state/subscriptionStore';

function resetStoreState() {
  __resetSubscriptionStoreForTests();
  applySubscriptionInfo({
    hasSubscription: false,
    canUseDailyAdvice: false,
    canUseYesNo: false,
    canUseThreeCards: false,
    remainingDailyAdvice: 0,
    remainingYesNo: 0,
    remainingThreeCards: 0,
  });
}

describe('subscriptionStore', () => {
  beforeEach(() => {
    localStorage.clear();
    resetStoreState();
  });

  describe('getSubscriptionSnapshot', () => {
    it('returns loaded state after applySubscriptionInfo', () => {
      applySubscriptionInfo({ hasSubscription: true });
      const snap = getSubscriptionSnapshot();
      expect(snap.isLoaded).toBe(true);
      expect(snap.loaded).toBe(true);
      expect(snap.loading).toBe(false);
      expect(snap.subscriptionInfo.hasSubscription).toBe(true);
    });
  });

  describe('applySubscriptionInfo', () => {
    it('stores data in localStorage cache', () => {
      applySubscriptionInfo({ hasSubscription: true, canUseDailyAdvice: true });
      const cached = JSON.parse(localStorage.getItem('subscriptionStatusCache')!);
      expect(cached.subscriptionInfo.hasSubscription).toBe(true);
      expect(cached.ts).toBeGreaterThan(0);
    });

    it('computes cooldownEndsAt from cooldowns', () => {
      const ts = Date.now();
      applySubscriptionInfo(
        {
          hasSubscription: false,
          cooldowns: {
            dailyAdviceMsRemaining: 3600000, // 1 hour
            yesNoMsRemaining: 0,
            threeCardsMsRemaining: 7200000, // 2 hours
          },
        },
        { ts }
      );

      const snap = getSubscriptionSnapshot();
      expect(snap.cooldownEndsAt.daily).toBe(ts + 3600000);
      expect(snap.cooldownEndsAt.yesNo).toBeUndefined();
      expect(snap.cooldownEndsAt.threeCards).toBe(ts + 7200000);
    });
  });

  describe('getTarotAvailability', () => {
    it('returns reason loading when store is not loaded', () => {
      __resetSubscriptionStoreForTests();
      const avail = getTarotAvailability('daily');
      expect(avail.allowed).toBe(false);
      expect(avail.reason).toBe('loading');
    });

    it('blocks free user when used flag is set and no canUse', () => {
      applySubscriptionInfo({
        hasSubscription: false,
        canUseDailyAdvice: false,
        canUseYesNo: false,
        canUseThreeCards: false,
        freeDailyAdviceUsed: true,
        freeYesNoUsed: true,
        freeThreeCardsUsed: true,
      });
      const avail = getTarotAvailability('daily');
      expect(avail.allowed).toBe(false);
    });

    it('returns allowed=true for subscribers', () => {
      applySubscriptionInfo({ hasSubscription: true });
      expect(getTarotAvailability('daily').allowed).toBe(true);
      expect(getTarotAvailability('yesNo').allowed).toBe(true);
      expect(getTarotAvailability('threeCards').allowed).toBe(true);
    });

    it('returns allowed=true for free user with available spread', () => {
      applySubscriptionInfo({
        hasSubscription: false,
        canUseDailyAdvice: true,
        canUseYesNo: false,
        canUseThreeCards: true,
        cooldowns: {
          dailyAdviceMsRemaining: 0,
          yesNoMsRemaining: 3600000,
          threeCardsMsRemaining: 0,
        },
      });

      expect(getTarotAvailability('daily').allowed).toBe(true);
      expect(getTarotAvailability('threeCards').allowed).toBe(true);
    });

    it('returns allowed=false with nextAvailableAt for cooldown spread', () => {
      const now = Date.now();
      applySubscriptionInfo(
        {
          hasSubscription: false,
          canUseDailyAdvice: false,
          canUseYesNo: false,
          canUseThreeCards: false,
          cooldowns: {
            dailyAdviceMsRemaining: 7200000,
            yesNoMsRemaining: 3600000,
            threeCardsMsRemaining: 0,
          },
        },
        { ts: now }
      );

      const dailyAvail = getTarotAvailability('daily');
      expect(dailyAvail.allowed).toBe(false);
      expect(dailyAvail.nextAvailableAt).toBeDefined();
      expect(dailyAvail.nextAvailableAt!.getTime()).toBeCloseTo(now + 7200000, -2);

      const yesNoAvail = getTarotAvailability('yesNo');
      expect(yesNoAvail.allowed).toBe(false);
      expect(yesNoAvail.nextAvailableAt).toBeDefined();
    });

    it('returns allowed=true when cooldown has passed', () => {
      const pastTs = Date.now() - 10_000_000; // 10 seconds ago would've expired
      applySubscriptionInfo(
        {
          hasSubscription: false,
          canUseDailyAdvice: false,
          cooldowns: {
            dailyAdviceMsRemaining: 5000, // only 5 seconds remaining at pastTs
            yesNoMsRemaining: 0,
            threeCardsMsRemaining: 0,
          },
        },
        { ts: pastTs }
      );

      // cooldownEndsAt.daily = pastTs + 5000, which is in the past
      const avail = getTarotAvailability('daily');
      expect(avail.allowed).toBe(true);
    });

    it('handles all tarot types correctly', () => {
      const types: TarotType[] = ['daily', 'yesNo', 'threeCards'];
      applySubscriptionInfo({ hasSubscription: true });
      for (const type of types) {
        expect(getTarotAvailability(type).allowed).toBe(true);
      }
    });
  });
});
