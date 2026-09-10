/**
 * Fork-only: tells the server which appearance the mobile app is showing.
 *
 * The web app manifest is fetched from a fixed URL with no way to express
 * "light or dark" — Chromium parses a single `theme_color`, and on Android that
 * one static value paints the WebAPK splash screen and the gesture navigation
 * bar (`kWebAppNavigationBarThemeColor`, enabled by default). The status bar
 * follows the page's `<meta name="theme-color">` at runtime, but the navigation
 * bar never does, so a light app installed with the upstream black manifest
 * keeps a black bar at the bottom for good.
 *
 * The one signal a same-origin manifest fetch does carry is cookies. The app
 * records its resolved appearance here; the manifest route reads it back and
 * emits matching colors, and the WebAPK picks them up on its next manifest
 * update check.
 */
export const LOBE_THEME_APPEARANCE_COOKIE = 'LOBE_THEME_APPEARANCE';

export type Appearance = 'dark' | 'light';

const ONE_YEAR = 365 * 24 * 60 * 60;

/** The appearance next-themes resolved onto `<html data-theme>`. */
export const readAppearance = (doc: Document): Appearance =>
  doc.documentElement.dataset.theme === 'dark' ? 'dark' : 'light';

export const writeAppearanceCookie = (doc: Document, appearance: Appearance): void => {
  doc.cookie = `${LOBE_THEME_APPEARANCE_COOKIE}=${appearance};path=/;max-age=${ONE_YEAR};SameSite=Lax`;
};
