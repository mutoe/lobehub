/**
 * Composer side of a file share: pull the files the service worker parked
 * under a batch id back out of the Cache API as `File` objects the ordinary
 * upload path accepts, then clear them so a reload cannot attach them twice.
 */
import {
  SHARE_FILE_MODIFIED_HEADER,
  SHARE_FILE_NAME_HEADER,
  SHARE_FILES_CACHE,
  SHARE_FILES_PREFIX,
} from './constants';

/**
 * Structural slice of `CacheStorage` — everything the reader touches and
 * nothing more, so tests can hand in a Map-backed fake and the real
 * `globalThis.caches` still type-checks against it.
 */
export interface ShareCacheStorage {
  open: (name: string) => Promise<ShareCache>;
}

export interface ShareCache {
  delete: (request: Request) => Promise<boolean>;
  keys: () => Promise<readonly Request[]>;
  match: (request: Request) => Promise<ShareCacheResponse | undefined>;
}

interface ShareCacheResponse {
  blob: () => Promise<Blob>;
  headers: { get: (name: string) => string | null };
}

const readOne = async (cache: ShareCache, request: Request, index: number) => {
  const response = await cache.match(request);
  if (!response) return;

  const blob = await response.blob();
  const name =
    decodeURIComponent(response.headers.get(SHARE_FILE_NAME_HEADER) ?? '') || `shared-${index}`;
  const lastModified = Number(response.headers.get(SHARE_FILE_MODIFIED_HEADER)) || Date.now();
  const type = response.headers.get('content-type') ?? blob.type;

  return { file: new File([blob], name, { lastModified, type }), index };
};

export const readSharedFiles = async (
  batchId: string,
  storage: ShareCacheStorage | undefined = globalThis.caches,
): Promise<File[]> => {
  if (!storage) return [];

  const cache = await storage.open(SHARE_FILES_CACHE);
  const prefix = `${SHARE_FILES_PREFIX}/${batchId}/`;

  const batch = (await cache.keys())
    .map((request) => ({ path: new URL(request.url).pathname, request }))
    .filter(({ path }) => path.startsWith(prefix))
    .map(({ path, request }) => ({ index: Number(path.slice(prefix.length)), request }));

  const entries = await Promise.all(
    batch.map(({ index, request }) => readOne(cache, request, index)),
  );

  // Consume before returning: even if the upload below fails the share is spent.
  await Promise.all(batch.map(({ request }) => cache.delete(request)));

  return entries
    .filter((entry): entry is NonNullable<typeof entry> => Boolean(entry))
    .sort((a, b) => a.index - b.index)
    .map((entry) => entry.file);
};
