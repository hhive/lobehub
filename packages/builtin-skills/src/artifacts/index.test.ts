import { describe, expect, it } from 'vitest';

import { systemPrompt } from './content';
import { ArtifactsSkill } from './index';

describe('ArtifactsSkill capability boundaries', () => {
  it('describes artifacts as editable and code-driven', () => {
    expect(ArtifactsSkill.description).toContain('editable, code-driven');
    expect(ArtifactsSkill.description).toContain('SVG graphics');
    expect(ArtifactsSkill.description).toContain('HTML pages');
    expect(ArtifactsSkill.description).toContain('charts');
    expect(ArtifactsSkill.description).toContain('React components');
  });

  it('keeps structured and interactive visual scenarios in scope', () => {
    expect(systemPrompt).toContain('Vector and Structured Visuals');
    expect(systemPrompt).toContain('SVG graphics');
    expect(systemPrompt).toContain('vector illustrations');
    expect(systemPrompt).toContain('dashboards');
    expect(systemPrompt).toContain('data visualizations');
    expect(systemPrompt).toContain('interactive components');
  });

  it('routes final raster visuals away from artifacts', () => {
    expect(systemPrompt).toContain('Raster Image Generation or Editing');
    expect(systemPrompt).toContain('Raster photos, raster illustrations, paintings, concept art');
    expect(systemPrompt).toContain('final PNG, JPEG, or WebP assets');
    expect(systemPrompt).toContain('native image-generation tool');
    expect(systemPrompt).not.toContain('If asked for "images/SVG"');
  });

  it('distinguishes ambiguous visual deliverables by requested format', () => {
    expect(systemPrompt).toContain('For posters, logos, and UI designs');
    expect(systemPrompt).toContain('editable SVG, HTML, or React source');
    expect(systemPrompt).toContain('final raster visual');
  });
});
