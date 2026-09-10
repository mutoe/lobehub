import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { registerServiceWorker } from './registerServiceWorker';

const register = vi.fn();

const setReadyState = (value: DocumentReadyState) =>
  Object.defineProperty(document, 'readyState', { configurable: true, value });

describe('registerServiceWorker', () => {
  beforeEach(() => {
    register.mockReset().mockResolvedValue({ scope: '/' });
    Object.defineProperty(navigator, 'serviceWorker', {
      configurable: true,
      value: { register },
    });
    vi.stubEnv('DEV', false);
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    setReadyState('complete');
  });

  it('registers right away when the page has already finished loading', () => {
    // The mobile entry is a large bundle evaluated after top-level awaits, so
    // by the time it runs `load` has usually fired. A listener attached now
    // would never be called — the regression this test pins.
    setReadyState('complete');

    registerServiceWorker();

    expect(register).toHaveBeenCalledWith('/sw.js');
  });

  it('waits for load when the document is still loading', () => {
    setReadyState('loading');

    registerServiceWorker();
    expect(register).not.toHaveBeenCalled();

    window.dispatchEvent(new Event('load'));
    expect(register).toHaveBeenCalledWith('/sw.js');
  });

  it('does nothing in dev, where no worker is built', () => {
    vi.stubEnv('DEV', true);
    setReadyState('complete');

    registerServiceWorker();

    expect(register).not.toHaveBeenCalled();
  });
});
