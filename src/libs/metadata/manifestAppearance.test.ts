// @vitest-environment node
import { describe, expect, it, vi } from 'vitest';

import { pickManifestColors } from './manifestAppearance';

// Only the pure picker is under test; the Next.js request helper is stubbed
// so the module can be imported outside a request scope.
vi.mock('next/headers', () => ({ cookies: vi.fn() }));

describe('pickManifestColors', () => {
  it('paints a light install light, with theme_color pulled under the lightness Chromium honours', () => {
    expect(pickManifestColors('light')).toEqual({ backgroundColor: '#f8f8f8', color: '#ededed' });
  });

  it('paints a dark install black', () => {
    expect(pickManifestColors('dark')).toEqual({ backgroundColor: '#000000', color: '#000000' });
  });

  it('treats a missing or unknown cookie as light', () => {
    expect(pickManifestColors(undefined).color).toBe('#ededed');
    expect(pickManifestColors('system').color).toBe('#ededed');
  });
});
