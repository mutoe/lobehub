// @vitest-environment node
import { INBOX_SESSION_ID } from '@lobechat/const';
import { describe, expect, it } from 'vitest';

import { SHARE_TARGET_ACTION } from '@/features/PWA/shareTarget/constants';

import { getShortcuts, shareTarget } from './pwaCapabilities';

describe('shareTarget', () => {
  it('lands on the inbox conversation', () => {
    // constants.ts must stay dependency-free, so it hardcodes the path; this is
    // the one place that checks it against the real inbox id.
    expect(SHARE_TARGET_ACTION).toBe(`/agent/${INBOX_SESSION_ID}`);
    expect(shareTarget.action).toBe(SHARE_TARGET_ACTION);
  });

  it('accepts images as a multipart POST', () => {
    expect(shareTarget.method).toBe('POST');
    expect(shareTarget.enctype).toBe('multipart/form-data');
    expect(shareTarget.params.files).toEqual([{ accept: ['image/*'], name: 'files' }]);
  });
});

describe('getShortcuts', () => {
  it('translates for zh-CN', () => {
    expect(getShortcuts('zh-CN').map((s) => s.name)).toEqual(['新对话', '图片生成', '任务']);
  });

  it('falls back to English for any other locale', () => {
    expect(getShortcuts('ja-JP').map((s) => s.name)).toEqual([
      'New Chat',
      'Image Generation',
      'Tasks',
    ]);
  });

  it('gives every shortcut an icon and a unique root-relative url', () => {
    const shortcuts = getShortcuts('en-US');

    for (const shortcut of shortcuts) {
      expect(shortcut.icons.length).toBeGreaterThan(0);
      expect(shortcut.url.startsWith('/')).toBe(true);
    }

    const urls = shortcuts.map((s) => s.url);
    expect(new Set(urls).size).toBe(urls.length);
  });
});
