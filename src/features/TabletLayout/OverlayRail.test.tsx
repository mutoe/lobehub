import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import OverlayRail from './OverlayRail';

describe('OverlayRail', () => {
  it('keeps the child mounted when switching between in-flow and overlay', () => {
    const { rerender } = render(
      <OverlayRail enabled={false} placement="left">
        <div data-testid="panel">panel</div>
      </OverlayRail>,
    );
    const before = screen.getByTestId('panel');

    rerender(
      <OverlayRail enabled showBackdrop placement="left" onDismiss={vi.fn()}>
        <div data-testid="panel">panel</div>
      </OverlayRail>,
    );
    expect(screen.getByTestId('panel')).toBe(before);

    rerender(
      <OverlayRail enabled={false} placement="left">
        <div data-testid="panel">panel</div>
      </OverlayRail>,
    );
    expect(screen.getByTestId('panel')).toBe(before);
  });

  it('only paints the backdrop while enabled and open', () => {
    const { rerender } = render(
      <OverlayRail showBackdrop enabled={false} placement="left" onDismiss={vi.fn()}>
        <div>panel</div>
      </OverlayRail>,
    );
    expect(screen.queryByRole('presentation')).toBeNull();

    rerender(
      <OverlayRail enabled showBackdrop placement="left" onDismiss={vi.fn()}>
        <div>panel</div>
      </OverlayRail>,
    );
    expect(screen.getByRole('presentation')).toBeInTheDocument();
  });
});
