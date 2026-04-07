import { describe, it, expect } from 'vitest';
import { getNextMoscowMidnightMs } from '@/utils/moscowTime';

describe('getNextMoscowMidnightMs', () => {
  it('returns a timestamp strictly in the future', () => {
    const now = new Date();
    const next = getNextMoscowMidnightMs(now);
    expect(next).toBeGreaterThan(now.getTime());
    expect(next - now.getTime()).toBeLessThanOrEqual(25 * 60 * 60 * 1000);
  });
});
