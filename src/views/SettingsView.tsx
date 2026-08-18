import React, { useState } from 'react';
import { Settings, Shield, RefreshCw, Cpu, Database, Check, AlertOctagon } from 'lucide-react';
import { SystemSettings } from '../types';
import { storage } from '../services/storage/StorageProvider';
import { ConfirmModal } from '../components/ConfirmModal';

interface SettingsViewProps {
  settings: SystemSettings;
  onSaveSettings: (settings: SystemSettings) => void;
  onResetData: () => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  settings,
  onSaveSettings,
  onResetData
}) => {
  const [currentSettings, setCurrentSettings] = useState<SystemSettings>(settings);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const handleToggleAi = (type: 'mock' | 'gemini') => {
    const updated = { ...currentSettings, aiProviderType: type };
    setCurrentSettings(updated);
    onSaveSettings(updated);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2000);
  };

  const handleToggleResearch = (type: 'mock' | 'parallel') => {
    const updated = { ...currentSettings, researchProviderType: type };
    setCurrentSettings(updated);
    onSaveSettings(updated);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2000);
  };

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6 pb-16 animate-in fade-in duration-200">
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 shadow-xl space-y-1">
        <h2 className="text-xl font-extrabold text-white flex items-center gap-2">
          <Settings className="w-5 h-5 text-amber-400" />
          System Settings & AI Provider Boundaries
        </h2>
        <p className="text-xs text-zinc-400">
          Configure AI intelligence providers, research backends, local persistence, and diagnostics.
        </p>
      </div>

      {saveSuccess && (
        <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-emerald-400 text-xs font-semibold flex items-center gap-2">
          <Check className="w-4 h-4" /> System settings saved successfully.
        </div>
      )}

      {/* AI Provider Section */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 space-y-4 shadow-xl">
        <h3 className="text-sm font-bold text-amber-400 uppercase tracking-wider font-mono flex items-center gap-2">
          <Cpu className="w-4 h-4" /> Script Breakdown & Agent Engine Provider
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div
            onClick={() => handleToggleAi('mock')}
            className={`p-4 rounded-xl border cursor-pointer transition-all ${
              currentSettings.aiProviderType === 'mock'
                ? 'bg-amber-500/10 border-amber-500 text-amber-400'
                : 'bg-zinc-950 border-zinc-800 text-zinc-400 hover:border-zinc-700'
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="font-bold text-xs">Stage 1 Local Simulation Engine</span>
              {currentSettings.aiProviderType === 'mock' && <Check className="w-4 h-4 text-amber-400" />}
            </div>
            <p className="text-xs text-zinc-300">
              Deterministic, instant local simulation designed for offline hackathon testing and demo reliability.
            </p>
          </div>

          <div
            onClick={() => handleToggleAi('gemini')}
            className={`p-4 rounded-xl border cursor-pointer transition-all ${
              currentSettings.aiProviderType === 'gemini'
                ? 'bg-amber-500/10 border-amber-500 text-amber-400'
                : 'bg-zinc-950 border-zinc-800 text-zinc-400 hover:border-zinc-700'
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="font-bold text-xs">Google ADK Multi-Agent Workflow Engine</span>
              {currentSettings.aiProviderType === 'gemini' && <Check className="w-4 h-4 text-amber-400" />}
            </div>
            <p className="text-xs text-zinc-300 font-mono text-[11px] leading-relaxed">
              CineFlow UI &rarr; Agentic Workflow API &rarr; Google ADK &rarr; SequentialAgent &rarr; 8 Gemini LlmAgents &rarr; ResearchAgent &rarr; Parallel Search FunctionTool
            </p>
          </div>
        </div>
      </div>

      {/* Research Provider Section */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 space-y-4 shadow-xl">
        <h3 className="text-sm font-bold text-amber-400 uppercase tracking-wider font-mono flex items-center gap-2">
          <Shield className="w-4 h-4" /> External Research Provider (Parallel Search Architecture)
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div
            onClick={() => handleToggleResearch('mock')}
            className={`p-4 rounded-xl border cursor-pointer transition-all ${
              currentSettings.researchProviderType === 'mock'
                ? 'bg-amber-500/10 border-amber-500 text-amber-400'
                : 'bg-zinc-950 border-zinc-800 text-zinc-400 hover:border-zinc-700'
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="font-bold text-xs">Mock Research Provider (Demo)</span>
              {currentSettings.researchProviderType === 'mock' && <Check className="w-4 h-4 text-amber-400" />}
            </div>
            <p className="text-xs text-zinc-300">
              Pre-computed source-backed permit and regulation reports clearly marked with DEMO/MOCK badges.
            </p>
          </div>

          <div
            onClick={() => handleToggleResearch('parallel')}
            className={`p-4 rounded-xl border cursor-pointer transition-all ${
              currentSettings.researchProviderType === 'parallel'
                ? 'bg-amber-500/10 border-amber-500 text-amber-400'
                : 'bg-zinc-950 border-zinc-800 text-zinc-400 hover:border-zinc-700'
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="font-bold text-xs">Parallel Search API Backend</span>
              {currentSettings.researchProviderType === 'parallel' && <Check className="w-4 h-4 text-amber-400" />}
            </div>
            <p className="text-xs text-zinc-300">
              Routes research requests through <code className="font-mono text-[10px] bg-zinc-900 px-1 py-0.5 rounded text-amber-300">/api/research</code> server proxy.
            </p>
          </div>
        </div>
      </div>

      {/* Local Storage & Reset Section */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 space-y-4 shadow-xl">
        <h3 className="text-sm font-bold text-red-400 uppercase tracking-wider font-mono flex items-center gap-2">
          <Database className="w-4 h-4" /> Storage Schema & Data Management
        </h3>

        <div className="p-4 bg-zinc-950 border border-zinc-800 rounded-xl space-y-3">
          <div className="flex items-center justify-between text-xs text-zinc-300">
            <span>Storage Schema Version</span>
            <span className="font-mono text-amber-400 bg-zinc-900 px-2 py-0.5 rounded border border-zinc-800">cineflow_v1</span>
          </div>

          <div className="flex items-center justify-between pt-2 border-t border-zinc-800">
            <div>
              <p className="text-xs font-bold text-zinc-200">Reset Local Storage Data</p>
              <p className="text-[11px] text-zinc-500">Clears all custom local productions and re-seeds "NEON HARBOR" benchmark demo.</p>
            </div>

            <button
              onClick={() => setShowResetConfirm(true)}
              className="flex items-center gap-1.5 px-4 py-2 bg-red-600/20 hover:bg-red-600/30 text-red-400 border border-red-500/30 text-xs font-bold rounded-lg transition-colors"
            >
              <RefreshCw className="w-3.5 h-3.5" /> Reset Data
            </button>
          </div>
        </div>
      </div>

      <ConfirmModal
        isOpen={showResetConfirm}
        title="Reset All Local Production Data?"
        message="This will clear your stored local productions, custom tasks, and risks, and reload the original 'NEON HARBOR' demo script benchmark. Continue?"
        confirmLabel="Reset & Reseed Demo"
        cancelLabel="Cancel"
        isDanger={true}
        onConfirm={() => {
          onResetData();
          setShowResetConfirm(false);
        }}
        onCancel={() => setShowResetConfirm(false)}
      />
    </div>
  );
};
