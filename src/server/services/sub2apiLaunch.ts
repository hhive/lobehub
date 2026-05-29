import crypto from 'node:crypto';

import { serverDB } from '@lobechat/database';
import { eq } from 'drizzle-orm';
import type {
  AiProviderModelListItem,
  LobeDefaultAiModelListItem,
  ModelAbilities,
} from 'model-bank';
import { AiModelSourceEnum, loadModels } from 'model-bank';

import { AiModelModel } from '@/database/models/aiModel';
import { AiProviderModel } from '@/database/models/aiProvider';
import { UserModel } from '@/database/models/user';
import { users } from '@/database/schemas/user';
import { KeyVaultsGateKeeper } from '@/server/modules/KeyVaultsEncrypt';

interface PasswordInput {
  secret: string;
  userId: number;
}

export interface Sub2APIExchangePayload {
  api_base_url: string;
  api_key: string;
  api_key_id: number;
  email?: string;
  role?: string;
  user_id: number;
  username?: string;
}

export interface LobeHubAuthResult {
  setCookies: string[];
  userId: string;
}

interface Sub2APIModelItem {
  display_name?: unknown;
  id?: unknown;
}

interface Sub2APIModelsResponse {
  data?: Sub2APIModelItem[];
}

interface DefaultAgentSettings {
  config?: Record<string, unknown>;
}

export function buildSub2APIBoundEmail(userId: number): string {
  return `sub2api-${userId}@sub2api.local`;
}

function normalizeSub2APIEmail(email?: string): string | undefined {
  const normalized = email?.trim().toLowerCase();
  if (!normalized) return;
  if (/\s/.test(normalized)) return;

  const parts = normalized.split('@');
  if (parts.length !== 2) return;

  const [local, domain] = parts;
  if (!local || !domain || !domain.includes('.')) return;
  if (domain.split('.').some((part) => !part)) return;

  return normalized;
}

function getSub2APIBoundAuthIdentity(payload: Sub2APIExchangePayload) {
  const legacyEmail = buildSub2APIBoundEmail(payload.user_id);
  const email = normalizeSub2APIEmail(payload.email);
  if (!email) throw new Error('Sub2API exchange returned invalid email');

  const name = payload.username || email;

  return {
    email,
    legacyEmail,
    name,
  };
}

export function buildSub2APIPassword({ secret, userId }: PasswordInput): string {
  return crypto.createHash('sha256').update(`${secret}:${userId}`).digest('hex');
}

export function normalizeSub2APIAPIBaseURL(rawBaseURL: string): string {
  const trimmed = rawBaseURL.trim();
  if (!trimmed) return '';

  try {
    const url = new URL(trimmed);
    if (url.pathname.replace(/\/+$/, '') !== '/v1') {
      url.pathname = `${url.pathname.replace(/\/+$/, '')}/v1`;
    }
    return url.toString();
  } catch {
    return trimmed;
  }
}

function resolveSub2APIAPIBaseURL(payloadBaseURL: string): string {
  const internalBaseURL = process.env.SUB2API_INTERNAL_API_BASE_URL?.trim();
  return normalizeSub2APIAPIBaseURL(internalBaseURL || payloadBaseURL);
}

function buildSub2APIModelsURL(apiBaseURL: string): URL {
  const normalizedBaseURL = resolveSub2APIAPIBaseURL(apiBaseURL);
  return new URL(
    'models',
    normalizedBaseURL.endsWith('/') ? normalizedBaseURL : `${normalizedBaseURL}/`,
  );
}

function inferSub2APIModelType(modelId: string): 'chat' | 'image' {
  const normalized = modelId.toLowerCase();
  if (
    normalized.startsWith('gpt-image') ||
    normalized.startsWith('dall-e') ||
    normalized.includes('image')
  ) {
    return 'image';
  }

  return 'chat';
}

function inferSub2APIModelAbilities(type: 'chat' | 'image'): ModelAbilities {
  if (type === 'image') return { imageOutput: true };

  return { functionCall: true };
}

function normalizeModelId(id: string): string {
  return id.trim().toLowerCase();
}

function findLobeModelTemplate(
  modelId: string,
  type: 'chat' | 'image',
  builtinModels: LobeDefaultAiModelListItem[],
) {
  const normalizedId = normalizeModelId(modelId);
  const openAIModels = builtinModels.filter((model) => model.providerId === 'openai');
  const exactOpenAIModel = openAIModels.find(
    (model) => normalizeModelId(model.id) === normalizedId,
  );
  if (exactOpenAIModel) return exactOpenAIModel;

  const exactModel = builtinModels.find((model) => normalizeModelId(model.id) === normalizedId);
  if (exactModel) return exactModel;

  const sameTypeModels = openAIModels.filter((model) => model.type === type);
  const sameFamilyModels = sameTypeModels
    .filter((model) => isSameModelFamily(normalizedId, normalizeModelId(model.id)))
    .sort(
      (a, b) =>
        getModelSimilarityScore(normalizedId, normalizeModelId(b.id)) -
        getModelSimilarityScore(normalizedId, normalizeModelId(a.id)),
    );

  return sameFamilyModels[0];
}

function isSameModelFamily(modelId: string, candidateId: string): boolean {
  if (!candidateId) return false;
  if (modelId.startsWith(`${candidateId}-`) || modelId.startsWith(`${candidateId}.`)) return true;

  const modelFamily = modelId.match(/^(gpt-image|dall-e|gpt-\d+)/)?.[1];
  const candidateFamily = candidateId.match(/^(gpt-image|dall-e|gpt-\d+)/)?.[1];

  return !!modelFamily && modelFamily === candidateFamily;
}

function getModelSimilarityScore(modelId: string, candidateId: string): number {
  if (modelId.startsWith(`${candidateId}-`) || modelId.startsWith(`${candidateId}.`)) {
    return 10_000 + candidateId.length;
  }

  let commonPrefixLength = 0;
  while (
    commonPrefixLength < modelId.length &&
    commonPrefixLength < candidateId.length &&
    modelId[commonPrefixLength] === candidateId[commonPrefixLength]
  ) {
    commonPrefixLength += 1;
  }

  return commonPrefixLength;
}

function buildSub2APILobeModel(
  model: { displayName: string; id: string },
  builtinModels: LobeDefaultAiModelListItem[],
): AiProviderModelListItem {
  const type = inferSub2APIModelType(model.id);
  const fallbackAbilities = inferSub2APIModelAbilities(type);
  const lobeTemplate = findLobeModelTemplate(model.id, type, builtinModels);
  const isExactLobeModel = normalizeModelId(lobeTemplate?.id || '') === normalizeModelId(model.id);
  const abilities = { ...fallbackAbilities, ...lobeTemplate?.abilities };

  return {
    ...(lobeTemplate?.config && { config: lobeTemplate.config }),
    ...(lobeTemplate?.contextWindowTokens && {
      contextWindowTokens: lobeTemplate.contextWindowTokens,
    }),
    ...(lobeTemplate?.parameters && { parameters: lobeTemplate.parameters }),
    ...(lobeTemplate?.pricing && { pricing: lobeTemplate.pricing }),
    ...(lobeTemplate?.releasedAt && { releasedAt: lobeTemplate.releasedAt }),
    ...(lobeTemplate?.settings && { settings: lobeTemplate.settings }),
    abilities,
    displayName: isExactLobeModel
      ? lobeTemplate?.displayName || model.displayName || model.id
      : model.displayName || lobeTemplate?.displayName || model.id,
    enabled: true,
    id: model.id,
    source: AiModelSourceEnum.Remote,
    type,
  };
}

export async function exchangeSub2APILaunchToken(params: {
  secret: string;
  sub2apiBaseURL: string;
  token: string;
}): Promise<Sub2APIExchangePayload> {
  const endpoint = new URL('/api/v1/lobehub/exchange', params.sub2apiBaseURL);
  const response = await fetch(endpoint, {
    body: JSON.stringify({ token: params.token }),
    headers: {
      'Content-Type': 'application/json',
      'X-Sub2API-LobeHub-Secret': params.secret,
    },
    method: 'POST',
  });

  if (!response.ok) {
    throw new Error(`Sub2API exchange failed with status ${response.status}`);
  }

  const body = await response.json();
  if (body?.code !== 0 || !body?.data?.api_key) {
    throw new Error('Sub2API exchange returned invalid payload');
  }

  return body.data as Sub2APIExchangePayload;
}

export async function authenticateSub2APIBoundUser(params: {
  appOrigin: string;
  payload: Sub2APIExchangePayload;
  secret: string;
}): Promise<LobeHubAuthResult> {
  const identity = getSub2APIBoundAuthIdentity(params.payload);
  const password = buildSub2APIPassword({ secret: params.secret, userId: params.payload.user_id });

  let authResponse = await authenticateWithBetterAuthEmail(params.appOrigin, {
    email: identity.email,
    name: identity.name,
    password,
  });

  if (!authResponse.ok && identity.email !== identity.legacyEmail) {
    authResponse = await callBetterAuth(params.appOrigin, '/api/auth/sign-in/email', {
      email: identity.legacyEmail,
      password,
      rememberMe: true,
    });
  }

  if (!authResponse.ok) {
    throw new Error(`LobeHub auth failed with status ${authResponse.status}`);
  }

  const body = await authResponse.json();
  const userId = body?.user?.id;
  if (!userId) {
    throw new Error('LobeHub auth returned no user id');
  }

  await syncSub2APIUserRole(userId, params.payload.role);

  return { setCookies: getSetCookies(authResponse.headers), userId };
}

async function authenticateWithBetterAuthEmail(
  appOrigin: string,
  params: { email: string; name: string; password: string },
) {
  const signUpResponse = await callBetterAuth(appOrigin, '/api/auth/sign-up/email', {
    email: params.email,
    name: params.name,
    password: params.password,
    rememberMe: true,
  });

  if (signUpResponse.ok || signUpResponse.status !== 422) return signUpResponse;

  return callBetterAuth(appOrigin, '/api/auth/sign-in/email', {
    email: params.email,
    password: params.password,
    rememberMe: true,
  });
}

async function syncSub2APIUserRole(userId: string, role?: string) {
  const normalizedRole = normalizeSub2APIUserRole(role);
  if (!normalizedRole) return;

  await serverDB.update(users).set({ role: normalizedRole }).where(eq(users.id, userId));
}

function normalizeSub2APIUserRole(role?: string): 'admin' | 'user' | undefined {
  if (role === 'admin' || role === 'user') return role;
}

export async function upsertSub2APIOpenAIProvider(userId: string, payload: Sub2APIExchangePayload) {
  const gateKeeper = await KeyVaultsGateKeeper.initWithEnvKey();
  const providerModel = new AiProviderModel(serverDB, userId);
  await providerModel.updateConfig(
    'openai',
    {
      config: { sub2apiOnlyModels: true },
      fetchOnClient: false,
      keyVaults: {
        apiKey: payload.api_key,
        baseURL: resolveSub2APIAPIBaseURL(payload.api_base_url),
      },
    },
    gateKeeper.encrypt,
    KeyVaultsGateKeeper.getUserKeyVaults,
  );
  await providerModel.toggleProviderEnabled('openai', true);

  const syncResult = await syncSub2APIModels(userId, payload);
  if (syncResult.defaultChatModel) {
    const userModel = new UserModel(serverDB, userId);
    const currentDefaultAgent =
      ((await userModel.getUserSettingsDefaultAgentConfig()) as DefaultAgentSettings) || {};
    await userModel.updateSetting({
      defaultAgent: {
        ...currentDefaultAgent,
        config: {
          ...currentDefaultAgent.config,
          ...syncResult.defaultChatModel,
        },
      },
    });
  }
}

export async function syncSub2APIModels(
  userId: string,
  payload: Sub2APIExchangePayload,
): Promise<{ count: number; defaultChatModel?: { model: string; provider: string }; synced: boolean }> {
  try {
    const response = await fetch(buildSub2APIModelsURL(payload.api_base_url), {
      headers: { Authorization: `Bearer ${payload.api_key}` },
      method: 'GET',
    });

    if (!response.ok) {
      throw new Error(`Sub2API models failed with status ${response.status}`);
    }

    const body = (await response.json()) as Sub2APIModelsResponse;
    const models = (body.data || [])
      .map((item) => ({
        displayName: typeof item.display_name === 'string' ? item.display_name.trim() : '',
        id: typeof item.id === 'string' ? item.id.trim() : '',
      }))
      .filter((item) => item.id);

    if (models.length === 0) {
      return { count: 0, synced: false };
    }

    const builtinModels = await loadModels();
    const lobeModels: AiProviderModelListItem[] = models.map((model) =>
      buildSub2APILobeModel(model, builtinModels),
    );

    const modelModel = new AiModelModel(serverDB, userId);
    await modelModel.clearModelsByProvider('openai');
    await modelModel.batchUpdateAiModels('openai', lobeModels);

    return {
      count: lobeModels.length,
      defaultChatModel: pickDefaultSub2APIChatModel(lobeModels),
      synced: true,
    };
  } catch (error) {
    console.warn('[sub2api-launch] failed to sync Sub2API models', error);
    return { count: 0, synced: false };
  }
}

export function pickDefaultSub2APIChatModel(
  models: Pick<AiProviderModelListItem, 'id' | 'type'>[],
): { model: string; provider: string } | undefined {
  const chatModel = models.find((model) => model.type === 'chat');
  if (!chatModel) return;

  return { model: chatModel.id, provider: 'openai' };
}

async function callBetterAuth(appOrigin: string, path: string, body: Record<string, unknown>) {
  return fetch(new URL(path, appOrigin), {
    body: JSON.stringify(body),
    headers: { 'Content-Type': 'application/json' },
    method: 'POST',
  });
}

function getSetCookies(headers: Headers): string[] {
  const withGetSetCookie = headers as Headers & { getSetCookie?: () => string[] };
  const cookies = withGetSetCookie.getSetCookie?.();
  if (cookies?.length) return cookies;

  const single = headers.get('set-cookie');
  return single ? [single] : [];
}
