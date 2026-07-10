import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import SkillPage from './index';

let isAdmin = false;

vi.mock('react-router', () => ({
  Navigate: ({ to }: { to: string }) => <div data-testid="navigate" data-to={to} />,
}));

vi.mock('@/hooks/useQuery', () => ({
  useQuery: () => ({}),
}));

vi.mock('@/store/discover', () => ({
  useDiscoverStore: (selector: (state: { useFetchSkillList: () => any }) => unknown) =>
    selector({
      useFetchSkillList: () => ({
        data: {
          currentPage: 1,
          items: [{ identifier: 'skill-1' }],
          pageSize: 21,
          totalCount: 0,
        },
        isLoading: false,
      }),
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

vi.mock('./features/List', () => ({
  default: () => <div data-testid="skill-list" />,
}));

vi.mock('./loading', () => ({
  default: () => <div data-testid="loading" />,
}));

vi.mock('../features/Pagination', () => ({
  default: () => <div data-testid="pagination" />,
}));

describe('community skill list page', () => {
  beforeEach(() => {
    isAdmin = false;
  });

  it('redirects non-admin users away from the skill page', () => {
    render(<SkillPage />);

    expect(screen.getByTestId('navigate')).toHaveAttribute('data-to', '/community/agent');
  });

  it('renders the skill list for admins', () => {
    isAdmin = true;

    render(<SkillPage />);

    expect(screen.getByTestId('skill-list')).toBeInTheDocument();
    expect(screen.getByTestId('pagination')).toBeInTheDocument();
  });
});
