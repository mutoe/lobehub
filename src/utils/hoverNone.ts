/**
 * Touch / stylus pointers never emit a sticky `:hover`. Reuse this query
 * wherever chrome is hover-gated (menubars, row actions, collapse toggles).
 */
export const HOVER_NONE_MEDIA = '(hover: none), (pointer: coarse)';

/** CSS `@media` form of {@link HOVER_NONE_MEDIA}. */
export const HOVER_NONE_CSS = `@media ${HOVER_NONE_MEDIA}`;

/**
 * {@link HOVER_NONE_CSS} for chrome shared with the phone shell. The phone SPA
 * is a separate build (`__MOBILE__`) with its own touch affordances, so there
 * the block compiles to a never-matching query and phones stay untouched.
 */
export const TABLET_HOVER_NONE_CSS =
  typeof __MOBILE__ !== 'undefined' && __MOBILE__ ? '@media not all' : HOVER_NONE_CSS;

export const isHoverNonePointer = (
  matchMedia: ((query: string) => { matches: boolean }) | undefined = typeof window === 'undefined'
    ? undefined
    : window.matchMedia.bind(window),
): boolean => Boolean(matchMedia?.(HOVER_NONE_MEDIA).matches);

let cachedHoverNone: boolean | undefined;

/**
 * Session-constant form of {@link isHoverNonePointer}: the primary pointer
 * class does not change while the page lives, so long lists (nav rows) can
 * read it per render without a `matchMedia` call each.
 */
export const hasHoverNonePointer = (): boolean => {
  cachedHoverNone ??= isHoverNonePointer();
  return cachedHoverNone;
};
