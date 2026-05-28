import { NextRequest } from 'next/server';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { GET } from './route';

vi.mock('@/server/services/sub2apiLaunch', () => ({
  authenticateSub2APIBoundUser: vi.fn(),
  exchangeSub2APILaunchToken: vi.fn(),
  upsertSub2APIOpenAIProvider: vi.fn(),
}));

describe('/api/sub2api/launch route', () => {
  afterEach(() => {
    delete process.env.APP_URL;
    vi.restoreAllMocks();
  });

  it('uses APP_URL for redirects when the proxied request URL is localhost', async () => {
    process.env.APP_URL = 'https://chat.xiaoni-ai.top';

    const response = await GET(new NextRequest('https://localhost:3210/api/sub2api/launch?token='));

    expect(response.headers.get('location')).toBe(
      'https://chat.xiaoni-ai.top/signin?error=sub2api_launch_token_missing',
    );
  });
});
