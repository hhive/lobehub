import { beforeEach, describe, expect, it, vi } from 'vitest';

import { imageGenerationRuntime, imageGenerationRuntimeTestUtils } from '../imageGeneration';

const mocks = vi.hoisted(() => ({
  createImage: vi.fn(),
  findFiles: vi.fn(),
  findProvider: vi.fn(),
  getFullFileUrl: vi.fn(),
  transformImage: vi.fn(),
  uploadFromBuffer: vi.fn(),
}));

vi.mock('@/database/models/aiProvider', () => ({
  AiProviderModel: class {
    findById = mocks.findProvider;
  },
}));

vi.mock('@/database/models/file', () => ({
  FileModel: class {
    findByIds = mocks.findFiles;
  },
}));

vi.mock('@/server/modules/ModelRuntime', () => ({
  initModelRuntimeFromDB: vi.fn(async () => ({ createImage: mocks.createImage })),
}));

vi.mock('@/server/services/file', () => ({
  FileService: class {
    getFullFileUrl = mocks.getFullFileUrl;
    uploadFromBuffer = mocks.uploadFromBuffer;
  },
}));

vi.mock('@/server/services/generation', () => ({
  GenerationService: class {
    transformImageForGeneration = mocks.transformImage;
  },
}));

const context = {
  executionTimeoutMs: 10_000,
  operationId: 'operation-1',
  serverDB: {} as any,
  toolCallId: 'call-1',
  toolManifestMap: {},
  userId: 'user-1',
};

describe('imageGenerationRuntime', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.findProvider.mockResolvedValue({
      config: { sub2apiImageModel: 'gpt-image-2', sub2apiOnlyModels: true },
      enabled: true,
      fetchOnClient: false,
    });
    mocks.findFiles.mockResolvedValue([]);
    mocks.createImage.mockResolvedValue({ imageUrl: 'data:image/png;base64,AAAA' });
    mocks.transformImage.mockResolvedValue({
      image: {
        buffer: Buffer.from('image'),
        extension: 'png',
        height: 1024,
        mime: 'image/png',
        width: 1536,
      },
    });
    mocks.uploadFromBuffer.mockResolvedValue({
      fileId: 'file-1',
      key: 'generations/tool/file-1.png',
      url: 'https://chat.example.com/f/file-1',
    });
  });

  it('uses the Sub2API image model and maps landscape size', async () => {
    const runtime = await imageGenerationRuntime.factory(context as any);
    const result = await runtime.generate_image({ prompt: 'A city street', shape: 'landscape' });

    expect(mocks.createImage).toHaveBeenCalledWith(
      {
        model: 'gpt-image-2',
        params: { prompt: 'A city street', size: '1536x1024' },
      },
      expect.objectContaining({
        metadata: expect.objectContaining({ operationId: 'operation-1', toolCallId: 'call-1' }),
      }),
    );
    expect(mocks.uploadFromBuffer).toHaveBeenCalledWith(
      expect.any(Buffer),
      'image/png',
      expect.stringMatching(/^generations\/tool\/.+\.png$/),
    );
    expect(result).toMatchObject({
      state: {
        images: [
          {
            fileId: 'file-1',
            model: 'gpt-image-2',
            url: 'https://chat.example.com/f/file-1',
          },
        ],
      },
      success: true,
    });
  });

  it('resolves authorized reference images for editing', async () => {
    mocks.findFiles.mockResolvedValue([
      { fileType: 'image/png', id: 'reference-1', url: 'files/reference-1.png' },
    ]);
    mocks.getFullFileUrl.mockResolvedValue('https://storage.example.com/reference-1.png');

    const runtime = await imageGenerationRuntime.factory(context as any);
    await runtime.generate_image({
      prompt: 'Restore the colors',
      reference_image_file_ids: ['reference-1'],
    });

    expect(mocks.createImage).toHaveBeenCalledWith(
      expect.objectContaining({
        params: expect.objectContaining({
          imageUrls: ['https://storage.example.com/reference-1.png'],
        }),
      }),
      expect.anything(),
    );
  });

  it('rejects inaccessible reference images before calling the provider', async () => {
    mocks.findFiles.mockResolvedValue([]);
    const runtime = await imageGenerationRuntime.factory(context as any);

    await expect(
      runtime.generate_image({ prompt: 'Edit this', reference_image_file_ids: ['missing'] }),
    ).rejects.toThrow('not found or are not accessible');
    expect(mocks.createImage).not.toHaveBeenCalled();
  });

  it('requires a server-side Sub2API provider and configured image model', async () => {
    mocks.findProvider.mockResolvedValue({
      config: { sub2apiOnlyModels: false },
      enabled: true,
    });
    const runtime = await imageGenerationRuntime.factory(context as any);
    await expect(runtime.generate_image({ prompt: 'A portrait' })).rejects.toThrow(
      'server-side Sub2API provider',
    );

    mocks.findProvider.mockResolvedValue({
      config: { sub2apiOnlyModels: true },
      enabled: true,
      fetchOnClient: false,
    });
    await expect(runtime.generate_image({ prompt: 'A portrait' })).rejects.toThrow(
      'default image model is not configured',
    );
  });

  it('normalizes provider errors without exposing upstream details', () => {
    expect(
      imageGenerationRuntimeTestUtils.normalizeError(new Error('401 secret upstream body')).message,
    ).toBe('The Sub2API image credential is not authorized for this request.');
    expect(
      imageGenerationRuntimeTestUtils.normalizeError(new Error('vendor internal failure')).message,
    ).toBe('Image generation failed. Please try again.');
  });
});
