import { describe, expect, it } from 'vitest';

import {
  SHARE_FILE_MODIFIED_HEADER,
  SHARE_FILE_NAME_HEADER,
  SHARE_FILES_CACHE,
  SHARE_FILES_PREFIX,
} from './constants';
import { readSharedFiles, type ShareCacheStorage } from './readSharedFiles';

const ORIGIN = 'https://example.com';

interface Entry {
  body: string;
  headers: Record<string, string>;
}

/** Just enough of the Cache API for the reader: keys / match / delete. */
const fakeStorage = (entries: Record<string, Entry>) => {
  const opened: string[] = [];
  const store = new Map<string, Entry>(
    Object.entries(entries).map(([path, entry]) => [`${ORIGIN}${path}`, entry]),
  );

  const storage: ShareCacheStorage = {
    open: async (name) => {
      opened.push(name);

      return {
        delete: async (req) => store.delete(req.url),
        keys: async () => [...store.keys()].map((url) => new Request(url)),
        match: async (req) => {
          const entry = store.get(req.url);
          if (!entry) return;

          return {
            blob: async () => new Blob([entry.body], { type: entry.headers['content-type'] }),
            headers: { get: (key: string) => entry.headers[key.toLowerCase()] ?? null },
          };
        },
      };
    },
  };

  return { opened, storage, store };
};

const png = (name: string, body: string, modified = 1_700_000_000_000): Entry => ({
  body,
  headers: {
    'content-type': 'image/png',
    [SHARE_FILE_MODIFIED_HEADER]: String(modified),
    [SHARE_FILE_NAME_HEADER]: encodeURIComponent(name),
  },
});

describe('readSharedFiles', () => {
  it('rebuilds Files in share order from the batch and clears them', async () => {
    const { opened, storage, store } = fakeStorage({
      // Deliberately listed out of order: cache.keys() makes no ordering promise.
      [`${SHARE_FILES_PREFIX}/b1/1`]: png('second.png', 'two'),
      [`${SHARE_FILES_PREFIX}/b1/0`]: png('first.png', 'one'),
    });

    const files = await readSharedFiles('b1', storage);

    expect(opened).toEqual([SHARE_FILES_CACHE]);
    expect(files.map((f) => f.name)).toEqual(['first.png', 'second.png']);
    expect(files[0].type).toBe('image/png');
    expect(files[0].lastModified).toBe(1_700_000_000_000);
    expect(await files[0].text()).toBe('one');
    // One-shot: a reload of the same URL must not attach the images twice.
    expect(store.size).toBe(0);
  });

  it('leaves other batches untouched', async () => {
    const { storage, store } = fakeStorage({
      [`${SHARE_FILES_PREFIX}/b1/0`]: png('mine.png', 'x'),
      [`${SHARE_FILES_PREFIX}/b2/0`]: png('theirs.png', 'y'),
    });

    const files = await readSharedFiles('b1', storage);

    expect(files.map((f) => f.name)).toEqual(['mine.png']);
    expect(store.size).toBe(1);
  });

  it('decodes filenames the worker percent-encoded', async () => {
    const { storage } = fakeStorage({
      [`${SHARE_FILES_PREFIX}/b1/0`]: png('照片 1.png', 'x'),
    });

    const [file] = await readSharedFiles('b1', storage);

    expect(file.name).toBe('照片 1.png');
  });

  it('returns nothing for an unknown batch', async () => {
    const { storage } = fakeStorage({});

    expect(await readSharedFiles('nope', storage)).toEqual([]);
  });

  it('returns nothing when the Cache API is unavailable', async () => {
    // Insecure contexts and some privacy modes expose no `caches` at all; the
    // composer must simply come up empty rather than throw on boot.
    expect(await readSharedFiles('b1', undefined)).toEqual([]);
  });
});
