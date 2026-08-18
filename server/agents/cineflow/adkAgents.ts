import { LlmAgent, SequentialAgent, zodObjectToSchema, Context, LlmRequest, SingleBeforeModelCallback } from '@google/adk';
import { GenerateContentConfig, FunctionCallingConfigMode } from '@google/genai';
import { CINEFLOW_GEMINI_MODEL } from './config.js';
import { parallelSearchFunctionTool } from './parallelSearchTool.js';
import {
  SupervisorOutputSchema,
  ScriptAnalystOutputSchema,
  DirectorOutputSchema,
  ProducerOutputSchema,
  ContinuityOutputSchema,
  RiskOutputSchema,
  SchedulerOutputSchema
} from './schemas.js';

type ZodAdapterParam = Parameters<typeof zodObjectToSchema>[0];

/**
 * Standard HTTP Retry Configuration for transient errors (429, 500, 502, 503, 504).
 * Capped at 2 total attempts (1 initial + 1 retry) with 2s initial delay, max 8s delay.
 */
export const defaultAgentContentConfig: GenerateContentConfig = {
  httpOptions: {
    retryOptions: {
      attempts: 2,
      initialDelay: 2.0,
      maxDelay: 8.0,
      httpStatusCodes: [429, 500, 502, 503, 504]
    }
  }
};

/**
 * Research Agent Content Config: temperature = 0 with standard HTTP retry policy.
 */
export const researchAgentContentConfig: GenerateContentConfig = {
  temperature: 0,
  httpOptions: {
    retryOptions: {
      attempts: 2,
      initialDelay: 2.0,
      maxDelay: 8.0,
      httpStatusCodes: [429, 500, 502, 503, 504]
    }
  }
};

/**
 * Traffic Pacing Callback:
 * Smooths rapid sequential LLM calls by ensuring a minimum 1.2s delay between model invocations.
 */
let lastModelCallTimestamp = 0;
async function smoothTrafficCallback() {
  const now = Date.now();
  const elapsed = now - lastModelCallTimestamp;
  if (lastModelCallTimestamp > 0 && elapsed < 1200) {
    await new Promise(resolve => setTimeout(resolve, 1200 - elapsed));
  }
  lastModelCallTimestamp = Date.now();
  return undefined;
}

/**
 * ResearchAgent BeforeModel Callback:
 * 1. Ensures traffic pacing delay.
 * 2. Forces deterministic model temperature = 0.
 * 3. On turn 1 (parallelToolCallsUsed < 1): Forces native function calling mode = ANY for parallel_search.
 * 4. On turn 2+ (parallelToolCallsUsed >= 1): Disables function calling (mode = NONE) so model synthesizes findings.
 */
export const researchBeforeModelCallback: SingleBeforeModelCallback = async ({
  context,
  request
}: {
  context: Context;
  request: LlmRequest;
}) => {
  await smoothTrafficCallback();

  const rawUsed = context.state?.get('temp:parallelToolCallsUsed');
  const toolCallsUsed = Number(rawUsed ?? 0);

  if (!request.config) {
    request.config = {};
  }

  request.config.temperature = 0;

  if (toolCallsUsed < 1) {
    request.config.toolConfig = {
      functionCallingConfig: {
        mode: FunctionCallingConfigMode.ANY,
        allowedFunctionNames: ['parallel_search']
      }
    };
  } else {
    request.config.toolConfig = {
      functionCallingConfig: {
        mode: FunctionCallingConfigMode.NONE
      }
    };
  }

  return undefined;
};

// 1. Supervisor Agent
export const supervisorAgent = new LlmAgent({
  name: 'SupervisorAgent',
  model: CINEFLOW_GEMINI_MODEL,
  instruction: `You are the Lead Production Supervisor in CineFlow AI.
Analyze the film setup:
Title: "{productionTitle}"
Location: "{location}"
Screenplay:
{screenplayText}

Establish the supervisor plan and validate screenplay readiness.
Output strict JSON matching schema.`,
  outputKey: 'supervisor_output',
  outputSchema: zodObjectToSchema(SupervisorOutputSchema as ZodAdapterParam),
  generateContentConfig: defaultAgentContentConfig,
  beforeModelCallback: smoothTrafficCallback,
  disallowTransferToParent: true,
  disallowTransferToPeers: true
});

// 2. Script Analyst Agent
export const scriptAnalystAgent = new LlmAgent({
  name: 'ScriptAnalystAgent',
  model: CINEFLOW_GEMINI_MODEL,
  instruction: `You are the Script Analyst Agent.
Analyze the screenplay:
{screenplayText}

Break it down into structured scenes, characters, props, and research questions for filming permits or special rules.
Output strict JSON matching schema.`,
  outputKey: 'script_analysis',
  outputSchema: zodObjectToSchema(ScriptAnalystOutputSchema as ZodAdapterParam),
  generateContentConfig: defaultAgentContentConfig,
  beforeModelCallback: smoothTrafficCallback,
  disallowTransferToParent: true,
  disallowTransferToPeers: true
});

// 3. Director Agent
export const directorAgent = new LlmAgent({
  name: 'DirectorAgent',
  model: CINEFLOW_GEMINI_MODEL,
  instruction: `You are the Director Agent.
Review script analysis from session state {script_analysis}.
Establish creative director vision, complexity, lighting considerations, visual style notes, and scene dependencies.
Output strict JSON matching schema.`,
  outputKey: 'director_output',
  outputSchema: zodObjectToSchema(DirectorOutputSchema as ZodAdapterParam),
  generateContentConfig: defaultAgentContentConfig,
  beforeModelCallback: smoothTrafficCallback,
  disallowTransferToParent: true,
  disallowTransferToPeers: true
});

// 4. Producer Agent
export const producerAgent = new LlmAgent({
  name: 'ProducerAgent',
  model: CINEFLOW_GEMINI_MODEL,
  instruction: `You are the Line Producer Agent.
Review script analysis from {script_analysis} and director notes from {director_output}.
Generate structured production tasks across departments, permit flags, priorities, and budget category estimates.
Output strict JSON matching schema.`,
  outputKey: 'producer_output',
  outputSchema: zodObjectToSchema(ProducerOutputSchema as ZodAdapterParam),
  generateContentConfig: defaultAgentContentConfig,
  beforeModelCallback: smoothTrafficCallback,
  disallowTransferToParent: true,
  disallowTransferToPeers: true
});

// 5. Research Agent (with ADK FunctionTool parallel_search, NO outputSchema per Requirement 4)
export const researchAgent = new LlmAgent({
  name: 'ResearchAgent',
  model: CINEFLOW_GEMINI_MODEL,
  instruction: `You are CineFlow ResearchAgent.

Review the research questions from {script_analysis} and production permit requirements from {producer_output}.

On your first model turn, use the provided native ADK FunctionTool named parallel_search exactly once.

Select at most two consolidated high-value search queries.

Never write or print a function call as text or code.
Never write Python-style or JavaScript-style tool syntax.
Use only the native structured FunctionTool supplied by ADK.

After the FunctionTool response is returned, do not call tools again.

Using the returned real sources, produce ONLY this JSON structure:

{
  "researchFindings": [
    {
      "question": "string",
      "findings": "string",
      "status": "FOUND | FAILED | NOT_NEEDED",
      "sourceIds": ["string"]
    }
  ]
}

Use only source IDs actually returned by parallel_search.
Do not invent source IDs or URLs.`,
  tools: [parallelSearchFunctionTool],
  outputKey: 'research_output_raw',
  generateContentConfig: researchAgentContentConfig,
  beforeModelCallback: researchBeforeModelCallback,
  disallowTransferToParent: true,
  disallowTransferToPeers: true
});

// 6. Continuity Agent
export const continuityAgent = new LlmAgent({
  name: 'ContinuityAgent',
  model: CINEFLOW_GEMINI_MODEL,
  instruction: `You are the Continuity Agent.
Analyze scenes and props from {script_analysis} to identify wardrobe gaps, prop continuity issues, timeline contradictions, or location discrepancies.
Output strict JSON matching schema.`,
  outputKey: 'continuity_output',
  outputSchema: zodObjectToSchema(ContinuityOutputSchema as ZodAdapterParam),
  generateContentConfig: defaultAgentContentConfig,
  beforeModelCallback: smoothTrafficCallback,
  disallowTransferToParent: true,
  disallowTransferToPeers: true
});

// 7. Risk Agent
/**
 * Late-Stage HTTP Retry Configuration for RiskAgent and SchedulerAgent.
 * Provides increased resilience against late-stage 429 quota/capacity exhaustion.
 * Bounded at 4 total attempts with 3s initial delay, max 20s delay, expBase 2.0, jitter 1.0.
 */
export const lateStageAgentContentConfig: GenerateContentConfig = {
  httpOptions: {
    retryOptions: {
      attempts: 4,
      initialDelay: 3.0,
      maxDelay: 20.0,
      expBase: 2.0,
      jitter: 1.0,
      httpStatusCodes: [408, 429, 500, 502, 503, 504]
    }
  }
};

export const riskBeforeModelCallback: SingleBeforeModelCallback = async ({
  context
}: {
  context: Context;
  request: LlmRequest;
}) => {
  await smoothTrafficCallback();

  const applied = context?.state?.get('temp:riskAgentCooldownApplied');
  if (!applied) {
    await new Promise(resolve => setTimeout(resolve, 4000));
    context?.state?.set('temp:riskAgentCooldownApplied', true);
    lastModelCallTimestamp = Date.now();
  }

  return undefined;
};

export const schedulerBeforeModelCallback: SingleBeforeModelCallback = async ({
  context
}: {
  context: Context;
  request: LlmRequest;
}) => {
  await smoothTrafficCallback();

  const applied = context?.state?.get('temp:schedulerAgentCooldownApplied');
  if (!applied) {
    await new Promise(resolve => setTimeout(resolve, 4000));
    context?.state?.set('temp:schedulerAgentCooldownApplied', true);
    lastModelCallTimestamp = Date.now();
  }

  return undefined;
};

export const riskAgent = new LlmAgent({
  name: 'RiskAgent',
  model: CINEFLOW_GEMINI_MODEL,
  instruction: `You are the Risk Assessment Agent.
Review {script_analysis}, {producer_output}, and {research_output_raw}.
Identify legal, safety, environmental, and financial risks. Attach research source IDs where grounded in research.
Output strict JSON matching schema.`,
  outputKey: 'risk_output',
  outputSchema: zodObjectToSchema(RiskOutputSchema as ZodAdapterParam),
  generateContentConfig: lateStageAgentContentConfig,
  beforeModelCallback: riskBeforeModelCallback,
  disallowTransferToParent: true,
  disallowTransferToPeers: true
});

// 8. Scheduler Agent
export const schedulerAgent = new LlmAgent({
  name: 'SchedulerAgent',
  model: CINEFLOW_GEMINI_MODEL,
  instruction: `You are the Production Scheduler Agent.
Review {script_analysis}, {producer_output}, and {risk_output}.
Group scenes into efficient shooting days (ShootDay[]).
Output strict JSON matching schema.`,
  outputKey: 'schedule_output',
  outputSchema: zodObjectToSchema(SchedulerOutputSchema as ZodAdapterParam),
  generateContentConfig: lateStageAgentContentConfig,
  beforeModelCallback: schedulerBeforeModelCallback,
  disallowTransferToParent: true,
  disallowTransferToPeers: true
});

// Root SequentialAgent combining all 8 crew members
export const rootSequentialAgent = new SequentialAgent({
  name: 'CineFlowProductionCrew',
  subAgents: [
    supervisorAgent,
    scriptAnalystAgent,
    directorAgent,
    producerAgent,
    researchAgent,
    continuityAgent,
    riskAgent,
    schedulerAgent
  ]
});
