import { ImageGenerationIdentifier } from '@lobechat/builtin-tool-image-generation';
import { ASYNC_TASK_TIMEOUT } from '@lobechat/business-config/server';
import type { RuntimeImageGenParams } from 'model-bank';
import { nanoid } from 'nanoid';

import { AiProviderModel } from '@/database/models/aiProvider';
import { FileModel } from '@/database/models/file';
import { initModelRuntimeFromDB } from '@/server/modules/ModelRuntime';
import { FileService } from '@/server/services/file';
import { GenerationService } from '@/server/services/generation';

import type { ServerRuntimeRegistration } from './types';

type ImageShape = 'landscape' | 'portrait' | 'square';

interface GenerateImageArgs {
  prompt: string;
  reference_image_file_ids?: string[];
  shape?: ImageShape;
}

interface Sub2APIProviderConfig {
  sub2apiImageModel?: string;
  sub2apiOnlyModels?: boolean;
}

const SHAPE_SIZE: Record<ImageShape, string> = {
  landscape: '1536x1024',
  portrait: '1024x1536',
  square: '1024x1024',
};

const normalizeError = (error: unknown): Error => {
  const raw = error instanceof Error ? error.message : String(error);
  const message = raw.toLowerCase();

  if (message.includes('content policy') || message.includes('safety')) {
    return new Error('Image generation was rejected by the content policy.');
  }
  if (message.includes('401') || message.includes('403') || message.includes('unauthorized')) {
    return new Error('The Sub2API image credential is not authorized for this request.');
  }
  if (message.includes('timeout') || message.includes('timed out')) {
    return new Error('Image generation timed out. Please try again.');
  }
  if (message.includes('missing or empty data') || message.includes('no image')) {
    return new Error('The image provider returned no image.');
  }

  return new Error('Image generation failed. Please try again.');
};

const withTimeout = async <T>(promise: Promise<T>, timeoutMs: number): Promise<T> => {
  let timeout: ReturnType<typeof setTimeout> | undefined;
  const timeoutPromise = new Promise<never>((_, reject) => {
    timeout = setTimeout(() => reject(new Error('Image generation timed out')), timeoutMs);
  });

  try {
    return await Promise.race([promise, timeoutPromise]);
  } finally {
    if (timeout) clearTimeout(timeout);
  }
};

export const imageGenerationRuntime: ServerRuntimeRegistration = {
  factory: (context) => {
    if (!context.serverDB || !context.userId) {
      throw new Error('userId and serverDB are required for image generation');
    }

    const db = context.serverDB;
    const userId = context.userId;
    const workspaceId = context.workspaceId;

    return {
      generate_image: async (args: GenerateImageArgs) => {
        const prompt = args.prompt?.trim();
        if (!prompt) throw new Error('A non-empty image prompt is required.');

        const shape = args.shape || 'square';
        if (!(shape in SHAPE_SIZE)) throw new Error(`Unsupported image shape: ${shape}`);

        const providerModel = new AiProviderModel(db, userId, workspaceId);
        const provider = await providerModel.findById('openai');
        const providerConfig = (provider?.config || {}) as Sub2APIProviderConfig;
        const model = providerConfig.sub2apiImageModel?.trim();

        if (!provider?.enabled || !providerConfig.sub2apiOnlyModels || provider.fetchOnClient) {
          throw new Error('A server-side Sub2API provider is required for image generation.');
        }
        if (!model) {
          throw new Error('The Sub2API default image model is not configured.');
        }

        const referenceIds = [...new Set(args.reference_image_file_ids || [])];
        const fileModel = new FileModel(db, userId, workspaceId);
        const fileService = new FileService(db, userId, workspaceId);
        const referenceFiles = referenceIds.length ? await fileModel.findByIds(referenceIds) : [];

        if (referenceFiles.length !== referenceIds.length) {
          throw new Error('One or more reference images were not found or are not accessible.');
        }
        if (referenceFiles.some((file) => !file.fileType.startsWith('image/'))) {
          throw new Error('Reference files must be images.');
        }

        const imageUrls = await Promise.all(
          referenceFiles.map((file) => fileService.getFullFileUrl(file.url)),
        );
        const params: RuntimeImageGenParams = {
          ...(imageUrls.length > 0 ? { imageUrls } : {}),
          prompt,
          size: SHAPE_SIZE[shape],
        };

        try {
          const modelRuntime = await initModelRuntimeFromDB(db, userId, 'openai', workspaceId);
          if (!modelRuntime.createImage) {
            throw new Error('The configured provider does not support image generation.');
          }

          const response = await withTimeout(
            modelRuntime.createImage(
              { model, params },
              {
                metadata: {
                  operationId: context.operationId,
                  toolCallId: context.toolCallId,
                  trigger: 'tool',
                },
              },
            ),
            Math.max(1_000, context.executionTimeoutMs || ASYNC_TASK_TIMEOUT),
          );

          if (!response?.imageUrl) throw new Error('The image provider returned no image.');

          const generationService = new GenerationService(db, userId, workspaceId);
          const { image } = await generationService.transformImageForGeneration(response.imageUrl);
          const pathname = `generations/tool/${nanoid()}_${image.width}x${image.height}.${image.extension}`;
          const stored = await fileService.uploadFromBuffer(image.buffer, image.mime, pathname);
          const generated = {
            alt: prompt,
            fileId: stored.fileId,
            height: image.height,
            model,
            provider: 'openai',
            url: stored.url,
            width: image.width,
          };

          return {
            content: `Image generated successfully. file_id=${stored.fileId} url=${stored.url}`,
            state: { images: [generated] },
            success: true,
          };
        } catch (error) {
          throw normalizeError(error);
        }
      },
    };
  },
  identifier: ImageGenerationIdentifier,
};

export const imageGenerationRuntimeTestUtils = { normalizeError, SHAPE_SIZE, withTimeout };
