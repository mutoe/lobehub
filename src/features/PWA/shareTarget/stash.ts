/**
 * Service-worker side of a file share. Pure functions over `FormData` so the
 * logic is testable in Node; the worker supplies the Cache API behind
 * `SharedFileStore` (see `../sw/sw.ts`).
 */
import {
  SHARE_FILES_FIELD,
  SHARE_FILES_PARAM,
  SHARE_FILES_PREFIX,
  SHARE_LANDING_PATH,
  SHARE_TEXT_PARAM,
  SHARE_TITLE_PARAM,
  SHARE_URL_PARAM,
} from './constants';

export interface SharedFileStore {
  put: (key: string, file: File) => Promise<void>;
}

export const sharedFileKey = (batchId: string, index: number) =>
  `${SHARE_FILES_PREFIX}/${batchId}/${index}`;

/**
 * Park every non-empty file from the multipart body under `batchId`.
 *
 * @returns how many files were stored — 0 for a text-only share, in which case
 * the redirect must not advertise a batch the composer would look up in vain.
 */
export const stashSharedFiles = async (
  formData: FormData,
  store: SharedFileStore,
  batchId: string,
): Promise<number> => {
  const files = formData
    .getAll(SHARE_FILES_FIELD)
    .filter((entry): entry is File => entry instanceof File && entry.size > 0);

  await Promise.all(files.map((file, index) => store.put(sharedFileKey(batchId, index), file)));

  return files.length;
};

const TEXT_FIELDS = [SHARE_TEXT_PARAM, SHARE_TITLE_PARAM, SHARE_URL_PARAM] as const;

/**
 * The GET the worker (or the server-side fallback) redirects to once the files
 * are parked. Text fields are forwarded verbatim so `composeSharedText` sees the
 * same payload it would have received from a text-only share.
 */
export const buildShareRedirect = (formData: FormData, batchId: string | undefined): string => {
  const params = new URLSearchParams();

  for (const field of TEXT_FIELDS) {
    const value = formData.get(field);

    if (typeof value === 'string' && value.trim()) params.set(field, value);
  }

  if (batchId) params.set(SHARE_FILES_PARAM, batchId);

  const query = params.toString();

  return query ? `${SHARE_LANDING_PATH}?${query}` : SHARE_LANDING_PATH;
};
