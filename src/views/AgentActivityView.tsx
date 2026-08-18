import React from 'react';
import {
  Sparkles,
  CheckCircle2,
  Clock,
  AlertTriangle,
  XCircle,
  Loader2,
  ArrowRight,
  Bot,
  Layers,
  Search,
  ShieldAlert,
  Calendar,
  Film,
  Users,
  Clapperboard,
  Briefcase,
  Eye,
  FileText,
  Globe,
  Zap,
  Activity,
  ShieldCheck,
  Check
} from 'lucide-react';
import { Production, WorkflowRun, AgentRole, ActivityStatus, ExecutionMode } from '../types';
import {
  CINEFLOW_AGENT_PIPELINE,
  getAgentPipelineState,
  getWorkflowProgress,
  getCurrentAgent,
  getFailedAgent,
  getParallelToolState,
  getWorkflowRuntimePresentation,
  PipelineRoleDefinition
} from '../lib/pipeline';

interface AgentActivityViewProps {
  production: Production;
  workflowRun: WorkflowRun | null;
  onComplete: () => void;
  onRunLocalSimulation?: () => void;
}

export const AgentActivityView: React.FC<AgentActivityViewProps> = ({
  production,
  workflowRun,
  onComplete,
  onRunLocalSimulation
}) => {
  const pipelineStates = getAgentPipelineState(workflowRun);
  const progressPercent = getWorkflowProgress(workflowRun);
  const currentAgent = getCurrentAgent(workflowRun);
  const failedAgent = getFailedAgent(workflowRun);
  const parallelState = getParallelToolState(workflowRun);
  const presentation = getWorkflowRuntimePresentation(workflowRun);

  const completedCount = pipelineStates.filter((s) => s.status === 'COMPLETED').length;
  const isFinished = workflowRun?.status === 'COMPLETED' && completedCount >= 8;
  const isFailed = workflowRun?.status === 'FAILED';

  const getRoleIcon = (roleName: string) => {
    switch (roleName) {
      case 'Supervisor': return ShieldAlert;
      case 'Script Analyst': return FileText;
      case 'Director': return Clapperboard;
      case 'Producer': return Briefcase;
      case 'Research': return Search;
      case 'Continuity': return Eye;
      case 'Risk': return AlertTriangle;
      case 'Scheduler': return Calendar;
      default: return Bot;
    }
  };

  const getExecutionBadge = (mode?: ExecutionMode, providerName?: string) => {
    switch (mode) {
      case 'gemini':
      case 'AGENTIC_GOOGLE_ADK':
        return (
          <span className="text-[9px] font-mono font-extrabold px-2 py-0.5 rounded bg-purple-500/20 text-purple-300 border border-purple-500/40 uppercase flex items-center gap-1">
            <Sparkles className="w-2.5 h-2.5" />
            {providerName || 'GOOGLE ADK / VERTEX AI'}
          </span>
        );
      case 'parallel':
        return (
          <span className="text-[9px] font-mono font-extrabold px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 uppercase flex items-center gap-1">
            <Globe className="w-2.5 h-2.5" />
            {providerName || 'PARALLEL SEARCH API'}
          </span>
        );
      case 'mock':
      case 'LOCAL_SIMULATION':
      default:
        return (
          <span className="text-[9px] font-mono font-semibold px-2 py-0.5 rounded bg-zinc-800 text-zinc-400 border border-zinc-700 uppercase">
            LOCAL DEMO / SIMULATION
          </span>
        );
    }
  };

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6 pb-16 animate-in fade-in duration-200">
      {/* Top Banner with Runtime Badge & Header */}
      <div className="bg-gradient-to-r from-zinc-900 via-zinc-900 to-zinc-950 border border-zinc-800 rounded-2xl p-6 shadow-2xl space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2 flex-wrap">
              {/* Truthful Mode Badge */}
              {presentation.isPreparing ? (
                <span className="text-[10px] font-mono font-black px-2.5 py-1 rounded-md bg-amber-500/20 text-amber-300 border border-amber-500/40 uppercase tracking-wide flex items-center gap-1.5 shadow-sm">
                  <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
                  PREPARING AI CREW • 8 AGENTS WAITING • STARTING WORKFLOW...
                </span>
              ) : presentation.claimsLive ? (
                <span className="text-[10px] font-mono font-black px-2.5 py-1 rounded-md bg-purple-500/20 text-purple-300 border border-purple-500/40 uppercase tracking-wide flex items-center gap-1.5 shadow-sm">
                  <span className="w-2 h-2 rounded-full bg-purple-400 animate-ping" />
                  LIVE — GOOGLE ADK + VERTEX AI
                </span>
              ) : (
                <span className="text-[10px] font-mono font-black px-2.5 py-1 rounded-md bg-zinc-800 text-zinc-300 border border-zinc-700 uppercase tracking-wide flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-zinc-500" />
                  LOCAL DEMO — SIMULATION — NO LIVE AI PROVIDERS
                </span>
              )}

              <span className="text-[10px] text-zinc-400 font-mono flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                8-Agent Crew
              </span>
            </div>

            <h2 className="text-xl font-black text-white tracking-tight">AUTONOMOUS FILM PRODUCTION CREW</h2>
            <p className="text-xs text-zinc-400 font-mono">
              Target Script: <span className="text-amber-400 font-bold">{production.title}</span> ({production.type})
            </p>
          </div>

          <div className="text-right shrink-0 bg-zinc-950/80 p-3 rounded-xl border border-zinc-800/80">
            <div className="text-2xl font-black text-amber-400 font-mono">
              {progressPercent === 100 ? '100%' : `${progressPercent.toFixed(1)}%`}
            </div>
            <p className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider">
              {completedCount} / 8 AGENTS COMPLETED
            </p>
          </div>
        </div>

        {/* Progress bar */}
        <div className="w-full bg-zinc-950 h-2.5 rounded-full overflow-hidden border border-zinc-800">
          <div
            className="h-full bg-gradient-to-r from-amber-500 to-amber-400 transition-all duration-300"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      {/* 8-Stage Sequential Execution Rail */}
      <div className="bg-zinc-900/90 border border-zinc-800 rounded-2xl p-5 space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-extrabold text-zinc-300 uppercase tracking-wider flex items-center gap-2">
            <Activity className="w-4 h-4 text-amber-400" />
            SEQUENTIAL CREW PIPELINE RAIL (8 STAGES)
          </h3>
          <span className="text-[10px] font-mono text-zinc-500">
            Authoritative Sequential Order
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2">
          {pipelineStates.map((st) => {
            const Icon = getRoleIcon(st.roleDef.role);
            const isRunning = st.status === 'RUNNING';
            const isDone = st.status === 'COMPLETED';
            const isFailedStage = st.status === 'FAILED';

            return (
              <div
                key={st.roleDef.id}
                className={`p-2.5 rounded-xl border text-center flex flex-col items-center justify-between transition-all relative ${
                  isRunning
                    ? 'bg-amber-500/10 border-amber-500/60 shadow-lg shadow-amber-500/10 scale-105 z-10'
                    : isDone
                    ? 'bg-emerald-950/30 border-emerald-500/30 text-emerald-300'
                    : isFailedStage
                    ? 'bg-red-950/30 border-red-500/40 text-red-300'
                    : 'bg-zinc-950/40 border-zinc-800/60 opacity-60 text-zinc-500'
                }`}
              >
                <div className="flex items-center justify-between w-full text-[9px] font-mono font-bold mb-1">
                  <span className={isRunning ? 'text-amber-400' : isDone ? 'text-emerald-400' : 'text-zinc-500'}>
                    0{st.roleDef.id}
                  </span>
                  {isRunning && (
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-ping" />
                  )}
                  {isDone && (
                    <Check className="w-3 h-3 text-emerald-400" />
                  )}
                  {isFailedStage && (
                    <XCircle className="w-3 h-3 text-red-400" />
                  )}
                </div>

                <div className={`p-1.5 rounded-lg my-1 ${
                  isRunning
                    ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40 animate-pulse'
                    : isDone
                    ? 'bg-emerald-500/20 text-emerald-400'
                    : isFailedStage
                    ? 'bg-red-500/20 text-red-400'
                    : 'bg-zinc-900 text-zinc-600'
                }`}>
                  <Icon className="w-4 h-4" />
                </div>

                <span className="text-[10px] font-bold tracking-tight truncate w-full text-zinc-200">
                  {st.roleDef.shortName}
                </span>

                <span className={`text-[8px] font-mono font-extrabold uppercase mt-1 px-1 py-0.2 rounded ${
                  isRunning
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                    : isDone
                    ? 'text-emerald-400'
                    : isFailedStage
                    ? 'text-red-400'
                    : 'text-zinc-600'
                }`}>
                  {st.status}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Current Agent Hero Panel (Shown during RUNNING or when active) */}
      {currentAgent && !isFinished && !isFailed && (
        <div className="bg-gradient-to-r from-amber-950/40 via-zinc-900 to-zinc-950 border border-amber-500/50 rounded-2xl p-5 shadow-xl space-y-3 animate-in fade-in duration-300">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-amber-500/20 border border-amber-500/40 rounded-xl text-amber-400">
                <Loader2 className="w-5 h-5 animate-spin" />
              </div>
              <div>
                <span className="text-[10px] font-mono font-extrabold text-amber-400 uppercase tracking-widest">
                  CURRENT ACTIVE CREW MEMBER
                </span>
                <h3 className="text-base font-extrabold text-white">
                  {currentAgent.agentName} ({currentAgent.role})
                </h3>
              </div>
            </div>

            <span className="text-xs font-mono font-extrabold px-3 py-1 rounded-lg bg-amber-500/20 text-amber-300 border border-amber-500/40 flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 animate-spin" /> RUNNING
            </span>
          </div>

          <p className="text-xs text-zinc-300 bg-zinc-950/70 p-3 rounded-xl border border-zinc-800">
            <strong className="text-amber-400">Operational Responsibility: </strong>
            {currentAgent.responsibility}
          </p>

          {/* Current Agent Hero Metadata */}
          {(() => {
            const activeStageState = pipelineStates.find((st) => st.roleDef.role === currentAgent.role);
            const hasProvider = Boolean(activeStageState?.providerName);
            const hasModel = Boolean(activeStageState?.modelName);
            const hasDuration = typeof activeStageState?.durationMs === 'number' && activeStageState.durationMs > 0;

            if (!hasProvider && !hasModel && !hasDuration) return null;

            return (
              <div className="flex flex-wrap items-center gap-4 text-[10px] font-mono bg-zinc-950/80 p-2.5 rounded-xl border border-zinc-800/80">
                {hasProvider && (
                  <div>
                    <span className="text-zinc-500 font-bold uppercase">PROVIDER: </span>
                    <span className="text-amber-300 font-semibold">{activeStageState?.providerName}</span>
                  </div>
                )}
                {hasModel && (
                  <div>
                    <span className="text-zinc-500 font-bold uppercase">MODEL: </span>
                    <span className="text-purple-300 font-semibold">{activeStageState?.modelName}</span>
                  </div>
                )}
                {hasDuration && (
                  <div>
                    <span className="text-zinc-500 font-bold uppercase">DURATION: </span>
                    <span className="text-zinc-200 font-semibold">
                      {((activeStageState?.durationMs || 0) / 1000).toFixed(1)}s
                    </span>
                  </div>
                )}
              </div>
            );
          })()}
        </div>
      )}

      {/* Parallel Search Grounded Research Telemetry Card */}
      {parallelState && (
        <div className="bg-gradient-to-r from-cyan-950/40 via-zinc-900 to-zinc-950 border border-cyan-500/50 rounded-2xl p-5 shadow-xl space-y-3 animate-in fade-in duration-300">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-cyan-500/20 border border-cyan-500/40 rounded-xl text-cyan-400">
                <Globe className="w-5 h-5 animate-pulse" />
              </div>
              <div>
                <span className="text-[10px] font-mono font-extrabold text-cyan-400 uppercase tracking-widest flex items-center gap-1">
                  <Zap className="w-3 h-3" /> LIVE WEB RESEARCH — POWERED BY PARALLEL SEARCH API
                </span>
                <h3 className="text-sm font-extrabold text-white">
                  {parallelState.status === 'RUNNING' ? 'SEARCHING THE WEB...' : 'GROUNDED RESEARCH COMPLETE'}
                </h3>
              </div>
            </div>

            <span className={`text-[10px] font-mono font-extrabold px-2.5 py-1 rounded-md uppercase border ${
              parallelState.status === 'RUNNING'
                ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40 animate-pulse'
                : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
            }`}>
              {parallelState.status}
            </span>
          </div>

          {parallelState.status === 'COMPLETED' && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
              <div className="bg-zinc-950 p-2.5 rounded-xl border border-zinc-800 text-center">
                <span className="text-xs font-mono font-black text-cyan-400">
                  {parallelState.queryCount !== undefined ? `${parallelState.queryCount} QUERIES` : 'PARALLEL SEARCH'}
                </span>
                <p className="text-[9px] text-zinc-500 font-bold uppercase mt-0.5">Queries Executed</p>
              </div>

              <div className="bg-zinc-950 p-2.5 rounded-xl border border-zinc-800 text-center">
                <span className="text-xs font-mono font-black text-cyan-400">
                  {parallelState.resultCount !== undefined ? `${parallelState.resultCount} REAL SOURCES` : 'REAL SOURCES'}
                </span>
                <p className="text-[9px] text-zinc-500 font-bold uppercase mt-0.5">Grounded Web Sources</p>
              </div>

              <div className="bg-zinc-950 p-2.5 rounded-xl border border-zinc-800 text-center">
                <span className="text-xs font-mono font-black text-cyan-400">
                  {parallelState.durationMs !== undefined ? `${(parallelState.durationMs / 1000).toFixed(1)}s` : 'REAL-TIME'}
                </span>
                <p className="text-[9px] text-zinc-500 font-bold uppercase mt-0.5">Execution Latency</p>
              </div>

              <div className="bg-zinc-950 p-2.5 rounded-xl border border-zinc-800 text-center">
                <span className="text-xs font-mono font-black text-cyan-400 truncate block">
                  {parallelState.domains && parallelState.domains.length > 0
                    ? parallelState.domains.slice(0, 3).join(', ')
                    : 'VERIFIED DOMAINS'}
                </span>
                <p className="text-[9px] text-zinc-500 font-bold uppercase mt-0.5">Retrieved Domains</p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Crew Execution Timeline & Activity Cards */}
      <div className="space-y-3">
        <div className="flex items-center justify-between px-1">
          <h3 className="text-xs font-extrabold text-zinc-300 uppercase tracking-wider flex items-center gap-2">
            <Activity className="w-4 h-4 text-amber-400" />
            CREW EXECUTION TIMELINE & AGENT OUTPUTS
          </h3>
          <span className="text-[10px] font-mono text-zinc-500">
            Operational Crew Logs
          </span>
        </div>

        {pipelineStates.map((st) => {
          const Icon = getRoleIcon(st.roleDef.role);
          const isRunning = st.status === 'RUNNING';
          const isDone = st.status === 'COMPLETED';
          const isFailedStage = st.status === 'FAILED';

          return (
            <div
              key={st.roleDef.id}
              className={`p-4 rounded-xl border transition-all ${
                isRunning
                  ? 'bg-zinc-900 border-amber-500/50 shadow-lg shadow-amber-500/5'
                  : isDone
                  ? 'bg-zinc-950/80 border-zinc-800/80'
                  : isFailedStage
                  ? 'bg-red-950/20 border-red-500/40'
                  : 'bg-zinc-950/30 border-zinc-900/60 opacity-50'
              }`}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-3">
                  <div className={`p-2 rounded-lg shrink-0 ${
                    isRunning
                      ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30 animate-pulse'
                      : isDone
                      ? 'bg-emerald-950 text-emerald-400 border border-emerald-500/30'
                      : isFailedStage
                      ? 'bg-red-950 text-red-400 border border-red-500/30'
                      : 'bg-zinc-900 text-zinc-600 border border-zinc-800'
                  }`}>
                    <Icon className="w-4 h-4" />
                  </div>

                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className="text-xs font-bold text-white">
                        0{st.roleDef.id}. {st.roleDef.agentName}
                      </h4>
                      <span className="text-[10px] font-mono text-amber-400/90 font-semibold">
                        ({st.roleDef.role})
                      </span>

                      {st.activity?.executionMode && getExecutionBadge(st.activity.executionMode, st.activity.providerName)}

                      {st.activity?.timestamp && (
                        <span className="text-[10px] text-zinc-500 font-mono">{st.activity.timestamp}</span>
                      )}
                    </div>

                    {st.actionSummary ? (
                      <p className="text-xs text-zinc-300 font-medium">{st.actionSummary}</p>
                    ) : (
                      <p className="text-xs text-zinc-500 italic">WAITING FOR PREVIOUS AGENT</p>
                    )}

                    {st.resultDetails && (
                      <p className="text-[11px] text-zinc-400 font-mono bg-zinc-900/80 p-2 rounded border border-zinc-800/80 mt-1">
                        {st.resultDetails}
                      </p>
                    )}
                  </div>
                </div>

                <div className="shrink-0">
                  {st.status === 'RUNNING' && (
                    <span className="flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded bg-amber-500/20 text-amber-400 border border-amber-500/30 animate-pulse">
                      <Loader2 className="w-3 h-3 animate-spin text-amber-400" /> RUNNING
                    </span>
                  )}
                  {st.status === 'COMPLETED' && (
                    <span className="flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                      <CheckCircle2 className="w-3 h-3 text-emerald-400" /> COMPLETED
                    </span>
                  )}
                  {st.status === 'FAILED' && (
                    <span className="flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded bg-red-500/20 text-red-400 border border-red-500/30">
                      <XCircle className="w-3 h-3 text-red-400" /> FAILED
                    </span>
                  )}
                  {st.status === 'WAITING' && (
                    <span className="flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded bg-zinc-900 text-zinc-500 border border-zinc-800">
                      <Clock className="w-3 h-3 text-zinc-600" /> WAITING
                    </span>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Completion Hero Panel */}
      {isFinished && (
        <div className="p-6 bg-gradient-to-r from-amber-500/10 via-zinc-900 to-zinc-950 border border-amber-500/40 rounded-2xl space-y-4 animate-in zoom-in-95 duration-200">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h3 className="text-lg font-black text-amber-400 flex items-center gap-2">
                <CheckCircle2 className="w-6 h-6 text-amber-400" />
                PRODUCTION PLAN READY — 8 / 8 AI AGENTS COMPLETED
              </h3>
              <p className="text-xs text-zinc-300 mt-1">
                All eight specialized agents executed sequentially to generate your comprehensive breakdown.
              </p>
            </div>

            <button
              onClick={onComplete}
              className="flex items-center gap-2 px-6 py-3.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-zinc-950 font-black text-xs rounded-xl shadow-2xl transition-transform transform hover:scale-105 shrink-0"
            >
              OPEN PRODUCTION WORKSPACE
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>

          {/* Compact Production Metrics */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 pt-2 border-t border-zinc-800/80">
            {production.scenes && (
              <div className="bg-zinc-950/80 p-3 rounded-xl border border-zinc-800 text-center">
                <span className="text-base font-black text-amber-400 font-mono">{production.scenes.length}</span>
                <p className="text-[10px] text-zinc-400 font-bold uppercase mt-0.5">Scenes</p>
              </div>
            )}
            {production.tasks && (
              <div className="bg-zinc-950/80 p-3 rounded-xl border border-zinc-800 text-center">
                <span className="text-base font-black text-amber-400 font-mono">{production.tasks.length}</span>
                <p className="text-[10px] text-zinc-400 font-bold uppercase mt-0.5">Tasks</p>
              </div>
            )}
            {production.sources && (
              <div className="bg-zinc-950/80 p-3 rounded-xl border border-zinc-800 text-center">
                <span className="text-base font-black text-cyan-400 font-mono">{production.sources.length}</span>
                <p className="text-[10px] text-zinc-400 font-bold uppercase mt-0.5">Grounded Sources</p>
              </div>
            )}
            {production.risks && (
              <div className="bg-zinc-950/80 p-3 rounded-xl border border-zinc-800 text-center">
                <span className="text-base font-black text-amber-400 font-mono">{production.risks.length}</span>
                <p className="text-[10px] text-zinc-400 font-bold uppercase mt-0.5">Risks</p>
              </div>
            )}
            {production.shootDays && (
              <div className="bg-zinc-950/80 p-3 rounded-xl border border-zinc-800 text-center">
                <span className="text-base font-black text-amber-400 font-mono">{production.shootDays.length}</span>
                <p className="text-[10px] text-zinc-400 font-bold uppercase mt-0.5">Shoot Days</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Interrupted / Failed State */}
      {isFailed && (
        <div className="p-6 bg-red-500/10 border border-red-500/30 rounded-2xl space-y-4 animate-in zoom-in-95 duration-200">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h3 className="text-base font-extrabold text-red-400 flex items-center gap-2">
                <XCircle className="w-5 h-5 text-red-400" />
                WORKFLOW INTERRUPTED — Completed: {completedCount} / 8
              </h3>
              {failedAgent && (
                <p className="text-xs text-red-300 font-mono mt-1">
                  Failed at: <strong>{failedAgent.agentName} ({failedAgent.role})</strong>
                </p>
              )}
              <p className="text-xs text-zinc-300 mt-1">
                Completed agent outputs remain preserved above.
              </p>
            </div>

            {onRunLocalSimulation && (
              <button
                onClick={onRunLocalSimulation}
                className="flex items-center gap-2 px-6 py-3 bg-zinc-800 hover:bg-zinc-700 text-amber-400 font-bold text-xs rounded-xl border border-zinc-700 transition-transform transform hover:scale-105 shrink-0"
              >
                RUN LOCAL DEMO
                <ArrowRight className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
