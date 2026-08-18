import React, { useState } from 'react';
import { Plus, Trash2, ArrowRight, Zap, AlertTriangle, Film, Calendar, Clapperboard } from 'lucide-react';
import { Production } from '../types';
import { storage } from '../services/storage/StorageProvider';
import { ConfirmModal } from '../components/ConfirmModal';
import { isDemoProduction } from '../lib/dashboard';

interface ProjectsViewProps {
  productions: Production[];
  activeProductionId: string;
  onSelectProduction: (id: string) => void;
  onNavigateNewProduction: () => void;
  onRefreshData: () => void;
}

export const ProjectsView: React.FC<ProjectsViewProps> = ({
  productions,
  activeProductionId,
  onSelectProduction,
  onNavigateNewProduction,
  onRefreshData
}) => {
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);

  const handleDeleteConfirm = () => {
    if (deleteTargetId) {
      storage.deleteProduction(deleteTargetId);
      setDeleteTargetId(null);
      onRefreshData();
    }
  };

  const targetProd = productions.find(p => p.id === deleteTargetId);

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6 pb-16 animate-in fade-in duration-200">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-800 pb-4">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Clapperboard className="w-5 h-5 text-amber-400" />
            Film Productions ({productions.length})
          </h2>
          <p className="text-xs text-zinc-400">Manage, create, and audit your AI crew productions.</p>
        </div>

        <button
          onClick={onNavigateNewProduction}
          className="flex items-center justify-center gap-2 px-4 py-2 bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold text-xs rounded-lg transition-colors shadow-md"
        >
          <Plus className="w-4 h-4" />
          Create New Production
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {productions.map((prod) => {
          const scenes = storage.getScenes(prod.id);
          const risks = storage.getRisks(prod.id);
          const openRisks = risks.filter(r => r.status !== 'RESOLVED').length;
          const isActive = prod.id === activeProductionId;

          return (
            <div
              key={prod.id}
              className={`bg-zinc-900 border rounded-xl p-5 space-y-4 flex flex-col justify-between transition-all relative overflow-hidden group ${
                isActive ? 'border-amber-500/50 shadow-lg shadow-amber-500/5' : 'border-zinc-800 hover:border-zinc-700'
              }`}
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-zinc-800 text-amber-400 border border-zinc-700">
                      {prod.type}
                    </span>
                    {isDemoProduction(prod) && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-500/10 text-amber-300 border border-amber-500/30">
                        DEMO PRODUCTION
                      </span>
                    )}
                  </div>
                  <span className="text-xs font-mono text-zinc-500">
                    {new Date(prod.createdAt).toLocaleDateString()}
                  </span>
                </div>

                <div>
                  <h3 className="text-lg font-bold text-white group-hover:text-amber-400 transition-colors">
                    {prod.title}
                  </h3>
                  <p className="text-xs text-zinc-400 mt-1 line-clamp-2">{prod.description || 'No description provided.'}</p>
                </div>

                <div className="grid grid-cols-3 gap-2 pt-2 border-t border-zinc-800/80 text-center">
                  <div className="bg-zinc-950 p-2 rounded border border-zinc-800">
                    <div className="text-[10px] text-zinc-500 font-semibold flex items-center justify-center gap-1">
                      <Film className="w-3 h-3 text-blue-400" /> Scenes
                    </div>
                    <div className="text-sm font-black text-white font-mono mt-0.5">{scenes.length}</div>
                  </div>

                  <div className="bg-zinc-950 p-2 rounded border border-zinc-800">
                    <div className="text-[10px] text-zinc-500 font-semibold flex items-center justify-center gap-1">
                      <AlertTriangle className="w-3 h-3 text-red-400" /> Risks
                    </div>
                    <div className="text-sm font-black text-red-400 font-mono mt-0.5">{openRisks}</div>
                  </div>

                  <div className="bg-zinc-950 p-2 rounded border border-zinc-800">
                    <div className="text-[10px] text-zinc-500 font-semibold flex items-center justify-center gap-1">
                      <Zap className="w-3 h-3 text-amber-400" /> Readiness
                    </div>
                    <div className="text-sm font-black text-amber-400 font-mono mt-0.5">{prod.readinessScore}%</div>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between gap-2 pt-3 border-t border-zinc-800/80">
                <button
                  onClick={() => setDeleteTargetId(prod.id)}
                  className="p-2 text-zinc-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors text-xs flex items-center gap-1"
                  title="Delete Production"
                >
                  <Trash2 className="w-4 h-4" />
                </button>

                <button
                  onClick={() => onSelectProduction(prod.id)}
                  className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                    isActive
                      ? 'bg-amber-500 text-zinc-950 hover:bg-amber-400'
                      : 'bg-zinc-800 text-zinc-200 hover:bg-zinc-700'
                  }`}
                >
                  {isActive ? 'Active Workspace' : 'Open Workspace'}
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      <ConfirmModal
        isOpen={Boolean(deleteTargetId)}
        title="Delete Film Production?"
        message={`Are you sure you want to delete "${targetProd?.title || 'this production'}"? This will remove all associated scenes, tasks, risks, and schedule data from local storage.`}
        confirmLabel="Delete Production"
        cancelLabel="Keep Production"
        isDanger={true}
        onConfirm={handleDeleteConfirm}
        onCancel={() => setDeleteTargetId(null)}
      />
    </div>
  );
};
