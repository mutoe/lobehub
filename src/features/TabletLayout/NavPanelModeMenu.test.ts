import { describe, expect, it, vi } from 'vitest';

import { buildNavPanelModeItems } from './NavPanelModeMenu';

const labels = { autoHide: 'autoHide', collapse: 'collapse', docked: 'docked', float: 'float' };

describe('buildNavPanelModeItems', () => {
  it('marks exactly the current mode as checked and keeps collapse last', () => {
    const items = buildNavPanelModeItems({
      labels,
      mode: 'float',
      onCollapse: vi.fn(),
      onSelect: vi.fn(),
    });

    const checks = items
      .filter((i) => i && 'type' in i && i.type === 'checkbox')
      .map((i) => [(i as { key: string }).key, (i as { checked: boolean }).checked]);
    expect(checks).toEqual([
      ['docked', false],
      ['float', true],
      ['autoHide', false],
    ]);

    const last = items.at(-1) as { key: string };
    expect(last.key).toBe('collapse');
  });

  it('routes selection and collapse to their callbacks', () => {
    const onSelect = vi.fn();
    const onCollapse = vi.fn();
    const items = buildNavPanelModeItems({ labels, mode: 'docked', onCollapse, onSelect });

    const autoHide = items.find((i) => i && 'key' in i && i.key === 'autoHide') as {
      onCheckedChange: (checked: boolean) => void;
    };
    // base-ui reports the would-be checked state; either way it is a pick
    autoHide.onCheckedChange(true);
    expect(onSelect).toHaveBeenCalledWith('autoHide');

    const collapse = items.at(-1) as { onClick: () => void };
    collapse.onClick();
    expect(onCollapse).toHaveBeenCalledTimes(1);
  });
});
