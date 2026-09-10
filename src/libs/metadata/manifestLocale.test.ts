// @vitest-environment node
import { describe, expect, it, vi } from 'vitest';

import { pickManifestLocale } from './manifestLocale';

// Only the pure picker is under test; the Next.js request helpers are stubbed
// so the module can be imported outside a request scope.
vi.mock('next/headers', () => ({ cookies: vi.fn(), headers: vi.fn() }));

describe('pickManifestLocale', () => {
  it('prefers the locale cookie the boot script set', () => {
    expect(pickManifestLocale('zh-CN', 'en-US,en;q=0.9')).toBe('zh-CN');
  });

  it('treats the "auto" cookie as unset and reads Accept-Language', () => {
    expect(pickManifestLocale('auto', 'zh-CN,zh;q=0.9,en;q=0.8')).toBe('zh-CN');
  });

  it('takes only the first Accept-Language entry, ignoring its q-value', () => {
    expect(pickManifestLocale(undefined, 'ja-JP;q=0.8, en-US')).toBe('ja-JP');
  });

  it('maps a bare language tag onto a supported locale', () => {
    expect(pickManifestLocale(undefined, 'zh')).toBe('zh-CN');
  });

  it('falls back to the default locale when neither signal helps', () => {
    expect(pickManifestLocale(null, null)).toBe('en-US');
    expect(pickManifestLocale('xx-YY', 'xx-YY')).toBe('en-US');
  });
});
