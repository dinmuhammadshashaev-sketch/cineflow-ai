import { Production, WorkflowRun, ExecutionMode } from '../../types';

export interface WorkflowEvent {
  type:
    | 'WORKFLOW_STARTED'
    | 'AGENT_STARTED'
    | 'TOOL_STARTED'
    | 'TOOL_COMPLETED'
    | 'AGENT_COMPLETED'
    | 'AGENT_FAILED'
    | 'WORKFLOW_COMPLETED'
    | 'WORKFLOW_FAILED'
    | 'STATUS'
    | 'HEARTBEAT';
  agentRole?: string;
  toolName?: string;
  summary?: string;
  timestamp?: string;
  details?: any;
  run?: WorkflowRun;
  production?: Production;
}

export class AgenticWorkflowClient {
  /**
   * Starts the multi-agent workflow on the backend server via POST /api/agentic-workflow/start
   * Returns immediately with runId (202 Accepted) without waiting for workflow completion.
   */
  static async startWorkflow(
    production: Production,
    scriptText: string,
    mode: ExecutionMode = 'AGENTIC_GOOGLE_ADK'
  ): Promise<{ runId: string; status: string; workflowRun: WorkflowRun }> {
    const response = await fetch('/api/agentic-workflow/start', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        production,
        scriptText,
        mode
      })
    });

    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      throw new Error(errData.error || `Failed to start workflow (HTTP ${response.status})`);
    }

    const data = await response.json();
    return {
      runId: data.runId,
      status: data.status,
      workflowRun: data.workflowRun
    };
  }

  /**
   * Connects to the SSE stream at /api/agentic-workflow/:runId/events
   */
  static subscribeToEvents(
    runId: string,
    onEvent: (event: WorkflowEvent) => void,
    onError?: (err: any) => void
  ): () => void {
    const sseUrl = `/api/agentic-workflow/${runId}/events`;
    const eventSource = new EventSource(sseUrl);

    eventSource.onmessage = (e) => {
      try {
        const parsed: WorkflowEvent = JSON.parse(e.data);
        onEvent(parsed);

        if (parsed.type === 'WORKFLOW_COMPLETED' || parsed.type === 'WORKFLOW_FAILED') {
          eventSource.close();
        }
      } catch (err) {
        console.warn('Error parsing SSE event data:', err);
      }
    };

    eventSource.onerror = (err) => {
      console.warn('SSE EventSource error for runId', runId, err);
      if (onError) onError(err);
      eventSource.close();
    };

    return () => {
      eventSource.close();
    };
  }

  /**
   * Queries the workflow run status via GET /api/agentic-workflow/:runId
   */
  static async getWorkflowStatus(
    runId: string
  ): Promise<{ run: WorkflowRun; production?: Production; readinessScore?: number }> {
    const response = await fetch(`/api/agentic-workflow/${runId}`);
    if (!response.ok) {
      throw new Error(`Failed to fetch workflow status (HTTP ${response.status})`);
    }
    return await response.json();
  }
}
