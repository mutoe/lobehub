'use client';

import { memo } from 'react';

import CreateGenerationPage from '@/routes/(main)/(create)/features/CreateGenerationPage';
import PromptInput from '@/routes/(main)/(create)/video/features/PromptInput';
import VideoWorkspace from '@/routes/(main)/(create)/video/features/VideoWorkspace';

const MobileVideoPage = memo(() => (
  <CreateGenerationPage mobile PromptInput={PromptInput} Workspace={VideoWorkspace} path="/video" />
));

MobileVideoPage.displayName = 'MobileVideoPage';

export default MobileVideoPage;
