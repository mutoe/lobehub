/**
 * Fork-only: keeps `<meta name="theme-color">` in step with the app theme.
 *
 * An installed PWA has no browser chrome of its own, so the system paints the
 * status bar (and, on Android, the gesture navigation bar) with this value.
 * Upstream never ships the meta tag at all — the only color the platform can
 * find is `theme_color` in the web manifest, which is a single hardcoded black
 * (`src/libs/metadata/manifest.ts`). A manifest color is also frozen at install
 * time, so it cannot follow a runtime theme switch even in principle.
 *
 * The meta tag can: the browser re-reads it whenever its content changes.
 */
import debug from 'debug';

const log = debug('lobe-pwa:theme-color');

/**
 * Mirrors the boot stylesheet in `index.mobile.html`, which paints the page
 * before any stylesheet from the bundle has loaded. Only used when the live
 * value is unavailable — during boot, or under a DOM with no cascade.
 */
const BOOT_PALETTE = { dark: '#000000', light: '#f8f8f8' } as const;

/**
 * `theme-color` must be opaque; a fully transparent value is silently dropped
 * and the platform falls back to its own default, which is exactly the black
 * bar we are trying to get rid of.
 */
const isOpaque = (color: string) => Boolean(color) && !/^transparent$|,\s*0\s*\)/.test(color);

/**
 * The color the app actually paints behind everything.
 *
 * Read from the live document rather than hardcoded so it cannot drift when
 * upstream retunes the background token; `BOOT_PALETTE` is only the safety net.
 */
export const resolveThemeColor = (doc: Document): string => {
  const painted = doc.defaultView?.getComputedStyle(doc.body).backgroundColor ?? '';

  if (isOpaque(painted)) return painted;

  return doc.documentElement.dataset.theme === 'dark' ? BOOT_PALETTE.dark : BOOT_PALETTE.light;
};

/** Point the document's theme-color at the current background, creating the tag if needed. */
export const applyThemeColor = (doc: Document): void => {
  let meta = doc.querySelector<HTMLMetaElement>('meta[name="theme-color"]');

  if (!meta) {
    meta = doc.createElement('meta');
    meta.name = 'theme-color';
    doc.head.append(meta);
  }

  const color = resolveThemeColor(doc);

  // Writing an unchanged value still counts as a mutation, and the browser
  // re-evaluates the system bars on every one of them.
  if (meta.content === color) return;

  meta.content = color;
  log('theme-color -> %s', color);
};

/**
 * Watch `data-theme` on `<html>` — the attribute next-themes flips, both on an
 * explicit user choice and on an OS-level change while the app follows the
 * system. Watching it covers every case with one listener.
 *
 * @returns a disposer, or undefined when there is no DOM (SSR).
 */
export const startThemeColorSync = (): (() => void) | undefined => {
  if (typeof document === 'undefined') return;

  applyThemeColor(document);

  const observer = new MutationObserver(() => applyThemeColor(document));

  observer.observe(document.documentElement, {
    attributeFilter: ['data-theme'],
    attributes: true,
  });

  return () => observer.disconnect();
};
