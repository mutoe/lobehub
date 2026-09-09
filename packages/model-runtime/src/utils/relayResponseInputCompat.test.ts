import { describe, expect, it } from 'vitest';

import { downgradeDeveloperRoleForRelay } from './relayResponseInputCompat';

describe('downgradeDeveloperRoleForRelay', () => {
  it('rewrites developer turns to user', () => {
    const input = [
      { content: 'Current date: 2026-09-10', role: 'developer' },
      { content: 'hello', role: 'user' },
    ];

    expect(downgradeDeveloperRoleForRelay(input)).toEqual([
      { content: 'Current date: 2026-09-10', role: 'user' },
      { content: 'hello', role: 'user' },
    ]);
  });

  it('preserves content, order and sibling fields', () => {
    const input = [
      { content: 'sys', role: 'developer', type: 'message' },
      { content: 'a', role: 'user' },
      { content: 'b', role: 'assistant' },
    ];

    expect(downgradeDeveloperRoleForRelay(input)).toEqual([
      { content: 'sys', role: 'user', type: 'message' },
      { content: 'a', role: 'user' },
      { content: 'b', role: 'assistant' },
    ]);
  });

  it('leaves other roles untouched', () => {
    const input = [
      { content: 'a', role: 'user' },
      { content: 'b', role: 'assistant' },
      { call_id: 'call_1', output: 'ok', type: 'function_call_output' },
    ];

    expect(downgradeDeveloperRoleForRelay(input)).toEqual(input);
  });

  it('returns the same reference when there is nothing to rewrite', () => {
    const input = [{ content: 'a', role: 'user' }];

    expect(downgradeDeveloperRoleForRelay(input)).toBe(input);
  });

  it('does not mutate the original input', () => {
    const item = { content: 'sys', role: 'developer' };
    const input = [item];

    downgradeDeveloperRoleForRelay(input);

    expect(item.role).toBe('developer');
  });

  it('tolerates non-array and malformed entries', () => {
    expect(downgradeDeveloperRoleForRelay('plain string')).toBe('plain string');
    expect(downgradeDeveloperRoleForRelay(undefined)).toBeUndefined();
    expect(downgradeDeveloperRoleForRelay([null, undefined, 'text', 42])).toEqual([
      null,
      undefined,
      'text',
      42,
    ]);
  });
});
