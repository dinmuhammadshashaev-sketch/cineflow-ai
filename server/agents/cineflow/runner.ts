import { InMemoryRunner } from '@google/adk';
import {
  Production,
  WorkflowRun,
  WorkflowActivity,
  AgentRole,
  ActivityStatus,
  Source
} from '../../../src/types/index.js';
import { getProviderStatus, CINEFLOW_GEMINI_MODEL } from './config.js';
import { rootSequentialAgent } from './adkAgents.js';
import { executeParallelSearch } from './parallelSearchTool.js';
import { CineFlowAgentState, computeDeterministicReadiness } from './state.js';
import {
  SupervisorOutputSchema,
  ScriptAnalystOutputSchema,
  DirectorOutputSchema,
  ProducerOutputSchema,
  ResearchOutputSchema,
  ContinuityOutputSchema,
  RiskOutputSchema,
  SchedulerOutputSchema
} from './schemas.js';
import {
  parseAgentOutput,
  mapScriptOutputToScenes,
  mapScriptOutputToCharacters,
  mapScriptOutputToProps,
  createInitialResearchQuestions,
  mapProducerOutputToTasks,
  updateResearchQuestionsWithFindings,
  mapContinuityOutputToIssues,
  mapRiskOutputToRisks,
  mapSchedulerOutputToShootDays
} from './mappers.js';

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
  agentRole?: AgentRole;
  toolName?: string;
  summary?: string;
  timestamp?: string;
  details?: Record<string, unknown>;
  run?: WorkflowRun;
  production?: Production;
}

export type EventCallback = (event: WorkflowEvent) => void;

interface RunEntry {
  run: WorkflowRun;
  state: CineFlowAgentState;
  eventsHistory: WorkflowEvent[];
  subscribers: Set<(event: WorkflowEvent) => void>;
}

const activeRunMap = new Map<string, RunEntry>();

export function getWorkflowRun(runId: string): RunEntry | undefined {
  return activeRunMap.get(runId);
}

export function subscribeToRunEvents(runId: string, callback: (event: WorkflowEvent) => void): () => void {
  const entry = activeRunMap.get(runId);
  if (!entry) return () => {};

  entry.eventsHistory.forEach(evt => callback(evt));
  entry.subscribers.add(callback);
  return () => {
    entry.subscribers.delete(callback);
  };
}

/**
 * Case-insensitive environment variable boolean parser
 */
export function envFlag(...names: string[]): boolean {
  for (const name of names) {
    const raw = process.env[name];
    if (!raw) continue;
    const value = raw.trim().toLowerCase();
    if (['true', '1', 'yes', 'on'].includes(value)) return true;
    if (['false', '0', 'no', 'off'].includes(value)) return false;
  }
  return false;
}

/**
 * Normalizes runtime detection using normalized environment boolean checks
 */
export function detectTruthfulRuntime(): {
  runtimeMode: 'GOOGLE_ADK_GEMINI_DEVELOPER_API' | 'GOOGLE_ADK_VERTEX_AI' | 'LOCAL_SIMULATION';
  modelName: string;
  project?: string;
  location?: string;
} {
  const useVertex = envFlag('GOOGLE_GENAI_USE_VERTEXAI', 'GOOGLE_GENAI_USE_ENTERPRISE');
  const hasProject = Boolean(process.env.GOOGLE_CLOUD_PROJECT || process.env.GOOGLE_CLOUD_PROJECT_ID);
  const isVertex = useVertex && hasProject;
  const isDevApi = Boolean(process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== 'MY_GEMINI_API_KEY');

  if (isVertex) {
    return {
      runtimeMode: 'GOOGLE_ADK_VERTEX_AI',
      modelName: CINEFLOW_GEMINI_MODEL,
      project: process.env.GOOGLE_CLOUD_PROJECT || process.env.GOOGLE_CLOUD_PROJECT_ID,
      location: process.env.GOOGLE_CLOUD_LOCATION || 'global'
    };
  } else if (isDevApi) {
    return {
      runtimeMode: 'GOOGLE_ADK_GEMINI_DEVELOPER_API',
      modelName: CINEFLOW_GEMINI_MODEL
    };
  }

  return {
    runtimeMode: 'LOCAL_SIMULATION',
    modelName: 'local-simulation'
  };
}

const AGENT_NAME_TO_ROLE: Record<string, AgentRole> = {
  SupervisorAgent: 'Supervisor',
  ScriptAnalystAgent: 'Script Analyst',
  DirectorAgent: 'Director',
  ProducerAgent: 'Producer',
  ResearchAgent: 'Research',
  ContinuityAgent: 'Continuity',
  RiskAgent: 'Risk',
  SchedulerAgent: 'Scheduler'
};

export async function runCineFlowAgenticWorkflow(options: {
  runId?: string;
  production: Production;
  screenplayText: string;
  mode?: 'AGENTIC_GOOGLE_ADK' | 'LOCAL_SIMULATION';
  onEvent?: EventCallback;
}): Promise<{
  production: Production;
  workflowRun: WorkflowRun;
  state: CineFlowAgentState;
  adkInfo?: {
    inMemoryRunnerStarted: boolean;
    runAsyncStarted: boolean;
    sequentialAgentStarted: boolean;
  };
}> {
  const runId = options.runId || `wfr_adk_${Date.now()}`;
  const runtimeInfo = detectTruthfulRuntime();
  const isRealAdk = options.mode !== 'LOCAL_SIMULATION' && runtimeInfo.runtimeMode !== 'LOCAL_SIMULATION';

  const activities: WorkflowActivity[] = [];
  const eventsHistory: WorkflowEvent[] = [];
  const subscribers = new Set<(event: WorkflowEvent) => void>();

  const currentRun: WorkflowRun = {
    id: runId,
    productionId: options.production.id,
    mode: isRealAdk ? 'AGENTIC_GOOGLE_ADK' : 'LOCAL_SIMULATION',
    status: 'RUNNING',
    startedAt: new Date().toISOString(),
    activities
  };

  const state: CineFlowAgentState = {
    production: options.production,
    screenplayText: options.screenplayText,
    scenes: options.production.scenes || [],
    characters: options.production.characters || [],
    props: options.production.props || [],
    tasks: options.production.tasks || [],
    researchQuestions: options.production.researchQuestions || [],
    sources: options.production.sources || [],
    continuityIssues: options.production.continuityIssues || [],
    risks: options.production.risks || [],
    shootDays: options.production.shootDays || [],
    readinessScore: options.production.readinessScore || 0
  };

  const entry: RunEntry = { run: currentRun, state, eventsHistory, subscribers };
  activeRunMap.set(runId, entry);

  const emit = (evt: WorkflowEvent) => {
    const evtWithRun = { ...evt, run: currentRun };
    eventsHistory.push(evtWithRun);
    if (options.onEvent) options.onEvent(evtWithRun);
    subscribers.forEach(sub => sub(evtWithRun));
  };

  emit({
    type: 'WORKFLOW_STARTED',
    summary: `Workflow ${runId} started in ${isRealAdk ? runtimeInfo.runtimeMode : 'LOCAL_SIMULATION'} mode.`,
    timestamp: new Date().toLocaleTimeString()
  });

  let inMemoryRunnerStarted = false;
  let runAsyncStarted = false;
  let sequentialAgentStarted = false;

  if (isRealAdk) {
    let runner: InMemoryRunner | null = null;
    let session: any = null;
    let currentAgentName = '';
    const agentStartTimes = new Map<string, number>();
    let toolStartTime: number | undefined;

    const processedToolCallIds = new Set<string>();
    const processedToolResponseIds = new Set<string>();

    let workflowError: string | null = null;

    try {
      runner = new InMemoryRunner({
        appName: 'cineflow-ai',
        agent: rootSequentialAgent
      });
      inMemoryRunnerStarted = true;
      sequentialAgentStarted = true;

      session = await runner.sessionService.createSession({
        appName: 'cineflow-ai',
        userId: 'cineflow_user',
        sessionId: runId,
        state: {
          productionTitle: options.production.title,
          screenplayText: options.screenplayText,
          location: options.production.location || 'Seattle, WA'
        }
      });

      emit({
        type: 'STATUS',
        summary: `ADK InMemoryRunner executing SequentialAgent with 8 subAgents on ${runtimeInfo.runtimeMode}...`,
        timestamp: new Date().toLocaleTimeString()
      });

      runAsyncStarted = true;

      for await (const event of runner.runAsync({
        userId: 'cineflow_user',
        sessionId: session.id,
        newMessage: {
          role: 'user',
          parts: [
            {
              text: `Start film production breakdown for "${options.production.title}". Location: "${options.production.location || 'Seattle, WA'}". Screenplay:\n${options.screenplayText}`
            }
          ]
        }
      })) {
        const author = event.author || 'SequentialAgent';

        if (event.errorCode) {
          // 1. Finalize previous completed agent if author is different
          if (currentAgentName && currentAgentName !== author && agentStartTimes.has(currentAgentName)) {
            const prevRole = AGENT_NAME_TO_ROLE[currentAgentName];
            const startTime = agentStartTimes.get(currentAgentName)!;
            const durationMs = Date.now() - startTime;
            if (prevRole) {
              const actIdx = activities.findIndex(a => a.agentRole === prevRole);
              if (actIdx >= 0) {
                activities[actIdx].status = 'COMPLETED';
                activities[actIdx].durationMs = durationMs;
              }
              emit({
                type: 'AGENT_COMPLETED',
                agentRole: prevRole,
                summary: `ADK LlmAgent "${currentAgentName}" completed execution (${durationMs}ms).`,
                timestamp: new Date().toLocaleTimeString(),
                details: {
                  durationMs,
                  provider: runtimeInfo.runtimeMode,
                  modelName: runtimeInfo.modelName
                }
              });
            }
          }

          // 2. Identify failing agent and ensure AGENT_STARTED is emitted first if not already started
          const failingRole = AGENT_NAME_TO_ROLE[author] || (author.replace('Agent', '') as AgentRole);

          if (author && author !== 'CineFlowProductionCrew' && !agentStartTimes.has(author)) {
            currentAgentName = author;
            agentStartTimes.set(author, Date.now());

            const existingAct = activities.find(a => a.agentRole === failingRole);
            if (existingAct) {
              existingAct.status = 'RUNNING';
            } else {
              activities.push({
                id: `act_${failingRole}_${Date.now()}`,
                agentRole: failingRole,
                agentName: author,
                actionSummary: `ADK LlmAgent "${author}" analyzing script on ${runtimeInfo.runtimeMode}...`,
                executionMode: 'gemini',
                providerName: `GOOGLE ADK (${runtimeInfo.runtimeMode})`,
                status: 'RUNNING',
                timestamp: new Date().toLocaleTimeString()
              });
            }

            currentRun.currentAgentRole = failingRole;

            emit({
              type: 'AGENT_STARTED',
              agentRole: failingRole,
              summary: `ADK LlmAgent "${author}" started reasoning...`,
              timestamp: new Date().toLocaleTimeString()
            });
          }

          // 3. Mark failing agent activity FAILED and emit AGENT_FAILED
          const actIdx = activities.findIndex(a => a.agentRole === failingRole);
          if (actIdx >= 0) {
            activities[actIdx].status = 'FAILED';
            activities[actIdx].actionSummary = `Agent failed (${event.errorCode}): ${event.errorMessage}`;
          } else {
            activities.push({
              id: `act_${failingRole}_${Date.now()}`,
              agentRole: failingRole,
              agentName: author,
              actionSummary: `Agent failed (${event.errorCode}): ${event.errorMessage}`,
              executionMode: 'gemini',
              providerName: `GOOGLE ADK (${runtimeInfo.runtimeMode})`,
              status: 'FAILED',
              timestamp: new Date().toLocaleTimeString()
            });
          }

          emit({
            type: 'AGENT_FAILED',
            agentRole: failingRole,
            summary: `ADK LlmAgent "${author}" failed (${event.errorCode}): ${event.errorMessage}`,
            timestamp: new Date().toLocaleTimeString(),
            details: {
              agentName: author,
              provider: runtimeInfo.runtimeMode,
              modelName: runtimeInfo.modelName,
              errorCode: event.errorCode,
              error: event.errorMessage
            }
          });

          throw new Error(`ADK Agent "${author}" error (${event.errorCode}): ${event.errorMessage}`);
        }

        if (author && author !== currentAgentName && author !== 'CineFlowProductionCrew') {
          // Complete previous agent activity if exists
          if (currentAgentName && agentStartTimes.has(currentAgentName)) {
            const prevRole = AGENT_NAME_TO_ROLE[currentAgentName];
            const startTime = agentStartTimes.get(currentAgentName)!;
            const durationMs = Date.now() - startTime;
            if (prevRole) {
              const actIdx = activities.findIndex(a => a.agentRole === prevRole);
              if (actIdx >= 0) {
                activities[actIdx].status = 'COMPLETED';
                activities[actIdx].durationMs = durationMs;
              }
              emit({
                type: 'AGENT_COMPLETED',
                agentRole: prevRole,
                summary: `ADK LlmAgent "${currentAgentName}" completed execution (${durationMs}ms).`,
                timestamp: new Date().toLocaleTimeString(),
                details: {
                  durationMs,
                  provider: runtimeInfo.runtimeMode,
                  modelName: runtimeInfo.modelName
                }
              });
            }
          }

          currentAgentName = author;
          agentStartTimes.set(author, Date.now());
          const role = AGENT_NAME_TO_ROLE[author] || (author.replace('Agent', '') as AgentRole);

          const existingAct = activities.find(a => a.agentRole === role);
          if (existingAct) {
            existingAct.status = 'RUNNING';
          } else {
            activities.push({
              id: `act_${role}_${Date.now()}`,
              agentRole: role,
              agentName: author,
              actionSummary: `ADK LlmAgent "${author}" analyzing script on ${runtimeInfo.runtimeMode}...`,
              executionMode: 'gemini',
              providerName: `GOOGLE ADK (${runtimeInfo.runtimeMode})`,
              status: 'RUNNING',
              timestamp: new Date().toLocaleTimeString()
            });
          }

          currentRun.currentAgentRole = role;

          emit({
            type: 'AGENT_STARTED',
            agentRole: role,
            summary: `ADK LlmAgent "${author}" started reasoning...`,
            timestamp: new Date().toLocaleTimeString()
          });
        }

        // Check for function tool calls (Deduplicated using stable IDs)
        if (event.content?.parts) {
          for (const part of event.content.parts as Array<{ functionCall?: { id?: string; name?: string; args?: Record<string, unknown> }; functionResponse?: { id?: string; name?: string; response?: Record<string, unknown> } }>) {
            if (part.functionCall) {
              const fnCall = part.functionCall;
              const callId = fnCall.id || `${event.id}_${fnCall.name || 'parallel_search'}`;
              if (!processedToolCallIds.has(callId)) {
                processedToolCallIds.add(callId);
                toolStartTime = Date.now();
                emit({
                  type: 'TOOL_STARTED',
                  agentRole: 'Research',
                  toolName: fnCall.name || 'parallel_search',
                  summary: `ADK ResearchAgent invoked FunctionTool "${fnCall.name}" with queries: ${JSON.stringify(fnCall.args?.searchQueries || fnCall.args?.objective || '')}`,
                  timestamp: new Date().toLocaleTimeString()
                });
              }
            }
            if (part.functionResponse) {
              const fnResp = part.functionResponse;
              const respId = fnResp.id || `${event.id}_${fnResp.name || 'parallel_search'}`;
              if (!processedToolResponseIds.has(respId)) {
                processedToolResponseIds.add(respId);
                const fnData = fnResp.response || {};
                const durationMs = toolStartTime ? Date.now() - toolStartTime : 0;

                emit({
                  type: 'TOOL_COMPLETED',
                  agentRole: 'Research',
                  toolName: fnResp.name || 'parallel_search',
                  summary: `ADK FunctionTool "${fnResp.name}" returned ${fnData.sourcesCount || 0} real sources (${durationMs}ms).`,
                  timestamp: new Date().toLocaleTimeString(),
                  details: {
                    toolName: fnResp.name,
                    startedAt: toolStartTime ? new Date(toolStartTime).toISOString() : undefined,
                    completedAt: new Date().toISOString(),
                    durationMs,
                    queryCount: fnData.rawQueryCount || 1,
                    resultCount: fnData.sourcesCount || 0,
                    domains: Array.isArray(fnData.sources) ? fnData.sources.map((s: { domain?: string }) => s.domain) : [],
                    provider: 'Parallel',
                    status: fnData.status || 'SUCCESS'
                  }
                });

                if (Array.isArray(fnData.sources) && fnData.sources.length > 0) {
                  fnData.sources.forEach((s: Record<string, unknown>) => {
                    const sUrl = typeof s.url === 'string' ? s.url : '';
                    if (sUrl && !state.sources.some(existing => existing.url === sUrl)) {
                      state.sources.push({
                        id: typeof s.id === 'string' ? s.id : `src_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
                        title: typeof s.title === 'string' ? s.title : 'Web Search Source',
                        domain: typeof s.domain === 'string' ? s.domain : 'web',
                        url: sUrl,
                        retrievedDate: typeof s.retrievedDate === 'string' ? s.retrievedDate : new Date().toISOString(),
                        evidenceSummary: typeof s.evidenceSummary === 'string' ? s.evidenceSummary : '',
                        isDemoMock: false,
                        qualityTag: (s.qualityTag === 'OFFICIAL' || s.qualityTag === 'INDUSTRY' || s.qualityTag === 'SECONDARY') ? s.qualityTag : 'INDUSTRY'
                      });
                    }
                  });
                }
              }
            }
          }
        }
      }

      // Mark final agent completed if reached normal loop end
      if (currentAgentName && agentStartTimes.has(currentAgentName)) {
        const finalRole = AGENT_NAME_TO_ROLE[currentAgentName];
        const startTime = agentStartTimes.get(currentAgentName)!;
        const durationMs = Date.now() - startTime;
        if (finalRole) {
          const actIdx = activities.findIndex(a => a.agentRole === finalRole);
          if (actIdx >= 0 && activities[actIdx].status !== 'FAILED') {
            activities[actIdx].status = 'COMPLETED';
            activities[actIdx].durationMs = durationMs;
          }
          emit({
            type: 'AGENT_COMPLETED',
            agentRole: finalRole,
            summary: `ADK LlmAgent "${currentAgentName}" completed execution (${durationMs}ms).`,
            timestamp: new Date().toLocaleTimeString(),
            details: {
              durationMs,
              provider: runtimeInfo.runtimeMode,
              modelName: runtimeInfo.modelName
            }
          });
        }
      }
    } catch (err: any) {
      workflowError = err?.message || String(err);
      console.error('ADK Workflow Error:', workflowError);
    } finally {
      // Retrieve session state regardless of whether runAsync succeeded or threw
      if (session?.id && runner) {
        try {
          const sessionData = await runner.sessionService.getSession({
            appName: 'cineflow-ai',
            userId: 'cineflow_user',
            sessionId: session.id
          });

          const sessionState = sessionData?.state || {};

          // 1. Supervisor Output
          if (sessionState.supervisor_output) {
            try {
              const validated = parseAgentOutput(sessionState.supervisor_output, SupervisorOutputSchema, 'SupervisorAgent');
              state.supervisorSummary = validated.summary;
              const act = activities.find(a => a.agentRole === 'Supervisor');
              if (act) {
                act.actionSummary = validated.summary;
                act.resultDetails = `Focus Areas: ${validated.focusAreas.join(', ')}`;
                if (act.status !== 'FAILED') act.status = 'COMPLETED';
              }
            } catch (e) {
              console.warn('Could not parse supervisor_output:', e);
            }
          }

          // 2. Script Analyst Output
          if (sessionState.script_analysis) {
            try {
              const validated = parseAgentOutput(sessionState.script_analysis, ScriptAnalystOutputSchema, 'ScriptAnalystAgent');
              state.scenes = mapScriptOutputToScenes(validated, options.production.id);
              state.characters = mapScriptOutputToCharacters(validated, options.production.id, state.scenes);
              state.props = mapScriptOutputToProps(validated, options.production.id, state.scenes);
              state.researchQuestions = createInitialResearchQuestions(validated.researchQuestions || [], options.production.id);

              const act = activities.find(a => a.agentRole === 'Script Analyst');
              if (act) {
                act.actionSummary = `Parsed ${state.scenes.length} scenes, ${state.characters.length} characters, ${state.props.length} props.`;
                act.resultDetails = `Extracted ${state.researchQuestions.length} research questions.`;
                if (act.status !== 'FAILED') act.status = 'COMPLETED';
              }
            } catch (e) {
              console.warn('Could not parse script_analysis:', e);
            }
          }

          // 3. Director Output
          if (sessionState.director_output) {
            try {
              const validated = parseAgentOutput(sessionState.director_output, DirectorOutputSchema, 'DirectorAgent');
              state.directorNotes = validated.directorNotes;
              state.creativeComplexity = validated.creativeComplexity;
              const act = activities.find(a => a.agentRole === 'Director');
              if (act) {
                act.actionSummary = validated.directorNotes;
                act.resultDetails = `Complexity: ${validated.creativeComplexity}`;
                if (act.status !== 'FAILED') act.status = 'COMPLETED';
              }
            } catch (e) {
              console.warn('Could not parse director_output:', e);
            }
          }

          // 4. Producer Output
          if (sessionState.producer_output) {
            try {
              const validated = parseAgentOutput(sessionState.producer_output, ProducerOutputSchema, 'ProducerAgent');
              state.tasks = mapProducerOutputToTasks(validated, options.production.id);
              const act = activities.find(a => a.agentRole === 'Producer');
              if (act) {
                act.actionSummary = `Generated ${state.tasks.length} structured production tasks across departments.`;
                act.resultDetails = `Permits required: ${validated.tasks.filter(t => t.permitRequired).length}`;
                if (act.status !== 'FAILED') act.status = 'COMPLETED';
              }
            } catch (e) {
              console.warn('Could not parse producer_output:', e);
            }
          }

          // 5. Research Output (read from raw state key per Requirement 4)
          if (sessionState.research_output_raw) {
            try {
              const validated = parseAgentOutput(sessionState.research_output_raw, ResearchOutputSchema, 'ResearchAgent');
              state.researchQuestions = updateResearchQuestionsWithFindings(state.researchQuestions, validated, state.sources);
              const act = activities.find(a => a.agentRole === 'Research');
              if (act) {
                act.actionSummary = `Grounded ${validated.researchFindings.length} research questions using Parallel Search FunctionTool.`;
                act.resultDetails = `Retrieved ${state.sources.length} authoritative web sources.`;
                if (act.status !== 'FAILED') act.status = 'COMPLETED';
              }
            } catch (e) {
              console.warn('Could not parse research_output_raw:', e);
            }
          }

          // 6. Continuity Output
          if (sessionState.continuity_output) {
            try {
              const validated = parseAgentOutput(sessionState.continuity_output, ContinuityOutputSchema, 'ContinuityAgent');
              state.continuityIssues = mapContinuityOutputToIssues(validated, options.production.id);
              const act = activities.find(a => a.agentRole === 'Continuity');
              if (act) {
                act.actionSummary = `Flagged ${state.continuityIssues.length} continuity issues across wardrobe, props, and timeline.`;
                act.resultDetails = `Critical issues: ${validated.issues.filter(i => i.severity === 'CRITICAL').length}`;
                if (act.status !== 'FAILED') act.status = 'COMPLETED';
              }
            } catch (e) {
              console.warn('Could not parse continuity_output:', e);
            }
          }

          // 7. Risk Output
          if (sessionState.risk_output) {
            try {
              const validated = parseAgentOutput(sessionState.risk_output, RiskOutputSchema, 'RiskAgent');
              state.risks = mapRiskOutputToRisks(validated, options.production.id, state.sources);
              const act = activities.find(a => a.agentRole === 'Risk');
              if (act) {
                act.actionSummary = `Identified ${state.risks.length} production risks grounded in research sources.`;
                act.resultDetails = `High/Critical risks: ${validated.risks.filter(r => r.severity === 'HIGH' || r.severity === 'CRITICAL').length}`;
                if (act.status !== 'FAILED') act.status = 'COMPLETED';
              }
            } catch (e) {
              console.warn('Could not parse risk_output:', e);
            }
          }

          // 8. Scheduler Output
          if (sessionState.schedule_output) {
            try {
              const validated = parseAgentOutput(sessionState.schedule_output, SchedulerOutputSchema, 'SchedulerAgent');
              state.shootDays = mapSchedulerOutputToShootDays(validated, options.production.id, state.scenes);
              const act = activities.find(a => a.agentRole === 'Scheduler');
              if (act) {
                act.actionSummary = `Scheduled ${state.shootDays.length} shoot days with deterministic scene distribution.`;
                act.resultDetails = `Shoot days: ${state.shootDays.length}`;
                if (act.status !== 'FAILED') act.status = 'COMPLETED';
              }
            } catch (e) {
              console.warn('Could not parse schedule_output:', e);
            }
          }
        } catch (sessionErr) {
          console.warn('Could not retrieve ADK session state:', sessionErr);
        }
      }

      const finalReadiness = computeDeterministicReadiness(state);
      state.readinessScore = finalReadiness;

      const updatedProduction: Production = {
        ...options.production,
        scenes: state.scenes,
        characters: state.characters,
        props: state.props,
        tasks: state.tasks,
        researchQuestions: state.researchQuestions,
        sources: state.sources,
        continuityIssues: state.continuityIssues,
        risks: state.risks,
        shootDays: state.shootDays,
        readinessScore: finalReadiness
      };

      state.production = updatedProduction;

      const finalRunStatus: 'COMPLETED' | 'FAILED' = workflowError
        ? 'FAILED'
        : (state.scenes.length > 0 && state.shootDays.length > 0 ? 'COMPLETED' : 'FAILED');

      const completedRun: WorkflowRun = {
        ...currentRun,
        status: finalRunStatus,
        completedAt: new Date().toISOString(),
        activities,
        sources: state.sources
      };

      if (finalRunStatus === 'FAILED') {
        emit({
          type: 'WORKFLOW_FAILED',
          summary: `ADK Workflow execution failed: ${workflowError || 'Incomplete workflow output'}`,
          timestamp: new Date().toLocaleTimeString(),
          details: { error: workflowError || 'Incomplete workflow output' },
          run: completedRun,
          production: updatedProduction
        });
      } else {
        emit({
          type: 'WORKFLOW_COMPLETED',
          summary: `Workflow ${runId} completed with 8/8 agents and readiness score ${finalReadiness}%.`,
          timestamp: new Date().toLocaleTimeString(),
          details: { readinessScore: finalReadiness },
          run: completedRun,
          production: updatedProduction
        });
      }

      activeRunMap.set(runId, { run: completedRun, state, eventsHistory, subscribers });

      return {
        production: updatedProduction,
        workflowRun: completedRun,
        state,
        adkInfo: {
          inMemoryRunnerStarted,
          runAsyncStarted,
          sequentialAgentStarted
        }
      };
    }
  } else {
    // =========================================================================
    // LOCAL SIMULATION MODE (EXPLICIT DEMO/SIMULATION ENGINE)
    // =========================================================================
    activities.push({
      id: `act_sup_${Date.now()}`,
      agentRole: 'Supervisor',
      agentName: 'Sarah Jenkins',
      actionSummary: `Local Simulation: Supervisor initialized setup for "${options.production.title}".`,
      executionMode: 'mock',
      providerName: 'LOCAL SIMULATION / MOCK',
      status: 'COMPLETED',
      timestamp: new Date().toLocaleTimeString()
    });

    state.scenes = [
      {
        id: `sc_${options.production.id}_1`,
        productionId: options.production.id,
        sceneNumber: 1,
        heading: 'EXT. SEATTLE WATERFRONT - NIGHT',
        intExt: 'EXT',
        dayNight: 'NIGHT',
        location: options.production.location || 'Seattle Waterfront',
        summary: 'Opening waterfront sequence requiring permits and drone team.',
        complexity: 'HIGH',
        scheduleStatus: 'UNSCHEDULED',
        characters: ['LEO', 'MAYA'],
        props: ['DUFFEL BAG', 'DRONE'],
        wardrobe: ['RAINCOATS'],
        specialRequirements: ['MUNICIPAL FILM PERMIT', 'FAA DRONE PERMIT'],
        estimatedMinutes: 20
      }
    ];

    state.characters = [
      { id: `char_${options.production.id}_1`, productionId: options.production.id, name: 'LEO', roleType: 'Lead', description: 'Undercover agent', castRequirements: 'Male 30s', sceneCount: 1, sceneNumbers: [1] },
      { id: `char_${options.production.id}_2`, productionId: options.production.id, name: 'MAYA', roleType: 'Supporting', description: 'Drone operator', castRequirements: 'Female 20s', sceneCount: 1, sceneNumbers: [1] }
    ];

    state.props = [
      { id: `prop_${options.production.id}_1`, productionId: options.production.id, name: 'DUFFEL BAG', category: 'General', description: 'Heavy leather bag', fragile: false, sceneNumbers: [1] },
      { id: `prop_${options.production.id}_2`, productionId: options.production.id, name: 'DRONE', category: 'Special Effect / SFX', description: 'Professional drone', fragile: true, sceneNumbers: [1] }
    ];

    activities.push({
      id: `act_script_${Date.now()}`,
      agentRole: 'Script Analyst',
      agentName: 'Marcus Vance',
      actionSummary: 'Parsed 1 scene, 2 characters, 2 props (Local Simulation).',
      executionMode: 'mock',
      providerName: 'LOCAL SIMULATION / MOCK',
      status: 'COMPLETED',
      timestamp: new Date().toLocaleTimeString()
    });

    state.directorNotes = 'Moody noir lighting with high contrast reflections.';
    state.creativeComplexity = 'HIGH';
    activities.push({
      id: `act_dir_${Date.now()}`,
      agentRole: 'Director',
      agentName: 'Elena Rostova',
      actionSummary: state.directorNotes,
      executionMode: 'mock',
      providerName: 'LOCAL SIMULATION / MOCK',
      status: 'COMPLETED',
      timestamp: new Date().toLocaleTimeString()
    });

    state.tasks = [
      {
        id: `task_${options.production.id}_1`,
        productionId: options.production.id,
        title: 'Apply for Municipal Street Use & Filming Permit',
        category: 'Location & Permits',
        priority: 'CRITICAL',
        status: 'TO DO',
        description: 'Submit permit request to local film office',
        createdAt: new Date().toISOString()
      }
    ];
    activities.push({
      id: `act_prod_${Date.now()}`,
      agentRole: 'Producer',
      agentName: 'David Chen',
      actionSummary: 'Generated 1 production task (Local Simulation).',
      executionMode: 'mock',
      providerName: 'LOCAL SIMULATION / MOCK',
      status: 'COMPLETED',
      timestamp: new Date().toLocaleTimeString()
    });

    const mockSources: Source[] = [
      {
        id: `src_sim_${options.production.id}_1`,
        title: `Municipal Film Permits & Rules (${options.production.location || 'Seattle'})`,
        domain: 'film.gov.local',
        url: 'https://film.gov.local/permits-and-regulations',
        retrievedDate: new Date().toISOString().split('T')[0],
        evidenceSummary: 'Local simulation mock source: Film permits required for commercial filming in public right-of-way.',
        isDemoMock: true,
        qualityTag: 'OFFICIAL'
      }
    ];

    state.sources = mockSources;
    state.researchQuestions = [
      {
        id: `rq_sim_${options.production.id}_1`,
        productionId: options.production.id,
        question: `What are the municipal filming permit requirements in ${options.production.location || 'Seattle'}?`,
        importance: 'HIGH',
        status: 'FOUND',
        sourceIds: [mockSources[0].id],
        createdAt: new Date().toISOString(),
        findings: 'Local simulation: Standard municipal filming permits apply for commercial public filming.',
        provider: 'MockResearchProvider'
      }
    ];

    activities.push({
      id: `act_res_${Date.now()}`,
      agentRole: 'Research',
      agentName: 'Dr. Aris Thorne',
      actionSummary: 'Retrieved 1 deterministic mock research source (Local Simulation).',
      executionMode: 'mock',
      providerName: 'LOCAL SIMULATION / MOCK',
      status: 'COMPLETED',
      timestamp: new Date().toLocaleTimeString()
    });

    state.continuityIssues = [
      {
        id: `ci_${options.production.id}_1`,
        productionId: options.production.id,
        title: 'Duffel Bag Zipper Continuity',
        description: 'Verify duffel bag zippers remain consistent.',
        category: 'Prop',
        sceneNumbers: [1],
        severity: 'MEDIUM',
        status: 'OPEN',
        recommendation: 'Prop Master photo log.'
      }
    ];
    activities.push({
      id: `act_cont_${Date.now()}`,
      agentRole: 'Continuity',
      agentName: 'Aisha Patel',
      actionSummary: '1 continuity check logged (Local Simulation).',
      executionMode: 'mock',
      providerName: 'LOCAL SIMULATION / MOCK',
      status: 'COMPLETED',
      timestamp: new Date().toLocaleTimeString()
    });

    state.risks = [
      {
        id: `risk_${options.production.id}_1`,
        productionId: options.production.id,
        title: 'Night Drone Filming Permit',
        description: 'FAA Part 107 and municipal permit needed.',
        severity: 'HIGH',
        sceneNumber: 1,
        reason: 'Airspace & city rules',
        recommendedAction: 'Submit flight plan 10 days early.',
        status: 'OPEN',
        createdAt: new Date().toISOString()
      }
    ];
    activities.push({
      id: `act_risk_${Date.now()}`,
      agentRole: 'Risk',
      agentName: 'Commander Jack Vance',
      actionSummary: '1 risk logged (Local Simulation).',
      executionMode: 'mock',
      providerName: 'LOCAL SIMULATION / MOCK',
      status: 'COMPLETED',
      timestamp: new Date().toLocaleTimeString()
    });

    state.shootDays = [
      {
        id: `sd_${options.production.id}_1`,
        productionId: options.production.id,
        dayNumber: 1,
        date: new Date().toISOString().split('T')[0],
        locationName: options.production.location || 'Seattle Waterfront',
        sceneNumbers: [1],
        dayNightFocus: 'NIGHT',
        estimatedHours: 10,
        notes: 'Wet pavement and drone filming.'
      }
    ];
    activities.push({
      id: `act_sched_${Date.now()}`,
      agentRole: 'Scheduler',
      agentName: 'Tomioka Ken',
      actionSummary: 'Scheduled 1 shoot day (Local Simulation).',
      executionMode: 'mock',
      providerName: 'LOCAL SIMULATION / MOCK',
      status: 'COMPLETED',
      timestamp: new Date().toLocaleTimeString()
    });
  }

  // Calculate deterministic readiness score
  const finalReadiness = computeDeterministicReadiness(state);
  state.readinessScore = finalReadiness;

  const completedRun: WorkflowRun = {
    ...currentRun,
    status: 'COMPLETED',
    completedAt: new Date().toISOString(),
    activities,
    sources: state.sources
  };

  const updatedProduction: Production = {
    ...options.production,
    scenes: state.scenes,
    characters: state.characters,
    props: state.props,
    tasks: state.tasks,
    researchQuestions: state.researchQuestions,
    sources: state.sources,
    continuityIssues: state.continuityIssues,
    risks: state.risks,
    shootDays: state.shootDays,
    readinessScore: finalReadiness
  };

  // Requirement 17: Update state.production at completion before saving/emitting
  state.production = updatedProduction;

  activeRunMap.set(runId, { run: completedRun, state, eventsHistory, subscribers });

  emit({
    type: 'WORKFLOW_COMPLETED',
    summary: `Workflow completed. Readiness score calculated: ${finalReadiness}%`,
    timestamp: new Date().toLocaleTimeString(),
    details: { readinessScore: finalReadiness },
    run: completedRun,
    production: updatedProduction
  });

  return {
    production: updatedProduction,
    workflowRun: completedRun,
    state,
    adkInfo: {
      inMemoryRunnerStarted,
      runAsyncStarted,
      sequentialAgentStarted
    }
  };
}
