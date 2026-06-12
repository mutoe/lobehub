import { readFile } from 'node:fs/promises';
import path from 'node:path';

import { describe, expect, it } from 'vitest';

/**
 * Fork feature guard: image / video generation must stay reachable on mobile.
 * If an upstream rebase drops these registrations, this test fails loudly
 * instead of mobile users silently being redirected to `/` by the catch-all.
 */
describe('mobileRouter generation routes (fork)', () => {
  it('registers image and video generation routes in the shared main area', async () => {
    const source = await readFile(
      path.join(process.cwd(), 'src/spa/router/mobileRouter.config.tsx'),
      'utf8',
    );

    expect(source).toContain("import('@/routes/(mobile)/image')");
    expect(source).toContain("import('@/routes/(mobile)/image/_layout')");
    expect(source).toContain("import('@/routes/(mobile)/video')");
    expect(source).toContain("import('@/routes/(mobile)/video/_layout')");
    expect(source).toContain("path: 'image'");
    expect(source).toContain("path: 'video'");
  });
});
