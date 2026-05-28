'use client';

import { memo } from 'react';
import { Navigate } from 'react-router-dom';

import CreateGenerationPage from '@/routes/(main)/(create)/features/CreateGenerationPage';
import { useUserStore } from '@/store/user';
import { userProfileSelectors } from '@/store/user/slices/auth/selectors';

import PromptInput from './features/PromptInput';
import VideoWorkspace from './features/VideoWorkspace';

const DesktopVideoPage = memo(() => {
  const [isAdmin, isUserStateInit] = useUserStore((s) => [
    userProfileSelectors.isAdmin(s),
    s.isUserStateInit,
  ]);

  if (!isUserStateInit) return null;
  if (!isAdmin) return <Navigate replace to="/image" />;

  return <CreateGenerationPage PromptInput={PromptInput} Workspace={VideoWorkspace} path="/video" />;
});

DesktopVideoPage.displayName = 'DesktopVideoPage';

export default DesktopVideoPage;
