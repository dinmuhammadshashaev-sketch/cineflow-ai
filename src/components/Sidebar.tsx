import React from 'react';
import {
  Clapperboard,
  LayoutDashboard,
  Film,
  Users,
  Kanban,
  Search,
  AlertTriangle,
  Calendar,
  BookOpen,
  Settings,
  FolderKanban,
  PlusCircle,
  Zap,
  Sparkles,
  FileText
} from 'lucide-react';
import { Production } from '../types';
import { isDemoProduction } from '../lib/dashboard';

interface SidebarProps {
  currentProduction: Production | null;
  activeView: string;
  onNavigate: (view: string, productionId?: string) => void;
  readinessScore: number;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentProduction,
  activeView,
  onNavigate,
  readinessScore
}) => {
  const prodId = currentProduction?.id;
  const isDemo = isDemoProduction(currentProduction);

  const sections = [
    {
      title: 'Overview',
      items: [
        { id: 'overview', label: 'Overview', icon: LayoutDashboard }
      ]
    },
    {
      title: 'PRE-PRODUCTION',
      items: [
        { id: 'script', label: 'Script', icon: FileText },
        { id: 'scenes', label: 'Scenes', icon: Film },
        { id: 'crew', label: 'AI Crew', icon: Users }
      ]
    },
    {
      title: 'PRODUCTION INTELLIGENCE',
      items: [
        { id: 'research', label: 'Research', icon: Search },
        { id: 'sources', label: 'Sources', icon: BookOpen },
        { id: 'risks', label: 'Risks', icon: AlertTriangle }
      ]
    },
    {
      title: 'EXECUTION',
      items: [
        { id: 'board', label: 'Board', icon: Kanban },
        { id: 'schedule', label: 'Schedule', icon: Calendar }
      ]
    }
  ];

  return (
    <aside className="w-64 bg-zinc-950 border-r border-zinc-800/80 flex flex-col h-screen shrink-0 select-none">
      {/* Brand Header */}
      <div className="p-4 border-b border-zinc-800/80 flex items-center justify-between">
        <div
          onClick={() => onNavigate('projects')}
          className="flex items-center gap-2.5 cursor-pointer group"
        >
          <div className="p-2 bg-gradient-to-br from-amber-500 to-amber-600 rounded-lg text-zinc-950 shadow-md group-hover:scale-105 transition-transform">
            <Clapperboard className="w-5 h-5 stroke-[2.2]" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-extrabold text-base tracking-tight text-white">CineFlow</span>
              <span className="text-xs font-bold px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20">AI</span>
            </div>
            <p className="text-[10px] text-zinc-400 uppercase tracking-wider font-semibold">Autonomous Crew</p>
          </div>
        </div>
      </div>

      {/* Production Switcher Badge */}
      {currentProduction ? (
        <div className="p-3 mx-3 my-2 bg-zinc-900/90 border border-zinc-800 rounded-lg">
          <div className="flex items-center justify-between text-xs text-zinc-400 mb-1">
            <span className="font-medium text-[11px] uppercase tracking-wider text-amber-400/90">
              {isDemo ? 'DEMO SHOOT' : 'Active Shoot'}
            </span>
            <span className="text-[10px] bg-zinc-800 px-1.5 py-0.5 rounded text-zinc-300 font-mono">
              {currentProduction.type}
            </span>
          </div>
          <p className="text-sm font-semibold text-zinc-100 truncate">{currentProduction.title}</p>
          <div className="mt-2 flex items-center gap-2">
            <button
              onClick={() => onNavigate('script', currentProduction.id)}
              className="text-[11px] text-zinc-400 hover:text-amber-400 flex items-center gap-1 transition-colors"
            >
              <Sparkles className="w-3 h-3 text-amber-400" />
              Build / Re-run Crew
            </button>
          </div>
        </div>
      ) : (
        <div className="p-3 mx-3 my-2">
          <button
            onClick={() => onNavigate('new-production')}
            className="w-full flex items-center justify-center gap-2 py-2 px-3 bg-amber-500 hover:bg-amber-400 text-zinc-950 text-xs font-semibold rounded-lg transition-colors"
          >
            <PlusCircle className="w-4 h-4" />
            New Production
          </button>
        </div>
      )}

      {/* Main Navigation Links Grouped by Mental Model */}
      <nav className="flex-1 px-3 py-2 space-y-4 overflow-y-auto">
        {sections.map((sec) => (
          <div key={sec.title} className="space-y-1">
            <div className="px-2 py-1 text-[10px] uppercase font-bold text-zinc-500 tracking-wider">
              {sec.title}
            </div>
            {sec.items.map((item) => {
              const Icon = item.icon;
              const isActive = activeView === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => onNavigate(item.id, prodId)}
                  disabled={!currentProduction}
                  className={`w-full flex items-center gap-3 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                    isActive
                      ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20 shadow-sm'
                      : currentProduction
                      ? 'text-zinc-400 hover:text-zinc-100 hover:bg-zinc-900/60'
                      : 'text-zinc-600 cursor-not-allowed'
                  }`}
                >
                  <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-amber-400' : 'text-zinc-400'}`} />
                  <span className="truncate">{item.label}</span>
                </button>
              );
            })}
          </div>
        ))}

        <div className="space-y-1 pt-2 border-t border-zinc-800/80">
          <div className="px-2 py-1 text-[10px] uppercase font-bold text-zinc-500 tracking-wider">
            PROJECT
          </div>
          <button
            onClick={() => onNavigate('projects')}
            className={`w-full flex items-center gap-3 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              activeView === 'projects'
                ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                : 'text-zinc-400 hover:text-zinc-100 hover:bg-zinc-900/60'
            }`}
          >
            <FolderKanban className="w-4 h-4 text-zinc-400" />
            <span>All Productions</span>
          </button>
          <button
            onClick={() => onNavigate('settings')}
            className={`w-full flex items-center gap-3 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              activeView === 'settings'
                ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                : 'text-zinc-400 hover:text-zinc-100 hover:bg-zinc-900/60'
            }`}
          >
            <Settings className="w-4 h-4 text-zinc-400" />
            <span>Settings & Engines</span>
          </button>
        </div>
      </nav>

      {/* Production Readiness Gauge Footer */}
      {currentProduction && (
        <div className="p-4 border-t border-zinc-800/80 bg-zinc-900/40">
          <div className="flex items-center justify-between text-xs mb-1.5">
            <span className="text-zinc-400 font-medium flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5 text-amber-400" />
              Shoot Readiness
            </span>
            <span className="font-bold text-amber-400 font-mono">{readinessScore}%</span>
          </div>
          <div className="w-full bg-zinc-800 h-2 rounded-full overflow-hidden">
            <div
              className={`h-full transition-all duration-500 ${
                readinessScore >= 80
                  ? 'bg-emerald-500'
                  : readinessScore >= 60
                  ? 'bg-amber-500'
                  : 'bg-red-500'
              }`}
              style={{ width: `${readinessScore}%` }}
            />
          </div>
        </div>
      )}
    </aside>
  );
};
