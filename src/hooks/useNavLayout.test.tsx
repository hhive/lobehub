import { renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { useNavLayout } from './useNavLayout';

let isAdmin = false;

const mocks = vi.hoisted(() => ({
  toggleCommandMenu: vi.fn(),
}));

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, options?: { defaultValue?: string }) => options?.defaultValue ?? key,
  }),
}));

vi.mock('@/config/routes', () => ({
  getRouteById: (id: string) => ({ icon: `${id}-icon` }),
}));

vi.mock('@/store/global', () => ({
  useGlobalStore: (selector: (state: { toggleCommandMenu: typeof mocks.toggleCommandMenu }) => unknown) =>
    selector({ toggleCommandMenu: mocks.toggleCommandMenu }),
}));

vi.mock('@/store/serverConfig', () => ({
  featureFlagsSelectors: (state: { hideGitHub?: boolean; showMarket?: boolean }) => ({
    hideGitHub: !!state.hideGitHub,
    showMarket: state.showMarket ?? true,
  }),
  useServerConfigStore: (selector: (state: { showMarket: boolean }) => unknown) =>
    selector({ showMarket: true }),
}));

vi.mock('@/store/user', () => ({
  useUserStore: (selector: (state: { user: { role: string } }) => unknown) =>
    selector({ user: { role: isAdmin ? 'admin' : 'user' } }),
}));

vi.mock('@/store/user/selectors', () => ({
  userProfileSelectors: {
    isAdmin: (state: { user?: { role?: string } }) => state.user?.role === 'admin',
  },
}));

describe('useNavLayout', () => {
  beforeEach(() => {
    isAdmin = false;
  });

  it('hides the desktop pages nav item for non-admin users', () => {
    const { result } = renderHook(() => useNavLayout());

    expect(result.current.topNavItems.find((item) => item.key === 'pages')?.hidden).toBe(true);
  });

  it('keeps the desktop pages nav item visible for admins', () => {
    isAdmin = true;

    const { result } = renderHook(() => useNavLayout());

    expect(result.current.topNavItems.find((item) => item.key === 'pages')?.hidden).toBe(false);
  });

  it('names the generation sidebar item as image generation', () => {
    const { result } = renderHook(() => useNavLayout());

    expect(result.current.bottomMenuItems.find((item) => item.key === 'image')?.title).toBe(
      '生成图片',
    );
  });
});
