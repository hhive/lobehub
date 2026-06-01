import { describe, expect, it, vi } from 'vitest';

import { createPublicDiscoverService, createPublicMarketService } from './publicServices';

const mocks = vi.hoisted(() => ({
  discoverService: vi.fn(),
  marketService: vi.fn(),
}));

vi.mock('@/server/services/discover', () => ({
  DiscoverService: mocks.discoverService,
}));

vi.mock('@/server/services/market', () => ({
  MarketService: mocks.marketService,
}));

describe('public market services', () => {
  it('uses the M2M cookie token for public discover list calls', () => {
    createPublicDiscoverService({
      marketAccessToken: 'expired-user-token',
      marketM2MAccessToken: 'm2m-cookie-token',
      marketUserInfo: { email: 'user@example.com', userId: 'user-1' },
    });

    expect(mocks.discoverService).toHaveBeenCalledWith({
      accessToken: 'm2m-cookie-token',
      userInfo: { email: 'user@example.com', userId: 'user-1' },
    });
  });

  it('uses the M2M cookie token for public skill list calls', () => {
    createPublicMarketService({
      marketAccessToken: 'expired-user-token',
      marketM2MAccessToken: 'm2m-cookie-token',
      marketUserInfo: { email: 'user@example.com', userId: 'user-1' },
    });

    expect(mocks.marketService).toHaveBeenCalledWith({
      accessToken: 'm2m-cookie-token',
      userInfo: { email: 'user@example.com', userId: 'user-1' },
    });
  });
});
