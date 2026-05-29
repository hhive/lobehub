// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { marketRouter } from './market';

const runBuildInTool = vi.fn();
const refreshToken = vi.fn();
const getUserSettings = vi.fn();
const updateSetting = vi.fn();
const createPreSignedUrl = vi.fn();
const getFileMetadata = vi.fn();
const createFileRecord = vi.fn();

vi.mock('@/database/core/db-adaptor', () => ({
  getServerDB: vi.fn().mockResolvedValue({}),
}));

vi.mock('@/database/models/user', () => ({
  UserModel: Object.assign(
    vi.fn().mockImplementation(() => ({
      getUserPreference: vi.fn().mockResolvedValue({ telemetry: false }),
      getUserSettings,
      getUserState: vi.fn().mockResolvedValue({ settings: { market: { accessToken: 'expired' } } }),
      updateSetting,
    })),
    {
      findById: vi.fn().mockResolvedValue({
        email: 'user@example.com',
        fullName: 'Test User',
        username: 'test-user',
      }),
    },
  ),
}));

vi.mock('@/server/services/market', () => ({
  MarketService: vi.fn().mockImplementation((options) => ({
    market: {
      plugins: {
        runBuildInTool,
      },
    },
    options,
    refreshToken,
  })),
}));

vi.mock('@/server/modules/S3', () => ({
  FileS3: vi.fn().mockImplementation(() => ({
    createPreSignedUrl,
    getFileMetadata,
  })),
}));

vi.mock('@/server/services/file', () => ({
  FileService: vi.fn().mockImplementation(() => ({
    createFileRecord,
    getFullFileUrl: vi.fn(),
  })),
}));

vi.mock('@/server/services/discover', () => ({
  DiscoverService: vi.fn().mockImplementation(() => ({})),
}));

vi.mock('./_helpers', () => ({
  scheduleToolCallReport: vi.fn(),
}));

describe('marketRouter', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    getUserSettings.mockResolvedValue({
      market: {
        accessToken: 'expired-access-token',
        refreshToken: 'saved-refresh-token',
      },
    });
    refreshToken.mockResolvedValue({
      accessToken: 'fresh-access-token',
      expiresIn: 3600,
      refreshToken: 'fresh-refresh-token',
    });
    updateSetting.mockResolvedValue(undefined);
    createPreSignedUrl.mockResolvedValue('https://upload.example.com/file');
    getFileMetadata.mockResolvedValue({
      contentLength: 123,
      contentType: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    });
    createFileRecord.mockResolvedValue({
      fileId: 'file-1',
      url: '/f/file-1',
    });
  });

  it('refreshes market token once and retries execInSandbox after invalid_token', async () => {
    runBuildInTool
      .mockResolvedValueOnce({
        error: {
          code: 'invalid_token',
          message: 'Access token is invalid or expired',
        },
        success: false,
      })
      .mockResolvedValueOnce({
        data: { result: { ok: true }, sessionExpiredAndRecreated: false },
        success: true,
      });

    const caller = marketRouter.createCaller({
      oidcAuth: { sub: 'user-1' },
    } as any);

    const result = await caller.execInSandbox({
      params: { value: 1 },
      toolName: 'python',
      topicId: 'topic-1',
    });

    expect(result).toEqual({
      result: { ok: true },
      sessionExpiredAndRecreated: false,
      success: true,
    });
    expect(refreshToken).toHaveBeenCalledWith({
      clientId: 'lobechat-com',
      refreshToken: 'saved-refresh-token',
    });
    expect(updateSetting).toHaveBeenCalledWith({
      market: {
        accessToken: 'fresh-access-token',
        expiresAt: expect.any(Number),
        refreshToken: 'fresh-refresh-token',
      },
    });
    expect(runBuildInTool).toHaveBeenCalledTimes(2);
  });

  it('refreshes market token once and retries exportAndUploadFile after invalid_token', async () => {
    runBuildInTool
      .mockResolvedValueOnce({
        error: {
          code: 'invalid_token',
          message: 'Access token is invalid or expired',
        },
        success: false,
      })
      .mockResolvedValueOnce({
        data: { result: { success: true } },
        success: true,
      });

    const caller = marketRouter.createCaller({
      oidcAuth: { sub: 'user-1' },
    } as any);

    const result = await caller.exportAndUploadFile({
      filename: 'deck.pptx',
      path: '/tmp/deck.pptx',
      topicId: 'topic-1',
    });

    expect(result).toMatchObject({
      fileId: 'file-1',
      filename: 'deck.pptx',
      mimeType: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      size: 123,
      success: true,
      url: '/f/file-1',
    });
    expect(refreshToken).toHaveBeenCalledWith({
      clientId: 'lobechat-com',
      refreshToken: 'saved-refresh-token',
    });
    expect(createFileRecord).toHaveBeenCalledWith({
      fileHash: expect.any(String),
      fileType: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      name: 'deck.pptx',
      size: 123,
      url: 'code-interpreter-exports/2026-05-29/topic-1/deck.pptx',
    });
    expect(runBuildInTool).toHaveBeenCalledTimes(2);
  });
});
