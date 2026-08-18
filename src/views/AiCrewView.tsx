import React from 'react';
import {
  Users,
  Bot,
  Sparkles,
  CheckCircle2,
  Clock,
  ShieldCheck,
  Activity,
  AlertOctagon,
  XCircle
} from 'lucide-react';
import { WorkflowRun } from '../types';
import {
  CINEFLOW_AGENT_PIPELINE,
  getAgentPipelineState,
  getFailedAgent
} from '../lib/pipeline';

interface AiCrewViewProps {
  workflowRun: WorkflowRun | null;
  aiProviderName: string;
  isMockProvider: boolean;
  onReRunCrew: () => void;
}

export const AiCrewView: React.FC<AiCrewViewProps> = ({
  workflowRun,
  aiProviderName,
  isMockProvider,
  onReRunCrew
}) => {
  const pipelineStates = getAgentPipelineState(workflowRun);
  const completedCount = pipelineStates.filter((s) => s.status === 'COMPLETED').length;
  const failedAgent = getFailedAgent(workflowRun);
  const isCompletedAll = completedCount >= 8 && workflowRun?.status === 'COMPLETED';
  const isFailed = workflowRun?.status === 'FAILED';

  let statusSummaryText = '0 / 8 AGENTS COMPLETE';
  if (isCompletedAll) {
    statusSummaryText = '8 / 8 AGENTS COMPLETE';
  } else if (isFailed) {
    statusSummaryText = `${completedCount} / 8 COMPLETE • FAILED AT: ${failedAgent ? failedAgent.role : 'UNKNOWN'}`;
  } else if (workflowRun) {
    statusSummaryText = `${completedCount} / 8 AGENTS COMPLETE`;
  }

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6 pb-16 animate-in fade-in duration-200">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-zinc-900 via-zinc-900/90 to-zinc-950 border border-zinc-800 rounded-2xl p-6 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-bold px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20">
              {statusSummaryText}
            </span>
            <span className="text-xs text-zinc-400 font-mono flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              Engine: {workflowRun ? (workflowRun.mode === 'AGENTIC_GOOGLE_ADK' ? 'Google Gemini ADK + Vertex AI' : 'Local Agent Simulation') : 'DEMO PROFILE / NOT YET RUN'}
            </span>
          </div>
          <h2 className="text-xl font-extrabold text-white">AUTONOMOUS FILM PRODUCTION CREW</h2>
          <p className="text-xs text-zinc-400">
            {workflowRun
              ? `Workflow Run ${workflowRun.id} • Status: ${workflowRun.status}`
              : 'No live workflow executed for this production yet. Click below to initiate crew analysis.'}
          </p>
        </div>

        <button
          onClick={onReRunCrew}
          className="flex items-center gap-2 px-5 py-2.5 bg-amber-500 hover:bg-amber-400 text-zinc-950 font-extrabold text-xs rounded-xl shadow-lg transition-transform transform hover:scale-105 shrink-0"
        >
          <Sparkles className="w-4 h-4 fill-zinc-950" />
          RUN CREW ANALYSIS
        </button>
      </div>

      {/* Agents Grid (All 8 Pipeline Roles) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {pipelineStates.map((st) => {
          const role = st.roleDef;
          const matchingActivities = workflowRun
            ? workflowRun.activities.filter((a) => a.agentRole === role.role)
            : [];

          let lastActivityText: string;
          if (!workflowRun) {
            lastActivityText = 'DEMO PROFILE / NOT YET RUN';
          } else if (st.activity) {
            lastActivityText = st.activity.actionSummary || st.activity.resultDetails || 'Step executed.';
          } else if (workflowRun.status === 'RUNNING') {
            lastActivityText = 'Waiting in execution queue...';
          } else {
            lastActivityText = 'Not executed in this run.';
          }

          return (
            <div
              key={role.id}
              className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 space-y-3 flex flex-col justify-between"
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div
                    className="w-8 h-8 rounded-lg flex items-center justify-center text-zinc-950 font-black text-xs shadow-md"
                    style={{ backgroundColor: role.avatarColor }}
                  >
                    <Bot className="w-4 h-4" />
                  </div>

                  {st.status === 'COMPLETED' && (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" /> COMPLETED
                    </span>
                  )}
                  {st.status === 'RUNNING' && (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20 flex items-center gap-1">
                      <Clock className="w-3 h-3 animate-spin" /> RUNNING
                    </span>
                  )}
                  {st.status === 'FAILED' && (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-red-500/10 text-red-400 border border-red-500/20 flex items-center gap-1">
                      <AlertOctagon className="w-3 h-3" /> FAILED
                    </span>
                  )}
                  {st.status === 'WAITING' && (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-zinc-950 text-zinc-500 border border-zinc-800">
                      WAITING
                    </span>
                  )}
                </div>

                <div>
                  <h3 className="text-sm font-bold text-white">0{role.id}. {role.agentName}</h3>
                  <p className="text-[11px] font-mono text-amber-400/90">{role.title}</p>
                </div>

                <p className="text-xs text-zinc-400 leading-relaxed">{role.responsibility}</p>
              </div>

              <div className="pt-3 border-t border-zinc-800/80 space-y-1.5">
                <div className="flex items-center justify-between text-[10px] text-zinc-500 font-mono">
                  <span>Pipeline Stage</span>
                  <span className="font-bold text-zinc-300">0{role.id} / 08</span>
                </div>
                <p className="text-[11px] text-zinc-400 italic line-clamp-2 bg-zinc-950 p-2 rounded border border-zinc-800">
                  "{lastActivityText}"
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Activity Timeline */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 space-y-4">
        <h3 className="text-sm font-bold text-white flex items-center gap-2">
          <Activity className="w-4 h-4 text-amber-400" />
          CREW EXECUTION TIMELINE & AGENT OUTPUTS
        </h3>

        {workflowRun && workflowRun.activities.length > 0 ? (
          <div className="space-y-2.5">
            {workflowRun.activities.map((act) => (
              <div key={act.id} className="p-3 bg-zinc-950 border border-zinc-800/80 rounded-lg flex items-start justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-amber-400">{act.agentRole}</span>
                    <span className="text-[10px] text-zinc-500 font-mono">{act.timestamp}</span>
                  </div>
                  <p className="text-xs text-zinc-200">{act.actionSummary}</p>
                  {act.resultDetails && (
                    <p className="text-[11px] text-zinc-400 font-mono">{act.resultDetails}</p>
                  )}
                </div>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-zinc-900 border border-zinc-800 text-zinc-400 shrink-0">
                  {act.status}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-xs text-zinc-500 italic p-4 bg-zinc-950 rounded-lg border border-zinc-800/80">
            No execution logs recorded yet. Run the crew analysis to view agent outputs.
          </p>
        )}
      </div>
    </div>
  );
};
