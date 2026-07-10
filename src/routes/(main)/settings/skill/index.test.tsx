import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import Page from './index';

let isAdmin = false;

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}));

vi.mock('@/store/user', () => ({
  useUserStore: (
    selector: (state: { isUserStateInit: boolean; user?: { role?: string } }) => unknown,
  ) => selector({ isUserStateInit: true, user: { role: isAdmin ? 'admin' : 'user' } }),
}));

vi.mock('@/store/user/selectors', () => ({
  userProfileSelectors: {
    isAdmin: (state: { user?: { role?: string } }) => state.user?.role === 'admin',
  },
}));

vi.mock('react-router', () => ({
  useSearchParams: () => [new URLSearchParams()],
}));

vi.mock('./features/LeftPanel', () => ({
  default: () => <div data-testid="settings-left-panel" />,
}));

vi.mock('./features/SkillDetail', () => ({
  default: () => <div data-testid="skill-detail" />,
}));

describe('SkillsSetting page', () => {
  beforeEach(() => {
    isAdmin = false;
  });

  it('hides skill settings for non-admin users', () => {
    render(<Page />);

    expect(screen.queryByTestId('settings-left-panel')).not.toBeInTheDocument();
  });

  it('shows skill settings for admins', () => {
    isAdmin = true;

    render(<Page />);

    expect(screen.getByTestId('settings-left-panel')).toBeInTheDocument();
  });
});
