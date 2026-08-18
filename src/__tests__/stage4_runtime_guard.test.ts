import { describe, it, expect } from 'vitest';
import {
  validateRequestedWorkflowMode,
  evaluateWorkflowRuntimeReadiness,
  guardWorkflowStart
} from '../../server/workflowRuntimeGuard';

describe('Stage 4.1.2 Fail-Closed Live Runtime Contract Tests', () => {
  it('1. AGENTIC + Vertex runtime ready + Parallel ready => ALLOW', () => {
    const res = guardWorkflowStart('AGENTIC_GOOGLE_ADK', 'GOOGLE_ADK_VERTEX_AI', true);
    expect(res.allowed).toBe(true);
    expect(res.resolvedMode).toBe('AGENTIC_GOOGLE_ADK');
  });

  it('2. AGENTIC + LOCAL_SIMULATION runtime => REJECT (503 LIVE_RUNTIME_NOT_READY)', () => {
    const res = guardWorkflowStart('AGENTIC_GOOGLE_ADK', 'LOCAL_SIMULATION', true);
    expect(res.allowed).toBe(false);
    expect(res.statusCode).toBe(503);
    expect(res.responseBody?.code).toBe('LIVE_RUNTIME_NOT_READY');
    expect(res.responseBody?.runtimeMode).toBe('LOCAL_SIMULATION');
    expect(res.responseBody?.researchProviderReady).toBe(true);
  });

  it('3. AGENTIC + Gemini Developer API runtime => REJECT (hackathon live path is Vertex)', () => {
    const res = guardWorkflowStart('AGENTIC_GOOGLE_ADK', 'GOOGLE_ADK_GEMINI_DEVELOPER_API', true);
    expect(res.allowed).toBe(false);
    expect(res.statusCode).toBe(503);
    expect(res.responseBody?.code).toBe('LIVE_RUNTIME_NOT_READY');
    expect(res.responseBody?.runtimeMode).toBe('GOOGLE_ADK_GEMINI_DEVELOPER_API');
  });

  it('4. AGENTIC + Vertex ready + Parallel unconfigured => REJECT', () => {
    const res = guardWorkflowStart('AGENTIC_GOOGLE_ADK', 'GOOGLE_ADK_VERTEX_AI', false);
    expect(res.allowed).toBe(false);
    expect(res.statusCode).toBe(503);
    expect(res.responseBody?.code).toBe('LIVE_RUNTIME_NOT_READY');
    expect(res.responseBody?.researchProviderReady).toBe(false);
  });

  it('5. LOCAL_SIMULATION + Vertex ready => ALLOW LOCAL', () => {
    const res = guardWorkflowStart('LOCAL_SIMULATION', 'GOOGLE_ADK_VERTEX_AI', true);
    expect(res.allowed).toBe(true);
    expect(res.resolvedMode).toBe('LOCAL_SIMULATION');
  });

  it('6. LOCAL_SIMULATION + Vertex unavailable => ALLOW LOCAL', () => {
    const res = guardWorkflowStart('LOCAL_SIMULATION', 'LOCAL_SIMULATION', false);
    expect(res.allowed).toBe(true);
    expect(res.resolvedMode).toBe('LOCAL_SIMULATION');
  });

  it('7. invalid workflow mode => HTTP-equivalent validation failure / INVALID_WORKFLOW_MODE', () => {
    const invalidModes = ['INVALID_MODE', 'gemini', 'LOCAL', 123, true, {}];
    for (const badMode of invalidModes) {
      const modeVal = validateRequestedWorkflowMode(badMode);
      expect(modeVal.valid).toBe(false);
      expect(modeVal.errorCode).toBe('INVALID_WORKFLOW_MODE');

      const res = guardWorkflowStart(badMode, 'GOOGLE_ADK_VERTEX_AI', true);
      expect(res.allowed).toBe(false);
      expect(res.statusCode).toBe(400);
      expect(res.responseBody?.code).toBe('INVALID_WORKFLOW_MODE');
      expect(res.responseBody?.error).toBe('Invalid workflow mode provided.');
    }
  });

  it('8. rejected live request cannot resolve to LOCAL_SIMULATION', () => {
    const res = guardWorkflowStart('AGENTIC_GOOGLE_ADK', 'LOCAL_SIMULATION', false);
    expect(res.allowed).toBe(false);
    expect(res.resolvedMode).toBeUndefined();
  });

  it('9. accepted live mode remains AGENTIC_GOOGLE_ADK', () => {
    const res = guardWorkflowStart('AGENTIC_GOOGLE_ADK', 'GOOGLE_ADK_VERTEX_AI', true);
    expect(res.allowed).toBe(true);
    expect(res.resolvedMode).toBe('AGENTIC_GOOGLE_ADK');
  });

  it('10. accepted local mode remains LOCAL_SIMULATION', () => {
    const res = guardWorkflowStart('LOCAL_SIMULATION', 'GOOGLE_ADK_VERTEX_AI', true);
    expect(res.allowed).toBe(true);
    expect(res.resolvedMode).toBe('LOCAL_SIMULATION');
  });

  it('11. guard exposes no secret values', () => {
    const res1 = guardWorkflowStart('AGENTIC_GOOGLE_ADK', 'LOCAL_SIMULATION', false);
    const res2 = guardWorkflowStart('INVALID', 'LOCAL_SIMULATION', false);

    const jsonStr = JSON.stringify([res1, res2]);
    expect(jsonStr).not.toContain('AIza');
    expect(jsonStr).not.toContain('PARALLEL_API_KEY');
    expect(jsonStr).not.toContain('GEMINI_API_KEY');
    expect(jsonStr).not.toContain('Bearer');
    expect(jsonStr).not.toContain('GOOGLE_CLOUD_PROJECT');
  });

  it('12. default/absent mode defaults to AGENTIC_GOOGLE_ADK and undergoes fail-closed check', () => {
    const modeVal = validateRequestedWorkflowMode(undefined);
    expect(modeVal.valid).toBe(true);
    expect(modeVal.mode).toBe('AGENTIC_GOOGLE_ADK');

    // If absent when runtime is not ready, guardWorkflowStart fails closed
    const resUnready = guardWorkflowStart(undefined, 'LOCAL_SIMULATION', false);
    expect(resUnready.allowed).toBe(false);
    expect(resUnready.statusCode).toBe(503);

    // If absent when runtime is ready, guardWorkflowStart passes with AGENTIC_GOOGLE_ADK
    const resReady = guardWorkflowStart(undefined, 'GOOGLE_ADK_VERTEX_AI', true);
    expect(resReady.allowed).toBe(true);
    expect(resReady.resolvedMode).toBe('AGENTIC_GOOGLE_ADK');
  });
});
