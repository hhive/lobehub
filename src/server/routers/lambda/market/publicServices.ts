import { type TrustedClientUserInfo } from '@/libs/trusted-client';
import { DiscoverService } from '@/server/services/discover';
import { MarketService } from '@/server/services/market';

interface PublicMarketContext {
  marketAccessToken?: string;
  marketM2MAccessToken?: string;
  marketUserInfo?: TrustedClientUserInfo;
}

export const createPublicDiscoverService = ({
  marketM2MAccessToken,
  marketUserInfo,
}: PublicMarketContext) =>
  new DiscoverService({ accessToken: marketM2MAccessToken, userInfo: marketUserInfo });

export const createPublicMarketService = ({
  marketM2MAccessToken,
  marketUserInfo,
}: PublicMarketContext) =>
  new MarketService({ accessToken: marketM2MAccessToken, userInfo: marketUserInfo });
