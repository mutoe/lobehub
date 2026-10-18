import type { RouteObject } from 'react-router';

import { dynamicElement, dynamicLayout, ErrorBoundary } from '@/utils/router';

/**
 * Fork-only mobile routes, spread into `sharedMainAreaChildren` in
 * mobileRouter.config.tsx (so the `/:workspaceSlug` mirror picks them up too).
 *
 * Kept in their own file so upstream rebases only ever conflict on the single
 * spread line, and so the upstream config stays under the 800-line limit.
 * mobileRouter.forkRoutes.test.tsx guards both the routes and the spread.
 */
export const forkMobileMainAreaRoutes: RouteObject[] = [
  // Image generation routes (fork: enable AI painting on mobile)
  {
    children: [
      {
        element: dynamicElement(() => import('@/routes/(mobile)/image'), 'Mobile > Image'),
        index: true,
      },
    ],
    element: dynamicLayout(
      () => import('@/routes/(mobile)/image/_layout'),
      'Mobile > Image > Layout',
    ),
    errorElement: <ErrorBoundary />,
    path: 'image',
  },

  // Video generation routes (fork: keep the image/video mode switch working)
  {
    children: [
      {
        element: dynamicElement(() => import('@/routes/(mobile)/video'), 'Mobile > Video'),
        index: true,
      },
    ],
    element: dynamicLayout(
      () => import('@/routes/(mobile)/video/_layout'),
      'Mobile > Video > Layout',
    ),
    errorElement: <ErrorBoundary />,
    path: 'video',
  },

  // Memory routes (fork: memory management on mobile — desktop pages reused
  // under a mobile tab-row shell)
  {
    children: [
      {
        element: dynamicElement(
          () => import('@/routes/(main)/memory/(home)'),
          'Mobile > Memory > Home',
        ),
        index: true,
      },
      {
        element: dynamicElement(
          () => import('@/routes/(main)/memory/identities'),
          'Mobile > Memory > Identities',
        ),
        path: 'identities',
      },
      {
        element: dynamicElement(
          () => import('@/routes/(main)/memory/contexts'),
          'Mobile > Memory > Contexts',
        ),
        path: 'contexts',
      },
      {
        element: dynamicElement(
          () => import('@/routes/(main)/memory/preferences'),
          'Mobile > Memory > Preferences',
        ),
        path: 'preferences',
      },
      {
        element: dynamicElement(
          () => import('@/routes/(main)/memory/activities'),
          'Mobile > Memory > Activities',
        ),
        path: 'activities',
      },
    ],
    element: dynamicLayout(
      () => import('@/routes/(mobile)/memory/_layout'),
      'Mobile > Memory > Layout',
    ),
    errorElement: <ErrorBoundary />,
    path: 'memory',
  },

  // Resource routes (fork: resource / knowledge library on mobile)
  {
    children: [
      {
        element: dynamicElement(
          () => import('@/routes/(main)/resource/(home)'),
          'Mobile > Resource > Home',
        ),
        index: true,
      },
      {
        children: [
          {
            element: dynamicElement(
              () => import('@/routes/(main)/resource/library'),
              'Mobile > Resource > Library',
            ),
            index: true,
          },
          {
            element: dynamicElement(
              () => import('@/routes/(main)/resource/library/[slug]'),
              'Mobile > Resource > Library > Slug',
            ),
            path: ':slug',
          },
        ],
        path: 'library/:id',
      },
    ],
    element: dynamicLayout(
      () => import('@/routes/(mobile)/resource/_layout'),
      'Mobile > Resource > Layout',
    ),
    errorElement: <ErrorBoundary />,
    path: 'resource',
  },
];
