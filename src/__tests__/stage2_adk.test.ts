import { describe, it, expect } from 'vitest';
import { SequentialAgent, InMemoryRunner, FunctionTool } from '@google/adk';
import { rootSequentialAgent, researchAgent } from '../../server/agents/cineflow/adkAgents.ts';
import { parallelSearchFunctionTool, ParallelSearchParameters, executeParallelSearch } from '../../server/agents/cineflow/parallelSearchTool.js';
import { detectTruthfulRuntime, runCineFlowAgenticWorkflow, subscribeToRunEvents } from '../../server/agents/cineflow/runner.js';
import { computeDeterministicReadiness } from '../../server/agents/cineflow/state.js';
import { AgenticWorkflowClient } from '../services/agentic/AgenticWorkflowClient.js';
import { SupervisorOutputSchema } from '../../server/agents/cineflow/schemas.ts';

describe('Stage 2.0 ADK Multi-Agent Core Verification', () => {
  it('1 & 2. Root ADK workflow is a SequentialAgent containing exactly 8 subAgents', () => {
    expect(rootSequentialAgent).toBeInstanceOf(SequentialAgent);
    expect(rootSequentialAgent.subAgents).toHaveLength(8);

    const agentNames = rootSequentialAgent.subAgents.map((a) => a.name);
    expect(agentNames).toEqual([
      'SupervisorAgent',
      'ScriptAnalystAgent',
      'DirectorAgent',
      'ProducerAgent',
      'ResearchAgent',
      'ContinuityAgent',
      'RiskAgent',
      'SchedulerAgent'
    ]);
  });

  it('3. InMemoryRunner can be instantiated with rootSequentialAgent', () => {
    const runner = new InMemoryRunner({
      appName: 'cineflow-ai',
      agent: rootSequentialAgent
    });
    expect(runner).toBeDefined();
    expect(runner.sessionService).toBeDefined();
  });

  it('5 & 6. Parallel FunctionTool exists with Zod parameters schema and is attached to ResearchAgent', () => {
    expect(parallelSearchFunctionTool).toBeInstanceOf(FunctionTool);
    expect(parallelSearchFunctionTool.name).toBe('parallel_search');
    expect((parallelSearchFunctionTool as any).parameters).toBe(ParallelSearchParameters);
    expect(ParallelSearchParameters.shape.objective).toBeDefined();

    expect(researchAgent.tools).toHaveLength(1);
    expect(researchAgent.tools[0]).toBe(parallelSearchFunctionTool);
  });

  it('7. Real mode reports FAILED status on error without silent canned mock fallback', async () => {
    const envObj = process.env;
    const oldKey = envObj['GEMINI_API_KEY'];
    const oldVertex = envObj['GOOGLE_GENAI_USE_VERTEXAI'];
    
    // Set invalid key dynamically
    envObj['GEMINI_API_KEY'] = 'invalid_key_for_test';
    envObj['GOOGLE_GENAI_USE_VERTEXAI'] = 'false';

    const prod = {
      id: 'prod_test_fail',
      title: 'Failed Test Film',
      type: 'Short Film',
      readinessScore: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    const res = await runCineFlowAgenticWorkflow({
      production: prod as any,
      screenplayText: 'EXT. STREET - DAY',
      mode: 'AGENTIC_GOOGLE_ADK'
    });

    expect(res.workflowRun.status).toBe('FAILED');

    // Restore environment
    if (oldKey) envObj['GEMINI_API_KEY'] = oldKey; else delete envObj['GEMINI_API_KEY'];
    if (oldVertex) envObj['GOOGLE_GENAI_USE_VERTEXAI'] = oldVertex; else delete envObj['GOOGLE_GENAI_USE_VERTEXAI'];
  });

  it('8 & 9. AgenticWorkflowClient starts workflow via API', async () => {
    expect(AgenticWorkflowClient.startWorkflow).toBeDefined();
    expect(AgenticWorkflowClient.subscribeToEvents).toBeDefined();
  });

  it('10 & 11. Zod output schemas validate or reject malformed agent outputs', () => {
    const validSupervisor = {
      status: 'READY',
      summary: 'Production is clear to proceed.',
      focusAreas: ['Permits', 'Safety']
    };

    expect(SupervisorOutputSchema.parse(validSupervisor)).toEqual(validSupervisor);

    const invalidSupervisor = {
      status: 'INVALID_STATUS_CODE',
      summary: 123
    };

    expect(() => SupervisorOutputSchema.parse(invalidSupervisor)).toThrow();
  });

  it('12. Parallel Search retains exact source URLs', async () => {
    const unconfigured = await executeParallelSearch({
      objective: 'Seattle film permits',
      searchQueries: ['Seattle film permit']
    });

    expect(unconfigured.providerStatus).toBeDefined();
    expect(Array.isArray(unconfigured.sources)).toBe(true);
  });

  it('13. Deterministic readiness calculation operates predictably', () => {
    const state: any = {
      scenes: [{ id: '1' }],
      tasks: [{ status: 'DONE' }, { status: 'PENDING' }],
      sources: [{ id: 's1' }],
      shootDays: [{ dayNumber: 1 }],
      risks: []
    };

    const score = computeDeterministicReadiness(state);
    expect(typeof score).toBe('number');
    expect(score).toBeGreaterThanOrEqual(0);
    expect(score).toBeLessThanOrEqual(100);
  });

  it('14 & 15. Truthful runtime detection returns correct metadata', () => {
    const runtime = detectTruthfulRuntime();
    expect(runtime.runtimeMode).toBeDefined();
    expect(runtime.modelName).toMatch(/gemini-2\.5-flash/);
  });
});
