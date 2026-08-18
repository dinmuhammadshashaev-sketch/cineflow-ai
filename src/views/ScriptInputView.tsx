import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  FileText,
  Upload,
  BookOpen,
  ArrowRight,
  Check,
  AlertCircle
} from 'lucide-react';
import { Production } from '../types';
import { DEMO_SCREENPLAY_TEXT } from '../data/demoScript';
import { storage } from '../services/storage/StorageProvider';
import { RequestedWorkflowMode } from '../services/ai/AiManager';

interface ScriptInputViewProps {
  production: Production;
  onRunWorkflow: (scriptText: string, requestedMode: RequestedWorkflowMode) => void;
  onBack: () => void;
}

export const ScriptInputView: React.FC<ScriptInputViewProps> = ({
  production,
  onRunWorkflow,
  onBack
}) => {
  const [scriptText, setScriptText] = useState(
    production.scriptText || (production.title === 'NEON HARBOR' ? DEMO_SCREENPLAY_TEXT : '')
  );
  const [activeTab, setActiveTab] = useState<'paste' | 'upload'>('paste');
  const [error, setError] = useState('');
  const [health, setHealth] = useState<{
    runtimeMode?: string;
    parallel?: string;
    researchProviderReady?: boolean;
  } | null>(null);
  const [checkingHealth, setCheckingHealth] = useState(true);

  useEffect(() => {
    let isMounted = true;
    fetch('/api/health')
      .then(res => res.json())
      .then(data => {
        if (isMounted) {
          setHealth(data);
          setCheckingHealth(false);
        }
      })
      .catch(() => {
        if (isMounted) {
          setHealth(null);
          setCheckingHealth(false);
        }
      });
    return () => { isMounted = false; };
  }, []);

  const isVertexReady = health?.runtimeMode === 'GOOGLE_ADK_VERTEX_AI';
  const isParallelReady = health?.researchProviderReady === true || health?.parallel === 'CONFIGURED';
  const isLiveReady = isVertexReady && isParallelReady;

  const handleLoadDemo = () => {
    setScriptText(DEMO_SCREENPLAY_TEXT);
    setError('');
  };

  const handleAction = (requestedMode: RequestedWorkflowMode) => {
    if (!scriptText.trim()) {
      setError('Please enter screenplay text, describe your film idea, or load the Demo Script.');
      return;
    }
    production.scriptText = scriptText;
    storage.saveProduction(production);
    onRunWorkflow(scriptText, requestedMode);
  };

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6 pb-16 animate-in fade-in duration-200">
      {/* Header Banner */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 shadow-xl space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider font-mono text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
              Step 2 • Story & Screenplay Input
            </span>
            <h2 className="text-xl font-extrabold text-white mt-1">ADD YOUR STORY TO {production.title.toUpperCase()}</h2>
            <p className="text-xs text-zinc-400 mt-0.5">
              Paste your screenplay, type a story outline, or load our official hackathon demo script.
            </p>
          </div>

          <button
            onClick={handleLoadDemo}
            className="flex items-center gap-2 px-4 py-2.5 bg-zinc-800 hover:bg-zinc-700 text-amber-400 border border-amber-500/30 rounded-xl text-xs font-bold transition-all shrink-0 hover:border-amber-400"
          >
            <BookOpen className="w-4 h-4 text-amber-400" />
            USE DEMO SCRIPT
          </button>
        </div>
      </div>

      {/* Runtime Readiness Health Indicator */}
      <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs font-mono">
        <div className="flex items-center gap-4 flex-wrap">
          <div className="flex items-center gap-2">
            <span className="text-zinc-400">GOOGLE ADK / VERTEX:</span>
            {checkingHealth ? (
              <span className="text-zinc-500 animate-pulse">CHECKING...</span>
            ) : isVertexReady ? (
              <span className="text-emerald-400 font-bold px-2 py-0.5 bg-emerald-500/10 border border-emerald-500/20 rounded">
                READY (Vertex AI)
              </span>
            ) : (
              <span className="text-amber-400 font-bold px-2 py-0.5 bg-amber-500/10 border border-amber-500/20 rounded">
                NOT READY (Local Simulation)
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <span className="text-zinc-400">PARALLEL SEARCH:</span>
            {checkingHealth ? (
              <span className="text-zinc-500 animate-pulse">CHECKING...</span>
            ) : isParallelReady ? (
              <span className="text-emerald-400 font-bold px-2 py-0.5 bg-emerald-500/10 border border-emerald-500/20 rounded">
                READY (Parallel API)
              </span>
            ) : (
              <span className="text-amber-400 font-bold px-2 py-0.5 bg-amber-500/10 border border-amber-500/20 rounded">
                NOT READY (Mock Search)
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Input Container */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 shadow-xl space-y-4">
        <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab('paste')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                activeTab === 'paste'
                  ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              Screenplay Text / Premise
            </button>

            <button
              onClick={() => setActiveTab('upload')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-colors flex items-center gap-1.5 ${
                activeTab === 'upload'
                  ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <Upload className="w-3.5 h-3.5" />
              Upload File (PDF / DOCX)
            </button>
          </div>

          <span className="text-[11px] font-mono text-zinc-500">
            {scriptText.length} characters
          </span>
        </div>

        {error && (
          <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-xs font-semibold flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            {error}
          </div>
        )}

        {activeTab === 'paste' ? (
          <div className="space-y-2">
            <textarea
              rows={14}
              value={scriptText}
              onChange={(e) => { setScriptText(e.target.value); setError(''); }}
              placeholder={`SCENE 1\nINT. COFFEE SHOP - DAY\nJohn enters holding a sealed envelope...\n\n(Or describe your film idea here)`}
              className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-4 font-mono text-xs text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-amber-500 leading-relaxed resize-y"
            />
          </div>
        ) : (
          <div className="p-8 bg-zinc-950 border-2 border-dashed border-zinc-800 rounded-xl text-center space-y-3">
            <div className="w-12 h-12 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center mx-auto text-zinc-400">
              <Upload className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm font-bold text-zinc-200">Drop your Screenplay PDF or DOCX file here</p>
              <p className="text-xs text-zinc-500 mt-1">Stage 1 Architecture Placeholder • For instant demo, click "USE DEMO SCRIPT" above.</p>
            </div>
            <button
              onClick={handleLoadDemo}
              className="px-4 py-2 bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-amber-400 rounded-lg text-xs font-bold transition-colors inline-block"
            >
              Load "NEON HARBOR" Screenplay
            </button>
          </div>
        )}

        <div className="pt-4 border-t border-zinc-800 flex flex-wrap items-center justify-between gap-3">
          <button
            onClick={onBack}
            className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-semibold rounded-lg transition-colors"
          >
            Back
          </button>

          <div className="flex items-center gap-3">
            <button
              onClick={() => handleAction('LOCAL_SIMULATION')}
              className="px-4 py-2.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700 text-xs font-bold rounded-xl transition-all"
            >
              RUN LOCAL DEMO
            </button>

            {isLiveReady ? (
              <button
                onClick={() => handleAction('AGENTIC_GOOGLE_ADK')}
                className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-zinc-950 font-black text-xs rounded-xl shadow-xl shadow-amber-500/10 transition-all transform hover:scale-105"
              >
                <Sparkles className="w-4 h-4 fill-zinc-950" />
                RUN LIVE AI CREW
                <ArrowRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                onClick={() => handleAction('LOCAL_SIMULATION')}
                className="flex items-center gap-2 px-6 py-3 bg-zinc-800 hover:bg-zinc-700 text-zinc-400 border border-zinc-700 font-bold text-xs rounded-xl transition-all cursor-pointer"
                title="Vertex AI / Parallel Search unconfigured. Running local simulation."
              >
                <Sparkles className="w-4 h-4 text-zinc-400" />
                BUILD PRODUCTION (SIMULATION)
                <ArrowRight className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
