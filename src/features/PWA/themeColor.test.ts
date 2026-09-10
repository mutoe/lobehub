import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { applyThemeColor, resolveThemeColor, startThemeColorSync } from './themeColor';

const meta = () => document.querySelector<HTMLMetaElement>('meta[name="theme-color"]');

/** MutationObserver callbacks are delivered as microtasks. */
const flush = () => Promise.resolve();

describe('resolveThemeColor', () => {
  afterEach(() => {
    document.documentElement.removeAttribute('data-theme');
    document.body.style.backgroundColor = '';
  });

  it('falls back to the boot palette when nothing is painted yet', () => {
    expect(resolveThemeColor(document)).toBe('#f8f8f8');

    document.documentElement.dataset.theme = 'dark';
    expect(resolveThemeColor(document)).toBe('#000000');
  });

  it('prefers whatever the stylesheet actually paints on body', () => {
    // The fallback must never win over the live value, or the status bar would
    // drift the moment upstream retunes the background token.
    document.body.style.backgroundColor = 'rgb(20, 20, 20)';

    expect(resolveThemeColor(document)).toBe('rgb(20, 20, 20)');
  });

  it('ignores a transparent body background', () => {
    // theme-color must be opaque; a transparent value would leave the status
    // bar at the browser default instead of the app background.
    document.body.style.backgroundColor = 'rgba(0, 0, 0, 0)';

    expect(resolveThemeColor(document)).toBe('#f8f8f8');
  });
});

describe('applyThemeColor', () => {
  beforeEach(() => {
    meta()?.remove();
  });

  afterEach(() => {
    meta()?.remove();
    document.documentElement.removeAttribute('data-theme');
  });

  it('creates the meta tag when the document has none', () => {
    applyThemeColor(document);

    expect(meta()?.content).toBe('#f8f8f8');
  });

  it('reuses the tag the html shell already ships', () => {
    const existing = document.createElement('meta');
    existing.name = 'theme-color';
    existing.content = '#f8f8f8';
    document.head.append(existing);

    document.documentElement.dataset.theme = 'dark';
    applyThemeColor(document);

    expect(document.querySelectorAll('meta[name="theme-color"]')).toHaveLength(1);
    expect(existing.content).toBe('#000000');
  });
});

describe('startThemeColorSync', () => {
  let stop: (() => void) | undefined;

  afterEach(() => {
    stop?.();
    stop = undefined;
    meta()?.remove();
    document.documentElement.removeAttribute('data-theme');
  });

  it('repaints the meta tag when the app switches theme', async () => {
    stop = startThemeColorSync();
    expect(meta()?.content).toBe('#f8f8f8');

    document.documentElement.dataset.theme = 'dark';
    await flush();

    expect(meta()?.content).toBe('#000000');
  });

  it('stops observing once disposed', async () => {
    const dispose = startThemeColorSync();
    expect(dispose).toBeDefined();
    dispose!();

    document.documentElement.dataset.theme = 'dark';
    await flush();

    expect(meta()?.content).toBe('#f8f8f8');
  });
});
