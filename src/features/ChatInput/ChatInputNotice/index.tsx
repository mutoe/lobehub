'use client';

import { Tooltip } from '@lobehub/ui';
import { Alert, Button } from '@lobehub/ui/base-ui';
import { createStaticStyles, cx } from 'antd-style';
import { memo } from 'react';
import { useTranslation } from 'react-i18next';

import { useChatInputNotice } from './useChatInputNotice';

const styles = createStaticStyles(({ css, cssVar }) => ({
  action: css`
    flex: none;
    height: 24px;
    padding-inline: 10px;
  `,
  actionWrapper: css`
    display: inline-flex;
  `,
  alert: css`
    flex: 0 1 auto;

    /* The Alert root already flex-gaps icon and content; without zeroing the
       icon margin below the two would stack into a ~14px gap. */
    gap: 6px !important;

    /* Keep the icon centered against the single-line title. */
    align-items: center !important;

    min-width: 0;
    max-width: min(560px, 52vw);
    padding-block: 4px !important;
    padding-inline: 8px 10px !important;
    border-radius: ${cssVar.borderRadius};

    .ant-alert-content {
      min-width: 0;
    }

    .ant-alert-icon {
      flex: none;
      height: 18px !important;
      margin-inline-end: 0 !important;
    }

    @media (width <= 768px) {
      max-width: 100%;
    }
  `,
  /* Fork: full-width row variant for the mobile composer, where the action bar
     has no room left for an inline notice (it truncated to "当前…" and pushed
     the button onto its own line). */
  block: css`
    flex: none;
    max-width: none !important;
    margin-block-start: 8px;
    margin-inline: 8px;
  `,
  /* base-ui wraps the action under the title on viewports <= 480px
     (`wrappedAction`); the block row has room for it inline. */
  blockAction: css`
    @media (width <= 480px) {
      order: 0 !important;
      width: auto !important;
      margin-block-start: 0 !important;
      margin-inline-start: auto !important;
    }
  `,
  blockTitle: css`
    overflow: hidden;
    display: -webkit-box;
    -webkit-box-orient: vertical;
    -webkit-line-clamp: 2;

    line-height: 18px !important;
    text-overflow: clip;
    white-space: normal;
  `,
  title: css`
    overflow: hidden;

    min-width: 0;

    font-size: 12px;
    line-height: 18px !important;
    text-overflow: ellipsis;
    white-space: nowrap;
  `,
}));

/**
 * Base Alert fills the available width, which pushes its action away from the notice text.
 * Keep this notice content-sized while its max-width rule handles long translations.
 */
const alertStyle = { fontSize: 12, width: 'fit-content' } as const;

interface ChatInputNoticeProps {
  /** Render as a full-width row (mobile) instead of an inline, content-sized chip. */
  block?: boolean;
}

const ChatInputNotice = memo<ChatInputNoticeProps>(({ block }) => {
  const { t } = useTranslation('chat');
  const notice = useChatInputNotice();

  if (!notice) return null;

  const enableButton = notice.action === 'enableModel' && (
    <Button
      className={styles.action}
      disabled={notice.actionDisabled}
      loading={notice.actionLoading}
      size={'small'}
      type={'primary'}
      onClick={() => void notice.onAction?.()}
    >
      {t('input.modelDisabled.action')}
    </Button>
  );

  const action =
    enableButton && notice.actionDisabled ? (
      <Tooltip title={notice.actionDisabledReason}>
        <span className={styles.actionWrapper}>{enableButton}</span>
      </Tooltip>
    ) : (
      enableButton
    );

  return (
    <Alert
      action={action}
      style={block ? { fontSize: 12 } : alertStyle}
      title={t(notice.key)}
      type={notice.type}
      variant={'borderless'}
      classNames={{
        action: block ? styles.blockAction : undefined,
        alert: cx(styles.alert, block && styles.block),
        title: cx(styles.title, block && styles.blockTitle),
      }}
    />
  );
});

ChatInputNotice.displayName = 'ChatInputNotice';

export default ChatInputNotice;
