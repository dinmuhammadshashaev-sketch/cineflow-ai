import {
  AgentRole,
  WorkflowRun,
  AgentActivity,
  WorkflowToolActivity
} from '../types';
import { WorkflowEvent } from '../services/agentic/AgenticWorkflowClient';

export interface PipelineRoleDefinition {
  id: number;
  role: AgentRole;
  shortName: string;
  title: string;
  agentName: string;
  responsibility: string;
  iconName: string;
  avatarColor: string;
}

export const CINEFLOW_AGENT_PIPELINE: PipelineRoleDefinition[] = [
  {
    id: 1,
    role: 'Supervisor',
    shortName: 'Supervisor',
    title: 'Executive Production Supervisor',
    agentName: 'SupervisorAgent',
    responsibility: 'Creates the production strategy and supervises crew execution.',
    iconName: 'ShieldAlert',
    avatarColor: '#f59e0b'
  },
  {
    id: 2,
    role: 'Script Analyst',
    shortName: 'Script',
    title: 'Master Script Analyst',
    agentName: 'ScriptAnalystAgent',
    responsibility: 'Breaks the screenplay into structured scenes, characters and props.',
    iconName: 'FileText',
    avatarColor: '#3b82f6'
  },
  {
    id: 3,
    role: 'Director',
    shortName: 'Director',
    title: 'Creative Vision Director',
    agentName: 'DirectorAgent',
    responsibility: 'Adds creative vision, complexity and scene dependencies.',
    iconName: 'Clapperboard',
    avatarColor: '#ec4899'
  },
  {
    id: 4,
    role: 'Producer',
    shortName: 'Producer',
    title: 'Lead Line Producer',
    agentName: 'ProducerAgent',
    responsibility: 'Converts the breakdown into actionable production tasks.',
    iconName: 'Briefcase',
    avatarColor: '#10b981'
  },
  {
    id: 5,
    role: 'Research',
    shortName: 'Research',
    title: 'Grounded Research Lead',
    agentName: 'ResearchAgent',
    responsibility: 'Investigates real-world permits, regulations and production constraints.',
    iconName: 'Search',
    avatarColor: '#8b5cf6'
  },
  {
    id: 6,
    role: 'Continuity',
    shortName: 'Continuity',
    title: 'Script Supervisor & Continuity',
    agentName: 'ContinuityAgent',
    responsibility: 'Detects cross-scene continuity conflicts.',
    iconName: 'Eye',
    avatarColor: '#06b6d4'
  },
  {
    id: 7,
    role: 'Risk',
    shortName: 'Risk',
    title: 'Safety & Risk Auditor',
    agentName: 'RiskAgent',
    responsibility: 'Evaluates safety, legal and operational production risks.',
    iconName: 'AlertTriangle',
    avatarColor: '#ef4444'
  },
  {
    id: 8,
    role: 'Scheduler',
    shortName: 'Scheduler',
    title: 'Call Sheet & Schedule Optimizer',
    agentName: 'SchedulerAgent',
    responsibility: 'Builds the final optimized shoot-day plan.',
    iconName: 'Calendar',
    avatarColor: '#84cc16'
  }
];

export type AgentStageStatus = 'WAITING' | 'RUNNING' | 'COMPLETED' | 'FAILED';

export interface AgentStageState {
  roleDef: PipelineRoleDefinition;
  status: AgentStageStatus;
  activity?: AgentActivity;
  toolActivity?: WorkflowToolActivity;
  durationMs?: number;
  actionSummary?: string;
  resultDetails?: string;
  providerName?: string;
  modelName?: string;
}

/**
 * Normalizes role string variations (e.g. "Director Agent" => "Director")
 */
export function normalizeAgentRole(roleStr?: string): AgentRole | undefined {
  if (!roleStr) return undefined;
  const raw = roleStr.trim().toLowerCase();
  if (raw.includes('supervisor')) return 'Supervisor';
  if (raw.includes('script')) return 'Script Analyst';
  if (raw.includes('director')) return 'Director';
  if (raw.includes('producer')) return 'Producer';
  if (raw.includes('research')) return 'Research';
  if (raw.includes('continuity')) return 'Continuity';
  if (raw.includes('risk')) return 'Risk';
  if (raw.includes('scheduler')) return 'Scheduler';
  return undefined;
}

/**
 * Derives state for all 8 pipeline roles truthfully from WorkflowRun
 */
export function getAgentPipelineState(workflowRun: WorkflowRun | null | undefined): AgentStageState[] {
  const activities = workflowRun?.activities || [];
  const toolActivities = workflowRun?.toolActivities || [];
  const currentRoleNormalized = normalizeAgentRole(workflowRun?.currentAgentRole);

  return CINEFLOW_AGENT_PIPELINE.map((roleDef) => {
    // Find matching activities for this role
    const matchingActs = activities.filter(
      (a) => normalizeAgentRole(a.agentRole) === roleDef.role
    );
    const latestAct = matchingActs.length > 0 ? matchingActs[matchingActs.length - 1] : undefined;

    // Find matching tool activities
    const matchingToolActs = toolActivities.filter(
      (t) => normalizeAgentRole(t.agentRole) === roleDef.role
    );
    const latestToolAct = matchingToolActs.length > 0 ? matchingToolActs[matchingToolActs.length - 1] : undefined;

    let status: AgentStageStatus = 'WAITING';

    if (latestAct) {
      if (latestAct.status === 'COMPLETED' || latestAct.status === 'WARNING') {
        status = 'COMPLETED';
      } else if (latestAct.status === 'FAILED') {
        status = 'FAILED';
      } else if (latestAct.status === 'RUNNING') {
        status = 'RUNNING';
      } else {
        status = 'WAITING';
      }
    } else if (workflowRun?.status === 'RUNNING' && currentRoleNormalized === roleDef.role) {
      status = 'RUNNING';
    }

    return {
      roleDef,
      status,
      activity: latestAct,
      toolActivity: latestToolAct,
      durationMs: latestAct?.durationMs,
      actionSummary: latestAct?.actionSummary,
      resultDetails: latestAct?.resultDetails,
      providerName: latestAct?.providerName,
      modelName: latestAct?.modelName
    };
  });
}

/**
 * Calculates workflow progress percentage strictly against denominator 8.
 * Progress = (completedRoles / 8) * 100
 * Never shows 100% unless all 8 required roles are completed.
 */
export function getWorkflowProgress(workflowRun: WorkflowRun | null | undefined): number {
  if (!workflowRun) return 0;
  const stages = getAgentPipelineState(workflowRun);
  const completedCount = stages.filter((s) => s.status === 'COMPLETED').length;
  if (completedCount >= 8) return 100;
  return (completedCount / 8) * 100;
}

/**
 * Returns the currently running agent pipeline definition if any
 */
export function getCurrentAgent(workflowRun: WorkflowRun | null | undefined): PipelineRoleDefinition | null {
  const stages = getAgentPipelineState(workflowRun);
  const running = stages.find((s) => s.status === 'RUNNING');
  if (running) return running.roleDef;

  const currentRoleNorm = normalizeAgentRole(workflowRun?.currentAgentRole);
  if (currentRoleNorm) {
    const found = CINEFLOW_AGENT_PIPELINE.find((p) => p.role === currentRoleNorm);
    if (found) return found;
  }
  return null;
}

/**
 * Returns the failed agent pipeline definition if any
 */
export function getFailedAgent(workflowRun: WorkflowRun | null | undefined): PipelineRoleDefinition | null {
  const stages = getAgentPipelineState(workflowRun);
  const failed = stages.find((s) => s.status === 'FAILED');
  return failed ? failed.roleDef : null;
}

/**
 * Gets Parallel tool activity state if present in WorkflowRun
 */
export function getParallelToolState(workflowRun: WorkflowRun | null | undefined): WorkflowToolActivity | null {
  if (!workflowRun || !workflowRun.toolActivities) return null;
  const found = workflowRun.toolActivities.find(
    (t) => t.toolName.toLowerCase().includes('parallel')
  );
  return found || null;
}

/**
 * Pure helper for merging WorkflowEvents into WorkflowRun in frontend state.
 * Preserves existing toolActivities without erasing them when evt.run is received.
 */
export function mergeWorkflowEventIntoRun(
  currentRun: WorkflowRun,
  event: WorkflowEvent
): WorkflowRun {
  let updatedRun: WorkflowRun = { ...currentRun };

  if (event.run) {
    // Preserve toolActivities from currentRun if event.run has none
    const existingToolActs = currentRun.toolActivities || [];
    const eventToolActs = event.run.toolActivities || [];

    updatedRun = {
      ...event.run,
      toolActivities: eventToolActs.length > 0 ? eventToolActs : existingToolActs
    };
  }

  if (event.type === 'WORKFLOW_COMPLETED') {
    updatedRun.status = 'COMPLETED';
    updatedRun.completedAt = event.timestamp || new Date().toISOString();
  } else if (event.type === 'WORKFLOW_FAILED') {
    updatedRun.status = 'FAILED';
    updatedRun.completedAt = event.timestamp || new Date().toISOString();
  }

  const toolActivities: WorkflowToolActivity[] = [...(updatedRun.toolActivities || [])];
  const toolName = event.toolName || (event.details?.toolName as string);

  if (event.type === 'TOOL_STARTED' && toolName) {
    const normRole = normalizeAgentRole(event.agentRole as string);
    const existingIdx = toolActivities.findIndex(
      (t) => t.toolName === toolName && t.status === 'RUNNING'
    );

    const newActivity: WorkflowToolActivity = {
      id: `tool_${toolName}_${Date.now()}`,
      toolName,
      agentRole: normRole,
      status: 'RUNNING',
      provider: typeof event.details?.provider === 'string' ? event.details.provider : undefined,
      summary: event.summary,
      timestamp: event.timestamp || new Date().toISOString()
    };

    if (existingIdx >= 0) {
      toolActivities[existingIdx] = { ...toolActivities[existingIdx], ...newActivity };
    } else {
      toolActivities.push(newActivity);
    }
    updatedRun.toolActivities = toolActivities;
  } else if (event.type === 'TOOL_COMPLETED' && toolName) {
    const runningIdx = toolActivities.findIndex(
      (t) => t.toolName === toolName && t.status === 'RUNNING'
    );

    const rawQueries = event.details?.searchQueries || event.details?.queries;
    const rawQueryCount = typeof event.details?.queryCount === 'number'
      ? event.details.queryCount
      : Array.isArray(rawQueries) ? rawQueries.length : undefined;

    const rawResultCount = typeof event.details?.resultCount === 'number'
      ? event.details.resultCount
      : typeof event.details?.sourcesCount === 'number'
      ? event.details.sourcesCount
      : Array.isArray(event.details?.sources) ? event.details.sources.length : undefined;

    const rawDomains = Array.isArray(event.details?.domains)
      ? event.details.domains.filter((d): d is string => typeof d === 'string')
      : undefined;

    const metrics = {
      status: 'COMPLETED' as const,
      completedAt: event.timestamp || new Date().toISOString(),
      durationMs: typeof event.details?.durationMs === 'number' ? event.details.durationMs : undefined,
      queryCount: rawQueryCount,
      resultCount: rawResultCount,
      domains: rawDomains,
      provider: typeof event.details?.provider === 'string' ? event.details.provider : undefined,
      summary: event.summary || (runningIdx >= 0 ? toolActivities[runningIdx].summary : undefined)
    };

    if (runningIdx >= 0) {
      toolActivities[runningIdx] = { ...toolActivities[runningIdx], ...metrics };
    } else {
      const normRole = normalizeAgentRole(event.agentRole as string);
      toolActivities.push({
        id: `tool_${toolName}_${Date.now()}`,
        toolName,
        agentRole: normRole,
        timestamp: event.timestamp || new Date().toISOString(),
        ...metrics
      });
    }
    updatedRun.toolActivities = toolActivities;
  }

  return updatedRun;
}

export interface WorkflowRuntimePresentation {
  modeLabel: string;
  badgeText: string;
  isPreparing: boolean;
  claimsLive: boolean;
  claimsLocal: boolean;
  claimsParallel: boolean;
  statusText: string;
}

export function getWorkflowRuntimePresentation(
  workflowRun: WorkflowRun | null | undefined
): WorkflowRuntimePresentation {
  if (!workflowRun) {
    return {
      modeLabel: 'PREPARING AI CREW',
      badgeText: 'PREPARING AI CREW • 8 AGENTS WAITING • STARTING WORKFLOW...',
      isPreparing: true,
      claimsLive: false,
      claimsLocal: false,
      claimsParallel: false,
      statusText: 'STARTING WORKFLOW...'
    };
  }

  if (workflowRun.mode === 'AGENTIC_GOOGLE_ADK') {
    return {
      modeLabel: 'LIVE — GOOGLE ADK + VERTEX AI',
      badgeText: 'LIVE — GOOGLE ADK + VERTEX AI',
      isPreparing: false,
      claimsLive: true,
      claimsLocal: false,
      claimsParallel: false,
      statusText: `Workflow Run ${workflowRun.id}`
    };
  }

  return {
    modeLabel: 'LOCAL DEMO — SIMULATION — NO LIVE AI PROVIDERS',
    badgeText: 'LOCAL DEMO — SIMULATION — NO LIVE AI PROVIDERS',
    isPreparing: false,
    claimsLive: false,
    claimsLocal: true,
    claimsParallel: false,
    statusText: `Workflow Run ${workflowRun.id}`
  };
}

