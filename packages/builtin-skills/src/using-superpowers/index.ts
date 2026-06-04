import type { BuiltinSkill } from '@lobechat/types';

import { systemPrompt } from './content';

export const UsingSuperpowersIdentifier = 'using-superpowers';

export const UsingSuperpowersSkill: BuiltinSkill = {
  content: systemPrompt,
  description:
    'Start here when any superpowers workflow may apply; decide which superpowers skill should be used first.',
  identifier: UsingSuperpowersIdentifier,
  name: 'Using Superpowers',
  source: 'builtin',
};
