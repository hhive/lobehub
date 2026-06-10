/**
 * @vitest-environment happy-dom
 */
import { render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { useUserStore } from '@/store/user';

import { marketAuthEvents } from './events';
import { MarketAuthProvider } from './MarketAuthProvider';

const refreshTokenMock = vi.hoisted(() => vi.fn());

vi.mock('antd', () => ({
  App: {
    useApp: () => ({
      message: {
        error: vi.fn(),
      },
    }),
  },
}));

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}));

vi.mock('./MarketAuthConfirmModal', () => ({
  default: ({ open }: { open?: boolean }) =>
    open ? <div data-testid="market-auth-confirm-modal" /> : null,
}));

vi.mock('./ProfileSetupModal', () => ({
  default: ({ open }: { open?: boolean }) =>
    open ? <div data-testid="profile-setup-modal" /> : null,
}));

vi.mock('./ClaimResourcesModal', () => ({
  default: ({ open }: { open?: boolean }) =>
    open ? <div data-testid="claim-resources-modal" /> : null,
}));

vi.mock('./useMarketUserProfile', () => ({
  useMarketUserProfile: () => ({
    data: undefined,
    mutate: vi.fn(),
  }),
}));

vi.mock('@/libs/trpc/client', () => ({
  lambdaClient: {
    market: {
      oidc: {
        getUserInfo: {
          mutate: vi.fn().mockResolvedValue(null),
        },
        refreshToken: {
          mutate: refreshTokenMock,
        },
      },
      socialProfile: {
        scanClaimableResources: {
          query: vi.fn(),
        },
      },
      user: {
        getUserByUsername: {
          query: vi.fn(),
        },
      },
    },
  },
}));

vi.mock('@/store/serverConfig', () => ({
  useServerConfigStore: (
    selector: (state: { serverConfig: { enableMarketTrustedClient: boolean } }) => unknown,
  ) => selector({ serverConfig: { enableMarketTrustedClient: false } }),
}));

vi.mock('@/store/serverConfig/selectors', () => ({
  serverConfigSelectors: {
    enableMarketTrustedClient: (state: {
      serverConfig?: { enableMarketTrustedClient?: boolean };
    }) => state.serverConfig?.enableMarketTrustedClient ?? false,
  },
}));

const renderProvider = () =>
  render(
    <MarketAuthProvider isDesktop={false}>
      <div>child</div>
    </MarketAuthProvider>,
  );

const initialUserStoreState = useUserStore.getState();

describe('MarketAuthProvider', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(console, 'error').mockImplementation(() => {});
    vi.spyOn(console, 'info').mockImplementation(() => {});
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    useUserStore.setState(initialUserStoreState, true);
    useUserStore.setState({
      isSignedIn: true,
      isUserStateInit: true,
      setSettings: vi.fn(),
      settings: {
        market: {
          accessToken: 'expired-token',
          expiresAt: Date.now() + 60_000,
          refreshToken: 'expired-refresh-token',
        },
      },
      user: { id: 'u1', role: 'user' } as any,
    } as any);
    refreshTokenMock.mockRejectedValue(new Error('expired'));
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('does not open Market auth or profile setup modals for background Market 401 events', async () => {
    renderProvider();

    marketAuthEvents.emit('market-unauthorized', {
      path: 'market.skill.getSkillList',
      scene: 'default',
      timestamp: Date.now(),
    });

    await waitFor(() => {
      expect(refreshTokenMock).toHaveBeenCalled();
    });

    expect(screen.queryByTestId('market-auth-confirm-modal')).not.toBeInTheDocument();
    expect(screen.queryByTestId('profile-setup-modal')).not.toBeInTheDocument();
  });
});
