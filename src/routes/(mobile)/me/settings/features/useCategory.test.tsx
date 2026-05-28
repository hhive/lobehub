import { renderHook } from '@testing-library/react';
import { type ReactNode } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { mapFeatureFlagsEnvToState } from '@/config/featureFlags';
import { SettingsTabs } from '@/store/global/initialState';
import { initServerConfigStore, Provider } from '@/store/serverConfig/store';
import { useUserStore } from '@/store/user';

import { useCategory } from './useCategory';

vi.hoisted(() => {
  Object.defineProperty(globalThis, 'localStorage', {
    configurable: true,
    value: {
      getItem: vi.fn(() => null),
      removeItem: vi.fn(),
      setItem: vi.fn(),
    },
  });
});

const navigate = vi.fn();

vi.mock('react-router-dom', () => ({
  useNavigate: () => navigate,
}));

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}));

const createWrapper = (showProvider: boolean) => {
  const Wrapper = ({ children }: { children: ReactNode }) => (
    <Provider
      createStore={() =>
        initServerConfigStore({
          featureFlags: {
            ...mapFeatureFlagsEnvToState({
              provider_settings: true,
            }),
            showProvider,
          },
        })
      }
    >
      {children}
    </Provider>
  );

  return Wrapper;
};

const setUserRole = (role: 'admin' | 'user') => {
  useUserStore.setState({ user: { id: 'u1', role } as any });
};

const initialUserStoreState = useUserStore.getState();

afterEach(() => {
  navigate.mockReset();
  useUserStore.setState(initialUserStoreState, true);
});

describe('mobile settings useCategory', () => {
  it('keeps Provider visible and routes to the provider list when provider settings are enabled', () => {
    setUserRole('admin');

    const { result } = renderHook(() => useCategory(), {
      wrapper: createWrapper(true),
    });

    const provider = result.current
      .flatMap((group) => group.items)
      .find((item) => item.key === SettingsTabs.Provider);

    expect(provider).toBeDefined();

    provider?.onClick?.();

    expect(navigate).toHaveBeenCalledWith('/settings/provider/all');
  });

  it('hides Provider when provider settings are disabled', () => {
    setUserRole('admin');

    const { result } = renderHook(() => useCategory(), {
      wrapper: createWrapper(false),
    });

    const keys = result.current.flatMap((group) => group.items.map((item) => item.key));

    expect(keys).not.toContain(SettingsTabs.Provider);
  });

  it('hides restricted app settings from non-admin users', () => {
    setUserRole('user');

    const { result } = renderHook(() => useCategory(), {
      wrapper: createWrapper(true),
    });

    const keys = result.current.flatMap((group) => group.items.map((item) => item.key));

    expect(keys).not.toContain(SettingsTabs.Provider);
    expect(keys).not.toContain(SettingsTabs.ServiceModel);
    expect(keys).not.toContain(SettingsTabs.Creds);
    expect(keys).not.toContain(SettingsTabs.Storage);
    expect(keys).not.toContain(SettingsTabs.Advanced);
    expect(keys).not.toContain(SettingsTabs.About);
  });

  it('keeps restricted app settings visible for admin users', () => {
    setUserRole('admin');

    const { result } = renderHook(() => useCategory(), {
      wrapper: createWrapper(true),
    });

    const keys = result.current.flatMap((group) => group.items.map((item) => item.key));

    expect(keys).toContain(SettingsTabs.Provider);
    expect(keys).toContain(SettingsTabs.ServiceModel);
    expect(keys).toContain(SettingsTabs.Creds);
    expect(keys).toContain(SettingsTabs.Storage);
    expect(keys).toContain(SettingsTabs.Advanced);
    expect(keys).toContain(SettingsTabs.About);
  });
});
