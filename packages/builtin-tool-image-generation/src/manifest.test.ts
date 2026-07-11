import { describe, expect, it } from 'vitest';

import { ImageGenerationManifest } from './manifest';
import { ImageGenerationApiName, ImageGenerationIdentifier } from './types';

describe('ImageGenerationManifest', () => {
  it('declares the generate_image API contract', () => {
    expect(ImageGenerationManifest.identifier).toBe(ImageGenerationIdentifier);
    expect(ImageGenerationManifest.type).toBe('builtin');
    expect(ImageGenerationManifest.api).toHaveLength(1);

    const api = ImageGenerationManifest.api[0];
    expect(api.name).toBe(ImageGenerationApiName.generateImage);
    expect(api.parameters).toMatchObject({
      additionalProperties: false,
      properties: {
        prompt: { type: 'string' },
        reference_image_file_ids: { items: { type: 'string' }, type: 'array' },
        shape: { enum: ['square', 'portrait', 'landscape'], type: 'string' },
      },
      required: ['prompt'],
      type: 'object',
    });
  });

  it('keeps credentials server-side and limits invocation to explicit image requests', () => {
    expect(ImageGenerationManifest.systemRole).toContain('only when the user explicitly asks');
    expect(ImageGenerationManifest.systemRole).toContain(
      'Never ask for, accept, or pass an API key',
    );
    expect(ImageGenerationManifest.systemRole).toContain('Do not redirect the user to OpenRouter');
  });
});
