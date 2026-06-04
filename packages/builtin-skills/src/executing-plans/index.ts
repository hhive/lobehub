import type { BuiltinSkill } from '@lobechat/types';

import { systemPrompt } from './content';

export const ExecutingPlansIdentifier = 'executing-plans';

export const ExecutingPlansSkill: BuiltinSkill = {
  content: systemPrompt,
  description:
    'Execute an approved implementation plan step by step with review checkpoints.',
  identifier: ExecutingPlansIdentifier,
  name: 'Executing Plans',
  source: 'builtin',
};
