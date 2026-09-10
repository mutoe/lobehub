/**
 * @vitest-environment node
 */
import type { NextRequest } from 'next/server';
import { describe, expect, it } from 'vitest';

import {
  SHARE_FILES_FIELD,
  SHARE_LANDING_PATH,
  SHARE_TARGET_ACTION,
  SHARE_TEXT_PARAM,
} from '@/features/PWA/shareTarget/constants';

import { POST } from './route';

const ORIGIN = 'https://lobe.example.com';

const createRequest = (body?: BodyInit) =>
  new Request(`${ORIGIN}${SHARE_TARGET_ACTION}`, {
    body,
    method: 'POST',
  }) as unknown as NextRequest;

describe('POST /webapi/share-target', () => {
  it('bounces a text share to the inbox as a GET the composer can read', async () => {
    const form = new FormData();
    form.append(SHARE_TEXT_PARAM, 'look at this');

    const response = await POST(createRequest(form));
    const location = new URL(response.headers.get('location')!, ORIGIN);

    // 303, not 307: the browser must re-issue this as GET, or a reload of the
    // landing page would re-POST the share.
    expect(response.status).toBe(303);
    expect(location.pathname).toBe(SHARE_LANDING_PATH);
    expect(location.searchParams.get(SHARE_TEXT_PARAM)).toBe('look at this');
  });

  it('redirects with a relative Location so the proxy-internal origin never leaks', async () => {
    // Behind nginx the request URL Next.js sees is https://0.0.0.0:3210/...;
    // an absolute redirect built from it sent the phone to 0.0.0.0.
    const request = new Request(`https://0.0.0.0:3210${SHARE_TARGET_ACTION}`, {
      body: new FormData(),
      method: 'POST',
    }) as unknown as NextRequest;

    const response = await POST(request);

    expect(response.headers.get('location')).toBe(SHARE_LANDING_PATH);
  });

  it('drops attached files instead of advertising a batch nobody stored', async () => {
    const form = new FormData();
    form.append(SHARE_TEXT_PARAM, 'with a photo');
    form.append(SHARE_FILES_FIELD, new File(['png'], 'photo.png', { type: 'image/png' }));

    const response = await POST(createRequest(form));
    const location = new URL(response.headers.get('location')!, ORIGIN);

    expect(location.searchParams.has('share_files')).toBe(false);
    expect(location.searchParams.get(SHARE_TEXT_PARAM)).toBe('with a photo');
  });

  it('still lands on the inbox when the body is not a form at all', async () => {
    const response = await POST(createRequest('not multipart'));

    expect(response.status).toBe(303);
    expect(new URL(response.headers.get('location')!, ORIGIN).pathname).toBe(SHARE_LANDING_PATH);
  });
});
