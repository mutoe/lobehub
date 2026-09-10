// @vitest-environment node
import { describe, expect, it } from 'vitest';

import { SHARE_FILES_FIELD, SHARE_TARGET_ACTION, SHARE_TEXT_PARAM } from './constants';
import { buildShareRedirect, sharedFileKey, type SharedFileStore, stashSharedFiles } from './stash';

const fakeStore = () => {
  const puts: { file: File; key: string }[] = [];
  const store: SharedFileStore = {
    put: async (key, file) => {
      puts.push({ file, key });
    },
  };

  return { puts, store };
};

const image = (name: string, bytes = 'png-bytes') => new File([bytes], name, { type: 'image/png' });

describe('stashSharedFiles', () => {
  it('stores every shared file under the batch, preserving order', async () => {
    const form = new FormData();
    form.append(SHARE_FILES_FIELD, image('first.png'));
    form.append(SHARE_FILES_FIELD, image('second.png'));
    const { puts, store } = fakeStore();

    const count = await stashSharedFiles(form, store, 'batch-1');

    expect(count).toBe(2);
    expect(puts.map((p) => p.key)).toEqual([
      sharedFileKey('batch-1', 0),
      sharedFileKey('batch-1', 1),
    ]);
    expect(puts.map((p) => p.file.name)).toEqual(['first.png', 'second.png']);
  });

  it('skips empty files', async () => {
    // Android sometimes pads the share with a zero-byte entry for a picker
    // slot that was never filled; stashing it would attach a blank file.
    const form = new FormData();
    form.append(SHARE_FILES_FIELD, image('real.png'));
    form.append(SHARE_FILES_FIELD, image('empty.png', ''));
    const { puts, store } = fakeStore();

    const count = await stashSharedFiles(form, store, 'batch-1');

    expect(count).toBe(1);
    expect(puts[0].file.name).toBe('real.png');
  });

  it('returns 0 and writes nothing for a text-only share', async () => {
    const form = new FormData();
    form.append(SHARE_TEXT_PARAM, 'just words');
    const { puts, store } = fakeStore();

    expect(await stashSharedFiles(form, store, 'batch-1')).toBe(0);
    expect(puts).toHaveLength(0);
  });
});

describe('buildShareRedirect', () => {
  it('forwards text params and the batch id as a GET the SPA can read', () => {
    const form = new FormData();
    form.append(SHARE_TEXT_PARAM, 'look at this');

    const url = new URL(buildShareRedirect(form, 'batch-1'), 'https://example.com');

    expect(url.pathname).toBe(SHARE_TARGET_ACTION);
    expect(url.searchParams.get('share_text')).toBe('look at this');
    expect(url.searchParams.get('share_files')).toBe('batch-1');
  });

  it('omits share_files when no file survived the stash', () => {
    const form = new FormData();
    form.append(SHARE_TEXT_PARAM, 'text only');

    const url = new URL(buildShareRedirect(form, undefined), 'https://example.com');

    expect(url.searchParams.has('share_files')).toBe(false);
  });

  it('drops empty text fields instead of forwarding blank params', () => {
    const form = new FormData();
    form.append(SHARE_TEXT_PARAM, '');
    form.append('share_title', '   ');

    const url = new URL(buildShareRedirect(form, 'batch-1'), 'https://example.com');

    expect([...url.searchParams.keys()]).toEqual(['share_files']);
  });
});
