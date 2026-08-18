import React from 'react';
import { BookOpen, ExternalLink, Globe } from 'lucide-react';
import { Source, WorkflowRun } from '../types';
import {
  getSourceTrustPresentation,
  getSafeExternalUrl,
  getSourceDisplayDomain
} from '../lib/researchEvidence';

interface SourcesViewProps {
  sources: Source[];
  workflowRun?: WorkflowRun | null;
}

export const SourcesView: React.FC<SourcesViewProps> = ({
  sources = [],
  workflowRun = null
}) => {
  // Deduplicate sources by ID
  const uniqueSources = Array.from(
    new Map<string, Source>(sources.map((s) => [s.id, s])).values()
  );

  const totalSourcesCount = uniqueSources.length;
  const realSourcesCount = uniqueSources.filter((s) => !s.isDemoMock).length;
  const mockSourcesCount = uniqueSources.filter((s) => s.isDemoMock).length;
  const officialSourcesCount = uniqueSources.filter((s) => s.qualityTag === 'OFFICIAL').length;
  const uniqueDomainsCount = new Set(
    uniqueSources.map((s) => getSourceDisplayDomain(s))
  ).size;

  let datasetClassification = 'NO SOURCES';
  if (totalSourcesCount > 0) {
    if (realSourcesCount > 0 && mockSourcesCount > 0) {
      datasetClassification = 'MIXED RESEARCH DATA';
    } else if (realSourcesCount > 0) {
      datasetClassification = 'REAL WEB SOURCES';
    } else {
      datasetClassification = 'DEMO / MOCK SOURCES';
    }
  }

  // Runtime parallel claim (requires AGENTIC_GOOGLE_ADK telemetry)
  let parallelClaimText: string | null = null;
  if (workflowRun && workflowRun.mode === 'AGENTIC_GOOGLE_ADK' && workflowRun.toolActivities) {
    const pTool = workflowRun.toolActivities.find((t) => t.toolName === 'parallel_search');
    if (pTool) {
      if (pTool.status === 'RUNNING') {
        parallelClaimText = 'PARALLEL SEARCH IN PROGRESS';
      } else if (pTool.status === 'COMPLETED') {
        parallelClaimText = 'COLLECTED VIA PARALLEL SEARCH API';
      } else if (pTool.status === 'FAILED') {
        parallelClaimText = 'PARALLEL SEARCH INTERRUPTED';
      }
    }
  }

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6 pb-16 animate-in fade-in duration-200">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-zinc-900 via-zinc-900 to-zinc-950 border border-zinc-800 rounded-2xl p-6 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20 flex items-center gap-1">
              <BookOpen className="w-3.5 h-3.5" /> Evidence & Citations
            </span>
          </div>
          <h2 className="text-xl font-extrabold text-white">EXTERNAL RESEARCH SOURCES ({totalSourcesCount})</h2>
          <p className="text-xs text-zinc-400">
            Source material and regulations collected by the Research Agent to support production decisions.
          </p>
        </div>

        <div className="px-3.5 py-2 bg-zinc-950 border border-zinc-800 rounded-lg text-xs font-mono text-zinc-400 shrink-0">
          <span className={`font-bold ${
            parallelClaimText
              ? parallelClaimText === 'COLLECTED VIA PARALLEL SEARCH API'
                ? 'text-emerald-400'
                : parallelClaimText === 'PARALLEL SEARCH IN PROGRESS'
                ? 'text-amber-400'
                : 'text-red-400'
              : datasetClassification === 'REAL WEB SOURCES'
              ? 'text-emerald-400'
              : datasetClassification === 'MIXED RESEARCH DATA'
              ? 'text-amber-400'
              : 'text-zinc-400'
          }`}>
            {parallelClaimText || datasetClassification}
          </span>
        </div>
      </div>

      {/* Summary Metrics Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <div className="p-3.5 bg-zinc-900 border border-zinc-800 rounded-xl space-y-1">
          <span className="text-[10px] font-mono text-zinc-400 uppercase tracking-wider block">Total Sources</span>
          <span className="text-lg font-extrabold text-white">{totalSourcesCount}</span>
        </div>
        <div className="p-3.5 bg-zinc-900 border border-zinc-800 rounded-xl space-y-1">
          <span className="text-[10px] font-mono text-zinc-400 uppercase tracking-wider block">Real Sources</span>
          <span className="text-lg font-extrabold text-amber-400">{realSourcesCount}</span>
        </div>
        <div className="p-3.5 bg-zinc-900 border border-zinc-800 rounded-xl space-y-1">
          <span className="text-[10px] font-mono text-zinc-400 uppercase tracking-wider block">Mock Sources</span>
          <span className="text-lg font-extrabold text-zinc-400">{mockSourcesCount}</span>
        </div>
        <div className="p-3.5 bg-zinc-900 border border-zinc-800 rounded-xl space-y-1">
          <span className="text-[10px] font-mono text-zinc-400 uppercase tracking-wider block">Unique Domains</span>
          <span className="text-lg font-extrabold text-emerald-400">{uniqueDomainsCount}</span>
        </div>
        <div className="p-3.5 bg-zinc-900 border border-zinc-800 rounded-xl space-y-1">
          <span className="text-[10px] font-mono text-zinc-400 uppercase tracking-wider block">Official Sources</span>
          <span className="text-lg font-extrabold text-blue-400">{officialSourcesCount}</span>
        </div>
      </div>

      {uniqueSources.length === 0 ? (
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-8 text-center space-y-2">
          <BookOpen className="w-8 h-8 text-zinc-600 mx-auto" />
          <h3 className="text-sm font-bold text-zinc-400 uppercase tracking-wider font-mono">NO SOURCES</h3>
          <p className="text-xs text-zinc-500">No external research sources retrieved for this production.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {uniqueSources.map((source) => {
            const trustInfo = getSourceTrustPresentation(source);
            const urlInfo = getSafeExternalUrl(source.url);
            const displayDomain = getSourceDisplayDomain(source);

            return (
              <div key={source.id} className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 space-y-3 shadow-md flex flex-col justify-between">
                <div className="space-y-2">
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <span className="text-[10px] font-mono text-zinc-400 flex items-center gap-1">
                      <Globe className="w-3 h-3 text-amber-400" /> {displayDomain}
                    </span>
                    <div className="flex items-center gap-1 font-mono text-[9px] flex-wrap">
                      {source.relatedSceneNumber && (
                        <span className="px-2 py-0.5 rounded bg-zinc-800 text-zinc-300 font-mono text-[9px] font-bold">
                          SCENE {source.relatedSceneNumber}
                        </span>
                      )}
                      {source.relatedResearchId && (
                        <span className="px-2 py-0.5 rounded bg-amber-500/10 text-amber-300 border border-amber-500/20 font-mono text-[9px] font-bold">
                          SUPPORTS RESEARCH QUESTION
                        </span>
                      )}
                      {trustInfo.displayQuality && (
                        <span className="px-2 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20 font-bold">
                          {trustInfo.displayQuality}
                        </span>
                      )}
                      <span className={`px-2 py-0.5 rounded font-bold ${
                        source.isDemoMock ? 'bg-zinc-800 text-zinc-400 border border-zinc-700' : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                      }`}>
                        {trustInfo.datasetTypeLabel}
                      </span>
                    </div>
                  </div>

                  <h3 className="text-sm font-bold text-white">{source.title}</h3>

                  <div className="bg-zinc-950 p-3 rounded-lg border border-zinc-800/80 space-y-1">
                    <span className="text-[9px] font-mono text-zinc-500 uppercase block font-bold">
                      {trustInfo.evidenceLabel}
                    </span>
                    <p className="text-xs text-zinc-300 leading-relaxed">
                      {source.evidenceSummary}
                    </p>
                  </div>
                </div>

                <div className="pt-3 border-t border-zinc-800/80 flex items-center justify-between text-xs font-mono">
                  <span className="text-zinc-500 text-[10px]">Retrieved {source.retrievedDate}</span>
                  {urlInfo.isValid && urlInfo.safeUrl ? (
                    <a
                      href={urlInfo.safeUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="text-amber-400 hover:underline flex items-center gap-1 font-bold"
                    >
                      View Source <ExternalLink className="w-3 h-3" />
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
      )}
    </div>
  );
};
