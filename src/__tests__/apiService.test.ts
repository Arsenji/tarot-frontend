import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

// Mock auth
vi.mock('@/utils/auth', () => ({
  getAccessToken: vi.fn(() => 'test-token'),
}));

// Mock cache
vi.mock('@/utils/cache', () => ({
  cache: { get: vi.fn(), set: vi.fn(), clear: vi.fn() },
  historyCache: { get: vi.fn(), set: vi.fn(), clear: vi.fn() },
  dailyAdviceCache: { get: vi.fn(), set: vi.fn(), clear: vi.fn() },
  getCurrentDate: vi.fn(() => '2026-01-21'),
}));

import { apiService } from '@/services/api';

const mockFetch = vi.fn();
global.fetch = mockFetch;

// Suppress console.error in tests
vi.spyOn(console, 'error').mockImplementation(() => {});

describe('ApiService', () => {
  beforeEach(() => {
    mockFetch.mockReset();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('getDailyAdvice', () => {
    it('sends POST to /api/tarot/daily-advice with auth header', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          data: {
            card: { name: 'Шут', category: 'major' },
            interpretation: 'Сегодня ждёт новое начало.',
            advice: 'Сегодня ждёт новое начало.',
          },
        }),
      });

      const result = await apiService.getDailyAdvice();

      expect(mockFetch).toHaveBeenCalledTimes(1);
      const [url, options] = mockFetch.mock.calls[0];
      expect(url).toContain('/api/tarot/daily-advice');
      expect(options.method).toBe('POST');
      expect(options.headers?.Authorization).toBe('Bearer test-token');
      expect(result.success).toBe(true);
      expect(result.data.card.name).toBe('Шут');
    });

    it('returns error on network failure', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      const result = await apiService.getDailyAdvice();

      expect(result.success).toBe(false);
      expect(result.error).toContain('Network error');
    });
  });

  describe('getYesNoAnswer', () => {
    it('sends question in POST body', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          data: {
            card: { name: 'Луна' },
            answer: 'Да',
            interpretation: 'Луна говорит да.',
          },
        }),
      });

      const result = await apiService.getYesNoAnswer('Будет ли мне везти?');

      const [, options] = mockFetch.mock.calls[0];
      const body = JSON.parse(options.body);
      expect(body.question).toBe('Будет ли мне везти?');
      expect(result.success).toBe(true);
      expect(result.data.answer).toBe('Да');
    });
  });

  describe('getThreeCardsReading', () => {
    it('sends category and question', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          data: {
            cards: [{ name: 'Шут' }, { name: 'Маг' }, { name: 'Жрица' }],
            interpretation: 'Расклад говорит...',
            category: 'love',
          },
        }),
      });

      const result = await apiService.getThreeCardsReading('love', 'Что ждёт?');

      const [url, options] = mockFetch.mock.calls[0];
      expect(url).toContain('/api/tarot/three-cards');
      const body = JSON.parse(options.body);
      expect(body.category).toBe('love');
      expect(body.userQuestion).toBe('Что ждёт?');
      expect(result.data.cards).toHaveLength(3);
    });
  });

  describe('getWalletStatus / getTarotSubscriptionStatus', () => {
    it('sends GET request to wallet-status', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          walletInfo: {
            tokensBalance: 10,
            freeYesNoRemaining: 3,
            freeThreeCardsRemaining: 3,
            canUseDailyAdvice: true,
          },
        }),
      });

      const result = await apiService.getTarotSubscriptionStatus();

      const [url, options] = mockFetch.mock.calls[0];
      expect(url).toContain('/api/tarot/wallet-status');
      expect(options.method).toBe('GET');
      expect(result.success).toBe(true);
    });
  });

  describe('error handling', () => {
    it('returns subscriptionRequired on 403', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 403,
        json: async () => ({
          success: false,
          error: 'Daily advice already used.',
          subscriptionRequired: false,
          reason: 'DAILY_ADVICE_COOLDOWN',
          cooldown: { msRemaining: 3600000 },
        }),
      });

      const result = await apiService.getDailyAdvice();

      expect(result.success).toBe(false);
      expect(result.reason).toBe('DAILY_ADVICE_COOLDOWN');
      expect(result.cooldown?.msRemaining).toBe(3600000);
    });

    it('returns error on 500', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: async () => ({
          error: 'Internal server error',
        }),
      });

      const result = await apiService.getDailyAdvice();

      expect(result.success).toBe(false);
      expect(result.error).toContain('Internal server error');
    });

    it('returns error on 503 with fallback flag', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 503,
        json: async () => ({
          success: false,
          error: 'AI временно недоступен',
          fallback: true,
        }),
      });

      const result = await apiService.getDailyAdvice();

      expect(result.success).toBe(false);
      expect(result.error).toContain('AI временно недоступен');
    });
  });
});
