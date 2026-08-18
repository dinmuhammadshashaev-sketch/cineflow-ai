import React, { useState } from 'react';
import { AlertTriangle, ShieldCheck, CheckCircle2, RotateCcw, AlertOctagon, Filter } from 'lucide-react';
import { Risk, RiskSeverity, RiskStatus } from '../types';

interface RisksViewProps {
  risks: Risk[];
  onUpdateRiskStatus: (riskId: string, status: RiskStatus) => void;
}

export const RisksView: React.FC<RisksViewProps> = ({ risks, onUpdateRiskStatus }) => {
  const [filterSeverity, setFilterSeverity] = useState<string>('ALL');

  const filteredRisks = risks.filter((r) => {
    if (filterSeverity === 'ALL') return true;
    if (filterSeverity === 'RESOLVED') return r.status === 'RESOLVED';
    return r.severity === filterSeverity && r.status !== 'RESOLVED';
  });

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6 pb-16 animate-in fade-in duration-200">
      {/* Risk Header & Filters */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-zinc-900 border border-zinc-800 p-4 rounded-xl">
        <div className="flex items-center gap-3">
          <AlertOctagon className="w-5 h-5 text-red-400" />
          <h2 className="text-base font-bold text-white">Risk Audit & Safety Hazard Register</h2>
          <span className="text-xs font-mono text-zinc-400">({risks.length} logged)</span>
        </div>

        <div className="flex items-center gap-2">
          <Filter className="w-3.5 h-3.5 text-zinc-500" />
          <select
            value={filterSeverity}
            onChange={(e) => setFilterSeverity(e.target.value)}
            className="bg-zinc-950 border border-zinc-800 text-zinc-300 text-xs rounded-lg px-3 py-1.5 focus:outline-none focus:border-amber-500"
          >
            <option value="ALL">All Severities</option>
            <option value="CRITICAL">CRITICAL</option>
            <option value="HIGH">HIGH</option>
            <option value="MEDIUM">MEDIUM</option>
            <option value="LOW">LOW</option>
            <option value="RESOLVED">RESOLVED</option>
          </select>
        </div>
      </div>

      {/* Risks List */}
      <div className="space-y-4">
        {filteredRisks.map((risk) => {
          const isResolved = risk.status === 'RESOLVED';

          return (
            <div
              key={risk.id}
              className={`bg-zinc-900 border rounded-xl p-5 space-y-3 transition-all ${
                isResolved
                  ? 'border-zinc-800/60 opacity-60'
                  : risk.severity === 'CRITICAL'
                  ? 'border-red-500/40 shadow-lg shadow-red-500/5'
                  : 'border-zinc-800'
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className={`text-[10px] font-black px-2 py-0.5 rounded ${
                      isResolved
                        ? 'bg-zinc-800 text-zinc-400'
                        : risk.severity === 'CRITICAL'
                        ? 'bg-red-500 text-zinc-950 font-bold'
                        : risk.severity === 'HIGH'
                        ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                        : 'bg-zinc-800 text-zinc-300'
                    }`}>
                      {risk.severity} SEVERITY
                    </span>

                    {risk.sceneNumber && (
                      <span className="text-xs text-zinc-400 font-mono">Scene {risk.sceneNumber}</span>
                    )}
                  </div>
                  <h3 className="text-sm font-bold text-white">{risk.title}</h3>
                </div>

                {isResolved ? (
                  <button
                    onClick={() => onUpdateRiskStatus(risk.id, 'OPEN')}
                    className="flex items-center gap-1.5 px-3 py-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-semibold rounded-lg transition-colors"
                  >
                    <RotateCcw className="w-3.5 h-3.5" /> Reopen Risk
                  </button>
                ) : (
                  <button
                    onClick={() => onUpdateRiskStatus(risk.id, 'RESOLVED')}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-zinc-950 text-xs font-bold rounded-lg transition-colors shadow-md"
                  >
                    <CheckCircle2 className="w-4 h-4" /> Mark Resolved
                  </button>
                )}
              </div>

              <div className="p-3 bg-zinc-950 border border-zinc-800/80 rounded-lg space-y-1 text-xs">
                <span className="font-bold text-red-400 uppercase tracking-wider text-[10px] font-mono block">Hazard Origin</span>
                <p className="text-zinc-300">{risk.reason}</p>
              </div>

              <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-lg space-y-1 text-xs">
                <span className="font-bold text-amber-400 uppercase tracking-wider text-[10px] font-mono block">Recommended Mitigation Action</span>
                <p className="text-zinc-200">{risk.recommendedAction}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
