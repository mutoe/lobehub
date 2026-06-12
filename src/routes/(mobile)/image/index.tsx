'use client';

import { memo } from 'react';

import CreateGenerationPage from '@/routes/(main)/(create)/features/CreateGenerationPage';
import ImageWorkspace from '@/routes/(main)/(create)/image/features/ImageWorkspace';
import PromptInput from '@/routes/(main)/(create)/image/features/PromptInput';

const MobileImagePage = memo(() => (
  <CreateGenerationPage mobile PromptInput={PromptInput} Workspace={ImageWorkspace} path="/image" />
));

MobileImagePage.displayName = 'MobileImagePage';

export default MobileImagePage;
