import React from 'react';
import {
  Film,
  Kanban,
  Search,
  AlertTriangle,
  Calendar,
  Sparkles,
  Zap,
  ArrowRight,
  ShieldAlert,
  Clock,
  CheckCircle2,
  AlertOctagon,
  FileText,
  Clapperboard,
  BookOpen,
  Eye,
  Briefcase,
  Layers,
  PlusCircle,
  Cpu,
  Globe,
  Info,
  Check
} from 'lucide-react';
import {
  Production,
  Scene,
  ProductionTask,
  ResearchQuestion,
  Risk,
  ContinuityIssue,
  ShootDay,
  Source,
  WorkflowRun
} from '../types';
import {
  isDemoProduction,
  getDashboardMetrics,
  getDashboardRunSummary,
  getDashboardPriorityActions,
  getProductionPlanStatus,
  READINESS_SCORE_EXPLANATION
} from '../lib/dashboard';
import { CINEFLOW_AGENT_PIPELINE } from '../lib/pipeline';

interface DashboardViewProps {
  production: Production | null;
  scenes?: Scene[];
  tasks?: ProductionTask[];
  research?: ResearchQuestion[];
  risks?: Risk[];
  continuity?: ContinuityIssue[];
  shootDays?: ShootDay[];
  sources?: Source[];
  latestRun?: WorkflowRun | null;
  onNavigate: (view: string, productionId?: string) => void;
  onBuildProduction?: () => void;
  onUpdateRiskStatus?: (riskId: string, status: Risk['status']) => void;
}

const ROLE_CAPABILITY_LABELS: Record<string, string> = {
  Supervisor: 'Production strategy',
  'Script Analyst': 'Scene breakdown',
  Director: 'Creative requirements',
  Producer: 'Tasks & logistics',
  Research: 'Grounded web research',
  Continuity: 'Continuity conflicts',
  Risk: 'Safety & operational risks',
  Scheduler: 'Shoot-day planning'
};

const AGENT_ICON_MAP: Record<string, React.ElementType> = {
  Supervisor: ShieldAlert,
  'Script Analyst': FileText,
  Director: Clapperboard,
  Producer: Briefcase,
  Research: Search,
  Continuity: Eye,
  Risk: AlertTriangle,
  Scheduler: Calendar
};

export const DashboardView: React.FC<DashboardViewProps> = ({
  production,
  scenes = [],
  tasks = [],
  research = [],
  risks = [],
  continuity = [],
  shootDays = [],
  sources = [],
  latestRun = null,
  onNavigate,
  onBuildProduction,
  onUpdateRiskStatus
}) => {
  const isDemo = isDemoProduction(production);
  const metrics = getDashboardMetrics(production, scenes, tasks, research, risks, shootDays, sources);
  const runSummary = getDashboardRunSummary(latestRun);
  const priorityActions = getDashboardPriorityActions(risks, research, tasks, continuity);
  const planStatus = getProductionPlanStatus(production, latestRun);

  // ----------------------------------------------------
  // Section 12: EMPTY / ONBOARDING STATE
  // ----------------------------------------------------
  if (!production) {
    return (
      <div className="p-6 max-w-5xl mx-auto space-y-8 pb-16 animate-in fade-in duration-200">
        <div className="bg-gradient-to-r from-zinc-900 via-zinc-900/90 to-zinc-950 border border-zinc-800 rounded-2xl p-8 shadow-2xl space-y-6 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

          <div className="space-y-3 relative z-10">
            <div className="flex items-center gap-2">
              <span className="text-xs font-black tracking-widest px-2.5 py-1 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20 uppercase">
                CINEFLOW AI
              </span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
              AUTONOMOUS AI PRODUCTION CREW
            </h1>
            <p className="text-lg font-medium text-amber-300/90 leading-relaxed max-w-2xl">
              Turn a screenplay into a research-backed, risk-aware, production-ready filmmaking plan.
            </p>
            <p className="text-sm text-zinc-400 max-w-2xl leading-relaxed">
              8 specialized AI agents analyze the script, research real-world constraints, detect production risks, and build the shoot schedule.
            </p>
          </div>

          <div className="pt-4 flex flex-col sm:flex-row items-stretch sm:items-center gap-4 relative z-10">
            <button
              onClick={() => onNavigate('new-production')}
              className="flex items-center justify-center gap-2 px-6 py-3.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-zinc-950 font-black text-xs uppercase tracking-wider rounded-xl shadow-lg transition-transform transform hover:scale-105"
            >
              <PlusCircle className="w-4 h-4 fill-zinc-950" />
              NEW PRODUCTION
            </button>
            <button
              onClick={() => onNavigate('projects')}
              className="flex items-center justify-center gap-2 px-6 py-3.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-bold text-xs uppercase tracking-wider rounded-xl transition-colors"
            >
              TRY THE DEMO
            </button>
          </div>
        </div>

        {/* Onboarding Guide */}
        <div className="bg-zinc-900/80 border border-zinc-800 rounded-xl p-6 space-y-6">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-amber-400" />
            START YOUR FIRST PRODUCTION
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-4 bg-zinc-950/80 border border-zinc-800/80 rounded-lg space-y-2">
              <div className="w-7 h-7 rounded-full bg-amber-500/10 text-amber-400 font-black text-xs flex items-center justify-center border border-amber-500/20">
                1
              </div>
              <h3 className="text-xs font-bold text-zinc-100">Add production details</h3>
              <p className="text-[11px] text-zinc-400">Set title, production type, target location, and budget.</p>
            </div>

            <div className="p-4 bg-zinc-950/80 border border-zinc-800/80 rounded-lg space-y-2">
              <div className="w-7 h-7 rounded-full bg-amber-500/10 text-amber-400 font-black text-xs flex items-center justify-center border border-amber-500/20">
                2
              </div>
              <h3 className="text-xs font-bold text-zinc-100">Add screenplay</h3>
              <p className="text-[11px] text-zinc-400">Paste your formatted screenplay or select a preset sample.</p>
            </div>

            <div className="p-4 bg-zinc-950/80 border border-zinc-800/80 rounded-lg space-y-2">
              <div className="w-7 h-7 rounded-full bg-amber-500/10 text-amber-400 font-black text-xs flex items-center justify-center border border-amber-500/20">
                3
              </div>
              <h3 className="text-xs font-bold text-zinc-100">Run the AI crew</h3>
              <p className="text-[11px] text-zinc-400">Watch all 8 specialized agents execute the breakdown in real-time.</p>
            </div>

            <div className="p-4 bg-zinc-950/80 border border-zinc-800/80 rounded-lg space-y-2">
              <div className="w-7 h-7 rounded-full bg-amber-500/10 text-amber-400 font-black text-xs flex items-center justify-center border border-amber-500/20">
                4
              </div>
              <h3 className="text-xs font-bold text-zinc-100">Review grounded plan</h3>
              <p className="text-[11px] text-zinc-400">Audit grounded permits, hazards, call sheets, and board tasks.</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ----------------------------------------------------
  // MAIN DASHBOARD FOR ACTIVE PRODUCTION
  // ----------------------------------------------------
  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto pb-16 animate-in fade-in duration-200">
      {/* 1. First-Screen Product Hero & Primary Judge CTA */}
      <div className="bg-gradient-to-r from-zinc-900 via-zinc-900/90 to-zinc-950 border border-zinc-800 rounded-2xl p-6 shadow-xl flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-amber-500/5 rounded-full blur-3xl pointer-events-none" />

        <div className="space-y-3 relative z-10 max-w-2xl">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[10px] font-black tracking-widest px-2.5 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20 uppercase">
              CINEFLOW AI
            </span>
            <span className="text-xs font-extrabold text-zinc-300 uppercase tracking-wider">
              AUTONOMOUS AI PRODUCTION CREW
            </span>
            {isDemo && (
              <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-zinc-800 text-amber-300 border border-amber-500/30">
                DEMO PRODUCTION
              </span>
            )}
          </div>

          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            {production.title}
          </h1>

          <p className="text-sm font-semibold text-amber-300/90 leading-snug">
            Turn a screenplay into a research-backed, risk-aware, production-ready filmmaking plan.
          </p>

          <p className="text-xs text-zinc-400 leading-relaxed">
            8 specialized AI agents analyze the script, research real-world constraints, detect production risks, and build the shoot schedule.
          </p>

          <div className="pt-2 flex items-center gap-3">
            <button
              onClick={onBuildProduction || (() => onNavigate('script', production.id))}
              className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-zinc-950 font-black text-xs uppercase tracking-wider rounded-xl shadow-lg transition-transform transform hover:scale-105"
            >
              <Sparkles className="w-4 h-4 fill-zinc-950" />
              BUILD MY PRODUCTION
            </button>
            <button
              onClick={() => onNavigate('script', production.id)}
              className="px-4 py-2.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-bold text-xs uppercase tracking-wider rounded-xl transition-colors"
            >
              TRY THE DEMO
            </button>
          </div>
          <p className="text-[11px] text-zinc-400 italic">
            Start with a screenplay and let the AI crew build the production plan.
          </p>
        </div>

        {/* Readiness Gauge & Status Box */}
        <div className="flex flex-col items-center lg:items-end gap-3 shrink-0 relative z-10 w-full lg:w-auto">
          <div className="bg-zinc-950/80 p-4 rounded-xl border border-zinc-800/80 w-full lg:w-64 space-y-2 text-center lg:text-left">
            <div className="flex items-center justify-between">
              <span className="text-xs text-zinc-400 font-medium uppercase tracking-wider">Production Readiness</span>
              <span className="text-2xl font-black text-amber-400 font-mono">{metrics.readinessScore}%</span>
            </div>
            <div className="w-full bg-zinc-800 h-2 rounded-full overflow-hidden">
              <div
                className={`h-full transition-all duration-500 ${
                  metrics.readinessScore >= 80
                    ? 'bg-emerald-500'
                    : metrics.readinessScore >= 60
                    ? 'bg-amber-500'
                    : 'bg-red-500'
                }`}
                style={{ width: `${metrics.readinessScore}%` }}
              />
            </div>
            <p className="text-[10px] text-zinc-400 leading-normal pt-1 border-t border-zinc-800/80">
              {READINESS_SCORE_EXPLANATION}
            </p>
          </div>
        </div>
      </div>

      {/* 2. PRODUCTION PLAN STATUS CARD (Ready or Interrupted) */}
      {planStatus === 'PRODUCTION_PLAN_READY' && (
        <div className="p-4 bg-emerald-950/40 border border-emerald-500/30 rounded-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
            <div>
              <span className="text-xs font-black text-emerald-400 uppercase tracking-wider">
                PRODUCTION PLAN READY
              </span>
              <p className="text-xs text-zinc-300 mt-0.5">
                All 8 specialized agents completed the autonomous workflow cleanly.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-4 text-xs font-mono text-zinc-300 bg-zinc-950/60 px-3 py-1.5 rounded-lg border border-zinc-800">
            <span>{metrics.sceneCount} Scenes</span>
            <span>•</span>
            <span>{metrics.taskCount} Tasks</span>
            <span>•</span>
            <span>{metrics.realSourceCount} Grounded Sources</span>
            <span>•</span>
            <span>{metrics.openRiskCount} Open Risks</span>
            <span>•</span>
            <span>{metrics.shootDayCount} Shoot Days</span>
          </div>
        </div>
      )}

      {planStatus === 'INTERRUPTED' && (
        <div className="p-4 bg-red-950/40 border border-red-500/30 rounded-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <AlertOctagon className="w-5 h-5 text-red-400 shrink-0" />
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-black text-red-400 uppercase tracking-wider">
                  AI CREW RUN INTERRUPTED
                </span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-red-500/20 text-red-300">
                  {runSummary.completedAgentsCount} / 8 Completed
                </span>
              </div>
              <p className="text-xs text-zinc-300 mt-0.5">
                Failed at role: <strong className="text-red-300 font-mono">{runSummary.failedAgentRole || 'Unknown Role'}</strong>. Completed production work has been preserved.
              </p>
            </div>
          </div>
          <button
            onClick={() => onNavigate('script', production.id)}
            className="px-3.5 py-1.5 bg-red-500/20 hover:bg-red-500/30 text-red-300 border border-red-500/40 rounded-lg text-xs font-bold transition-colors shrink-0"
          >
            Review Script & Retry
          </button>
        </div>
      )}

      {/* 3. Metrics Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <div
          onClick={() => onNavigate('scenes', production.id)}
          className="bg-zinc-900/80 border border-zinc-800 hover:border-amber-500/40 rounded-xl p-4 cursor-pointer transition-all hover:bg-zinc-900"
        >
          <div className="flex items-center justify-between text-zinc-400 mb-2">
            <span className="text-xs font-semibold">Scenes</span>
            <Film className="w-4 h-4 text-blue-400" />
          </div>
          <div className="text-2xl font-black text-white font-mono">{metrics.sceneCount}</div>
          <div className="text-[11px] text-zinc-400 mt-1">
            {scenes.filter((s) => s.dayNight === 'NIGHT').length} Night / {scenes.filter((s) => s.intExt === 'EXT').length} Ext
          </div>
        </div>

        <div
          onClick={() => onNavigate('board', production.id)}
          className="bg-zinc-900/80 border border-zinc-800 hover:border-amber-500/40 rounded-xl p-4 cursor-pointer transition-all hover:bg-zinc-900"
        >
          <div className="flex items-center justify-between text-zinc-400 mb-2">
            <span className="text-xs font-semibold">Tasks</span>
            <Kanban className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-black text-white font-mono">{metrics.taskCount}</div>
          <div className="text-[11px] text-zinc-400 mt-1">
            {tasks.filter((t) => t.status === 'DONE').length} completed
          </div>
        </div>

        <div
          onClick={() => onNavigate('research', production.id)}
          className="bg-zinc-900/80 border border-zinc-800 hover:border-amber-500/40 rounded-xl p-4 cursor-pointer transition-all hover:bg-zinc-900"
        >
          <div className="flex items-center justify-between text-zinc-400 mb-2">
            <span className="text-xs font-semibold">Research</span>
            <Search className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-black text-white font-mono">{research.length}</div>
          <div className="text-[11px] text-zinc-400 mt-1">
            {research.filter((r) => r.status === 'FOUND').length} verified
          </div>
        </div>

        <div
          onClick={() => onNavigate('risks', production.id)}
          className="bg-zinc-900/80 border border-zinc-800 hover:border-red-500/40 rounded-xl p-4 cursor-pointer transition-all hover:bg-zinc-900"
        >
          <div className="flex items-center justify-between text-zinc-400 mb-2">
            <span className="text-xs font-semibold">Open Risks</span>
            <AlertTriangle className="w-4 h-4 text-red-400" />
          </div>
          <div className="text-2xl font-black text-red-400 font-mono">{metrics.openRiskCount}</div>
          <div className="text-[11px] text-zinc-400 mt-1">
            {metrics.criticalRiskCount} Critical severity
          </div>
        </div>

        <div
          onClick={() => onNavigate('scenes', production.id)}
          className="bg-zinc-900/80 border border-zinc-800 hover:border-amber-500/40 rounded-xl p-4 cursor-pointer transition-all hover:bg-zinc-900"
        >
          <div className="flex items-center justify-between text-zinc-400 mb-2">
            <span className="text-xs font-semibold">Continuity</span>
            <ShieldAlert className="w-4 h-4 text-pink-400" />
          </div>
          <div className="text-2xl font-black text-white font-mono">{continuity.length}</div>
          <div className="text-[11px] text-zinc-400 mt-1">
            {continuity.filter((c) => c.status === 'OPEN').length} pending audit
          </div>
        </div>

        <div
          onClick={() => onNavigate('schedule', production.id)}
          className="bg-zinc-900/80 border border-zinc-800 hover:border-amber-500/40 rounded-xl p-4 cursor-pointer transition-all hover:bg-zinc-900"
        >
          <div className="flex items-center justify-between text-zinc-400 mb-2">
            <span className="text-xs font-semibold">Shoot Days</span>
            <Calendar className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="text-2xl font-black text-white font-mono">{metrics.shootDayCount}</div>
          <div className="text-[11px] text-zinc-400 mt-1">
            {production.targetShootingDates || 'Target Schedule'}
          </div>
        </div>
      </div>

      {/* 4. EXPLAIN THE 8-AGENT SYSTEM & PARALLEL DIFFERENTIATOR */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 8-Agent Crew Architecture Grid */}
        <div className="lg:col-span-2 bg-zinc-900/90 border border-zinc-800 rounded-xl p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-zinc-800/80 pb-3">
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Cpu className="w-4 h-4 text-amber-400" />
                YOUR AI PRODUCTION CREW
              </h3>
              <p className="text-[11px] text-zinc-400 mt-0.5">
                8 specialized roles executing in deterministic pipeline sequence.
              </p>
            </div>
            <button
              onClick={() => onNavigate('crew', production.id)}
              className="text-xs text-amber-400 hover:underline flex items-center gap-1 font-medium"
            >
              View Crew Logs <ArrowRight className="w-3 h-3" />
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {CINEFLOW_AGENT_PIPELINE.map((pRole) => {
              const IconComp = AGENT_ICON_MAP[pRole.role] || Cpu;
              const capLabel = ROLE_CAPABILITY_LABELS[pRole.role] || pRole.responsibility;

              return (
                <div
                  key={pRole.role}
                  className="p-3 bg-zinc-950/70 border border-zinc-800/80 rounded-lg space-y-1.5 transition-colors hover:border-zinc-700"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono text-zinc-400 font-bold">0{pRole.id}</span>
                    <IconComp className="w-3.5 h-3.5" style={{ color: pRole.avatarColor }} />
                  </div>
                  <h4 className="text-xs font-bold text-zinc-100">{pRole.role}</h4>
                  <p className="text-[11px] text-zinc-400 line-clamp-2 leading-snug">{capLabel}</p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Grounded Web Research Parallel Explanation */}
        <div className="bg-zinc-900/90 border border-zinc-800 rounded-xl p-5 space-y-3 flex flex-col justify-between">
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-amber-400">
              <Globe className="w-4 h-4" />
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">GROUNDED WEB RESEARCH</h3>
            </div>
            <p className="text-xs text-zinc-300 leading-relaxed">
              ResearchAgent uses Parallel Search to investigate current permits, regulations and production constraints before Risk and Scheduler agents finalize the plan.
            </p>
          </div>

          <div className="pt-3 border-t border-zinc-800/80">
            {runSummary.isParallelVerified ? (
              <div className="p-2.5 bg-emerald-950/40 border border-emerald-500/30 rounded-lg flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                <span className="text-xs font-bold text-emerald-300 font-mono">Parallel Search verified</span>
              </div>
            ) : (
              <div className="p-2.5 bg-zinc-950/60 border border-zinc-800/80 rounded-lg flex items-center gap-2">
                <Info className="w-4 h-4 text-zinc-400 shrink-0" />
                <span className="text-xs text-zinc-400">Architecture capability • Run workflow to trigger live research</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 5. Main Content Layout: Priorities, Provenance & Activities */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Priority Actions & Critical Risks */}
        <div className="lg:col-span-2 space-y-6">
          {/* Priority Actions */}
          <div className="bg-zinc-900/90 border border-zinc-800 rounded-xl p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Zap className="w-4 h-4 text-amber-400" />
                WHAT NEEDS ATTENTION BEFORE SHOOTING?
              </h3>
              <button
                onClick={() => onNavigate('risks', production.id)}
                className="text-xs text-amber-400 hover:underline flex items-center gap-1 font-medium"
              >
                Review Risks <ArrowRight className="w-3 h-3" />
              </button>
            </div>

            {priorityActions.length > 0 ? (
              <div className="space-y-2.5">
                {priorityActions.map((item) => (
                  <div
                    key={item.id}
                    onClick={() => onNavigate(item.navView, production.id)}
                    className="p-3 bg-zinc-950/70 border border-zinc-800/80 rounded-lg flex items-start justify-between gap-3 cursor-pointer hover:border-amber-500/40 transition-all"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span
                          className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                            item.severity === 'CRITICAL'
                              ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                              : item.severity === 'HIGH'
                              ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                              : 'bg-zinc-800 text-zinc-400'
                          }`}
                        >
                          {item.badgeLabel}
                        </span>
                        <span className="text-xs text-zinc-400 font-mono uppercase">{item.status}</span>
                      </div>
                      <p className="text-xs font-semibold text-zinc-100">{item.title}</p>
                      <p className="text-[11px] text-zinc-400 line-clamp-1">{item.description}</p>
                    </div>
                    <ArrowRight className="w-4 h-4 text-zinc-500 shrink-0 self-center" />
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-4 bg-zinc-950/50 border border-zinc-800/50 rounded-lg text-center text-xs text-zinc-400">
                All critical risks, research questions, and tasks are resolved.
              </div>
            )}
          </div>

          {/* Shooting Days Outline */}
          <div className="bg-zinc-900/90 border border-zinc-800 rounded-xl p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Calendar className="w-4 h-4 text-cyan-400" />
                Shooting Days Outline
              </h3>
              <button
                onClick={() => onNavigate('schedule', production.id)}
                className="text-xs text-cyan-400 hover:underline flex items-center gap-1 font-medium"
              >
                Full Call Sheet <ArrowRight className="w-3 h-3" />
              </button>
            </div>

            {shootDays.length > 0 ? (
              <div className="space-y-2.5">
                {shootDays.map((sd) => (
                  <div key={sd.id} className="p-3 bg-zinc-950/60 border border-zinc-800/80 rounded-lg space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-extrabold text-xs text-zinc-100">Day {sd.dayNumber}</span>
                      <span className="text-[10px] font-mono text-cyan-400 bg-cyan-950/40 border border-cyan-800/50 px-1.5 py-0.5 rounded">
                        {sd.dayNightFocus}
                      </span>
                    </div>
                    <p className="text-xs text-zinc-300">{sd.locationName}</p>
                    <div className="text-[10px] text-zinc-400 font-mono">
                      Scenes: {sd.sceneNumbers.join(', ')} • Est. {sd.estimatedHours} hrs
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-4 bg-zinc-950/50 border border-zinc-800/50 rounded-lg text-center text-xs text-zinc-400">
                No shoot days scheduled yet.
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Runtime Provenance Card & Agent Activity */}
        <div className="space-y-6">
          {/* Runtime Provenance Card */}
          <div className="bg-zinc-900/90 border border-zinc-800 rounded-xl p-5 space-y-3">
            <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-wider flex items-center justify-between">
              <span>LAST AI CREW RUN</span>
              <span className="text-[10px] font-mono text-amber-400">
                {runSummary.provenanceLabel}
              </span>
            </h3>

            {runSummary.hasRun ? (
              <div className="space-y-2 text-xs">
                <div className="p-3 bg-zinc-950/80 border border-zinc-800 rounded-lg space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-zinc-200">{runSummary.provenanceLabel}</span>
                    <span className="text-[10px] font-mono text-zinc-400">{runSummary.subLabel}</span>
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-zinc-400 pt-1 border-t border-zinc-800/80">
                    <span>Status: <strong className="text-zinc-200 font-mono">{runSummary.workflowStatus}</strong></span>
                    <span>Completed: <strong className="text-amber-400 font-mono">{runSummary.completedAgentsCount} / 8</strong></span>
                  </div>

                  {runSummary.failedAgentRole && (
                    <p className="text-[11px] text-red-400 font-mono">
                      Failed at: {runSummary.failedAgentRole}
                    </p>
                  )}

                  {runSummary.isParallelVerified && (
                    <div className="pt-1.5 flex items-center gap-1.5 text-[11px] font-mono text-emerald-400">
                      <Check className="w-3.5 h-3.5" />
                      <span>Parallel Search verified</span>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="p-4 bg-zinc-950/60 border border-zinc-800/80 rounded-lg text-center text-xs text-zinc-400 font-mono">
                NO AI CREW RUN YET
              </div>
            )}
          </div>

          {/* Recent Agent Activity */}
          <div className="bg-zinc-900/90 border border-zinc-800 rounded-xl p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Clock className="w-4 h-4 text-amber-400" />
                Recent Agent Activity
              </h3>
              <button
                onClick={() => onNavigate('crew', production.id)}
                className="text-xs text-amber-400 hover:underline flex items-center gap-1 font-medium"
              >
                Crew Logs <ArrowRight className="w-3 h-3" />
              </button>
            </div>

            {latestRun && latestRun.activities && latestRun.activities.length > 0 ? (
              <div className="space-y-2.5">
                {latestRun.activities.slice(0, 5).map((act) => (
                  <div key={act.id} className="p-2.5 bg-zinc-950/60 border border-zinc-800/80 rounded-lg text-xs space-y-1">
                    <div className="flex items-center justify-between text-zinc-400">
                      <span className="font-bold text-amber-400">{act.agentRole}</span>
                      <span className="text-[10px] font-mono text-zinc-400">{act.timestamp}</span>
                    </div>
                    <p className="text-zinc-200">{act.actionSummary}</p>
                    {act.resultDetails && (
                      <p className="text-[11px] text-zinc-400 font-mono italic">{act.resultDetails}</p>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-4 bg-zinc-950/60 border border-zinc-800/80 rounded-lg text-center text-xs text-zinc-400 font-mono">
                NO AI CREW RUN YET
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
