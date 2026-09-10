import debug from 'debug';

const log = debug('lobe-pwa:sw');

/**
 * Register the mobile service worker.
 *
 * Served from `/sw.js` (copied there by scripts/copySpaBuildCore.ts) so its
 * scope covers the whole app — the SPA bundle lives under `/_spa/`, and a
 * worker registered from there would control none of the routes the user
 * actually visits.
 *
 * The worker only caches build assets: fonts, images and the hashed JS/CSS
 * chunks. API traffic and navigations deliberately bypass it — see the VitePWA
 * block in vite.config.ts for why.
 *
 * Updates are intentionally NOT force-activated. `registerType: 'prompt'`
 * leaves a new worker waiting until every tab of the app is closed, so a deploy
 * can never reload the page out from under a half-typed message; the user picks
 * it up on their next cold start.
 */
export const registerServiceWorker = () => {
  if (typeof window === 'undefined') return;
  if (!('serviceWorker' in navigator)) return;

  // The worker is a production build artifact; it does not exist in dev.
  if (import.meta.env.DEV) return;

  const register = () => {
    navigator.serviceWorker.register('/sw.js').then(
      (registration) => log('registered, scope=%s', registration.scope),
      // A failed registration must stay non-fatal: the app works fine without
      // a worker, and a rejected promise here would surface as an unhandled
      // rejection on every cold start.
      (error) => log('registration failed: %o', error),
    );
  };

  // Deferred until `load` so the worker's install does not compete with the
  // first paint for bandwidth — but the entry bundle is evaluated behind
  // top-level awaits, and on a fast connection `load` has already fired by
  // the time this runs. A listener attached then would never be called.
  if (document.readyState === 'complete') register();
  else window.addEventListener('load', register, { once: true });
};
