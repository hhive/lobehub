import type { BuiltinSkill } from '@lobechat/types';

import { systemPrompt } from './content';

export const WritingPlansIdentifier = 'writing-plans';

export const WritingPlansSkill: BuiltinSkill = {
  content: systemPrompt,
  description:
    'Write a concrete implementation plan with files, tasks, tests, and verification steps.',
  identifier: WritingPlansIdentifier,
  name: 'Writing Plans',
  source: 'builtin',
};
