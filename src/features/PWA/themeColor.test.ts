import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import {
  applyThemeColor,
  clampThemeColor,
  resolveThemeColor,
  startThemeColorSync,
} from './themeColor';

const meta = () => document.querySelector<HTMLMetaElement>('meta[name="theme-color"]');

/** MutationObserver callbacks are delivered as microtasks. */
const flush = () => Promise.resolve();

describe('clampThemeColor', () => {
  it('pulls the light background just under the lightness Chromium still honours', () => {
    // #f8f8f8 has lightness 0.97; Chromium throws away anything above 0.94 and
    // paints the status bar black — the very thing this module exists to fix.
    expect(clampThemeColor('#f8f8f8')).toBe('#ededed');
    expect(clampThemeColor('#ffffff')).toBe('#ededed');
  });

  it('leaves colors under the ceiling alone, normalised to hex', () => {
    expect(clampThemeColor('#000000')).toBe('#000000');
    expect(clampThemeColor('rgb(20, 20, 20)')).toBe('#141414');
    expect(clampThemeColor('#abc')).toBe('#aabbcc');
  });

  it('keeps the hue when darkening a tinted color', () => {
    // Every channel is scaled by the same factor (0.93 / 0.97 here).
    expect(clampThemeColor('#fff0f0')).toBe('#f4e6e6');
  });

  it('passes through anything it cannot parse', () => {
    expect(clampThemeColor('rebeccapurple')).toBe('rebeccapurple');
  });
});

describe('resolveThemeColor', () => {
  afterEach(() => {
    document.documentElement.removeAttribute('data-theme');
    document.body.style.backgroundColor = '';
  });

  it('falls back to the boot palette when nothing is painted yet', () => {
    expect(resolveThemeColor(document)).toBe('#ededed');

    document.documentElement.dataset.theme = 'dark';
    expect(resolveThemeColor(document)).toBe('#000000');
  });

  it('prefers whatever the stylesheet actually paints on body', () => {
    // The fallback must never win over the live value, or the status bar would
    // drift the moment upstream retunes the background token.
    document.body.style.backgroundColor = 'rgb(20, 20, 20)';

    expect(resolveThemeColor(document)).toBe('#141414');
  });

  it('ignores a transparent body background', () => {
    // theme-color must be opaque; a transparent value would leave the status
    // bar at the browser default instead of the app background.
    document.body.style.backgroundColor = 'rgba(0, 0, 0, 0)';

    expect(resolveThemeColor(document)).toBe('#ededed');
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

    expect(meta()?.content).toBe('#ededed');
  });

  it('records the resolved appearance in a cookie for the manifest route', () => {
    applyThemeColor(document);
    expect(document.cookie).toContain('LOBE_THEME_APPEARANCE=light');

    document.documentElement.dataset.theme = 'dark';
    applyThemeColor(document);
    expect(document.cookie).toContain('LOBE_THEME_APPEARANCE=dark');
  });

  it('still records the appearance when the shell already ships the matching tag', () => {
    // Regression: the cookie write used to sit behind the "unchanged" early
    // return, and the shell ships the boot color, so it never ran at startup.
    const existing = document.createElement('meta');
    existing.name = 'theme-color';
    existing.content = '#ededed';
    document.head.append(existing);
    document.cookie = 'LOBE_THEME_APPEARANCE=dark;path=/';

    applyThemeColor(document);

    expect(document.cookie).toContain('LOBE_THEME_APPEARANCE=light');
  });

  it('reuses the tag the html shell already ships', () => {
    const existing = document.createElement('meta');
    existing.name = 'theme-color';
    existing.content = '#ededed';
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
    expect(meta()?.content).toBe('#ededed');

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

    expect(meta()?.content).toBe('#ededed');
  });
});
