'use client';

import { Block, Flexbox } from '@lobehub/ui';
import { Spin } from 'antd';
import { createStaticStyles } from 'antd-style';
import { memo, useState } from 'react';

import Image from '@/libs/next/Image';

import UploadCard, { UPLOAD_CARD_SIZE, uploadCardStyles, type UploadData } from './UploadCard';

const STACK_OFFSET = -(UPLOAD_CARD_SIZE - 8);
const EXPAND_OFFSET = 4;

const styles = createStaticStyles(({ css }) => ({
  addCirclePos: css`
    position: absolute;
    z-index: 100;
    inset-block-end: -2px;
    inset-inline-end: -2px;
  `,
  stack: css`
    position: relative;
    padding-block: 4px;
    padding-inline: 0;

    &:hover {
      .inline-ref-close {
        opacity: 1;
      }
    }
  `,
}));

interface InlineImageReferenceProps {
  imageConstraints?: any;
  images: string[];
  maxCount?: number;
  maxFileSize?: number;
  onAdd: (data: UploadData) => void;
  onRemove: (url: string) => void;
  /** Local preview of an in-flight upload (e.g. pasted image), shown with a spinner */
  pendingPreviewUrl?: string | null;
}

const InlineImageReference = memo<InlineImageReferenceProps>(
  ({ images, onAdd, onRemove, maxFileSize, maxCount = 5, pendingPreviewUrl }) => {
    const [isHovered, setIsHovered] = useState(false);

    const canAddMore = images.length < maxCount;
    const hasImages = images.length > 0;
    const shouldCollapse = hasImages && !isHovered;

    return (
      <Flexbox
        horizontal
        align={'end'}
        className={styles.stack}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {images.map((url, index) => (
          <UploadCard
            closeClassName="inline-ref-close"
            imageUrl={url}
            key={url}
            maxFileSize={maxFileSize}
            style={{
              marginInlineStart: index > 0 ? (shouldCollapse ? STACK_OFFSET : EXPAND_OFFSET) : 0,
              zIndex: index + 1,
            }}
            onRemove={() => onRemove(url)}
            onUpload={onAdd}
          />
        ))}

        {pendingPreviewUrl && (
          <Block
            className={uploadCardStyles.filledCard}
            variant={'outlined'}
            style={{
              marginInlineStart: hasImages ? EXPAND_OFFSET : 0,
              zIndex: images.length + 1,
            }}
          >
            <div className={uploadCardStyles.filledCardInner}>
              <Image
                fill
                unoptimized
                alt=""
                src={pendingPreviewUrl}
                style={{ objectFit: 'cover' }}
              />
              <div className={uploadCardStyles.uploadOverlay}>
                <Spin percent={'auto'} size="small" />
              </div>
            </div>
          </Block>
        )}

        {canAddMore &&
          (shouldCollapse ? (
            <UploadCard
              className={styles.addCirclePos}
              maxFileSize={maxFileSize}
              variant="circle"
              onRemove={() => {}}
              onUpload={onAdd}
            />
          ) : (
            <UploadCard
              maxFileSize={maxFileSize}
              style={{
                marginInlineStart: hasImages ? EXPAND_OFFSET : 0,
                zIndex: images.length + 1,
              }}
              onRemove={() => {}}
              onUpload={onAdd}
            />
          ))}
      </Flexbox>
    );
  },
);

InlineImageReference.displayName = 'InlineImageReference';

export default InlineImageReference;
