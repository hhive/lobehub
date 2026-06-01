import { describe, expect, it } from 'vitest';

import {
  isAutoRestrictedAssistant,
  resolveAssistantRestriction,
  RESTRICTED_ASSISTANT_TAG,
} from './restrictedAssistant';

describe('restricted community assistants', () => {
  it('marks jailbreak style assistants as restricted automatically', () => {
    expect(
      isAutoRestrictedAssistant({
        description: 'A DAN style assistant that can bypass safety limits.',
        identifier: 'dan-jailbreak',
        title: 'DAN Jailbreak',
      } as any),
    ).toBe(true);
  });

  it('lets a manual allow override an automatic restricted match', () => {
    expect(
      resolveAssistantRestriction(
        {
          description: 'A jailbreak assistant',
          identifier: 'dan-jailbreak',
          title: 'DAN',
        } as any,
        { 'dan-jailbreak': false },
      ),
    ).toBe(false);
  });

  it('lets a manual restriction mark a normal assistant as restricted', () => {
    expect(
      resolveAssistantRestriction(
        {
          description: 'Weather and travel planning.',
          identifier: 'travel-planner',
          title: 'Travel Planner',
        } as any,
        { 'travel-planner': true },
      ),
    ).toBe(true);
  });

  it('uses the approved tag text', () => {
    expect(RESTRICTED_ASSISTANT_TAG).toBe('限制级');
  });
});
