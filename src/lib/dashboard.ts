/**
 * CineFlow AI — Pure Dashboard Domain Logic & Selectors
 * Pure functions for dashboard metrics, provenance summary, priority actions, and demo classification.
 * NO side effects, network calls, or mutable state.
 */

import {
  Production,
  Scene,
  ProductionTask,
  ResearchQuestion,
  Risk,
  ContinuityIssue,
  ShootDay,
  Source,
  WorkflowRun
} from '../types';
import {
  getAgentPipelineState,
  getFailedAgent,
  getParallelToolState,
  CINEFLOW_AGENT_PIPELINE
} from './pipeline';

export const DEMO_PRODUCTION_ID = 'prod_neon_harbor_001';
export const DEMO_PRODUCTION_TITLE = 'NEON HARBOR';

/**
 * Deterministically checks whether a production is the seeded demo production.
 * Ensures user-created productions are never accidentally classified as demo.
 */
export function isDemoProduction(production: Production | null | undefined): boolean {
  if (!production) return false;
  if (production.id === DEMO_PRODUCTION_ID) return true;
  if (production.id && production.id.startsWith('demo_')) return true;
  if (production.title && production.title.toUpperCase() === DEMO_PRODUCTION_TITLE) return true;
  return false;
}

export interface DashboardMetrics {
  hasProduction: boolean;
  readinessScore: number;
  sceneCount: number;
  taskCount: number;
  openRiskCount: number;
  criticalRiskCount: number;
  shootDayCount: number;
  realSourceCount: number;
  totalSourceCount: number;
}

/**
 * Derives truthful dashboard metrics from active domain collections.
 * Never uses hardcoded fake numbers.
 */
export function getDashboardMetrics(
  production: Production | null | undefined,
  scenes: Scene[] = [],
  tasks: ProductionTask[] = [],
  research: ResearchQuestion[] = [],
  risks: Risk[] = [],
  shootDays: ShootDay[] = [],
  sources: Source[] = []
): DashboardMetrics {
  if (!production) {
    return {
      hasProduction: false,
      readinessScore: 0,
      sceneCount: 0,
      taskCount: 0,
      openRiskCount: 0,
      criticalRiskCount: 0,
      shootDayCount: 0,
      realSourceCount: 0,
      totalSourceCount: 0
    };
  }

  const openRisks = risks.filter((r) => r.status !== 'RESOLVED');
  const criticalRisks = openRisks.filter((r) => r.severity === 'CRITICAL');
  const realSources = sources.filter((s) => s.isDemoMock === false);

  return {
    hasProduction: true,
    readinessScore: production.readinessScore || 0,
    sceneCount: scenes.length,
    taskCount: tasks.length,
    openRiskCount: openRisks.length,
    criticalRiskCount: criticalRisks.length,
    shootDayCount: shootDays.length,
    realSourceCount: realSources.length,
    totalSourceCount: sources.length
  };
}

export interface DashboardRunSummary {
  hasRun: boolean;
  isLive: boolean;
  isLocal: boolean;
  provenanceLabel: 'LIVE' | 'LOCAL DEMO' | 'NO AI CREW RUN YET';
  subLabel: string;
  workflowStatus: 'QUEUED' | 'RUNNING' | 'COMPLETED' | 'FAILED' | 'NONE';
  completedAgentsCount: number;
  totalAgents: number;
  failedAgentRole: string | null;
  isParallelVerified: boolean;
  isCompleted: boolean;
  isFailed: boolean;
  isInterrupted: boolean;
}

/**
 * Evaluates truthful runtime provenance and tool telemetry from WorkflowRun.
 */
export function getDashboardRunSummary(
  latestRun: WorkflowRun | null | undefined
): DashboardRunSummary {
  if (!latestRun) {
    return {
      hasRun: false,
      isLive: false,
      isLocal: false,
      provenanceLabel: 'NO AI CREW RUN YET',
      subLabel: 'Run the AI crew to generate a filmmaking plan',
      workflowStatus: 'NONE',
      completedAgentsCount: 0,
      totalAgents: 8,
      failedAgentRole: null,
      isParallelVerified: false,
      isCompleted: false,
      isFailed: false,
      isInterrupted: false
    };
  }

  const isLive = latestRun.mode === 'AGENTIC_GOOGLE_ADK';
  const isLocal = latestRun.mode === 'LOCAL_SIMULATION' || !isLive;

  const pipelineState = getAgentPipelineState(latestRun);
  const completedAgentsCount = pipelineState.filter((s) => s.status === 'COMPLETED').length;

  const failedAgent = getFailedAgent(latestRun);
  const failedAgentRole = failedAgent ? failedAgent.role : null;

  const isCompleted = latestRun.status === 'COMPLETED' && completedAgentsCount === 8;
  const isFailed = latestRun.status === 'FAILED';
  const isInterrupted = isFailed || (latestRun.status !== 'COMPLETED' && latestRun.status !== 'RUNNING');

  // Parallel verified REQUIRES AGENTIC mode AND completed parallel_search tool telemetry
  let isParallelVerified = false;
  if (isLive) {
    const parallelTool = getParallelToolState(latestRun);
    if (parallelTool && parallelTool.status === 'COMPLETED') {
      isParallelVerified = true;
    } else {
      // Check toolActivities or activities directly
      const hasCompletedToolAct = (latestRun.toolActivities || []).some(
        (t) => t.toolName.toLowerCase().includes('parallel') && t.status === 'COMPLETED'
      );
      if (hasCompletedToolAct) {
        isParallelVerified = true;
      }
    }
  }

  return {
    hasRun: true,
    isLive,
    isLocal,
    provenanceLabel: isLive ? 'LIVE' : 'LOCAL DEMO',
    subLabel: isLive ? 'Google ADK + Vertex AI' : 'Simulation',
    workflowStatus: latestRun.status,
    completedAgentsCount,
    totalAgents: 8,
    failedAgentRole,
    isParallelVerified,
    isCompleted,
    isFailed,
    isInterrupted
  };
}

export type PriorityItemType = 'RISK' | 'RESEARCH' | 'TASK' | 'CONTINUITY';

export interface PriorityActionItem {
  id: string;
  type: PriorityItemType;
  title: string;
  description: string;
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  status: string;
  navView: string;
  badgeLabel: string;
}

/**
 * Returns prioritized actions that need attention before shooting.
 * Derives strictly from actual production data without fabricating entries.
 */
export function getDashboardPriorityActions(
  risks: Risk[] = [],
  research: ResearchQuestion[] = [],
  tasks: ProductionTask[] = [],
  continuity: ContinuityIssue[] = []
): PriorityActionItem[] {
  const items: PriorityActionItem[] = [];

  // 1. Critical & High unresolved Risks
  const openRisks = risks.filter((r) => r.status !== 'RESOLVED');
  openRisks.forEach((r) => {
    if (r.severity === 'CRITICAL' || r.severity === 'HIGH') {
      items.push({
        id: `risk_${r.id}`,
        type: 'RISK',
        title: r.title,
        description: r.recommendedAction || r.description,
        severity: r.severity,
        status: r.status,
        navView: 'risks',
        badgeLabel: `${r.severity} RISK`
      });
    }
  });

  // 2. Critical & High unresolved Research Questions
  const openResearch = research.filter(
    (q) => q.status !== 'FOUND' && q.status !== 'NOT_NEEDED'
  );
  openResearch.forEach((q) => {
    if (q.importance === 'CRITICAL' || q.importance === 'HIGH') {
      items.push({
        id: `research_${q.id}`,
        type: 'RESEARCH',
        title: q.question,
        description: q.findings || `Research status: ${q.status}`,
        severity: q.importance,
        status: q.status,
        navView: 'research',
        badgeLabel: `${q.importance} RESEARCH`
      });
    }
  });

  // 3. Blocked or High/Critical Production Tasks
  const openTasks = tasks.filter((t) => t.status !== 'DONE');
  openTasks.forEach((t) => {
    if (t.status === 'BLOCKED' || t.priority === 'CRITICAL' || t.priority === 'HIGH') {
      items.push({
        id: `task_${t.id}`,
        type: 'TASK',
        title: t.title,
        description: t.description || `Category: ${t.category}`,
        severity: t.priority,
        status: t.status,
        navView: 'board',
        badgeLabel: `${t.priority} TASK`
      });
    }
  });

  // 4. Open Continuity Issues
  const openContinuity = continuity.filter((c) => c.status === 'OPEN');
  openContinuity.forEach((c) => {
    items.push({
      id: `continuity_${c.id}`,
      type: 'CONTINUITY',
      title: c.title,
      description: c.recommendation || c.description,
      severity: c.severity as 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW',
      status: c.status,
      navView: 'scenes',
      badgeLabel: `CONTINUITY (${c.category})`
    });
  });

  // Deterministic ordering: CRITICAL first, then HIGH, then others
  const severityWeight: Record<string, number> = {
    CRITICAL: 4,
    HIGH: 3,
    MEDIUM: 2,
    LOW: 1
  };

  items.sort((a, b) => {
    const weightA = severityWeight[a.severity] || 0;
    const weightB = severityWeight[b.severity] || 0;
    if (weightB !== weightA) return weightB - weightA;
    return a.id.localeCompare(b.id);
  });

  return items.slice(0, 5);
}

export type ProductionPlanStatus =
  | 'NO_PRODUCTION'
  | 'PRODUCTION_PLAN_READY'
  | 'INTERRUPTED'
  | 'IN_PROGRESS'
  | 'DRAFT';

/**
 * Evaluates high-level production plan completion state.
 */
export function getProductionPlanStatus(
  production: Production | null | undefined,
  latestRun: WorkflowRun | null | undefined
): ProductionPlanStatus {
  if (!production) return 'NO_PRODUCTION';

  if (latestRun) {
    if (latestRun.status === 'FAILED') return 'INTERRUPTED';
    const summary = getDashboardRunSummary(latestRun);
    if (latestRun.status === 'COMPLETED' && summary.completedAgentsCount === 8) {
      return 'PRODUCTION_PLAN_READY';
    }
    if (latestRun.status === 'RUNNING') return 'IN_PROGRESS';
  }

  return 'DRAFT';
}

/**
 * Concise explanation of how readiness score is derived.
 * Truthful to the deterministic formula in StorageProvider.
 */
export const READINESS_SCORE_EXPLANATION =
  'Readiness is calculated from open production risks, pending research questions, unscheduled scenes, and task completion progress.';
