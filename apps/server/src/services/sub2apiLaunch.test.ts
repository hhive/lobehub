import { beforeEach, describe, expect, it, vi } from 'vitest';

import {
  authenticateSub2APIBoundUser,
  buildSub2APIBoundEmail,
  buildSub2APIPassword,
  normalizeSub2APIAPIBaseURL,
  pickDefaultSub2APIChatModel,
  syncSub2APIModels,
  upsertSub2APIOpenAIProvider,
} from './sub2apiLaunch';

const mocks = vi.hoisted(() => ({
  batchUpdateAiModels: vi.fn(),
  clearModelsByProvider: vi.fn(),
  encrypt: vi.fn((value: string) => `encrypted:${value}`),
  loadModels: vi.fn(),
  toggleProviderEnabled: vi.fn(),
  updateConfig: vi.fn(),
  getUserSettingsDefaultAgentConfig: vi.fn(),
  insert: vi.fn(),
  insertOnConflictDoNothing: vi.fn(),
  insertValues: vi.fn(),
  userFindFirst: vi.fn(),
  updateSetting: vi.fn(),
  updateSet: vi.fn(),
  updateWhere: vi.fn(),
}));

vi.mock('@/database/models/aiModel', () => ({
  AiModelModel: vi.fn().mockImplementation(() => ({
    batchUpdateAiModels: mocks.batchUpdateAiModels,
    clearModelsByProvider: mocks.clearModelsByProvider,
  })),
}));

vi.mock('@/database/models/aiProvider', () => ({
  AiProviderModel: vi.fn().mockImplementation(() => ({
    toggleProviderEnabled: mocks.toggleProviderEnabled,
    updateConfig: mocks.updateConfig,
  })),
}));

vi.mock('@/database/models/user', () => ({
  UserModel: vi.fn().mockImplementation(() => ({
    getUserSettingsDefaultAgentConfig: mocks.getUserSettingsDefaultAgentConfig,
    updateSetting: mocks.updateSetting,
  })),
}));

vi.mock('@lobechat/database', () => ({
  serverDB: {
    insert: mocks.insert,
    query: {
      users: {
        findFirst: mocks.userFindFirst,
      },
    },
    update: vi.fn(() => ({
      set: mocks.updateSet.mockReturnValue({
        where: mocks.updateWhere,
      }),
    })),
  },
}));

vi.mock('@/server/modules/KeyVaultsEncrypt', () => ({
  KeyVaultsGateKeeper: {
    getUserKeyVaults: vi.fn(),
    initWithEnvKey: vi.fn(async () => ({
      encrypt: mocks.encrypt,
    })),
  },
}));

vi.mock('model-bank', () => ({
  AiModelSourceEnum: {
    Builtin: 'builtin',
    Custom: 'custom',
    Remote: 'remote',
  },
  loadModels: mocks.loadModels,
}));

describe('sub2apiLaunch helpers', () => {
  const originalInternalBaseURL = process.env.SUB2API_INTERNAL_API_BASE_URL;

  beforeEach(() => {
    mocks.batchUpdateAiModels.mockReset();
    mocks.clearModelsByProvider.mockReset();
    mocks.encrypt.mockClear();
    mocks.loadModels.mockReset();
    mocks.loadModels.mockResolvedValue([
      {
        abilities: { functionCall: true, reasoning: true },
        contextWindowTokens: 128_000,
        displayName: 'Lobe GPT-5.5',
        id: 'gpt-5.5',
        pricing: {
          units: [{ name: 'textInput', rate: 1, strategy: 'fixed', unit: 'millionTokens' }],
        },
        providerId: 'openai',
        releasedAt: '2026-01-01',
        settings: { disabledParams: ['temperature'] },
        type: 'chat',
      },
      {
        abilities: { functionCall: true },
        contextWindowTokens: 64_000,
        displayName: 'Lobe GPT-5.4',
        id: 'gpt-5.4',
        pricing: {
          units: [{ name: 'textInput', rate: 0.5, strategy: 'fixed', unit: 'millionTokens' }],
        },
        providerId: 'openai',
        type: 'chat',
      },
      {
        abilities: { functionCall: true, vision: true },
        contextWindowTokens: 1_000_000,
        displayName: 'Lobe Gemini 2.5 Pro',
        id: 'gemini-2.5-pro',
        pricing: {
          units: [{ name: 'textInput', rate: 1.25, strategy: 'fixed', unit: 'millionTokens' }],
        },
        providerId: 'google',
        type: 'chat',
      },
      {
        displayName: 'Lobe GPT Image 1',
        id: 'gpt-image-1',
        parameters: { imageOutputFormats: ['png'] },
        providerId: 'openai',
        type: 'image',
      },
    ]);
    mocks.toggleProviderEnabled.mockReset();
    mocks.getUserSettingsDefaultAgentConfig.mockReset();
    mocks.getUserSettingsDefaultAgentConfig.mockResolvedValue({});
    mocks.insert.mockReset();
    mocks.insertOnConflictDoNothing.mockReset();
    mocks.insertValues.mockReset();
    mocks.insertValues.mockReturnValue({
      onConflictDoNothing: mocks.insertOnConflictDoNothing,
    });
    mocks.insert.mockReturnValue({
      values: mocks.insertValues,
    });
    mocks.userFindFirst.mockReset();
    mocks.userFindFirst.mockResolvedValue({ id: 'lobe-user-1' });
    mocks.updateConfig.mockReset();
    mocks.updateSetting.mockReset();
    mocks.updateSet.mockReset();
    mocks.updateWhere.mockReset();
    if (originalInternalBaseURL === undefined) {
      delete process.env.SUB2API_INTERNAL_API_BASE_URL;
    } else {
      process.env.SUB2API_INTERNAL_API_BASE_URL = originalInternalBaseURL;
    }
    process.env.AUTH_SECRET = 'test-auth-secret';
    vi.spyOn(globalThis, 'fetch').mockRestore();
  });

  it('builds a deterministic service-owned LobeHub email from the Sub2API user id', () => {
    expect(buildSub2APIBoundEmail(42)).toBe('sub2api-42@sub2api.local');
  });

  it('builds a deterministic Better Auth compatible password without using the API key', () => {
    const password = buildSub2APIPassword({ secret: 'exchange-secret', userId: 42 });

    expect(password).toHaveLength(64);
    expect(password).toMatch(/^[a-f0-9]+$/);
    expect(password).toBe(buildSub2APIPassword({ secret: 'exchange-secret', userId: 42 }));
    expect(password).not.toBe(buildSub2APIPassword({ secret: 'exchange-secret', userId: 43 }));
  });

  it('normalizes Sub2API base URL to the OpenAI-compatible /v1 endpoint', () => {
    expect(normalizeSub2APIAPIBaseURL('https://xiaoni-ai.top')).toBe('https://xiaoni-ai.top/v1');
    expect(normalizeSub2APIAPIBaseURL('https://xiaoni-ai.top/v1')).toBe('https://xiaoni-ai.top/v1');
    expect(normalizeSub2APIAPIBaseURL('http://127.0.0.1:8080/api')).toBe(
      'http://127.0.0.1:8080/api/v1',
    );
  });

  it('syncs Sub2API /v1/models as a whitelist while preserving existing Lobe model metadata', async () => {
    const fetchMock = vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(
        JSON.stringify({
          data: [
            { display_name: 'GPT-5.5', id: 'gpt-5.5', object: 'model' },
            { id: 'gpt-image-1', object: 'model' },
            { id: 'dall-e-3', object: 'model' },
          ],
          object: 'list',
        }),
        { status: 200 },
      ),
    );

    const result = await syncSub2APIModels('lobe-user-1', {
      api_base_url: 'https://xiaoni-ai.top',
      api_key: 'sk-test',
      api_key_id: 1,
      user_id: 2,
    });

    expect(result).toEqual({
      count: 3,
      defaultChatModel: { model: 'gpt-5.5', provider: 'openai' },
      synced: true,
    });
    expect(fetchMock).toHaveBeenCalledWith(new URL('https://xiaoni-ai.top/v1/models'), {
      headers: { Authorization: 'Bearer sk-test' },
      method: 'GET',
    });
    expect(mocks.clearModelsByProvider).toHaveBeenCalledWith('openai');
    expect(mocks.batchUpdateAiModels).toHaveBeenCalledWith('openai', [
      expect.objectContaining({
        abilities: { functionCall: true, reasoning: true },
        contextWindowTokens: 128_000,
        displayName: 'Lobe GPT-5.5',
        enabled: true,
        id: 'gpt-5.5',
        pricing: {
          units: [{ name: 'textInput', rate: 1, strategy: 'fixed', unit: 'millionTokens' }],
        },
        releasedAt: '2026-01-01',
        settings: { disabledParams: ['temperature'] },
        source: 'remote',
        type: 'chat',
      }),
      expect.objectContaining({
        abilities: { imageOutput: true },
        displayName: 'Lobe GPT Image 1',
        enabled: true,
        id: 'gpt-image-1',
        parameters: { imageOutputFormats: ['png'] },
        source: 'remote',
        type: 'image',
      }),
      expect.objectContaining({
        abilities: { imageOutput: true },
        enabled: true,
        id: 'dall-e-3',
        source: 'remote',
        type: 'image',
      }),
    ]);
  });

  it('picks the first synced Sub2API chat model as the default agent model', () => {
    expect(
      pickDefaultSub2APIChatModel([
        { id: 'gpt-image-1', type: 'image' } as any,
        { id: 'gpt-5.5', type: 'chat' } as any,
      ]),
    ).toEqual({ model: 'gpt-5.5', provider: 'openai' });
  });

  it('uses same-family Lobe metadata as a fallback for Sub2API models missing from model-bank', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(
        JSON.stringify({
          data: [{ display_name: 'GPT-5.4 Nano', id: 'gpt-5.4-nano', object: 'model' }],
          object: 'list',
        }),
        { status: 200 },
      ),
    );

    const result = await syncSub2APIModels('lobe-user-1', {
      api_base_url: 'https://xiaoni-ai.top',
      api_key: 'sk-test',
      api_key_id: 1,
      user_id: 2,
    });

    expect(result).toEqual({
      count: 1,
      defaultChatModel: { model: 'gpt-5.4-nano', provider: 'openai' },
      synced: true,
    });
    expect(mocks.batchUpdateAiModels).toHaveBeenCalledWith('openai', [
      expect.objectContaining({
        abilities: { functionCall: true },
        contextWindowTokens: 64_000,
        displayName: 'GPT-5.4 Nano',
        enabled: true,
        id: 'gpt-5.4-nano',
        pricing: {
          units: [{ name: 'textInput', rate: 0.5, strategy: 'fixed', unit: 'millionTokens' }],
        },
        source: 'remote',
        type: 'chat',
      }),
    ]);
  });

  it('reuses exact Lobe model metadata even when the model belongs to another provider', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(
        JSON.stringify({
          data: [{ display_name: 'Gemini 2.5 Pro', id: 'gemini-2.5-pro', object: 'model' }],
          object: 'list',
        }),
        { status: 200 },
      ),
    );

    const result = await syncSub2APIModels('lobe-user-1', {
      api_base_url: 'https://xiaoni-ai.top',
      api_key: 'sk-test',
      api_key_id: 1,
      user_id: 2,
    });

    expect(result).toEqual({
      count: 1,
      defaultChatModel: { model: 'gemini-2.5-pro', provider: 'openai' },
      synced: true,
    });
    expect(mocks.batchUpdateAiModels).toHaveBeenCalledWith('openai', [
      expect.objectContaining({
        abilities: { functionCall: true, vision: true },
        contextWindowTokens: 1_000_000,
        displayName: 'Lobe Gemini 2.5 Pro',
        enabled: true,
        id: 'gemini-2.5-pro',
        pricing: {
          units: [{ name: 'textInput', rate: 1.25, strategy: 'fixed', unit: 'millionTokens' }],
        },
        source: 'remote',
        type: 'chat',
      }),
    ]);
  });

  it('uses configured internal Sub2API base URL for model sync requests', async () => {
    process.env.SUB2API_INTERNAL_API_BASE_URL = 'http://127.0.0.1:8080';
    const fetchMock = vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(JSON.stringify({ data: [{ id: 'gpt-5.5' }], object: 'list' }), {
        status: 200,
      }),
    );

    await syncSub2APIModels('lobe-user-1', {
      api_base_url: 'https://xiaoni-ai.top',
      api_key: 'sk-test',
      api_key_id: 1,
      user_id: 2,
    });

    expect(fetchMock).toHaveBeenCalledWith(new URL('http://127.0.0.1:8080/v1/models'), {
      headers: { Authorization: 'Bearer sk-test' },
      method: 'GET',
    });
  });

  it('stores the configured internal Sub2API base URL in the OpenAI provider', async () => {
    process.env.SUB2API_INTERNAL_API_BASE_URL = 'http://127.0.0.1:8080';
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(JSON.stringify({ data: [{ id: 'gpt-5.5' }], object: 'list' }), { status: 200 }),
    );

    await upsertSub2APIOpenAIProvider('lobe-user-1', {
      api_base_url: 'https://xiaoni-ai.top',
      api_key: 'sk-test',
      api_key_id: 1,
      user_id: 2,
    });

    expect(mocks.updateConfig).toHaveBeenCalledWith(
      'openai',
      expect.objectContaining({
        config: { sub2apiOnlyModels: true },
        keyVaults: expect.objectContaining({
          apiKey: 'sk-test',
          baseURL: 'http://127.0.0.1:8080/v1',
        }),
      }),
      mocks.encrypt,
      expect.any(Function),
    );
  });

  it('stores the Sub2API default image model in the OpenAI provider config', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(JSON.stringify({ data: [{ id: 'gpt-5.5' }], object: 'list' }), { status: 200 }),
    );

    await upsertSub2APIOpenAIProvider('lobe-user-1', {
      api_base_url: 'https://xiaoni-ai.top',
      api_key: 'sk-test',
      api_key_id: 1,
      image_model_name: 'gpt-image-2',
      user_id: 2,
    });

    expect(mocks.updateConfig).toHaveBeenCalledWith(
      'openai',
      expect.objectContaining({
        config: {
          sub2apiImageModel: 'gpt-image-2',
          sub2apiOnlyModels: true,
        },
      }),
      mocks.encrypt,
      expect.any(Function),
    );
  });

  it('sets the user default agent to the first synced Sub2API chat model after provider sync', async () => {
    process.env.SUB2API_INTERNAL_API_BASE_URL = 'http://127.0.0.1:8080';
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(
        JSON.stringify({
          data: [{ id: 'gpt-image-1' }, { id: 'gpt-5.5' }],
          object: 'list',
        }),
        { status: 200 },
      ),
    );

    await upsertSub2APIOpenAIProvider('lobe-user-1', {
      api_base_url: 'https://xiaoni-ai.top',
      api_key: 'sk-test',
      api_key_id: 1,
      user_id: 2,
    });

    expect(mocks.updateSetting).toHaveBeenCalledWith({
      defaultAgent: { config: { model: 'gpt-5.5', provider: 'openai' } },
    });
  });

  it('preserves existing default agent settings while updating the Sub2API chat model', async () => {
    mocks.getUserSettingsDefaultAgentConfig.mockResolvedValue({
      config: { params: { temperature: 0.2 }, systemRole: 'keep me' },
      meta: { title: 'Default' },
    });
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(JSON.stringify({ data: [{ id: 'gpt-5.5' }], object: 'list' }), {
        status: 200,
      }),
    );

    await upsertSub2APIOpenAIProvider('lobe-user-1', {
      api_base_url: 'https://xiaoni-ai.top',
      api_key: 'sk-test',
      api_key_id: 1,
      user_id: 2,
    });

    expect(mocks.updateSetting).toHaveBeenCalledWith({
      defaultAgent: {
        config: {
          model: 'gpt-5.5',
          params: { temperature: 0.2 },
          provider: 'openai',
          systemRole: 'keep me',
        },
        meta: { title: 'Default' },
      },
    });
  });

  it('does not clear existing models when Sub2API /v1/models returns an empty list', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(JSON.stringify({ data: [], object: 'list' }), { status: 200 }),
    );

    const result = await syncSub2APIModels('lobe-user-1', {
      api_base_url: 'https://xiaoni-ai.top/v1',
      api_key: 'sk-test',
      api_key_id: 1,
      user_id: 2,
    });

    expect(result).toEqual({ count: 0, synced: false });
    expect(mocks.clearModelsByProvider).not.toHaveBeenCalled();
    expect(mocks.batchUpdateAiModels).not.toHaveBeenCalled();
  });

  it('does not throw when Sub2API /v1/models fails', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response('nope', { status: 500 }));

    await expect(
      syncSub2APIModels('lobe-user-1', {
        api_base_url: 'https://xiaoni-ai.top/v1',
        api_key: 'sk-test',
        api_key_id: 1,
        user_id: 2,
      }),
    ).resolves.toEqual({ count: 0, synced: false });

    expect(mocks.clearModelsByProvider).not.toHaveBeenCalled();
    expect(mocks.batchUpdateAiModels).not.toHaveBeenCalled();
  });

  it('syncs the LobeHub user role from the Sub2API exchange payload after trusted email authentication', async () => {
    const result = await authenticateSub2APIBoundUser({
      appOrigin: 'https://chat.example.com',
      payload: {
        api_base_url: 'https://xiaoni-ai.top',
        api_key: 'sk-test',
        api_key_id: 1,
        email: 'admin@example.com',
        role: 'admin',
        user_id: 2,
      },
      secret: 'exchange-secret',
    });

    expect(result.userId).toBe('lobe-user-1');
    expect(result.setCookies[0]).toContain('better-auth.session_token=');
    expect(mocks.updateSet).toHaveBeenCalledWith({ role: 'admin' });
    expect(mocks.updateWhere).toHaveBeenCalledTimes(1);
  });

  it('uses the normalized Sub2API email as the trusted LobeHub identity', async () => {
    await authenticateSub2APIBoundUser({
      appOrigin: 'https://chat.example.com',
      payload: {
        api_base_url: 'https://xiaoni-ai.top',
        api_key: 'sk-test',
        api_key_id: 1,
        email: '  User@Example.COM  ',
        user_id: 2,
        username: 'Readable User',
      },
      secret: 'exchange-secret',
    });

    expect(mocks.userFindFirst).toHaveBeenCalledTimes(1);
    expect(mocks.insertValues).not.toHaveBeenCalledWith(
      expect.objectContaining({ email: 'user@example.com' }),
    );
  });

  it('rejects LobeHub authentication when the Sub2API email is invalid', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(JSON.stringify({ user: { id: 'lobe-user-1' } }), { status: 200 }),
    );

    await expect(
      authenticateSub2APIBoundUser({
        appOrigin: 'https://chat.example.com',
        payload: {
          api_base_url: 'https://xiaoni-ai.top',
          api_key: 'sk-test',
          api_key_id: 1,
          email: 'not-an-email',
          user_id: 2,
        },
        secret: 'exchange-secret',
      }),
    ).rejects.toThrow('Sub2API exchange returned invalid email');

    expect(globalThis.fetch).not.toHaveBeenCalled();
  });

  it('rejects LobeHub authentication when the Sub2API email is missing', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(JSON.stringify({ user: { id: 'lobe-user-1' } }), { status: 200 }),
    );

    await expect(
      authenticateSub2APIBoundUser({
        appOrigin: 'https://chat.example.com',
        payload: {
          api_base_url: 'https://xiaoni-ai.top',
          api_key: 'sk-test',
          api_key_id: 1,
          user_id: 2,
        },
        secret: 'exchange-secret',
      }),
    ).rejects.toThrow('Sub2API exchange returned invalid email');

    expect(globalThis.fetch).not.toHaveBeenCalled();
  });

  it('creates a LobeHub user for a new trusted Sub2API email', async () => {
    mocks.userFindFirst.mockResolvedValueOnce(null).mockResolvedValueOnce({ id: 'new-lobe-user' });

    const result = await authenticateSub2APIBoundUser({
      appOrigin: 'https://chat.example.com',
      payload: {
        api_base_url: 'https://xiaoni-ai.top',
        api_key: 'sk-test',
        api_key_id: 1,
        email: 'user@example.com',
        user_id: 2,
        username: 'Readable User',
      },
      secret: 'exchange-secret',
    });

    expect(result.userId).toBe('new-lobe-user');
    expect(mocks.insertValues).toHaveBeenCalledWith(
      expect.objectContaining({
        email: 'user@example.com',
        emailVerified: true,
        fullName: 'Readable User',
        normalizedEmail: 'user@example.com',
      }),
    );
  });
});
