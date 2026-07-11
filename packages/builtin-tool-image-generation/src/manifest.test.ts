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

  it('defines raster generation and editing as its supported visual boundary', () => {
    const api = ImageGenerationManifest.api[0];

    expect(api.description).toContain('final raster image');
    expect(api.description).toContain('photo, raster illustration, painting, concept art');
    expect(ImageGenerationManifest.systemRole).toContain(
      'photos, raster illustrations, paintings, concept art, cover visuals, product images, social media graphics, requested PNG/JPEG/WebP images',
    );
    expect(ImageGenerationManifest.systemRole).toContain('edits based on reference images');
    expect(ImageGenerationManifest.systemRole).toContain('posters, logos, and UI designs');
  });

  it('excludes code-driven visuals and non-execution image requests', () => {
    const api = ImageGenerationManifest.api[0];

    expect(api.description).toContain('do not use for HTML, React, SVG, charts, diagrams');
    expect(ImageGenerationManifest.systemRole).toContain(
      'Do not call it for HTML, React, SVG, charts, flowcharts, diagrams, data visualizations, or interactive pages.',
    );
    expect(ImageGenerationManifest.systemRole).toContain(
      'image analysis, prompt writing or explanation',
    );
    expect(ImageGenerationManifest.systemRole).toContain(
      'Do not use it when the user requests editable SVG, HTML, React',
    );
  });
});
