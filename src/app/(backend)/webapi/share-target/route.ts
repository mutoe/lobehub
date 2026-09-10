/**
 * Fork-only: server-side fallback for the Web Share Target POST.
 *
 * The service worker (`src/features/PWA/sw/sw.ts`) answers this POST whenever
 * it controls the origin, so in steady state nothing reaches here. It exists
 * for the moments a worker is not in control — first launch after install, a
 * share fired before the app has ever been opened, a worker evicted by the
 * browser — so that a share still lands in the composer instead of on an
 * error page. Attached files cannot be handed over without the Cache API,
 * so this path forwards the text fields only.
 *
 * Lives under `/webapi` on purpose: that prefix bypasses the SPA proxy and the
 * statically cached page route, which would otherwise record a 405 for the
 * POST and keep serving it to every later GET (see `shareTarget/constants.ts`).
 */
import { type NextRequest } from 'next/server';

import { buildShareRedirect } from '@/features/PWA/shareTarget/stash';

export const POST = async (request: NextRequest) => {
  let formData: FormData;

  try {
    formData = await request.formData();
  } catch {
    formData = new FormData();
  }

  // 303 turns the POST navigation into a GET one — anything else would have
  // the browser re-POST on reload.
  return Response.redirect(new URL(buildShareRedirect(formData, undefined), request.url), 303);
};
