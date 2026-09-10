'use client';

import { Drawer } from '@lobehub/ui/base-ui';
import { lazy, memo, Suspense } from 'react';

import SurfaceSkeleton from '@/components/Skeleton/Surface';

import { useMobileParamsDrawer } from './useMobileParamsDrawer';

// Same section the desktop working sidebar shows for its "params" tab; it
// carries its own title bar, so the drawer renders none.
const ParamsSection = lazy(() => import('@/features/Conversation/WorkingSidebar/ParamsSection'));

/**
 * Fork-only: bottom sheet standing in for the desktop working sidebar's params
 * tab on the mobile chat page. See `useMobileParamsDrawer` for why.
 */
const MobileParamsDrawer = memo(() => {
  const { close, open } = useMobileParamsDrawer();

  return (
    <Drawer
      noHeader
      height={'85%'}
      open={open}
      placement={'bottom'}
      styles={{
        bodyContent: { height: '100%', minHeight: 0, overflow: 'hidden', padding: 0 },
        panel: { borderStartEndRadius: 16, borderStartStartRadius: 16 },
      }}
      onClose={close}
    >
      <Suspense fallback={<SurfaceSkeleton header={false} variant={'list'} />}>
        <ParamsSection />
      </Suspense>
    </Drawer>
  );
});

MobileParamsDrawer.displayName = 'MobileParamsDrawer';

export default MobileParamsDrawer;
