export type AllowedWorkflowMode = 'AGENTIC_GOOGLE_ADK' | 'LOCAL_SIMULATION';

export interface ModeValidationResult {
  valid: boolean;
  mode?: AllowedWorkflowMode;
  errorCode?: string;
  errorMessage?: string;
}

export interface RuntimeReadinessResult {
  ready: boolean;
  runtimeMode: string;
  researchProviderReady: boolean;
  errorCode?: string;
  errorMessage?: string;
}

/**
 * Validates the requested workflow mode string from API requests.
 * Defaults absent/empty mode to 'AGENTIC_GOOGLE_ADK' for safe backward compatibility,
 * which will subsequently undergo fail-closed readiness checks.
 */
export function validateRequestedWorkflowMode(mode?: unknown): ModeValidationResult {
  if (mode === undefined || mode === null || mode === '') {
    return { valid: true, mode: 'AGENTIC_GOOGLE_ADK' };
  }

  if (typeof mode === 'string') {
    const trimmed = mode.trim();
    if (trimmed === 'AGENTIC_GOOGLE_ADK' || trimmed === 'LOCAL_SIMULATION') {
      return { valid: true, mode: trimmed as AllowedWorkflowMode };
    }
  }

  return {
    valid: false,
    errorCode: 'INVALID_WORKFLOW_MODE',
    errorMessage: 'Invalid workflow mode provided.'
  };
}

/**
 * Evaluates whether the backend runtime is genuinely ready for live AGENTIC_GOOGLE_ADK execution.
 * Fail-closed requirement:
 * 1. runtimeMode === 'GOOGLE_ADK_VERTEX_AI'
 * 2. researchProviderReady === true (PARALLEL_API_KEY configured)
 */
export function evaluateWorkflowRuntimeReadiness(
  runtimeMode: string,
  isParallelConfigured: boolean
): RuntimeReadinessResult {
  const researchProviderReady = Boolean(isParallelConfigured);
  const isVertex = runtimeMode === 'GOOGLE_ADK_VERTEX_AI';
  const ready = isVertex && researchProviderReady;

  if (!ready) {
    return {
      ready: false,
      runtimeMode,
      researchProviderReady,
      errorCode: 'LIVE_RUNTIME_NOT_READY',
      errorMessage: 'Live AI Crew runtime is not ready.'
    };
  }

  return {
    ready: true,
    runtimeMode,
    researchProviderReady
  };
}

/**
 * Single pure helper function to guard a workflow start request.
 */
export function guardWorkflowStart(
  requestedMode: unknown,
  runtimeMode: string,
  isParallelConfigured: boolean
): {
  allowed: boolean;
  statusCode?: number;
  responseBody?: Record<string, unknown>;
  resolvedMode?: AllowedWorkflowMode;
} {
  const modeValidation = validateRequestedWorkflowMode(requestedMode);
  if (!modeValidation.valid) {
    return {
      allowed: false,
      statusCode: 400,
      responseBody: {
        error: modeValidation.errorMessage || 'Invalid workflow mode provided.',
        code: modeValidation.errorCode || 'INVALID_WORKFLOW_MODE'
      }
    };
  }

  const targetMode = modeValidation.mode!;

  if (targetMode === 'AGENTIC_GOOGLE_ADK') {
    const readiness = evaluateWorkflowRuntimeReadiness(runtimeMode, isParallelConfigured);
    if (!readiness.ready) {
      return {
        allowed: false,
        statusCode: 503,
        responseBody: {
          error: readiness.errorMessage || 'Live AI Crew runtime is not ready.',
          code: readiness.errorCode || 'LIVE_RUNTIME_NOT_READY',
          runtimeMode: readiness.runtimeMode,
          researchProviderReady: readiness.researchProviderReady
        }
      };
    }
  }

  return {
    allowed: true,
    resolvedMode: targetMode
  };
}
