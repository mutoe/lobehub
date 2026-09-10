import '../initialize';

import { RouterProvider } from 'react-router/dom';

import { registerServiceWorker } from '@/features/PWA/registerServiceWorker';
import { startThemeColorSync } from '@/features/PWA/themeColor';
import NextThemeProvider from '@/layout/GlobalProvider/NextThemeProvider';
import { bootTiming } from '@/libs/bootTiming';
import { createAppRouter } from '@/utils/router';

import { startAppInitialization } from './initialize/bootstrap';
import { mobileRoutes } from './router/mobileRouter.config';
import { createSPARoot } from './runtime';

bootTiming.mark('bundle-eval');
startAppInitialization();
registerServiceWorker();
startThemeColorSync();

const router = createAppRouter(mobileRoutes);

createSPARoot(document.getElementById('root')!).render(
  <NextThemeProvider>
    <RouterProvider router={router} />
  </NextThemeProvider>,
);
