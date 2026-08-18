import React from 'react';
import {
  Search,
  Globe,
  CheckCircle2,
  BookOpen,
  ExternalLink,
  AlertOctagon,
  ShieldAlert,
  Zap,
  Award
} from 'lucide-react';
import { ResearchQuestion, Source, Risk, WorkflowRun } from '../types';
import {
  getSourcesForResearchQuestion,
  getRisksForResearchQuestion,
  getResearchSummary,
  getSourceTrustPresentation,
  getSafeExternalUrl,
  getSourceDisplayDomain
} from '../lib/researchEvidence';
import { getAgentPipelineState } from '../lib/pipeline';

interface ResearchViewProps {
  research: ResearchQuestion[];
  sources: Source[];
  risks?: Risk[];
  workflowRun?: WorkflowRun | null;
}

export const ResearchView: React.FC<ResearchViewProps> = ({
  research = [],
  sources = [],
  risks = [],
  workflowRun = null
}) => {
  // Derive Research Agent status from workflowRun
  let researchAgentStatus = 'NO WORKFLOW RUN YET';
  if (workflowRun) {
    const pipelineStates = getAgentPipelineState(workflowRun);
    const researchAgentState = pipelineStates.find(
      (s) => s.roleDef.role === 'Research' || s.roleDef.role === 'Research Agent'
    );
    if (researchAgentState) {
      researchAgentStatus = researchAgentState.status;
    } else {
      researchAgentStatus = 'WAITING';
    }
  }

  // Summary statistics & dataset classification
  const summary = getResearchSummary(research, sources, workflowRun);

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6 pb-16 animate-in fade-in duration-200">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-zinc-900 via-zinc-900 to-zinc-950 border border-zinc-800 rounded-2xl p-6 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-bold px-2.5 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20 flex items-center gap-1 font-mono">
              <Search className="w-3.5 h-3.5" /> Research Agent: {researchAgentStatus}
            </span>
          </div>
          <h2 className="text-xl font-extrabold text-white tracking-tight">EXTERNAL INTELLIGENCE & RESEARCH REPORT</h2>
          <p className="text-xs text-zinc-400">
            Source-backed research verifying permits, airspace rules, power grids, and local filming guidelines.
          </p>
        </div>

        {/* Runtime / Tool Status Badge */}
        <div className="px-3.5 py-2 bg-zinc-950 border border-zinc-800 rounded-lg text-xs font-mono text-zinc-400 shrink-0">
          {summary.hasParallelTool ? (
            summary.parallelToolStatus === 'RUNNING' ? (
              <span className="text-amber-400 flex items-center gap-1.5 font-bold animate-pulse">
                <Zap className="w-3.5 h-3.5" /> PARALLEL SEARCH LIVE (SEARCHING THE WEB...)
              </span>
            ) : summary.parallelToolStatus === 'COMPLETED' ? (
              <span className="text-emerald-400 flex items-center gap-1.5 font-bold">
                <Globe className="w-3.5 h-3.5" /> PARALLEL SEARCH VERIFIED (GROUNDED WEB RESEARCH COMPLETE)
              </span>
            ) : (
              <span className="text-red-400 flex items-center gap-1.5 font-bold">
                <AlertOctagon className="w-3.5 h-3.5" /> PARALLEL SEARCH FAILED (PARTIAL EVIDENCE PRESERVED)
              </span>
            )
          ) : summary.datasetType === 'REAL' ? (
            <span className="text-emerald-400 flex items-center gap-1.5 font-bold">
              <Globe className="w-3.5 h-3.5" /> LIVE GROUNDED SOURCES
            </span>
          ) : summary.datasetType === 'MIXED' ? (
            <span className="text-amber-400 flex items-center gap-1.5 font-bold">
              <Globe className="w-3.5 h-3.5" /> MIXED RESEARCH DATA
            </span>
          ) : summary.datasetType === 'MOCK' ? (
            <span className="text-zinc-400 flex items-center gap-1.5">
              🧪 DEMO / MOCK SOURCES
            </span>
          ) : (
            <span className="text-zinc-500">
              NO SOURCES RECORDED
            </span>
          )}
        </div>
      </div>

      {/* Summary Metrics Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="p-3.5 bg-zinc-900 border border-zinc-800 rounded-xl space-y-1">
          <span className="text-[10px] font-mono text-zinc-400 uppercase tracking-wider block">Total Questions</span>
          <span className="text-lg font-extrabold text-white">{summary.totalQuestions}</span>
        </div>
        <div className="p-3.5 bg-zinc-900 border border-zinc-800 rounded-xl space-y-1">
          <span className="text-[10px] font-mono text-zinc-400 uppercase tracking-wider block">Grounded</span>
          <span className="text-lg font-extrabold text-emerald-400">{summary.groundedQuestions}</span>
        </div>
        <div className="p-3.5 bg-zinc-900 border border-zinc-800 rounded-xl space-y-1">
          <span className="text-[10px] font-mono text-zinc-400 uppercase tracking-wider block">Real Sources</span>
          <span className="text-lg font-extrabold text-amber-400">{summary.realSourcesCount}</span>
        </div>
        <div className="p-3.5 bg-zinc-900 border border-zinc-800 rounded-xl space-y-1">
          <span className="text-[10px] font-mono text-zinc-400 uppercase tracking-wider block">Official Sources</span>
          <span className="text-lg font-extrabold text-blue-400">{summary.officialSourcesCount}</span>
        </div>
        <div className="p-3.5 bg-zinc-900 border border-zinc-800 rounded-xl space-y-1">
          <span className="text-[10px] font-mono text-zinc-400 uppercase tracking-wider block">Unresolved</span>
          <span className="text-lg font-extrabold text-red-400">{summary.unresolvedQuestions}</span>
        </div>
        <div className="p-3.5 bg-zinc-900 border border-zinc-800 rounded-xl space-y-1">
          <span className="text-[10px] font-mono text-zinc-400 uppercase tracking-wider block">Coverage</span>
          <span className="text-lg font-extrabold text-zinc-200">
            {summary.totalQuestions === 0 ? 'NO RESEARCH QUESTIONS' : `${Math.round(summary.groundingCoverage * 100)}%`}
          </span>
        </div>
      </div>

      {/* Partner Judge Card (ONLY when parallel_search tool telemetry exists and is COMPLETED) */}
      {summary.hasParallelTool && summary.parallelToolStatus === 'COMPLETED' && (
        <div className="bg-gradient-to-r from-amber-950/30 via-zinc-900 to-zinc-900 border border-amber-500/30 rounded-xl p-5 shadow-lg space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Award className="w-4 h-4 text-amber-400" />
              <h3 className="text-xs font-bold text-amber-400 font-mono tracking-wider uppercase">
                GROUNDED BY PARALLEL SEARCH
              </h3>
            </div>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-500/10 text-amber-300 border border-amber-500/20">
              Parallel Search API
            </span>
          </div>

          <p className="text-xs text-zinc-300 leading-relaxed">
            Parallel grounds CineFlow's production decisions in current web evidence before Risk and Scheduler agents finalize the plan.
          </p>

          <div className="grid grid-cols-3 gap-3 pt-2 border-t border-amber-500/20 font-mono text-xs">
            <div>
              <span className="text-[10px] text-zinc-400 block uppercase">Queries</span>
              <span className="font-bold text-white">{summary.parallelQueries ?? 'N/A'}</span>
            </div>
            <div>
              <span className="text-[10px] text-zinc-400 block uppercase">Results</span>
              <span className="font-bold text-white">{summary.parallelResults ?? 'N/A'}</span>
            </div>
            <div>
              <span className="text-[10px] text-zinc-400 block uppercase">Domains</span>
              <span className="font-bold text-white">{summary.parallelDomainsCount ?? 'N/A'}</span>
            </div>
          </div>
        </div>
      )}

      {/* Research Questions List */}
      <div className="space-y-4">
        {research.length === 0 ? (
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-8 text-center space-y-2">
            <BookOpen className="w-8 h-8 text-zinc-600 mx-auto" />
            <h3 className="text-sm font-bold text-zinc-400 uppercase tracking-wider font-mono">NO RESEARCH QUESTIONS</h3>
            <p className="text-xs text-zinc-500">No research queries recorded for this production.</p>
          </div>
        ) : (
          research.map((rq) => {
            const rqSources = getSourcesForResearchQuestion(rq, sources);
            const rqRisks = getRisksForResearchQuestion(rq, sources, risks);

            return (
              <div key={rq.id} className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 space-y-4 shadow-md">
                {/* Question Header */}
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded font-mono ${
                        rq.importance === 'CRITICAL' ? 'bg-red-500/20 text-red-400 border border-red-500/30' : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                      }`}>
                        {rq.importance} IMPORTANCE
                      </span>
                      {rq.sceneNumber && (
                        <span className="text-xs text-zinc-400 font-mono">Scene {rq.sceneNumber}</span>
                      )}
                    </div>
                    <h3 className="text-sm font-bold text-white">{rq.question}</h3>
                  </div>

                  {rq.status === 'FAILED' ? (
                    <span className="text-[10px] font-bold font-mono px-2.5 py-1 rounded bg-red-500/10 text-red-400 border border-red-500/20 shrink-0 flex items-center gap-1">
                      <AlertOctagon className="w-3 h-3" /> FAILED
                    </span>
                  ) : (
                    <span className="text-[10px] font-bold font-mono px-2.5 py-1 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shrink-0 flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" /> {rq.status}
                    </span>
                  )}
                </div>

                {/* Grounded Finding */}
                <div className="p-3.5 bg-zinc-950 border border-zinc-800 rounded-lg space-y-1 text-xs leading-relaxed text-zinc-200">
                  <span className="font-bold text-amber-400 uppercase tracking-wider text-[10px] font-mono block">
                    GROUNDED FINDING
                  </span>
                  {rq.findings && rq.findings.trim().length > 0 ? (
                    <p>{rq.findings}</p>
                  ) : (
                    <p className="text-zinc-500 italic">NO GROUNDED FINDING AVAILABLE</p>
                  )}
                </div>

                {/* Evidence (Sources) */}
                <div className="space-y-2 pt-2 border-t border-zinc-800/80">
                  <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider font-mono flex items-center gap-1">
                    <BookOpen className="w-3 h-3 text-amber-400" /> EVIDENCE ({rqSources.length})
                  </span>

                  {rqSources.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      {rqSources.map((src) => {
                        const trustInfo = getSourceTrustPresentation(src);
                        const urlInfo = getSafeExternalUrl(src.url);

                        return (
                          <div key={src.id} className="p-3 bg-zinc-950/80 border border-zinc-800/80 rounded-lg space-y-1.5 text-xs">
                            <div className="flex items-center justify-between gap-2 text-[11px]">
                              <span className="font-bold text-amber-400 truncate">{src.title}</span>
                              <div className="flex items-center gap-1 shrink-0 font-mono text-[9px]">
                                {trustInfo.displayQuality && (
                                  <span className="px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20 font-bold">
                                    {trustInfo.displayQuality}
                                  </span>
                                )}
                                <span className={`px-1.5 py-0.5 rounded font-bold ${
                                  src.isDemoMock ? 'bg-zinc-800 text-zinc-400' : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                                }`}>
                                  {trustInfo.datasetTypeLabel}
                                </span>
                              </div>
                            </div>

                            <div className="space-y-0.5">
                              <span className="text-[9px] font-mono text-zinc-500 uppercase block font-bold">
                                {trustInfo.evidenceLabel}
                              </span>
                              <p className="text-[11px] text-zinc-300 leading-relaxed">
                                {src.evidenceSummary}
                              </p>
                            </div>

                            <div className="pt-1">
                              {urlInfo.isValid && urlInfo.safeUrl ? (
                                <a
                                  href={urlInfo.safeUrl}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="text-[10px] font-mono text-zinc-400 hover:text-amber-400 flex items-center gap-1 transition-colors"
                                >
                                  {getSourceDisplayDomain(src)} <ExternalLink className="w-2.5 h-2.5" />
                                </a>
                              ) : (
                                <span className="text-[10px] font-mono text-zinc-600">
                                  SOURCE LINK UNAVAILABLE
                                </span>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="p-3 bg-zinc-950/50 border border-zinc-800/50 rounded-lg text-center text-xs font-mono text-zinc-500">
                      NO LINKED SOURCES
                    </div>
                  )}
                </div>

                {/* Production Impact (Linked Risks) */}
                <div className="space-y-2 pt-2 border-t border-zinc-800/80">
                  <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider font-mono flex items-center gap-1">
                    <ShieldAlert className="w-3 h-3 text-red-400" /> PRODUCTION IMPACT ({rqRisks.length})
                  </span>

                  {rqRisks.length > 0 ? (
                    <div className="space-y-2">
                      {rqRisks.map((risk) => (
                        <div key={risk.id} className="p-3 bg-zinc-950 border border-red-500/20 rounded-lg space-y-1 text-xs">
                          <div className="flex items-center justify-between gap-2">
                            <span className="font-bold text-white">{risk.title}</span>
                            <span className={`text-[9px] font-bold font-mono px-2 py-0.5 rounded ${
                              risk.severity === 'CRITICAL' || risk.severity === 'HIGH'
                                ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                                : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                            }`}>
                              {risk.severity} SEVERITY
                            </span>
                          </div>
                          <p className="text-[11px] text-zinc-300">{risk.reason || risk.description}</p>
                          {risk.recommendedAction && (
                            <div className="text-[11px] text-amber-300 font-mono pt-1">
                              <span className="font-bold text-amber-400">Mitigation: </span>
                              {risk.recommendedAction}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="p-3 bg-zinc-950/50 border border-zinc-800/50 rounded-lg text-center text-xs font-mono text-zinc-500">
                      NO DIRECT RISK IMPACT IDENTIFIED
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
