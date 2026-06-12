import { readFile } from 'node:fs/promises';
import path from 'node:path';

import { describe, expect, it } from 'vitest';

/**
 * Fork feature guard: routes enabled on mobile by this fork must stay
 * registered. If an upstream rebase drops these registrations, this test
 * fails loudly instead of mobile users silently being redirected to `/`
 * by the catch-all.
 */
describe('mobileRouter fork routes', () => {
  const readConfig = () =>
    readFile(path.join(process.cwd(), 'src/spa/router/mobileRouter.config.tsx'), 'utf8');

  it('registers image and video generation routes in the shared main area', async () => {
    const source = await readConfig();

    expect(source).toContain("import('@/routes/(mobile)/image')");
    expect(source).toContain("import('@/routes/(mobile)/image/_layout')");
    expect(source).toContain("import('@/routes/(mobile)/video')");
    expect(source).toContain("import('@/routes/(mobile)/video/_layout')");
    expect(source).toContain("path: 'image'");
    expect(source).toContain("path: 'video'");
  });

  it('registers memory routes in the shared main area', async () => {
    const source = await readConfig();

    expect(source).toContain("import('@/routes/(mobile)/memory/_layout')");
    expect(source).toContain("import('@/routes/(main)/memory/(home)')");
    expect(source).toContain("path: 'memory'");
    for (const tab of ['identities', 'contexts', 'preferences', 'experiences', 'activities']) {
      expect(source).toContain(`path: '${tab}'`);
    }
  });

  it('registers resource / library routes in the shared main area', async () => {
    const source = await readConfig();

    expect(source).toContain("import('@/routes/(mobile)/resource/_layout')");
    expect(source).toContain("import('@/routes/(main)/resource/(home)')");
    expect(source).toContain("import('@/routes/(main)/resource/library')");
    expect(source).toContain("path: 'resource'");
    expect(source).toContain("path: 'library/:id'");
  });

  it('registers community skill list and detail routes', async () => {
    const source = await readConfig();

    expect(source).toContain("import('@/routes/(main)/community/(list)/skill')");
    expect(source).toContain('m.MobileSkillPage');
    expect(source).toContain("path: 'skill'");
    expect(source).toContain("path: 'skill/:slug'");
  });
});
