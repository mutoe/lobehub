/// <reference lib="webworker" />
/**
 * Fork-only mobile service worker (source for `/sw.js`).
 *
 * Built by vite-plugin-pwa's `injectManifest` strategy: the precache list is
 * injected at `self.__WB_MANIFEST`, everything else is ordinary code. Upstream
 * uses `generateSW`, which cannot host the one thing that needs custom logic —
 * the Web Share Target POST handler below.
 *
 * Caching mirrors the previous generateSW config one-to-one, minus the two
 * Google Fonts rules (nothing in the app loads from there).
 *
 * Updates are deliberately not force-activated: no `skipWaiting`, no
 * `clientsClaim`. A new worker waits until every window is closed, so a deploy
 * can never reload the page out from under a half-typed message.
 */
import { ExpirationPlugin } from 'workbox-expiration';
import { cleanupOutdatedCaches, precacheAndRoute, type PrecacheEntry } from 'workbox-precaching';
import { registerRoute } from 'workbox-routing';
import { CacheFirst, NetworkFirst, StaleWhileRevalidate } from 'workbox-strategies';

import {
  SHARE_FILE_MODIFIED_HEADER,
  SHARE_FILE_NAME_HEADER,
  SHARE_FILES_CACHE,
  SHARE_TARGET_ACTION,
} from '../shareTarget/constants';
import { buildShareRedirect, type SharedFileStore, stashSharedFiles } from '../shareTarget/stash';

declare const self: ServiceWorkerGlobalScope & {
  __WB_MANIFEST: (PrecacheEntry | string)[];
};

const DAY = 60 * 60 * 24;

precacheAndRoute(self.__WB_MANIFEST);
cleanupOutdatedCaches();

// ---------------------------------------------------------------------------
// Web Share Target: the OS POSTs a multipart body here. Park the files in the
// Cache API and bounce to a GET the SPA router can read on first paint.
// ---------------------------------------------------------------------------

const cacheFileStore = (cache: Cache): SharedFileStore => ({
  put: (key, file) =>
    cache.put(
      new Request(key),
      new Response(file, {
        headers: {
          'content-type': file.type || 'application/octet-stream',
          [SHARE_FILE_MODIFIED_HEADER]: String(file.lastModified),
          [SHARE_FILE_NAME_HEADER]: encodeURIComponent(file.name),
        },
      }),
    ),
});

registerRoute(
  ({ request, url }) => request.method === 'POST' && url.pathname === SHARE_TARGET_ACTION,
  async ({ request }) => {
    const formData = await request.formData();
    const batchId = crypto.randomUUID();
    const cache = await caches.open(SHARE_FILES_CACHE);
    const stored = await stashSharedFiles(formData, cacheFileStore(cache), batchId);

    const redirect = new URL(
      buildShareRedirect(formData, stored > 0 ? batchId : undefined),
      self.location.origin,
    );

    // 303 turns the POST navigation into a GET one — anything else would have
    // the browser re-POST on reload.
    return Response.redirect(redirect.href, 303);
  },
  'POST',
);

// ---------------------------------------------------------------------------
// Runtime caching
// ---------------------------------------------------------------------------

// Offline fallback for navigations. Network first, so an online load always
// takes the freshly rendered template (current server config, SEO head,
// locale). Only when the network fails — or stalls past the timeout — do we
// serve the last real response this device received, which is stale but
// genuinely came from the server. Never answered from the precached build
// artifact: that HTML has no `window.__SERVER_CONFIG__`.
registerRoute(
  ({ request }) => request.mode === 'navigate',
  new NetworkFirst({
    cacheName: 'app-shell',
    networkTimeoutSeconds: 3,
    plugins: [new ExpirationPlugin({ maxEntries: 20 })],
  }),
);

// Deferred assets excluded from the precache (see sharedPwaGlobIgnores).
const onDemand = (cacheName: string, pattern: RegExp, maxEntries: number) =>
  registerRoute(
    ({ url }) => pattern.test(url.pathname),
    new CacheFirst({
      cacheName,
      plugins: [new ExpirationPlugin({ maxAgeSeconds: 30 * DAY, maxEntries })],
    }),
  );

onDemand('on-demand-i18n', /\/i18n\/.*\.js$/i, 50);
onDemand('on-demand-shiki', /\/shiki\/.*\.js$/i, 150);
onDemand('on-demand-model-bank', /\/model-bank\/.*\.js$/i, 5);

// Content-hashed build chunks: a given URL's bytes never change, so serving
// from cache is always correct and a new deploy simply requests new filenames.
onDemand('spa-assets', /\/assets\/.+\.(?:js|css)$/i, 400);

registerRoute(
  ({ url }) => /\.(?:png|jpg|jpeg|svg|gif|webp|ico|avif)$/i.test(url.pathname),
  new StaleWhileRevalidate({
    cacheName: 'image-assets',
    plugins: [new ExpirationPlugin({ maxAgeSeconds: 30 * DAY, maxEntries: 100 })],
  }),
);
