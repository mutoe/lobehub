// @vitest-environment happy-dom
import { act, renderHook, waitFor } from '@testing-library/react';
import type { ClipboardEvent } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { usePasteImageUpload } from './usePasteImageUpload';

const uploadWithProgress = vi.fn();
const messageError = vi.fn();

vi.mock('@/store/file', () => ({
  useFileStore: (selector: any) => selector({ uploadWithProgress }),
}));

vi.mock('@/components/AntdStaticMethods', () => ({
  message: {
    error: (...args: any[]) => messageError(...args),
  },
}));

const createPasteEvent = (files: File[]) =>
  ({
    clipboardData: { files },
    preventDefault: vi.fn(),
  }) as unknown as ClipboardEvent<HTMLTextAreaElement> & {
    preventDefault: ReturnType<typeof vi.fn>;
  };

const imageFile = (name = 'pasted.png', size = 1024) => {
  const file = new File(['x'.repeat(size)], name, { type: 'image/png' });
  // happy-dom may ignore content length; pin size explicitly
  Object.defineProperty(file, 'size', { value: size });
  return file;
};

beforeEach(() => {
  vi.clearAllMocks();
  vi.stubGlobal('URL', {
    ...URL,
    createObjectURL: vi.fn(() => 'blob:preview-url'),
    revokeObjectURL: vi.fn(),
  });
});

describe('usePasteImageUpload', () => {
  it('should ignore paste without image files', () => {
    const onUpload = vi.fn();
    const { result } = renderHook(() => usePasteImageUpload({ onUpload }));

    const textFile = new File(['hello'], 'note.txt', { type: 'text/plain' });
    const event = createPasteEvent([textFile]);

    act(() => {
      result.current.onPaste(event);
    });

    expect(event.preventDefault).not.toHaveBeenCalled();
    expect(uploadWithProgress).not.toHaveBeenCalled();
    expect(onUpload).not.toHaveBeenCalled();
  });

  it('should upload pasted image and emit url', async () => {
    uploadWithProgress.mockResolvedValueOnce({ url: 'https://cdn.example.com/a.png' });
    const onUpload = vi.fn();
    const { result } = renderHook(() => usePasteImageUpload({ onUpload }));

    const event = createPasteEvent([imageFile()]);

    act(() => {
      result.current.onPaste(event);
    });

    expect(event.preventDefault).toHaveBeenCalled();
    await waitFor(() => {
      expect(onUpload).toHaveBeenCalledWith('https://cdn.example.com/a.png');
    });
    expect(uploadWithProgress).toHaveBeenCalledWith(
      expect.objectContaining({ skipCheckFileType: true }),
    );
  });

  it('should emit url with dimensions when upload result contains them', async () => {
    uploadWithProgress.mockResolvedValueOnce({
      dimensions: { height: 512, width: 768 },
      url: 'https://cdn.example.com/b.png',
    });
    const onUpload = vi.fn();
    const { result } = renderHook(() => usePasteImageUpload({ onUpload }));

    act(() => {
      result.current.onPaste(createPasteEvent([imageFile()]));
    });

    await waitFor(() => {
      expect(onUpload).toHaveBeenCalledWith({
        dimensions: { height: 512, width: 768 },
        url: 'https://cdn.example.com/b.png',
      });
    });
  });

  it('should only upload the first image when multiple are pasted', async () => {
    uploadWithProgress.mockResolvedValueOnce({ url: 'https://cdn.example.com/first.png' });
    const onUpload = vi.fn();
    const { result } = renderHook(() => usePasteImageUpload({ onUpload }));

    act(() => {
      result.current.onPaste(createPasteEvent([imageFile('1.png'), imageFile('2.png')]));
    });

    await waitFor(() => {
      expect(onUpload).toHaveBeenCalledTimes(1);
    });
    expect(uploadWithProgress).toHaveBeenCalledTimes(1);
  });

  it('should reject image exceeding maxFileSize but still prevent default', () => {
    const onUpload = vi.fn();
    const { result } = renderHook(() => usePasteImageUpload({ maxFileSize: 100, onUpload }));

    const event = createPasteEvent([imageFile('big.png', 200)]);

    act(() => {
      result.current.onPaste(event);
    });

    expect(event.preventDefault).toHaveBeenCalled();
    expect(uploadWithProgress).not.toHaveBeenCalled();
  });

  it('should do nothing when disabled', () => {
    const onUpload = vi.fn();
    const { result } = renderHook(() => usePasteImageUpload({ disabled: true, onUpload }));

    const event = createPasteEvent([imageFile()]);

    act(() => {
      result.current.onPaste(event);
    });

    expect(event.preventDefault).not.toHaveBeenCalled();
    expect(uploadWithProgress).not.toHaveBeenCalled();
  });

  it('should toast and clear preview when upload fails, without unhandled rejection', async () => {
    uploadWithProgress.mockRejectedValueOnce(new Error('NetWorkError'));
    const onUpload = vi.fn();
    const { result } = renderHook(() => usePasteImageUpload({ onUpload }));

    act(() => {
      result.current.onPaste(createPasteEvent([imageFile()]));
    });

    await waitFor(() => {
      expect(messageError).toHaveBeenCalled();
    });
    expect(onUpload).not.toHaveBeenCalled();
    expect(result.current.pastePreviewUrl).toBeNull();
  });

  it('should expose preview url during upload and clear it after', async () => {
    let resolveUpload: (value: any) => void;
    uploadWithProgress.mockImplementationOnce(
      () =>
        new Promise((resolve) => {
          resolveUpload = resolve;
        }),
    );
    const onUpload = vi.fn();
    const { result } = renderHook(() => usePasteImageUpload({ onUpload }));

    act(() => {
      result.current.onPaste(createPasteEvent([imageFile()]));
    });

    expect(result.current.pastePreviewUrl).toBe('blob:preview-url');

    act(() => {
      resolveUpload!({ url: 'https://cdn.example.com/c.png' });
    });

    await waitFor(() => {
      expect(result.current.pastePreviewUrl).toBeNull();
    });
    expect(onUpload).toHaveBeenCalledWith('https://cdn.example.com/c.png');
  });
});
