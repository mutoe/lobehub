'use client';

import { useSharedContentFromUrl } from './useSharedContentFromUrl';

/**
 * Renders nothing — mounts `useSharedContentFromUrl` inside ConversationProvider
 * so a Web Share Target payload lands in the composer. See the hook for the
 * behaviour and the reasons behind it.
 */
const SharedContentFromUrl = () => {
  useSharedContentFromUrl();

  return null;
};

export default SharedContentFromUrl;
