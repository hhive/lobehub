import { ImageGenerationIdentifier } from '@lobechat/builtin-tool-image-generation';
import { describe, expect, it } from 'vitest';

import {
  builtinTools,
  defaultToolIds,
  defaultUninstalledBuiltinTools,
  runtimeManagedToolIds,
  workflowBuiltinIds,
} from './index';

describe('defaultUninstalledBuiltinTools', () => {
  it('marks workflow builtin skills as uninstalled by default', () => {
    for (const identifier of workflowBuiltinIds) {
      expect(defaultUninstalledBuiltinTools).toContain(identifier);
    }
  });
});

describe('image generation tool registration', () => {
  it('registers image generation as a hidden, runtime-managed default tool', () => {
    const tool = builtinTools.find((item) => item.identifier === ImageGenerationIdentifier);

    expect(tool).toMatchObject({ discoverable: false, hidden: true, type: 'builtin' });
    expect(defaultToolIds).toContain(ImageGenerationIdentifier);
    expect(runtimeManagedToolIds).toContain(ImageGenerationIdentifier);
  });
});
