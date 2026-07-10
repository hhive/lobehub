import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { useUserStore } from '@/store/user';

import UserAvatar from '../UserAvatar';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}));

vi.mock('@/layout/AuthProvider/MarketAuth', () => ({
  useMarketAuth: () => ({
    getCurrentUserInfo: () => undefined,
    isAuthenticated: false,
    isLoading: false,
    signIn: vi.fn(),
  }),
  useMarketUserProfile: () => ({
    data: undefined,
  }),
}));

vi.mock('@/store/serverConfig', () => ({
  useServerConfigStore: (
    selector: (state: { serverConfig: { enableMarketTrustedClient: boolean } }) => unknown,
  ) => selector({ serverConfig: { enableMarketTrustedClient: false } }),
}));

const initialUserStoreState = useUserStore.getState();

const setUserRole = (role: 'admin' | 'user') => {
  useUserStore.setState({ user: { id: 'u1', role } as any });
};

const renderUserAvatar = () =>
  render(
    <MemoryRouter>
      <UserAvatar />
    </MemoryRouter>,
  );

afterEach(() => {
  useUserStore.setState(initialUserStoreState, true);
});

describe('community UserAvatar', () => {
  it('hides the become-a-creator button from non-admin users', () => {
    setUserRole('user');

    const { container } = renderUserAvatar();

    expect(screen.queryByText('user.login')).not.toBeInTheDocument();
    expect(container).toBeEmptyDOMElement();
  });

  it('shows the become-a-creator button for admin users', () => {
    setUserRole('admin');

    renderUserAvatar();

    expect(screen.getByText('user.login')).toBeInTheDocument();
  });
});
