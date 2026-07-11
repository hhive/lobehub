import type { BuiltinToolManifest } from '@lobechat/types';

import { systemPrompt } from './systemRole';
import { ImageGenerationApiName, ImageGenerationIdentifier } from './types';

export const ImageGenerationManifest: BuiltinToolManifest = {
  api: [
    {
      description:
        'Generate or edit one final raster image, such as a photo, raster illustration, painting, concept art, cover visual, product image, social media graphic, or requested PNG, JPEG, or WebP output. Use only when the user explicitly requests image generation or editing; do not use for HTML, React, SVG, charts, diagrams, interactive pages, image analysis, or prompt-only requests.',
      name: ImageGenerationApiName.generateImage,
      parameters: {
        additionalProperties: false,
        properties: {
          prompt: {
            description:
              'A complete visual description of the image to generate, including subject, composition, style, lighting, and mood.',
            type: 'string',
          },
          reference_image_file_ids: {
            description:
              'Optional file IDs of images already available in the current conversation or workspace to use as editing references.',
            items: { type: 'string' },
            type: 'array',
          },
          shape: {
            description:
              'Optional output composition. Omit when the user has no aspect-ratio preference.',
            enum: ['square', 'portrait', 'landscape'],
            type: 'string',
          },
        },
        required: ['prompt'],
        type: 'object',
      },
    },
  ],
  identifier: ImageGenerationIdentifier,
  meta: {
    avatar: 'IMG',
    description: "Generate and edit images with the current user's server-side image provider",
    readme:
      'Creates one final raster image from a visual prompt and can use authorized workspace images as editing references. Best suited to photos, raster illustrations, paintings, concept art, cover visuals, product images, and social media graphics. Provider credentials remain on the server.',
    title: 'Image Generation',
  },
  systemRole: systemPrompt,
  type: 'builtin',
};
