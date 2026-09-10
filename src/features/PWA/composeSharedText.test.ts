import { describe, expect, it } from 'vitest';

import { composeSharedText } from './composeSharedText';

describe('composeSharedText', () => {
  it('returns plain shared text unchanged', () => {
    expect(composeSharedText({ text: 'hello world' })).toBe('hello world');
  });

  it('returns an empty string when nothing was shared', () => {
    expect(composeSharedText({})).toBe('');
  });

  it('appends the url when it is not already part of the text', () => {
    expect(composeSharedText({ text: 'read this', url: 'https://example.com' })).toBe(
      'read this\n\nhttps://example.com',
    );
  });

  it('does not duplicate a url the text already contains', () => {
    // Android commonly hands the same link in both `text` and `url`.
    expect(
      composeSharedText({ text: 'look: https://example.com', url: 'https://example.com' }),
    ).toBe('look: https://example.com');
  });

  it('falls back to the url alone when no text was shared', () => {
    expect(composeSharedText({ url: 'https://example.com' })).toBe('https://example.com');
  });

  it('keeps the title when it adds information beyond the text', () => {
    expect(composeSharedText({ text: 'https://example.com', title: 'A Great Article' })).toBe(
      'A Great Article\n\nhttps://example.com',
    );
  });

  it('drops a title that merely repeats the text', () => {
    expect(composeSharedText({ text: 'A Great Article', title: 'A Great Article' })).toBe(
      'A Great Article',
    );
  });

  it('trims surrounding whitespace from every part', () => {
    expect(composeSharedText({ text: '  spaced  ', url: '  https://example.com  ' })).toBe(
      'spaced\n\nhttps://example.com',
    );
  });
});
