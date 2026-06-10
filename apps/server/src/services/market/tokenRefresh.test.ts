// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from 'vitest';

import {
  isMarketAuthErrorPayload,
  refreshMarketTokenAndCreateService,
  WEB_MARKET_CLIENT_ID,
} from './tokenRefresh';

vi.mock('./index', () => ({
  MarketService: vi.fn().mockImplementation((options) => ({
    market: {
      auth: {
        exchangeOAuthToken: vi.fn().mockResolvedValue({
          accessToken: 'fresh-access-token',
          expiresIn: 3600,
          refreshToken: 'fresh-refresh-token',
        }),
      },
    },
    options,
    refreshToken: vi.fn().mockResolvedValue({
      accessToken: 'fresh-access-token',
      expiresIn: 3600,
      refreshToken: 'fresh-refresh-token',
    }),
  })),
}));

describe('isMarketAuthErrorPayload', () => {
  it('detects market invalid token errors', () => {
    expect(isMarketAuthErrorPayload('invalid_token', 'Access token is invalid or expired')).toBe(
      true,
    );
    expect(isMarketAuthErrorPayload('token_expired', 'expired')).toBe(true);
    expect(isMarketAuthErrorPayload('unauthorized', 'unauthorized')).toBe(true);
    expect(isMarketAuthErrorPayload(undefined, 'token expired')).toBe(true);
    expect(isMarketAuthErrorPayload(undefined, 'rate limit')).toBe(false);
  });
});

describe('refreshMarketTokenAndCreateService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('refreshes a saved market refresh token, persists new tokens, and returns a new service', async () => {
    const userModel = {
      getUserSettings: vi.fn().mockResolvedValue({
        market: {
          accessToken: 'expired-access-token',
          expiresAt: Date.now() - 1000,
          refreshToken: 'saved-refresh-token',
        },
      }),
      updateSetting: vi.fn().mockResolvedValue(undefined),
    };

    const result = await refreshMarketTokenAndCreateService({
      userInfo: { email: 'user@example.com', userId: 'user-1' },
      userModel,
    });

    expect(result).toBeTruthy();
    expect(result?.marketService).toBeTruthy();
    expect(result?.accessToken).toBe('fresh-access-token');
    expect(result?.expiresAt).toBeGreaterThan(Date.now());
    expect(result?.refreshToken).toBe('fresh-refresh-token');
    expect(userModel.updateSetting).toHaveBeenCalledWith({
      market: {
        accessToken: 'fresh-access-token',
        expiresAt: expect.any(Number),
        refreshToken: 'fresh-refresh-token',
      },
    });
  });

  it('keeps the old refresh token when market refresh response omits a replacement', async () => {
    const userModel = {
      getUserSettings: vi.fn().mockResolvedValue({
        market: {
          accessToken: 'expired-access-token',
          refreshToken: 'saved-refresh-token',
        },
      }),
      updateSetting: vi.fn().mockResolvedValue(undefined),
    };
    const refreshMarketService = {
      refreshToken: vi.fn().mockResolvedValue({
        accessToken: 'fresh-access-token',
        expiresIn: 1800,
      }),
    };

    const result = await refreshMarketTokenAndCreateService({
      refreshMarketService: refreshMarketService as any,
      userModel,
    });

    expect(result?.refreshToken).toBe('saved-refresh-token');
    expect(userModel.updateSetting).toHaveBeenCalledWith({
      market: {
        accessToken: 'fresh-access-token',
        expiresAt: expect.any(Number),
        refreshToken: 'saved-refresh-token',
      },
    });
  });

  it('returns undefined when no refresh token is saved', async () => {
    const userModel = {
      getUserSettings: vi.fn().mockResolvedValue({ market: { accessToken: 'expired' } }),
      updateSetting: vi.fn(),
    };

    const result = await refreshMarketTokenAndCreateService({ userModel });

    expect(result).toBeUndefined();
    expect(userModel.updateSetting).not.toHaveBeenCalled();
  });

  it('returns undefined and does not clear tokens when refresh fails', async () => {
    const userModel = {
      getUserSettings: vi.fn().mockResolvedValue({
        market: { accessToken: 'expired', refreshToken: 'saved-refresh-token' },
      }),
      updateSetting: vi.fn(),
    };
    const refreshMarketService = {
      refreshToken: vi.fn().mockRejectedValue(new Error('invalid_grant')),
    };

    const result = await refreshMarketTokenAndCreateService({
      refreshMarketService: refreshMarketService as any,
      userModel,
    });

    expect(result).toBeUndefined();
    expect(refreshMarketService.refreshToken).toHaveBeenCalledWith({
      clientId: WEB_MARKET_CLIENT_ID,
      refreshToken: 'saved-refresh-token',
    });
    expect(userModel.updateSetting).not.toHaveBeenCalled();
  });
});
