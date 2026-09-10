'use client';

import { memo } from 'react';

import MobileParamsDrawer from '@/features/ChatInput/ActionBar/Params/MobileParamsDrawer';
import ChatHydration from '@/routes/(main)/agent/features/Conversation/ChatHydration';
import ConversationArea from '@/routes/(main)/agent/features/Conversation/ConversationArea';
import PortalPanel from '@/routes/(main)/agent/features/Portal/features/PortalPanel';
import TelemetryNotification from '@/routes/(main)/agent/features/TelemetryNotification';

import Topic from './features/Topic';

const MobileChatPage = memo(() => {
  return (
    <>
      <ChatHydration />
      <ConversationArea />
      <Topic />
      {/* Fork: the Plus menu's params item opens the desktop working sidebar, which
          the mobile page does not mount. */}
      <MobileParamsDrawer />
      <PortalPanel mobile />
      <TelemetryNotification mobile />
    </>
  );
});

export default MobileChatPage;
