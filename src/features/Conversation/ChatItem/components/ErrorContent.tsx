import { Flexbox, Skeleton } from '@lobehub/ui';
import { Alert, Button } from '@lobehub/ui/base-ui';
import { RotateCcw } from 'lucide-react';
import { memo, type ReactNode, Suspense } from 'react';
import { useTranslation } from 'react-i18next';

import {
  dataSelectors,
  messageStateSelectors,
  useConversationStore,
} from '@/features/Conversation/store';

import { type ChatItemProps } from '../type';

export interface ErrorContentProps {
  customErrorRender?: ChatItemProps['customErrorRender'];
  error: ChatItemProps['error'];
  /**
   * Fork: extra action rendered next to the regenerate button, for error types
   * that offer a more specific recovery than a plain retry (e.g. the
   * non-streaming retry on an empty completion). Purely additive — omitting it
   * keeps the stock single-button layout.
   */
  extraAction?: ReactNode;
  id?: string;
  onRegenerate?: () => void;
}

const ErrorContent = memo<ErrorContentProps>(
  ({ customErrorRender, error, extraAction, id, onRegenerate }) => {
    const { t } = useTranslation('common');
    const [deleteMessage, updateMessageError] = useConversationStore((s) => [
      s.deleteMessage,
      s.updateMessageError,
    ]);
    const messageContent = useConversationStore((s) =>
      id ? dataSelectors.getDisplayMessageById(id)(s)?.content : undefined,
    );
    // The retry can take a while to produce anything visible (branch switch plus a
    // transport round trip), so the button has to own its own pending state —
    // otherwise a click reads as "nothing happened" and invites a second one.
    const retrying = useConversationStore((s) =>
      id ? messageStateSelectors.isMessageRegenerating(id)(s) : false,
    );

    if (!error) return;

    if (customErrorRender) {
      return (
        <Suspense fallback={<Skeleton.Button active block />}>{customErrorRender(error)}</Suspense>
      );
    }

    return (
      <Alert
        closable
        extraDefaultExpand
        showIcon
        extraIsolate={false}
        type={'secondary'}
        action={
          (onRegenerate || extraAction) && (
            <Flexbox horizontal gap={8}>
              {onRegenerate && (
                <Button
                  disabled={retrying}
                  icon={<RotateCcw size={14} />}
                  loading={retrying}
                  size="small"
                  type="fill"
                  onClick={onRegenerate}
                >
                  {t('regenerate')}
                </Button>
              )}
              {extraAction}
            </Flexbox>
          )
        }
        {...error}
        title={error.message}
        afterClose={() => {
          error?.afterClose?.();
          if (!id) return;
          // A turn can carry a terminal error on top of content it already
          // streamed. Dismissing the error must not delete that content — just
          // clear the error and keep the message.
          if (messageContent && messageContent.trim() !== '') {
            updateMessageError(id, null);
          } else {
            deleteMessage(id);
          }
        }}
        style={{
          overflow: 'hidden',
          position: 'relative',
          width: '100%',
          ...error.style,
        }}
      />
    );
  },
);

export default ErrorContent;
