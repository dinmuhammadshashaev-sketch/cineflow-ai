import React from 'react';
import { Sparkles, Plus, Play, ChevronRight } from 'lucide-react';
import { Production } from '../types';

interface HeaderProps {
  currentProduction: Production | null;
  activeView: string;
  onNavigate: (view: string, productionId?: string) => void;
  onBuildProduction: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentProduction,
  activeView,
  onNavigate,
  onBuildProduction
}) => {
  const getViewTitle = () => {
    switch (activeView) {
      case 'overview': return 'Production Overview';
      case 'scenes': return 'Scenes Breakdown';
      case 'crew': return 'Autonomous AI Crew';
      case 'board': return 'Production Board';
      case 'research': return 'External Intelligence Research';
      case 'risks': return 'Risk Audit & Mitigation';
      case 'schedule': return 'Shooting Call Schedule';
      case 'sources': return 'Research Sources & Citations';
      case 'projects': return 'All Productions';
      case 'new-production': return 'Create New Production';
      case 'script': return 'Add Your Screenplay / Story';
      case 'build': return 'Agent Crew Execution';
      case 'settings': return 'System Settings & AI Providers';
      default: return 'Production Workspace';
    }
  };

  return (
    <header className="h-16 border-b border-zinc-800/80 bg-zinc-950/80 backdrop-blur-md px-6 flex items-center justify-between shrink-0 select-none">
      <div className="flex items-center gap-3">
        <span className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">
          {currentProduction ? currentProduction.title : 'CineFlow Studio'}
        </span>
        <ChevronRight className="w-3.5 h-3.5 text-zinc-600" />
        <h1 className="text-base font-bold text-zinc-100">{getViewTitle()}</h1>
        {currentProduction && (
          <span className="ml-2 text-xs font-medium px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20">
            {currentProduction.status}
          </span>
        )}
      </div>

      <div className="flex items-center gap-3">
        {currentProduction && activeView !== 'build' && activeView !== 'script' && (
          <button
            onClick={onBuildProduction}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-zinc-950 font-extrabold text-xs rounded-lg shadow-lg shadow-amber-500/10 transition-all transform hover:scale-[1.02] active:scale-[0.98]"
          >
            <Sparkles className="w-4 h-4 fill-zinc-950" />
            BUILD MY PRODUCTION
          </button>
        )}

        <button
          onClick={() => onNavigate('new-production')}
          className="flex items-center gap-1.5 px-3 py-2 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-200 text-xs font-semibold rounded-lg transition-colors"
        >
          <Plus className="w-3.5 h-3.5 text-zinc-400" />
          New Production
        </button>
      </div>
    </header>
  );
};
