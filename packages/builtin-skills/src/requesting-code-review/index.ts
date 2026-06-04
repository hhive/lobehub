import type { BuiltinSkill } from '@lobechat/types';

import { systemPrompt } from './content';

export const RequestingCodeReviewIdentifier = 'requesting-code-review';

export const RequestingCodeReviewSkill: BuiltinSkill = {
  content: systemPrompt,
  description:
    'Use when a change is ready for review and the agent should ask for a focused code review.',
  identifier: RequestingCodeReviewIdentifier,
  name: 'Requesting Code Review',
  source: 'builtin',
};
