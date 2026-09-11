import { afterEach, describe, expect, it, vi } from 'vitest';

import {
  HOVER_NONE_CSS,
  HOVER_NONE_MEDIA,
  isHoverNonePointer,
  TABLET_HOVER_NONE_CSS,
} from './hoverNone';

describe('hoverNone', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('matches both non-hover and coarse pointers', () => {
    expect(HOVER_NONE_MEDIA).toContain('hover: none');
    expect(HOVER_NONE_MEDIA).toContain('pointer: coarse');
    expect(HOVER_NONE_CSS).toBe(`@media ${HOVER_NONE_MEDIA}`);
  });

  // The test config builds the desktop shell (`__MOBILE__` = false); there the
  // shared-chrome variant must be live. The phone build turns it inert.
  it('is live in the desktop shell build', () => {
    expect(TABLET_HOVER_NONE_CSS).toBe(HOVER_NONE_CSS);
  });

  it('reports a coarse / hover-none pointer from matchMedia', () => {
    expect(isHoverNonePointer(() => ({ matches: true }))).toBe(true);
    expect(isHoverNonePointer(() => ({ matches: false }))).toBe(false);
  });

  it('is false when matchMedia is unavailable', () => {
    expect(isHoverNonePointer(undefined)).toBe(false);
  });
});
