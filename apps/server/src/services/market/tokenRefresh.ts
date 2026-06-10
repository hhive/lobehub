import debug from 'debug';

import { type TrustedClientUserInfo } from '@/libs/trusted-client';

import { MarketService } from './index';

const log = debug('lobe-server:market-token-refresh');

export const WEB_MARKET_CLIENT_ID = 'lobechat-com';

interface MarketTokenSettings {
  accessToken?: string;
  expiresAt?: number;
  refreshToken?: string;
}

interface UserSettingsWithMarket {
  market?: MarketTokenSettings | null;
}

interface MarketTokenUserModel {
  getUserSettings: () => Promise<UserSettingsWithMarket | undefined>;
  updateSetting: (value: { market: MarketTokenSettings }) => Promise<unknown>;
}

interface MarketTokenRefreshResponse {
  accessToken?: string;
  expiresIn?: number;
  refreshToken?: string;
}

interface RefreshMarketTokenOptions {
  refreshMarketService?: Pick<MarketService, 'refreshToken'>;
  userInfo?: TrustedClientUserInfo;
  userModel: MarketTokenUserModel;
}

export interface RefreshedMarketTokenResult {
  accessToken: string;
  expiresAt: number;
  marketService: MarketService;
  refreshToken: string;
}

export const isMarketAuthErrorPayload = (errorCode?: string, errorMessage = '') => {
  const lowerCode = errorCode?.toLowerCase();
  const lowerMessage = errorMessage.toLowerCase();

  return (
    lowerCode === 'invalid_token' ||
    lowerCode === 'token_expired' ||
    lowerCode === 'unauthorized' ||
    lowerMessage.includes('invalid_token') ||
    lowerMessage.includes('token expired') ||
    lowerMessage.includes('unauthorized')
  );
};

export const refreshMarketTokenAndCreateService = async ({
  refreshMarketService,
  userInfo,
  userModel,
}: RefreshMarketTokenOptions): Promise<RefreshedMarketTokenResult | undefined> => {
  const settings = await userModel.getUserSettings();
  const savedMarket = settings?.market;
  const savedRefreshToken = savedMarket?.refreshToken;

  if (!savedRefreshToken) {
    log('No saved market refresh token; skip refresh');
    return;
  }

  try {
    const tokenService = refreshMarketService || new MarketService({ userInfo });
    const refreshed = (await tokenService.refreshToken({
      clientId: WEB_MARKET_CLIENT_ID,
      refreshToken: savedRefreshToken,
    })) as MarketTokenRefreshResponse;

    if (!refreshed.accessToken) {
      log('Market refresh response did not include an access token');
      return;
    }

    const nextRefreshToken = refreshed.refreshToken || savedRefreshToken;
    const expiresIn = refreshed.expiresIn ?? 3600;
    const expiresAt = Date.now() + expiresIn * 1000;
    const nextMarket = {
      accessToken: refreshed.accessToken,
      expiresAt,
      refreshToken: nextRefreshToken,
    };

    await userModel.updateSetting({ market: nextMarket });

    return {
      ...nextMarket,
      marketService: new MarketService({
        accessToken: refreshed.accessToken,
        userInfo,
      }),
    };
  } catch (error) {
    log('Failed to refresh market token: %O', error);
    return;
  }
};
