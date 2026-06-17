// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { qstashOrKeyVaultAuth } from '../qstashOrKeyVaultAuth';

const mockVerify = vi.fn<(req: Request, body: string) => Promise<boolean>>();
vi.mock('@/libs/qstash', () => ({
  verifyQStashSignature: (req: Request, body: string) => mockVerify(req, body),
}));

function buildContext(rawBody: string, authorization?: string) {
  const rawRequest = new Request('http://x/api/agent/webhooks/bot-callback', {
    body: rawBody,
    headers: authorization ? { authorization } : undefined,
    method: 'POST',
  });
  let captured: { body: any; status: number } | undefined;
  const ctx = {
    json: (b: any, status = 200) => {
      captured = { body: b, status };
      return Response.json(b, { status });
    },
    req: {
      header: (name: string) =>
        name.toLowerCase() === 'authorization' ? authorization : undefined,
      path: '/api/agent/webhooks/bot-callback',
      raw: rawRequest,
      text: async () => rawBody,
    },
  } as any;
  return { ctx, getCaptured: () => captured };
}

describe('qstashOrKeyVaultAuth middleware', () => {
  beforeEach(() => {
    mockVerify.mockReset();
    process.env.KEY_VAULTS_SECRET = 'internal-secret';
  });

  afterEach(() => {
    delete process.env.KEY_VAULTS_SECRET;
    vi.clearAllMocks();
  });

  it('accepts a valid QStash signature', async () => {
    mockVerify.mockResolvedValue(true);
    const next = vi.fn().mockResolvedValue(undefined);
    const { ctx } = buildContext('{"hello":"world"}');

    await qstashOrKeyVaultAuth()(ctx, next);

    expect(next).toHaveBeenCalledTimes(1);
  });

  it('accepts KEY_VAULTS_SECRET bearer auth for internal fetch callbacks', async () => {
    mockVerify.mockResolvedValue(false);
    const next = vi.fn().mockResolvedValue(undefined);
    const { ctx } = buildContext('{"hello":"world"}', 'Bearer internal-secret');

    await qstashOrKeyVaultAuth()(ctx, next);

    expect(next).toHaveBeenCalledTimes(1);
  });

  it('rejects when neither auth method matches', async () => {
    mockVerify.mockResolvedValue(false);
    const next = vi.fn();
    const { ctx, getCaptured } = buildContext('{"hello":"world"}', 'Bearer wrong');

    const res = await qstashOrKeyVaultAuth()(ctx, next);

    expect(res?.status).toBe(401);
    expect(getCaptured()?.body).toEqual({ error: 'Unauthorized' });
    expect(next).not.toHaveBeenCalled();
  });
});
