import { type NextRequest, NextResponse } from 'next/server';

import {
  authenticateSub2APIBoundUser,
  exchangeSub2APILaunchToken,
  upsertSub2APIOpenAIProvider,
} from '@/server/services/sub2apiLaunch';

const defaultChatPath = '/chat';

function buildLaunchURL(path: string, request: NextRequest): URL {
  const appURL = process.env.APP_URL?.trim();
  return new URL(path, appURL || request.url);
}

export const GET = async (request: NextRequest) => {
  const token = request.nextUrl.searchParams.get('token')?.trim();
  if (!token) {
    return NextResponse.redirect(
      buildLaunchURL('/signin?error=sub2api_launch_token_missing', request),
    );
  }

  const sub2apiBaseURL = process.env.SUB2API_BASE_URL?.trim();
  const exchangeSecret = process.env.SUB2API_LOBEHUB_EXCHANGE_SECRET?.trim();
  if (!sub2apiBaseURL || !exchangeSecret) {
    return NextResponse.redirect(
      buildLaunchURL('/signin?error=sub2api_launch_not_configured', request),
    );
  }

  try {
    const payload = await exchangeSub2APILaunchToken({
      secret: exchangeSecret,
      sub2apiBaseURL,
      token,
    });
    const authResult = await authenticateSub2APIBoundUser({
      appOrigin: buildLaunchURL('/', request).origin,
      payload,
      secret: exchangeSecret,
    });

    await upsertSub2APIOpenAIProvider(authResult.userId, payload);

    const response = NextResponse.redirect(buildLaunchURL(defaultChatPath, request));
    for (const cookie of authResult.setCookies) {
      response.headers.append('set-cookie', cookie);
    }
    return response;
  } catch (error) {
    console.error('[sub2api-launch] failed to launch LobeHub', error);
    return NextResponse.redirect(buildLaunchURL('/signin?error=sub2api_launch_failed', request));
  }
};
