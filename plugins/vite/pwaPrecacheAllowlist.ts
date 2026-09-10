/**
 * Fork-only: narrows the service-worker precache manifest.
 *
 * The build ships ~19 locales and 308 shiki grammars, all of which are loaded
 * on demand at runtime. Upstream therefore excludes both wholesale from the
 * precache (`sharedPwaGlobIgnores`) — it serves a global audience, so
 * precaching any single language would be dead weight for everyone else.
 *
 * A self-hosted deployment with a known audience can make the opposite call:
 * the one locale its users actually read is guaranteed to be fetched, so
 * paying for it during install is strictly better than paying for it on first
 * use. Everything else stays on demand.
 *
 * Kept as a manifest transform rather than a glob negation because
 * `globIgnores` patterns are matched by a glob dialect whose extglob support
 * is easy to get subtly wrong; this is plain, testable JavaScript.
 */

/** The only locale worth paying for during service-worker install. */
export const PRECACHED_LOCALE = 'zh-CN';

/** Grammars common enough that nearly every session hits at least one. */
export const PRECACHED_SHIKI_LANGUAGES = ['javascript', 'typescript', 'python', 'json', 'markdown'];

/**
 * Anchored on purpose: shiki names its chunks `<lang>-<hash>.js`, and a naive
 * substring test for `json` would also drag in `json5`, `jsonc`, `jsonl` and
 * `jsonnet`. The language must be followed directly by the hash separator.
 */
const SHIKI_KEEP = new RegExp(`/(?:${PRECACHED_SHIKI_LANGUAGES.join('|')})-[\\w-]+\\.js$`);

const I18N_KEEP = new RegExp(`/i18n-${PRECACHED_LOCALE}-`);

/**
 * Manifest urls are build-relative (`shiki/abap-x.js`), not absolute, so a
 * `/shiki/` substring test silently matches nothing and waves the whole long
 * tail through.
 */
const inDir = (url: string, dir: string) => url.startsWith(`${dir}/`) || url.includes(`/${dir}/`);

/** Whether one precache candidate survives the allowlist. */
export const shouldPrecache = (url: string): boolean => {
  if (inDir(url, 'i18n')) return I18N_KEEP.test(`/${url}`);
  if (inDir(url, 'shiki')) return SHIKI_KEEP.test(`/${url}`);

  return true;
};

/**
 * workbox `manifestTransforms` entry.
 *
 * Generic over the entry shape rather than redeclaring workbox's `ManifestEntry`:
 * that type requires `revision` and `size`, and a hand-written copy drifts the
 * moment workbox tightens it. Preserving the caller's own type keeps the
 * transform assignable to `ManifestTransform` for free.
 */
export const pwaPrecacheAllowlist = <T extends { url: string }>(entries: T[]) => ({
  manifest: entries.filter((entry) => shouldPrecache(entry.url)),
});
