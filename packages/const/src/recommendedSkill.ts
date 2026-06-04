export enum RecommendedSkillType {
  Builtin = 'builtin',
  Klavis = 'klavis',
  Lobehub = 'lobehub',
}

export interface RecommendedSkillItem {
  id: string;
  type: RecommendedSkillType;
}

export const RECOMMENDED_SKILLS: RecommendedSkillItem[] = [
  // Builtin skills
  { id: 'lobe-artifacts', type: RecommendedSkillType.Builtin },
  { id: 'lobe-user-memory', type: RecommendedSkillType.Builtin },
  { id: 'lobe-cloud-sandbox', type: RecommendedSkillType.Builtin },
  { id: 'lobe-task', type: RecommendedSkillType.Builtin },
  { id: 'lobe-agent-documents', type: RecommendedSkillType.Builtin },
  { id: 'lobe-message', type: RecommendedSkillType.Builtin },
  // Workflow skills shown below the original default builtin list
  { id: 'using-superpowers', type: RecommendedSkillType.Builtin },
  { id: 'brainstorming', type: RecommendedSkillType.Builtin },
  { id: 'writing-plans', type: RecommendedSkillType.Builtin },
  { id: 'executing-plans', type: RecommendedSkillType.Builtin },
  { id: 'requesting-code-review', type: RecommendedSkillType.Builtin },
  // LobeHub skills
  { id: 'notion', type: RecommendedSkillType.Lobehub },
  { id: 'twitter', type: RecommendedSkillType.Lobehub },
  // Klavis skills
  { id: 'gmail', type: RecommendedSkillType.Klavis },
  { id: 'google-drive', type: RecommendedSkillType.Klavis },
  { id: 'google-calendar', type: RecommendedSkillType.Klavis },
  { id: 'slack', type: RecommendedSkillType.Klavis },
];
