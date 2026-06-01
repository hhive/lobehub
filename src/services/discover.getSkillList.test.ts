import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { lambdaClient } from '@/libs/trpc/client';
import { globalHelpers } from '@/store/global/helpers';

import { discoverService } from './discover';

vi.mock('@/libs/trpc/client', () => ({
  lambdaClient: {
    market: {
      skill: {
        getSkillList: {
          query: vi.fn().mockResolvedValue({ items: [], total: 0 }),
        },
      },
    },
  },
}));

vi.mock('@/store/global/helpers', () => ({
  globalHelpers: {
    getCurrentLanguage: vi.fn(() => 'zh-CN'),
  },
}));

describe('discoverService.getSkillList', () => {
  let safeInjectMPTokenSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    vi.clearAllMocks();
    safeInjectMPTokenSpy = vi.spyOn(discoverService, 'safeInjectMPToken').mockResolvedValue();
  });

  afterEach(() => {
    safeInjectMPTokenSpy.mockRestore();
  });

  it('injects the marketplace M2M token before fetching skills', async () => {
    await discoverService.getSkillList({ page: 2, pageSize: 21 });

    expect(safeInjectMPTokenSpy).toHaveBeenCalledOnce();
    expect(lambdaClient.market.skill.getSkillList.query).toHaveBeenCalledWith({
      locale: 'zh-CN',
      page: 2,
      pageSize: 21,
    });
    expect(globalHelpers.getCurrentLanguage).toHaveBeenCalled();
  });
});
