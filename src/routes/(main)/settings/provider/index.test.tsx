import { act, cleanup, render, waitFor } from '@testing-library/react';
import { type ReactNode } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { useUserStore } from '@/store/user';

import { ProviderLayout } from './index';

const navigateMock = vi.fn();

vi.mock('@lobehub/ui', () => ({
  Flexbox: ({ children }: { children: ReactNode }) => <div>{children}</div>,
}));

vi.mock('react-router-dom', () => ({
  Outlet: () => <div>provider detail</div>,
  useNavigate: () => navigateMock,
  useParams: () => ({ providerId: 'all' }),
}));

vi.mock('@/const/version', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/const/version')>()),
  isCustomBranding: true,
}));

vi.mock('./_layout/Desktop/Container', () => ({
  default: ({ children }: { children: ReactNode }) => <main>{children}</main>,
}));

vi.mock('./(list)/Footer', () => ({
  default: () => <footer />,
}));

vi.mock('./ProviderMenu', () => ({
  default: () => <nav>provider menu</nav>,
}));

const initialUserStoreState = useUserStore.getState();

afterEach(() => {
  cleanup();
  navigateMock.mockClear();
  useUserStore.setState(initialUserStoreState, true);
});

describe('Provider settings access', () => {
  it('redirects non-admin users away from provider settings', async () => {
    act(() => {
      useUserStore.setState({ isUserStateInit: true, user: { id: 'u1', role: 'user' } as any });
    });

    render(<ProviderLayout />);

    await waitFor(() =>
      expect(navigateMock).toHaveBeenCalledWith('/settings/profile', { replace: true }),
    );
  });
});
