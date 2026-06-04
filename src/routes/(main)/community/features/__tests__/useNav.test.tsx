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
  it('shows the assistant and skill tabs to non-admin users', () => {
    setUserRole('user');

    const { result } = renderHook(() => useNav(), {
      wrapper: createWrapper(),
    });

    const keys = result.current.items.map((item: any) => item.key);

    expect(keys).toEqual([DiscoverTab.Assistants]);
    expect(keys).not.toContain(DiscoverTab.Home);
    expect(keys).not.toContain(DiscoverTab.Mcp);
    expect(keys).not.toContain(DiscoverTab.Models);
    expect(keys).not.toContain(DiscoverTab.Providers);
    expect(keys).not.toContain(DiscoverTab.Skills);
  });

  it('keeps all community tabs visible for admin users', () => {
    setUserRole('admin');

    const { result } = renderHook(() => useNav(), {
      wrapper: createWrapper(),
    });

    const keys = result.current.items.map((item: any) => item.key);

    expect(keys).toContain(DiscoverTab.Home);
    expect(keys).toContain(DiscoverTab.Assistants);
    expect(keys).toContain(DiscoverTab.Skills);
    expect(keys).toContain(DiscoverTab.Mcp);
    expect(keys).toContain(DiscoverTab.Models);
    expect(keys).toContain(DiscoverTab.Providers);
  });
});
