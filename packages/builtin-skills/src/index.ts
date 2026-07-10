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

/**
 * The portable verify skill is distributed to external builders (Claude Code /
 * Codex) by pulling it to disk (`lh verify init`), NOT by loading it into the
 * homogeneous agent runtime. So it is exported as a named skill for the pull
 * endpoint to import directly, but deliberately left OUT of `builtinSkills`
 * below — keeping it out of every app-layer consumer of that array (server
 * runtime, agentDocumentVfs, tool store / picker).
 */
export { VerifyIdentifier, VerifySkill } from './verify';

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
