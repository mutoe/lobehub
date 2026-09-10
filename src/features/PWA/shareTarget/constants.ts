/**
 * Fork-only: the contract between the three parties of a Web Share Target
 * hand-off — the manifest that advertises it, the service worker that receives
 * the POST, and the composer that finally picks the payload up.
 *
 * Kept dependency-free on purpose: the service worker bundle imports this
 * file, and anything heavier (`@lobechat/const` and friends) would drag the
 * app's module graph into a 20KB worker.
 */

/**
 * Where the OS POSTs a share. The service worker normally answers it; when no
 * worker is in control yet, the route handler at
 * `src/app/(backend)/webapi/share-target/route.ts` does.
 *
 * Must live under a backend prefix (`/webapi`), never on an SPA page path:
 * `src/app/spa/[variants]/[[...path]]/route.ts` is a statically cached GET-only
 * handler, and Next.js writes its 405 for a stray POST into the route cache —
 * after which every GET of that page answers 405 until the cache is purged
 * (seen in production on 2026-09-10 when the action was `/agent/inbox`).
 */
export const SHARE_TARGET_ACTION = '/webapi/share-target';

/**
 * Where the share ends up: the inbox conversation. Must stay equal to
 * `/agent/${INBOX_SESSION_ID}` — `pwaCapabilities.test.ts` pins the two
 * together, since importing the real constant here is exactly what this file
 * must not do.
 */
export const SHARE_LANDING_PATH = '/agent/inbox';

/**
 * Query params carrying shared text. `SharedContentFromUrl` reads them and
 * drops the payload into the composer instead of sending it, so the user can
 * edit or add context before the message goes out.
 */
export const SHARE_TEXT_PARAM = 'share_text';
export const SHARE_TITLE_PARAM = 'share_title';
export const SHARE_URL_PARAM = 'share_url';

/**
 * Query param carrying the batch id of shared files. The files themselves
 * never travel through the URL: a share arrives as a multipart POST that only
 * the service worker can see, so it parks them in the Cache API under
 * `SHARE_FILES_CACHE` and redirects to a GET carrying this id.
 */
export const SHARE_FILES_PARAM = 'share_files';

/** Multipart field name the manifest asks the OS to use for attached files. */
export const SHARE_FILES_FIELD = 'files';

export const SHARE_FILES_CACHE = 'lobe-share-target';

/** Cache keys look like `${SHARE_FILES_PREFIX}/${batchId}/${index}`. */
export const SHARE_FILES_PREFIX = '/_share';

/**
 * A cached `Response` keeps the bytes and the MIME type, but not the original
 * filename or timestamp. They ride along as headers so the composer can rebuild
 * a `File` the upload path treats exactly like one picked from the gallery.
 */
export const SHARE_FILE_NAME_HEADER = 'x-lobe-file-name';
export const SHARE_FILE_MODIFIED_HEADER = 'x-lobe-file-modified';
