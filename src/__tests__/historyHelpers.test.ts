import { describe, it, expect } from 'vitest';
import { getCategoryName, shouldShowCategory, HistoryEntryBase } from '@/utils/historyHelpers';

describe('getCategoryName', () => {
  it('returns empty string for null', () => {
    expect(getCategoryName(null)).toBe('');
  });

  it('returns empty string for undefined', () => {
    expect(getCategoryName(undefined)).toBe('');
  });

  it('returns empty string for empty string', () => {
    expect(getCategoryName('')).toBe('');
  });

  it('translates "love" to "Любовь"', () => {
    expect(getCategoryName('love')).toBe('Любовь');
  });

  it('translates "career" to "Карьера"', () => {
    expect(getCategoryName('career')).toBe('Карьера');
  });

  it('translates "personal" to "Личное развитие"', () => {
    expect(getCategoryName('personal')).toBe('Личное развитие');
  });

  it('translates "yesno" to "Да/Нет"', () => {
    expect(getCategoryName('yesno')).toBe('Да/Нет');
  });

  it('translates "major" to "Старшие Арканы"', () => {
    expect(getCategoryName('major')).toBe('Старшие Арканы');
  });

  it('translates "minor" to "Младшие Арканы"', () => {
    expect(getCategoryName('minor')).toBe('Младшие Арканы');
  });

  it('returns raw value for unknown categories', () => {
    expect(getCategoryName('unknown')).toBe('unknown');
    expect(getCategoryName('health')).toBe('health');
  });
});

describe('shouldShowCategory', () => {
  it('returns false for single card reading', () => {
    const entry: HistoryEntryBase = { type: 'single', category: 'love' };
    expect(shouldShowCategory(entry)).toBe(false);
  });

  it('returns false for yes/no reading', () => {
    const entry: HistoryEntryBase = { type: 'yes_no', category: 'love' };
    expect(shouldShowCategory(entry)).toBe(false);
  });

  it('returns true for three_cards with "love"', () => {
    const entry: HistoryEntryBase = { type: 'three_cards', category: 'love' };
    expect(shouldShowCategory(entry)).toBe(true);
  });

  it('returns true for three_cards with "career"', () => {
    const entry: HistoryEntryBase = { type: 'three_cards', category: 'career' };
    expect(shouldShowCategory(entry)).toBe(true);
  });

  it('returns true for three_cards with "personal"', () => {
    const entry: HistoryEntryBase = { type: 'three_cards', category: 'personal' };
    expect(shouldShowCategory(entry)).toBe(true);
  });

  it('returns false for three_cards with "major"', () => {
    const entry: HistoryEntryBase = { type: 'three_cards', category: 'major' };
    expect(shouldShowCategory(entry)).toBe(false);
  });

  it('returns false for three_cards with "minor"', () => {
    const entry: HistoryEntryBase = { type: 'three_cards', category: 'minor' };
    expect(shouldShowCategory(entry)).toBe(false);
  });

  it('returns false for three_cards without category', () => {
    const entry: HistoryEntryBase = { type: 'three_cards' };
    expect(shouldShowCategory(entry)).toBe(false);
  });

  it('returns false for single with "major"', () => {
    const entry: HistoryEntryBase = { type: 'single', category: 'major' };
    expect(shouldShowCategory(entry)).toBe(false);
  });
});
