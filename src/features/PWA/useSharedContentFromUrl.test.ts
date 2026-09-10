import { renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { useSharedContentFromUrl } from './useSharedContentFromUrl';

const mocks = vi.hoisted(() => ({
  editor: null as null | { focus: ReturnType<typeof vi.fn>; setDocument: ReturnType<typeof vi.fn> },
  readSharedFiles: vi.fn(),
  searchParams: new URLSearchParams(),
  setSearchParams: vi.fn(),
  updateInputMessage: vi.fn(),
  uploadChatFiles: vi.fn(),
}));

vi.mock('@/features/Conversation', () => ({
  useConversationStore: (selector: (s: unknown) => unknown) =>
    selector({
      agentId: 'agent-1',
      editor: mocks.editor,
      updateInputMessage: mocks.updateInputMessage,
    }),
}));

vi.mock('@/features/Conversation/store', () => ({
  contextSelectors: { agentId: (s: { agentId: string }) => s.agentId },
}));

vi.mock('@/store/file', () => ({
  useFileStore: (selector: (s: unknown) => unknown) =>
    selector({ uploadChatFiles: mocks.uploadChatFiles }),
}));

vi.mock('./shareTarget/readSharedFiles', () => ({
  readSharedFiles: mocks.readSharedFiles,
}));

vi.mock('react-router', () => ({
  useSearchParams: () => [mocks.searchParams, mocks.setSearchParams],
}));

/** Run the updater the hook handed to setSearchParams, as the router would. */
const resultingParams = () => {
  const updater = mocks.setSearchParams.mock.calls[0][0] as (
    prev: URLSearchParams,
  ) => URLSearchParams;

  return updater(mocks.searchParams);
};

const flush = () => new Promise((resolve) => setTimeout(resolve, 0));

describe('useSharedContentFromUrl', () => {
  beforeEach(() => {
    mocks.editor = { focus: vi.fn(), setDocument: vi.fn() };
    mocks.searchParams = new URLSearchParams();
    mocks.setSearchParams.mockClear();
    mocks.updateInputMessage.mockClear();
    mocks.uploadChatFiles.mockReset();
    mocks.readSharedFiles.mockReset();
    mocks.readSharedFiles.mockResolvedValue([]);
  });

  describe('text', () => {
    it('drops shared text into the composer without sending it', () => {
      mocks.searchParams = new URLSearchParams({ share_text: 'read this' });

      renderHook(() => useSharedContentFromUrl());

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

      renderHook(() => useSharedContentFromUrl());

      expect(mocks.editor!.setDocument).toHaveBeenCalledWith(
        'markdown',
        'A Great Article\n\nhttps://example.com',
      );
    });

    it('clears every share param from the url once applied', () => {
      mocks.searchParams = new URLSearchParams({
        share_files: 'b1',
        share_text: 'x',
        share_title: 'y',
        share_url: 'https://example.com',
        topic: 'keep-me',
      });

      renderHook(() => useSharedContentFromUrl());

      const next = resultingParams();
      expect(next.get('share_text')).toBeNull();
      expect(next.get('share_title')).toBeNull();
      expect(next.get('share_url')).toBeNull();
      expect(next.get('share_files')).toBeNull();
      // Unrelated params must survive.
      expect(next.get('topic')).toBe('keep-me');
    });
  });

  describe('files', () => {
    it('attaches shared files through the ordinary upload path, unsent', async () => {
      const files = [new File(['x'], 'photo.png', { type: 'image/png' })];
      mocks.readSharedFiles.mockResolvedValue(files);
      mocks.searchParams = new URLSearchParams({ share_files: 'b1' });

      renderHook(() => useSharedContentFromUrl());
      await flush();

      expect(mocks.readSharedFiles).toHaveBeenCalledWith('b1');
      expect(mocks.uploadChatFiles).toHaveBeenCalledWith(files, 'agent-1');
      // Nothing was typed, so the composer text must be left alone.
      expect(mocks.editor!.setDocument).not.toHaveBeenCalled();
      expect(mocks.editor!.focus).toHaveBeenCalled();
    });

    it('carries text and files together', async () => {
      const files = [new File(['x'], 'photo.png', { type: 'image/png' })];
      mocks.readSharedFiles.mockResolvedValue(files);
      mocks.searchParams = new URLSearchParams({ share_files: 'b1', share_text: 'what is this?' });

      renderHook(() => useSharedContentFromUrl());
      await flush();

      expect(mocks.updateInputMessage).toHaveBeenCalledWith('what is this?');
      expect(mocks.uploadChatFiles).toHaveBeenCalledWith(files, 'agent-1');
    });

    it('does not start an upload when the batch turned out empty', async () => {
      // A reload after the share was consumed: the id is still in the URL but
      // the cache is gone. Clear the param, attach nothing.
      mocks.searchParams = new URLSearchParams({ share_files: 'stale' });

      renderHook(() => useSharedContentFromUrl());
      await flush();

      expect(mocks.uploadChatFiles).not.toHaveBeenCalled();
      expect(resultingParams().get('share_files')).toBeNull();
    });
  });

  it('holds the payload until the editor mounts instead of dropping it', () => {
    // A share lands on a cold start, so the first render usually has no editor.
    mocks.editor = null;
    mocks.searchParams = new URLSearchParams({ share_text: 'read this' });

    const { rerender } = renderHook(() => useSharedContentFromUrl());

    expect(mocks.updateInputMessage).not.toHaveBeenCalled();
    // The params must NOT be consumed while the payload could not be applied.
    expect(mocks.setSearchParams).not.toHaveBeenCalled();

    mocks.editor = { focus: vi.fn(), setDocument: vi.fn() };
    rerender();

    expect(mocks.editor.setDocument).toHaveBeenCalledWith('markdown', 'read this');
  });

  it('does nothing when no share payload is present', () => {
    mocks.searchParams = new URLSearchParams({ topic: 'abc' });

    renderHook(() => useSharedContentFromUrl());

    expect(mocks.editor!.setDocument).not.toHaveBeenCalled();
    expect(mocks.readSharedFiles).not.toHaveBeenCalled();
    expect(mocks.setSearchParams).not.toHaveBeenCalled();
  });

  it('applies a share only once even if the effect re-runs', () => {
    mocks.searchParams = new URLSearchParams({ share_text: 'read this' });

    const { rerender } = renderHook(() => useSharedContentFromUrl());
    rerender();

    expect(mocks.updateInputMessage).toHaveBeenCalledTimes(1);
  });
});
