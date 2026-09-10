import { describe, expect, it } from 'vitest';

import { pwaPrecacheAllowlist, shouldPrecache } from './pwaPrecacheAllowlist';

describe('shouldPrecache', () => {
  describe('i18n', () => {
    it('keeps the precached locale', () => {
      expect(shouldPrecache('i18n/i18n-zh-CN-BFYDkEMg.js')).toBe(true);
      expect(shouldPrecache('i18n/i18n-zh-CN-models-DC-KvSvS.js')).toBe(true);
    });

    it('drops every other locale', () => {
      expect(shouldPrecache('i18n/i18n-en-US-DjOrYbGM.js')).toBe(false);
      expect(shouldPrecache('i18n/i18n-ar-XPbhYyv5.js')).toBe(false);
      expect(shouldPrecache('i18n/i18n-default-BV0oTRYH.js')).toBe(false);
    });

    it('does not confuse zh-TW with zh-CN', () => {
      expect(shouldPrecache('i18n/i18n-zh-TW-app-shell-abc123.js')).toBe(false);
    });
  });

  describe('shiki', () => {
    it('keeps the allowlisted grammars', () => {
      expect(shouldPrecache('shiki/javascript-DX6HyqmW.js')).toBe(true);
      expect(shouldPrecache('shiki/json-j4gwFoL2.js')).toBe(true);
      expect(shouldPrecache('shiki/markdown-BH-LV3Yr.js')).toBe(true);
    });

    it('does not let json5 / jsonc / jsonl / jsonnet ride in on the json prefix', () => {
      // The whole reason the pattern is anchored to the hash separator.
      expect(shouldPrecache('shiki/json5-BAAKVMSP.js')).toBe(false);
      expect(shouldPrecache('shiki/jsonc-BTSuFV6h.js')).toBe(false);
      expect(shouldPrecache('shiki/jsonl-DrvxauU6.js')).toBe(false);
      expect(shouldPrecache('shiki/jsonnet-CztOUNE-.js')).toBe(false);
    });

    it('drops the long tail of grammars', () => {
      expect(shouldPrecache('shiki/abap-BV2a08LD.js')).toBe(false);
      expect(shouldPrecache('shiki/actionscript-3-B0NCPQ-u.js')).toBe(false);
    });
  });

  it('leaves non-i18n, non-shiki assets alone', () => {
    expect(shouldPrecache('assets/index-B3JXVkjS.css')).toBe(true);
    expect(shouldPrecache('assets/index.mobile-BylbJoFw.js')).toBe(true);
  });
});

describe('pwaPrecacheAllowlist', () => {
  it('filters a workbox manifest in place', () => {
    const result = pwaPrecacheAllowlist([
      { revision: null, url: 'assets/index-B3JXVkjS.css' },
      { revision: null, url: 'i18n/i18n-zh-CN-BFYDkEMg.js' },
      { revision: null, url: 'i18n/i18n-en-US-DjOrYbGM.js' },
      { revision: null, url: 'shiki/python-abc12345.js' },
      { revision: null, url: 'shiki/abap-BV2a08LD.js' },
    ]);

    expect(result.manifest.map((entry) => entry.url)).toEqual([
      '/_spa/assets/index-B3JXVkjS.css',
      '/_spa/i18n/i18n-zh-CN-BFYDkEMg.js',
      '/_spa/shiki/python-abc12345.js',
    ]);
  });

  it('rewrites every url to where the build is actually served from', () => {
    // The worker lives at the site root while the bundle lives under /_spa/.
    // A relative `assets/x.css` resolves to /assets/x.css from there — a 404
    // that fails the whole precache install and leaves the worker inactive.
    const result = pwaPrecacheAllowlist([{ revision: 'abc', url: 'assets/index-B3JXVkjS.css' }]);

    expect(result.manifest).toEqual([{ revision: 'abc', url: '/_spa/assets/index-B3JXVkjS.css' }]);
  });
});
