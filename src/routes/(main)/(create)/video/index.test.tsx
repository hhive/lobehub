import { render } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import DesktopVideoPage from './index';

const navigateMock = vi.fn();
let isAdmin = false;
let isUserStateInit = true;

vi.mock('react-router-dom', () => ({
  Navigate: ({ to }: { to: string }) => <div>redirect:{to}</div>,
  useNavigate: () => navigateMock,
}));

vi.mock('@/routes/(main)/(create)/features/CreateGenerationPage', () => ({
  default: ({ path }: { path: string }) => <div>generation:{path}</div>,
}));

vi.mock('./features/PromptInput', () => ({
  default: () => <div>video prompt</div>,
}));

vi.mock('./features/VideoWorkspace', () => ({
  default: () => <div>video workspace</div>,
}));

vi.mock('@/store/user', () => ({
  useUserStore: (selector: (state: Record<string, unknown>) => unknown) =>
    selector({ isUserStateInit, user: { role: isAdmin ? 'admin' : 'user' } }),
}));

vi.mock('@/store/user/slices/auth/selectors', () => ({
  userProfileSelectors: {
    isAdmin: (s: { user?: { role?: string } }) => s.user?.role === 'admin',
  },
}));

describe('DesktopVideoPage', () => {
  beforeEach(() => {
    isAdmin = false;
    isUserStateInit = true;
    navigateMock.mockClear();
  });

  it('redirects non-admin users to image generation', () => {
    const { getByText } = render(<DesktopVideoPage />);

    expect(getByText('redirect:/image')).toBeDefined();
  });

  it('renders video generation for admin users', () => {
    isAdmin = true;

    const { getByText } = render(<DesktopVideoPage />);

    expect(getByText('generation:/video')).toBeDefined();
    expect(navigateMock).not.toHaveBeenCalled();
  });
});
