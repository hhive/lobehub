import { renderHook } from '@testing-library/react';
import { type ReactNode } from 'react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { useUserStore } from '@/store/user';
import { DiscoverTab } from '@/types/discover';

import { useNav } from '../useNav';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}));

const initialUserStoreState = useUserStore.getState();

const setUserRole = (role: 'admin' | 'user') => {
  useUserStore.setState({ user: { id: 'u1', role } as any });
};

const createWrapper = (initialPath = '/community') => {
  const Wrapper = ({ children }: { children: ReactNode }) => (
    <MemoryRouter initialEntries={[initialPath]}>{children}</MemoryRouter>
  );

  return Wrapper;
};

afterEach(() => {
  useUserStore.setState(initialUserStoreState, true);
});

describe('community useNav', () => {
  it('hides model and provider tabs from non-admin users', () => {
    setUserRole('user');

    const { result } = renderHook(() => useNav(), {
      wrapper: createWrapper(),
    });

    const keys = result.current.items.map((item: any) => item.key);

    expect(keys).not.toContain(DiscoverTab.Models);
    expect(keys).not.toContain(DiscoverTab.Providers);
  });

  it('keeps model and provider tabs visible for admin users', () => {
    setUserRole('admin');

    const { result } = renderHook(() => useNav(), {
      wrapper: createWrapper(),
    });

    const keys = result.current.items.map((item: any) => item.key);

    expect(keys).toContain(DiscoverTab.Models);
    expect(keys).toContain(DiscoverTab.Providers);
  });
});
