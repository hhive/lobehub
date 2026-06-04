import { describe, expect, it } from 'vitest';

import { defaultUninstalledBuiltinTools, workflowBuiltinIds } from './index';

describe('defaultUninstalledBuiltinTools', () => {
  it('marks workflow builtin skills as uninstalled by default', () => {
    for (const identifier of workflowBuiltinIds) {
      expect(defaultUninstalledBuiltinTools).toContain(identifier);
    }
  });
});
