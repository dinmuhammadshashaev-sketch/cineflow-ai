import { Production, WorkflowRun } from '../../types';
import { AgenticWorkflowClient } from '../agentic/AgenticWorkflowClient';
import { storage } from '../storage/StorageProvider';
import { mergeWorkflowEventIntoRun } from '../../lib/pipeline';

export type RequestedWorkflowMode =
  | 'AGENTIC_GOOGLE_ADK'
  | 'LOCAL_SIMULATION'
  | 'AUTO';

export function resolveWorkflowMode(
  requestedMode: RequestedWorkflowMode = 'AUTO',
  settingsAiProviderType?: string
): 'AGENTIC_GOOGLE_ADK' | 'LOCAL_SIMULATION' {
  if (requestedMode === 'AGENTIC_GOOGLE_ADK') {
    return 'AGENTIC_GOOGLE_ADK';
  }
  if (requestedMode === 'LOCAL_SIMULATION') {
    return 'LOCAL_SIMULATION';
  }
  return settingsAiProviderType === 'gemini'
    ? 'AGENTIC_GOOGLE_ADK'
    : 'LOCAL_SIMULATION';
}

export class AiManager {
  public async runScriptBreakdownWorkflow(
    production: Production,
    onProgress?: (runUpdate: WorkflowRun) => void,
    requestedMode: RequestedWorkflowMode = 'AUTO'
  ): Promise<WorkflowRun> {
    const settings = storage.getSettings();
    const mode = resolveWorkflowMode(requestedMode, settings.aiProviderType);

    try {
      // 1. Call POST /api/agentic-workflow/start to get runId immediately
      const startResult = await AgenticWorkflowClient.startWorkflow(
        production,
        production.scriptText || '',
        mode
      );

      let currentRun: WorkflowRun = startResult.workflowRun;
      if (onProgress) onProgress(currentRun);

      // 2. Subscribe to SSE events for real-time progress updates
      return new Promise((resolve) => {
        const cleanup = AgenticWorkflowClient.subscribeToEvents(
          startResult.runId,
          (evt) => {
            currentRun = mergeWorkflowEventIntoRun(currentRun, evt);

            // 1. PERSIST FIRST! Save production & run state before UI notification
            if (evt.production) {
              storage.saveAgenticWorkflowResult(evt.production, currentRun);
            } else {
              storage.saveWorkflowRun(currentRun);
            }

            // 2. ONLY THEN NOTIFY UI!
            if (onProgress) onProgress(currentRun);

            // 3. TERMINAL CLEANUP & RESOLUTION
            if (evt.type === 'WORKFLOW_COMPLETED' || evt.type === 'WORKFLOW_FAILED') {
              cleanup();
              resolve(currentRun);
            }
          },
          (err) => {
            console.warn('AgenticWorkflowClient SSE stream ended or errored:', err);
            cleanup();
            if (currentRun.status === 'RUNNING') {
              currentRun = {
                ...currentRun,
                status: 'FAILED',
                completedAt: new Date().toISOString()
              };
              storage.saveWorkflowRun(currentRun);
              if (onProgress) onProgress(currentRun);
            }
            resolve(currentRun);
          }
        );
      });
    } catch (err: any) {
      console.error('Backend ADK workflow invocation failed:', err);
      // DO NOT silently fall back to local simulation! Return failed run state.
      const failedRun: WorkflowRun = {
        id: `wfr_fail_${Date.now()}`,
        productionId: production.id,
        mode,
        status: 'FAILED',
        startedAt: new Date().toISOString(),
        completedAt: new Date().toISOString(),
        activities: [
          {
            id: `act_err_${Date.now()}`,
            agentRole: 'Supervisor',
            agentName: 'System',
            status: 'FAILED',
            actionSummary: `Workflow failed: ${err?.message || 'Server connection or execution error'}`,
            timestamp: new Date().toLocaleTimeString()
          }
        ]
      };
      storage.saveWorkflowRun(failedRun);
      if (onProgress) onProgress(failedRun);
      return failedRun;
    }
  }
}

export const aiManager = new AiManager();
