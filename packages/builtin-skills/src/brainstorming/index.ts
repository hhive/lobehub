import type { BuiltinSkill } from '@lobechat/types';

import { systemPrompt } from './content';

export const BrainstormingIdentifier = 'brainstorming';

export const BrainstormingSkill: BuiltinSkill = {
  content: systemPrompt,
  description:
    'Use before creative or design work to explore requirements, options, and trade-offs.',
  identifier: BrainstormingIdentifier,
  name: 'Brainstorming',
  source: 'builtin',
};
