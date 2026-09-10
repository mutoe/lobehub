import { render } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import SharedTextFromUrl from './SharedTextFromUrl';

const mocks = vi.hoisted(() => ({
  editor: null as null | { focus: ReturnType<typeof vi.fn>; setDocument: ReturnType<typeof vi.fn> },
  searchParams: new URLSearchParams(),
  setSearchParams: vi.fn(),
  updateInputMessage: vi.fn(),
}));

vi.mock('@/features/Conversation', () => ({
  useConversationStore: (selector: (s: unknown) => unknown) =>
    selector({ editor: mocks.editor, updateInputMessage: mocks.updateInputMessage }),
}));

vi.mock('react-router', () => ({
  useSearchParams: () => [mocks.searchParams, mocks.setSearchParams],
}));

/** Run the updater the component handed to setSearchParams, as the router would. */
const resultingParams = () => {
  const updater = mocks.setSearchParams.mock.calls[0][0] as (
    prev: URLSearchParams,
  ) => URLSearchParams;

  return updater(mocks.searchParams);
};

describe('SharedTextFromUrl', () => {
  beforeEach(() => {
    mocks.editor = { focus: vi.fn(), setDocument: vi.fn() };
    mocks.searchParams = new URLSearchParams();
    mocks.setSearchParams.mockClear();
    mocks.updateInputMessage.mockClear();
  });

  it('drops shared text into the composer without sending it', () => {
    mocks.searchParams = new URLSearchParams({ share_text: 'read this' });

    render(<SharedTextFromUrl />);

    expect(mocks.editor!.setDocument).toHaveBeenCalledWith('markdown', 'read this');
    // setDocument alone leaves Send disabled — inputMessage must stay in sync.
    expect(mocks.updateInputMessage).toHaveBeenCalledWith('read this');
    expect(mocks.editor!.focus).toHaveBeenCalled();
  });

  it('combines title and url into one markdown payload', () => {
    mocks.searchParams = new URLSearchParams({
      share_text: 'https://example.com',
      share_title: 'A Great Article',
    });

    render(<SharedTextFromUrl />);

    expect(mocks.editor!.setDocument).toHaveBeenCalledWith(
      'markdown',
      'A Great Article\n\nhttps://example.com',
    );
  });

  it('clears every share param from the url once applied', () => {
    mocks.searchParams = new URLSearchParams({
      share_text: 'x',
      share_title: 'y',
      share_url: 'https://example.com',
      topic: 'keep-me',
    });

    render(<SharedTextFromUrl />);

    const next = resultingParams();
    expect(next.get('share_text')).toBeNull();
    expect(next.get('share_title')).toBeNull();
    expect(next.get('share_url')).toBeNull();
    // Unrelated params must survive.
    expect(next.get('topic')).toBe('keep-me');
  });

  it('holds the payload until the editor mounts instead of dropping it', () => {
    // A share lands on a cold start, so the first render usually has no editor.
    mocks.editor = null;
    mocks.searchParams = new URLSearchParams({ share_text: 'read this' });

    const { rerender } = render(<SharedTextFromUrl />);

    expect(mocks.updateInputMessage).not.toHaveBeenCalled();
    // The params must NOT be consumed while the payload could not be applied.
    expect(mocks.setSearchParams).not.toHaveBeenCalled();

    mocks.editor = { focus: vi.fn(), setDocument: vi.fn() };
    rerender(<SharedTextFromUrl />);

    expect(mocks.editor.setDocument).toHaveBeenCalledWith('markdown', 'read this');
  });

  it('does nothing when no share payload is present', () => {
    mocks.searchParams = new URLSearchParams({ topic: 'abc' });

    render(<SharedTextFromUrl />);

    expect(mocks.editor!.setDocument).not.toHaveBeenCalled();
    expect(mocks.setSearchParams).not.toHaveBeenCalled();
  });

  it('applies a share only once even if the effect re-runs', () => {
    mocks.searchParams = new URLSearchParams({ share_text: 'read this' });

    const { rerender } = render(<SharedTextFromUrl />);
    rerender(<SharedTextFromUrl />);

    expect(mocks.updateInputMessage).toHaveBeenCalledTimes(1);
  });
});
