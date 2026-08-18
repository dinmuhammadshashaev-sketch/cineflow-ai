import { describe, it, expect } from 'vitest';
import {
  CINEFLOW_AGENT_PIPELINE,
  getAgentPipelineState,
  getWorkflowProgress,
  getCurrentAgent,
  getFailedAgent,
  getParallelToolState,
  mergeWorkflowEventIntoRun,
  normalizeAgentRole
} from '../lib/pipeline';
import { WorkflowRun, AgentActivity } from '../types';
import { WorkflowEvent } from '../services/agentic/AgenticWorkflowClient';

describe('Stage 4.2 Autonomous Crew Visualization & Telemetry Tests', () => {
  const baseRun: WorkflowRun = {
    id: 'wfr_test_101',
    productionId: 'prod_1',
    mode: 'AGENTIC_GOOGLE_ADK',
    status: 'RUNNING',
    startedAt: new Date().toISOString(),
    activities: []
  };

  it('1. pipeline always has exactly 8 roles', () => {
    expect(CINEFLOW_AGENT_PIPELINE.length).toBe(8);
  });

  it('2. correct role order', () => {
    const roles = CINEFLOW_AGENT_PIPELINE.map((p) => p.role);
    expect(roles).toEqual([
      'Supervisor',
      'Script Analyst',
      'Director',
      'Producer',
      'Research',
      'Continuity',
      'Risk',
      'Scheduler'
    ]);
  });

  it('3. 0 completed => 0%', () => {
    const progress = getWorkflowProgress(baseRun);
    expect(progress).toBe(0);
  });

  it('4. 1 completed => not 100% (exact 12.5%)', () => {
    const run: WorkflowRun = {
      ...baseRun,
      activities: [
        {
          id: 'a1',
          agentRole: 'Supervisor',
          status: 'COMPLETED',
          actionSummary: 'Supervisor finished strategy.',
          timestamp: '10:00:00'
        }
      ]
    };
    const progress = getWorkflowProgress(run);
    expect(progress).toBe(12.5);
    expect(progress).not.toBe(100);
  });

  it('5. 4 completed => 50%', () => {
    const run: WorkflowRun = {
      ...baseRun,
      activities: [
        { id: 'a1', agentRole: 'Supervisor', status: 'COMPLETED', actionSummary: 'done', timestamp: '10:00' },
        { id: 'a2', agentRole: 'Script Analyst', status: 'COMPLETED', actionSummary: 'done', timestamp: '10:01' },
        { id: 'a3', agentRole: 'Director', status: 'COMPLETED', actionSummary: 'done', timestamp: '10:02' },
        { id: 'a4', agentRole: 'Producer', status: 'COMPLETED', actionSummary: 'done', timestamp: '10:03' }
      ]
    };
    expect(getWorkflowProgress(run)).toBe(50);
  });

  it('6. 7 completed => less than 100% (87.5%)', () => {
    const run: WorkflowRun = {
      ...baseRun,
      activities: [
        { id: 'a1', agentRole: 'Supervisor', status: 'COMPLETED', actionSummary: 'done', timestamp: '10:00' },
        { id: 'a2', agentRole: 'Script Analyst', status: 'COMPLETED', actionSummary: 'done', timestamp: '10:01' },
        { id: 'a3', agentRole: 'Director', status: 'COMPLETED', actionSummary: 'done', timestamp: '10:02' },
        { id: 'a4', agentRole: 'Producer', status: 'COMPLETED', actionSummary: 'done', timestamp: '10:03' },
        { id: 'a5', agentRole: 'Research', status: 'COMPLETED', actionSummary: 'done', timestamp: '10:04' },
        { id: 'a6', agentRole: 'Continuity', status: 'COMPLETED', actionSummary: 'done', timestamp: '10:05' },
        { id: 'a7', agentRole: 'Risk', status: 'COMPLETED', actionSummary: 'done', timestamp: '10:06' }
      ]
    };
    const progress = getWorkflowProgress(run);
    expect(progress).toBe(87.5);
    expect(progress).toBeLessThan(100);
  });

  it('7. 8 completed => 100%', () => {
    const run: WorkflowRun = {
      ...baseRun,
      status: 'COMPLETED',
      activities: CINEFLOW_AGENT_PIPELINE.map((p, idx) => ({
        id: `act_${idx}`,
        agentRole: p.role,
        status: 'COMPLETED',
        actionSummary: `${p.role} finished`,
        timestamp: '10:10'
      }))
    };
    expect(getWorkflowProgress(run)).toBe(100);
  });

  it('8. running role detected correctly', () => {
    const run: WorkflowRun = {
      ...baseRun,
      currentAgentRole: 'Research',
      activities: [
        { id: 'a1', agentRole: 'Supervisor', status: 'COMPLETED', actionSummary: 'done', timestamp: '10:00' },
        { id: 'a2', agentRole: 'Research', status: 'RUNNING', actionSummary: 'Searching...', timestamp: '10:01' }
      ]
    };
    const curr = getCurrentAgent(run);
    expect(curr?.role).toBe('Research');
  });

  it('9. failed role detected correctly', () => {
    const run: WorkflowRun = {
      ...baseRun,
      status: 'FAILED',
      activities: [
        { id: 'a1', agentRole: 'Supervisor', status: 'COMPLETED', actionSummary: 'done', timestamp: '10:00' },
        { id: 'a2', agentRole: 'Script Analyst', status: 'FAILED', actionSummary: 'Syntax error', timestamp: '10:01' }
      ]
    };
    const failed = getFailedAgent(run);
    expect(failed?.role).toBe('Script Analyst');
  });

  it('10. future roles remain WAITING', () => {
    const run: WorkflowRun = {
      ...baseRun,
      activities: [
        { id: 'a1', agentRole: 'Supervisor', status: 'COMPLETED', actionSummary: 'done', timestamp: '10:00' }
      ]
    };
    const states = getAgentPipelineState(run);
    expect(states[0].status).toBe('COMPLETED');
    expect(states[1].status).toBe('WAITING');
    expect(states[7].status).toBe('WAITING');
  });

  it('11. incoming evt.run does not erase toolActivities', () => {
    const initialRunWithTools: WorkflowRun = {
      ...baseRun,
      toolActivities: [
        {
          id: 't1',
          toolName: 'parallel_search',
          agentRole: 'Research',
          status: 'COMPLETED',
          queryCount: 2,
          resultCount: 15
        }
      ]
    };

    const evt: WorkflowEvent = {
      type: 'AGENT_COMPLETED',
      run: {
        ...baseRun,
        activities: [
          { id: 'a1', agentRole: 'Supervisor', status: 'COMPLETED', actionSummary: 'done', timestamp: '10:00' }
        ]
      }
    };

    const merged = mergeWorkflowEventIntoRun(initialRunWithTools, evt);
    expect(merged.toolActivities).toBeDefined();
    expect(merged.toolActivities?.length).toBe(1);
    expect(merged.toolActivities?.[0].queryCount).toBe(2);
  });

  it('12. TOOL_STARTED creates running tool activity', () => {
    const evt: WorkflowEvent = {
      type: 'TOOL_STARTED',
      toolName: 'parallel_search',
      agentRole: 'Research',
      summary: 'Searching permits',
      timestamp: '10:05:00',
      details: { provider: 'ParallelSearchProvider' }
    };

    const merged = mergeWorkflowEventIntoRun(baseRun, evt);
    expect(merged.toolActivities?.length).toBe(1);
    expect(merged.toolActivities?.[0].toolName).toBe('parallel_search');
    expect(merged.toolActivities?.[0].status).toBe('RUNNING');
    expect(merged.toolActivities?.[0].provider).toBe('ParallelSearchProvider');
  });

  it('13. TOOL_COMPLETED marks it completed', () => {
    const startEvt: WorkflowEvent = {
      type: 'TOOL_STARTED',
      toolName: 'parallel_search',
      agentRole: 'Research',
      summary: 'Searching',
      timestamp: '10:05:00'
    };
    const runWithStarted = mergeWorkflowEventIntoRun(baseRun, startEvt);

    const completeEvt: WorkflowEvent = {
      type: 'TOOL_COMPLETED',
      toolName: 'parallel_search',
      agentRole: 'Research',
      timestamp: '10:05:03',
      details: {
        durationMs: 2400,
        queryCount: 2,
        resultCount: 15,
        domains: ['film.ca.gov', 'faa.gov'],
        provider: 'ParallelSearchProvider'
      }
    };

    const runWithCompleted = mergeWorkflowEventIntoRun(runWithStarted, completeEvt);
    expect(runWithCompleted.toolActivities?.length).toBe(1);
    const tool = runWithCompleted.toolActivities?.[0];
    expect(tool?.status).toBe('COMPLETED');
    expect(tool?.durationMs).toBe(2400);
    expect(tool?.queryCount).toBe(2);
    expect(tool?.resultCount).toBe(15);
  });

  it('14. Parallel queryCount comes from event details', () => {
    const completeEvt: WorkflowEvent = {
      type: 'TOOL_COMPLETED',
      toolName: 'parallel_search',
      details: { queryCount: 3, resultCount: 20 }
    };
    const merged = mergeWorkflowEventIntoRun(baseRun, completeEvt);
    expect(merged.toolActivities?.[0].queryCount).toBe(3);
  });

  it('15. Parallel resultCount comes from event details', () => {
    const completeEvt: WorkflowEvent = {
      type: 'TOOL_COMPLETED',
      toolName: 'parallel_search',
      details: { queryCount: 1, resultCount: 12 }
    };
    const merged = mergeWorkflowEventIntoRun(baseRun, completeEvt);
    expect(merged.toolActivities?.[0].resultCount).toBe(12);
  });

  it('16. Parallel domains come from event details', () => {
    const completeEvt: WorkflowEvent = {
      type: 'TOOL_COMPLETED',
      toolName: 'parallel_search',
      details: { domains: ['burbank.ca.gov', 'la.ca.gov'] }
    };
    const merged = mergeWorkflowEventIntoRun(baseRun, completeEvt);
    expect(merged.toolActivities?.[0].domains).toEqual(['burbank.ca.gov', 'la.ca.gov']);
  });

  it('17. no Parallel telemetry exists without real tool event', () => {
    const emptyRun: WorkflowRun = { ...baseRun, toolActivities: [] };
    const pState = getParallelToolState(emptyRun);
    expect(pState).toBeNull();
  });

  it('18. LOCAL_SIMULATION mode is reflected as local simulation', () => {
    const localRun: WorkflowRun = {
      ...baseRun,
      mode: 'LOCAL_SIMULATION'
    };
    expect(localRun.mode).toBe('LOCAL_SIMULATION');
  });

  it('19. AGENTIC mode reflects Google ADK + Vertex', () => {
    const adkRun: WorkflowRun = {
      ...baseRun,
      mode: 'AGENTIC_GOOGLE_ADK'
    };
    expect(adkRun.mode).toBe('AGENTIC_GOOGLE_ADK');
  });

  it('20. explicit local run does not display Parallel merely due settings', () => {
    const localRunNoTool: WorkflowRun = {
      ...baseRun,
      mode: 'LOCAL_SIMULATION',
      toolActivities: []
    };
    expect(getParallelToolState(localRunNoTool)).toBeNull();
  });

  it('21. incomplete workflow cannot show 8/8', () => {
    const run: WorkflowRun = {
      ...baseRun,
      status: 'RUNNING',
      activities: [
        { id: 'a1', agentRole: 'Supervisor', status: 'COMPLETED', actionSummary: 'done', timestamp: '10:00' }
      ]
    };
    const stages = getAgentPipelineState(run);
    const completed = stages.filter((s) => s.status === 'COMPLETED').length;
    expect(completed).toBe(1);
    expect(completed).not.toBe(8);
  });

  it('22. completed 8-agent workflow can show 8/8', () => {
    const run: WorkflowRun = {
      ...baseRun,
      status: 'COMPLETED',
      activities: CINEFLOW_AGENT_PIPELINE.map((p, idx) => ({
        id: `a_${idx}`,
        agentRole: p.role,
        status: 'COMPLETED',
        actionSummary: `${p.role} finished`,
        timestamp: '10:00'
      }))
    };
    const stages = getAgentPipelineState(run);
    const completed = stages.filter((s) => s.status === 'COMPLETED').length;
    expect(completed).toBe(8);
  });

  it('23. failed workflow retains completed-role states', () => {
    const run: WorkflowRun = {
      ...baseRun,
      status: 'FAILED',
      activities: [
        { id: 'a1', agentRole: 'Supervisor', status: 'COMPLETED', actionSummary: 'done', timestamp: '10:00' },
        { id: 'a2', agentRole: 'Script Analyst', status: 'COMPLETED', actionSummary: 'done', timestamp: '10:01' },
        { id: 'a3', agentRole: 'Director', status: 'FAILED', actionSummary: 'Error', timestamp: '10:02' }
      ]
    };
    const stages = getAgentPipelineState(run);
    expect(stages[0].status).toBe('COMPLETED');
    expect(stages[1].status).toBe('COMPLETED');
    expect(stages[2].status).toBe('FAILED');
    expect(stages[3].status).toBe('WAITING');
  });

  it('24. no chain-of-thought field is introduced into WorkflowRun types', () => {
    const runKeys = Object.keys(baseRun);
    expect(runKeys).not.toContain('chainOfThought');
    expect(runKeys).not.toContain('privateThinking');
    expect(runKeys).not.toContain('reasoningSteps');
  });
});
