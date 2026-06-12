'use client';

import type { ClipboardEvent } from 'react';
import { useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { message } from '@/components/AntdStaticMethods';
import { useFileStore } from '@/store/file';

import type { UploadData } from './UploadCard';

interface UsePasteImageUploadOptions {
  disabled?: boolean;
  maxFileSize?: number;
  onUpload: (data: UploadData) => void;
}

/**
 * Allow pasting an image from the clipboard into the generation prompt textarea,
 * as an alternative to the manual "+" upload button (UploadCard).
 *
 * Only the first pasted image is handled: `onUpload` consumers close over the
 * current image list, so concurrent uploads in the same tick would overwrite
 * each other.
 */
export const usePasteImageUpload = ({
  disabled,
  maxFileSize,
  onUpload,
}: UsePasteImageUploadOptions) => {
  const { t } = useTranslation('error');
  const uploadWithProgress = useFileStore((s) => s.uploadWithProgress);
  const [pastePreviewUrl, setPastePreviewUrl] = useState<string | null>(null);

  const onPaste = useCallback(
    (event: ClipboardEvent<HTMLTextAreaElement>) => {
      if (disabled) return;

      const file = Array.from(event.clipboardData?.files ?? []).find((item) =>
        item.type.startsWith('image/'),
      );
      if (!file) return;

      // Pasting an image must not insert its file name as prompt text
      event.preventDefault();

      if (maxFileSize && file.size > maxFileSize) return;

      const previewUrl = URL.createObjectURL(file);
      setPastePreviewUrl(previewUrl);

      const upload = async () => {
        try {
          const result = await uploadWithProgress({
            file,
            onStatusUpdate: () => {},
            skipCheckFileType: true,
          });

          if (result?.url) {
            onUpload(
              result.dimensions ? { dimensions: result.dimensions, url: result.url } : result.url,
            );
          }
        } catch (error) {
          console.error('Paste image upload failed:', error);
          message.error(t('upload.uploadFailed'));
        } finally {
          URL.revokeObjectURL(previewUrl);
          setPastePreviewUrl(null);
        }
      };

      void upload();
    },
    [disabled, maxFileSize, onUpload, uploadWithProgress, t],
  );

  return { onPaste, pastePreviewUrl };
};
