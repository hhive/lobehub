import type { BuiltinSkill } from '@lobechat/types';

import { AgentBrowserSkill } from './agent-browser';
import { ArtifactsSkill } from './artifacts';
import { BrainstormingSkill } from './brainstorming';
import { ExecutingPlansSkill } from './executing-plans';
import { LobeHubSkill } from './lobehub';
import { RequestingCodeReviewSkill } from './requesting-code-review';
import { TaskSkill } from './task';
import { UsingSuperpowersSkill } from './using-superpowers';
import { WritingPlansSkill } from './writing-plans';

export { AgentBrowserIdentifier } from './agent-browser';
export { ArtifactsIdentifier } from './artifacts';
export { BrainstormingIdentifier } from './brainstorming';
export { ExecutingPlansIdentifier } from './executing-plans';
export { LobeHubIdentifier } from './lobehub';
export { RequestingCodeReviewIdentifier } from './requesting-code-review';
export { TaskIdentifier } from './task';
export { UsingSuperpowersIdentifier } from './using-superpowers';
export { WritingPlansIdentifier } from './writing-plans';

export const builtinSkills: BuiltinSkill[] = [
  AgentBrowserSkill,
  ArtifactsSkill,
  LobeHubSkill,
  TaskSkill,
  UsingSuperpowersSkill,
  BrainstormingSkill,
  WritingPlansSkill,
  ExecutingPlansSkill,
  RequestingCodeReviewSkill,
  // FindSkillsSkill
];
