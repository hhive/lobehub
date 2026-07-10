import { NextRequest } from 'next/server';
import { afterEach, describe, expect, it, vi } from 'vitest';

import {
  authenticateSub2APIBoundUser,
  exchangeSub2APILaunchToken,
  upsertSub2APIOpenAIProvider,
} from '@/server/services/sub2apiLaunch';

import { GET } from './route';

vi.mock('@/server/services/sub2apiLaunch', () => ({
  authenticateSub2APIBoundUser: vi.fn(),
  exchangeSub2APILaunchToken: vi.fn(),
  upsertSub2APIOpenAIProvider: vi.fn(),
}));

describe('/api/sub2api/launch route', () => {
  afterEach(() => {
    delete process.env.APP_URL;
    delete process.env.SUB2API_BASE_URL;
    delete process.env.SUB2API_LOBEHUB_EXCHANGE_SECRET;
    vi.clearAllMocks();
  });

  const mockSuccessfulLaunch = () => {
    process.env.APP_URL = 'https://chat.xiaoni-ai.top';
    process.env.SUB2API_BASE_URL = 'https://xiaoni-ai.top';
    process.env.SUB2API_LOBEHUB_EXCHANGE_SECRET = 'test-secret';

    vi.mocked(exchangeSub2APILaunchToken).mockResolvedValue({
      api_base_url: 'https://xiaoni-ai.top/v1',
      api_key: 'test-api-key',
      api_key_id: 1,
      email: 'user@example.com',
      user_id: 1,
      username: 'Test User',
    });
    vi.mocked(authenticateSub2APIBoundUser).mockResolvedValue({
      setCookies: ['better-auth.session_token=test-token; Path=/; HttpOnly'],
      userId: 'lobe-user-1',
    });
    vi.mocked(upsertSub2APIOpenAIProvider).mockResolvedValue(undefined);
  };

  it('uses APP_URL for redirects when the proxied request URL is localhost', async () => {
    process.env.APP_URL = 'https://chat.xiaoni-ai.top';

    const response = await GET(new NextRequest('https://localhost:3210/api/sub2api/launch?token='));

    expect(response.headers.get('location')).toBe(
      'https://chat.xiaoni-ai.top/signin?error=sub2api_launch_token_missing',
    );
  });

  it('redirects phone browsers directly to the inbox chat and preserves auth cookies', async () => {
    mockSuccessfulLaunch();

    const response = await GET(
      new NextRequest('https://localhost:3210/api/sub2api/launch?token=mobile-token', {
        headers: {
          'user-agent':
            'Mozilla/5.0 (iPhone; CPU iPhone OS 18_5 like Mac OS X) AppleWebKit/605.1.15 Mobile/15E148',
        },
      }),
    );

    expect(response.headers.get('location')).toBe('https://chat.xiaoni-ai.top/agent/inbox');
    expect(response.headers.get('set-cookie')).toContain('better-auth.session_token=test-token');
  });

  it('keeps desktop browsers on the existing chat redirect', async () => {
    mockSuccessfulLaunch();

    const response = await GET(
      new NextRequest('https://localhost:3210/api/sub2api/launch?token=desktop-token', {
        headers: {
          'user-agent':
            'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Chrome/136.0.0.0 Safari/537.36',
        },
      }),
    );

    expect(response.headers.get('location')).toBe('https://chat.xiaoni-ai.top/chat');
  });

  it('keeps tablet browsers on the existing chat redirect', async () => {
    mockSuccessfulLaunch();

    const response = await GET(
      new NextRequest('https://localhost:3210/api/sub2api/launch?token=tablet-token', {
        headers: {
          'user-agent':
            'Mozilla/5.0 (iPad; CPU OS 18_5 like Mac OS X) AppleWebKit/605.1.15 Version/18.5 Mobile/15E148 Safari/604.1',
        },
      }),
    );

    expect(response.headers.get('location')).toBe('https://chat.xiaoni-ai.top/chat');
  });

  it('keeps the desktop redirect when the user agent is missing', async () => {
    mockSuccessfulLaunch();

    const response = await GET(
      new NextRequest('https://localhost:3210/api/sub2api/launch?token=no-user-agent'),
    );

    expect(response.headers.get('location')).toBe('https://chat.xiaoni-ai.top/chat');
  });
});
