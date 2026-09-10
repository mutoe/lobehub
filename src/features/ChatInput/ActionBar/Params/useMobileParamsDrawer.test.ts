import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { useGlobalStore } from '@/store/global';

import { useMobileParamsDrawer } from './useMobileParamsDrawer';

const setStatus = (patch: Partial<ReturnType<typeof useGlobalStore.getState>['status']>) => {
  useGlobalStore.setState({
    isStatusInit: true,
    status: { ...useGlobalStore.getState().status, ...patch },
  });
};

beforeEach(() => {
  vi.spyOn(useGlobalStore.getState().statusStorage, 'saveToLocalStorage').mockResolvedValue(
    undefined,
  );
  setStatus({
    showRightPanel: false,
    workingSidebarTab: undefined,
    workingSidebarTabRequest: undefined,
  });
});

describe('useMobileParamsDrawer', () => {
  it('opens when the params sidebar is requested after mount', () => {
    const { result } = renderHook(() => useMobileParamsDrawer());
    expect(result.current.open).toBe(false);

    act(() => useGlobalStore.getState().openWorkingSidebar('params'));

    expect(result.current.open).toBe(true);
  });

  it('ignores a request left behind by an earlier session', () => {
    // Persisted status can hand the hook an existing request on first render;
    // that must not pop the sheet at launch.
    setStatus({
      showRightPanel: true,
      workingSidebarTab: 'params',
      workingSidebarTabRequest: { nonce: 7, tab: 'params' },
    });

    const { result } = renderHook(() => useMobileParamsDrawer());

    expect(result.current.open).toBe(false);
  });

  it('ignores requests for other sidebar tabs', () => {
    const { result } = renderHook(() => useMobileParamsDrawer());

    act(() => useGlobalStore.getState().openWorkingSidebar('files'));

    expect(result.current.open).toBe(false);
  });

  it('closes and clears the right-panel flag so the next tap reopens', () => {
    const { result } = renderHook(() => useMobileParamsDrawer());
    act(() => useGlobalStore.getState().openWorkingSidebar('params'));
    expect(useGlobalStore.getState().status.showRightPanel).toBe(true);

    act(() => result.current.close());

    expect(result.current.open).toBe(false);
    expect(useGlobalStore.getState().status.showRightPanel).toBe(false);

    act(() => useGlobalStore.getState().openWorkingSidebar('params'));
    expect(result.current.open).toBe(true);
  });
});
