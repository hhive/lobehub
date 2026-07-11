import { describe, expect, it } from 'vitest';

import { ImageGenerationManifest } from '../../../builtin-tool-image-generation/src/manifest';
import { ArtifactsSkill } from '../artifacts';
import { LobeHubSkill } from '.';

describe('LobeHubSkill routing boundary', () => {
  it('routes ordinary raster image requests to native image generation', () => {
    expect(LobeHubSkill.description).toContain(
      'DO NOT activate this skill for an ordinary request to generate or edit a raster image',
    );
    expect(LobeHubSkill.description).toContain('use the native image-generation tool instead');
    expect(LobeHubSkill.content).toContain('lobe-image-generation.generate_image');
    expect(LobeHubSkill.content).toContain('Do not query Market image models');
    expect(LobeHubSkill.content).not.toContain('# Generate an image');
  });

  it('keeps explicit CLI and generation task administration in scope', () => {
    expect(LobeHubSkill.description).toContain(
      'explicitly asks to operate `lh gen` or administer an existing generation task',
    );
    expect(LobeHubSkill.content).toContain('Video, TTS, and ASR CLI workflows remain available');
    expect(LobeHubSkill.resources).toHaveProperty('references/generate');
  });

  it('keeps platform management, artifacts, and raster generation boundaries distinct', () => {
    expect(LobeHubSkill.description).toContain('model/provider/plugin management');
    expect(ArtifactsSkill.description).toContain('editable, code-driven artifacts');
    expect(ImageGenerationManifest.api[0].description).toContain('final raster image');
    expect(ImageGenerationManifest.api[0].description).toContain(
      'photo, raster illustration, painting, concept art',
    );
  });
});
