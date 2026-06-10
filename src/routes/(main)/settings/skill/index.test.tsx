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
  useUserStore: (selector: (state: { user?: { role?: string } }) => unknown) =>
    selector({ user: { role: isAdmin ? 'admin' : 'user' } }),
}));

vi.mock('@/store/user/slices/auth/selectors', () => ({
  userProfileSelectors: {
    isAdmin: (state: { user?: { role?: string } }) => state.user?.role === 'admin',
  },
}));

vi.mock('@/features/SkillStore', () => ({
  createSkillStoreModal: vi.fn(),
}));

vi.mock('./features/SkillList', () => ({
  default: () => <div data-testid="skill-list" />,
}));

vi.mock('./features/SkillDetail', () => ({
  default: () => <div data-testid="skill-detail" />,
}));

describe('SkillsSetting page', () => {
  beforeEach(() => {
    isAdmin = false;
  });

  it('hides the skill store button for non-admin users', () => {
    render(<Page />);

    expect(screen.getByTestId('skill-list')).toBeInTheDocument();
    expect(screen.queryByLabelText('skillStore.button')).not.toBeInTheDocument();
  });

  it('shows the skill store button for admins', () => {
    isAdmin = true;

    render(<Page />);

    expect(screen.getByLabelText('skillStore.button')).toBeInTheDocument();
  });
});
