import { cookies, headers } from 'next/headers';

import { LOBE_LOCALE_COOKIE } from '@/const/locale';
import { type Locales, matchLocale, normalizeLocale } from '@/locales/resources';

/**
 * Fork-only: pick the locale the web app manifest should be rendered in.
 *
 * A manifest is one JSON document with no runtime translation, and the browser
 * fetches it from a fixed URL with no locale segment. Two signals are still
 * available on that request: the `LOBE_LOCALE` cookie the boot script sets
 * (a same-origin manifest fetch carries cookies), and `Accept-Language` as the
 * fallback for a first visit.
 */
export const pickManifestLocale = (
  cookieLocale: string | null | undefined,
  acceptLanguage: string | null | undefined,
): Locales => {
  // 'auto' is a real cookie value meaning "follow the browser".
  const fromCookie =
    cookieLocale && cookieLocale !== 'auto' ? matchLocale(cookieLocale) : undefined;
  if (fromCookie) return fromCookie;

  const preferred = acceptLanguage?.split(',')[0]?.split(';')[0]?.trim();

  return normalizeLocale(preferred);
};

export const resolveManifestLocale = async (): Promise<Locales> => {
  const [cookieStore, headerStore] = await Promise.all([cookies(), headers()]);

  return pickManifestLocale(
    cookieStore.get(LOBE_LOCALE_COOKIE)?.value,
    headerStore.get('accept-language'),
  );
};
