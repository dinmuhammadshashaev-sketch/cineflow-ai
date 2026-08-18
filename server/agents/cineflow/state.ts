import { Production, Scene, Character, Prop, Task, ResearchQuestion, ResearchSource, Risk, ShootDay, ContinuityIssue } from '../../../src/types/index.js';

export interface CineFlowAgentState {
  production: Production;
  screenplayText: string;
  supervisorSummary?: string;
  scenes: Scene[];
  characters: Character[];
  props: Prop[];
  directorNotes?: string;
  creativeComplexity?: string;
  tasks: Task[];
  researchQuestions: ResearchQuestion[];
  sources: ResearchSource[];
  continuityIssues: ContinuityIssue[];
  risks: Risk[];
  shootDays: ShootDay[];
  readinessScore: number;
}

export function computeDeterministicReadiness(state: Partial<CineFlowAgentState>): number {
  let score = 0;

  // 1. Production metadata & Screenplay present
  if (state.production?.title && state.screenplayText && state.screenplayText.length > 20) {
    score += 10;
  }

  // 2. Scenes breakdown complete
  if (state.scenes && state.scenes.length > 0) {
    score += 20;
  }

  // 3. Characters & Props identified
  if ((state.characters && state.characters.length > 0) || (state.props && state.props.length > 0)) {
    score += 10;
  }

  // 4. Production Tasks created
  if (state.tasks && state.tasks.length > 0) {
    score += 15;
  }

  // 5. Research grounded
  if (state.researchQuestions && state.researchQuestions.length > 0) {
    const answered = state.researchQuestions.filter(q => q.status === 'FOUND' || q.status === 'NOT_NEEDED');
    if (answered.length > 0) {
      score += 15;
    }
  } else if (state.sources && state.sources.length > 0) {
    score += 15;
  }

  // 6. Continuity checked
  if (state.continuityIssues !== undefined) {
    score += 15;
  }

  // 7. Shoot Schedule generated
  if (state.shootDays && state.shootDays.length > 0) {
    score += 15;
  }

  return Math.min(100, score);
}
