import { describe, expect, it } from 'vitest';

import { localeToOutputLanguage } from './localeToOutputLanguage';

describe('localeToOutputLanguage', () => {
  it('returns English for empty or undefined', () => {
    expect(localeToOutputLanguage(undefined)).toBe('English');
    expect(localeToOutputLanguage('')).toBe('English');
    expect(localeToOutputLanguage('   ')).toBe('English');
  });

  it('maps common locales to language names', () => {
    expect(localeToOutputLanguage('en-US')).toBe('English');
    expect(localeToOutputLanguage('zh-CN')).toBe('Simplified Chinese');
    expect(localeToOutputLanguage('zh-TW')).toBe('Traditional Chinese');
    expect(localeToOutputLanguage('ja-JP')).toBe('Japanese');
    expect(localeToOutputLanguage('ko-KR')).toBe('Korean');
    expect(localeToOutputLanguage('fr-FR')).toBe('French');
    expect(localeToOutputLanguage('de-DE')).toBe('German');
  });

  it('returns input as-is when not in map (for model to interpret)', () => {
    expect(localeToOutputLanguage('unknown-LOCALE')).toBe('unknown-LOCALE');
  });

  it('trims whitespace', () => {
    expect(localeToOutputLanguage('  zh-CN  ')).toBe('Simplified Chinese');
  });
});
