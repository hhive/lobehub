import debug from 'debug';
import type { MiddlewareHandler } from 'hono';

import { verifyQStashSignature } from '@/libs/qstash';

const log = debug('lobe-server:agent:qstash-or-keyvault-auth');

/**
 * Accept QStash signed callbacks or same-host internal fetch callbacks signed
 * with KEY_VAULTS_SECRET.
 */
export const qstashOrKeyVaultAuth = (): MiddlewareHandler => async (c, next) => {
  const rawBody = await c.req.text();
  const isValidQStash = await verifyQStashSignature(c.req.raw, rawBody);

  const keyVaultsSecret = process.env.KEY_VAULTS_SECRET;
  const authHeader = c.req.header('authorization');
  const isValidKeyVaultsSecret =
    !!keyVaultsSecret && authHeader === `Bearer ${keyVaultsSecret}`;

  if (!isValidQStash && !isValidKeyVaultsSecret) {
    log('Rejected: neither QStash sig nor KEY_VAULTS_SECRET matched on %s', c.req.path);
    return c.json({ error: 'Unauthorized' }, 401);
  }

  await next();
};
