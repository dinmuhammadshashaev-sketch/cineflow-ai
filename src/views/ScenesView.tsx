import React, { useState } from 'react';
import {
  Film,
  Sun,
  Moon,
  Search,
  Users,
  Box,
  AlertTriangle,
  Clock,
  X,
  Sparkles,
  MapPin,
  Calendar,
  Layers,
  CheckCircle2
} from 'lucide-react';
import { Scene, Risk, ResearchQuestion, ContinuityIssue } from '../types';

interface ScenesViewProps {
  scenes: Scene[];
  risks: Risk[];
  research: ResearchQuestion[];
  continuity: ContinuityIssue[];
}

export const ScenesView: React.FC<ScenesViewProps> = ({
  scenes,
  risks,
  research,
  continuity
}) => {
  const [selectedScene, setSelectedScene] = useState<Scene | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterIntExt, setFilterIntExt] = useState<string>('ALL');
  const [filterDayNight, setFilterDayNight] = useState<string>('ALL');

  const filteredScenes = scenes.filter((scene) => {
    const matchesSearch =
      scene.heading.toLowerCase().includes(searchTerm.toLowerCase()) ||
      scene.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
      scene.characters.some(c => c.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesIntExt = filterIntExt === 'ALL' || scene.intExt === filterIntExt;
    const matchesDayNight = filterDayNight === 'ALL' || scene.dayNight === filterDayNight;

    return matchesSearch && matchesIntExt && matchesDayNight;
  });

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6 pb-16 animate-in fade-in duration-200">
      {/* Search & Filter Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-zinc-900 border border-zinc-800 p-4 rounded-xl">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-zinc-500 absolute left-3 top-3" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search heading, location, characters..."
            className="w-full bg-zinc-950 border border-zinc-800 rounded-lg pl-9 pr-3 py-2 text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-amber-500"
          />
        </div>

        <div className="flex items-center gap-2">
          <select
            value={filterIntExt}
            onChange={(e) => setFilterIntExt(e.target.value)}
            className="bg-zinc-950 border border-zinc-800 text-zinc-300 text-xs rounded-lg px-3 py-2 focus:outline-none focus:border-amber-500"
          >
            <option value="ALL">All Environments (INT/EXT)</option>
            <option value="INT">INT (Interior)</option>
            <option value="EXT">EXT (Exterior)</option>
          </select>

          <select
            value={filterDayNight}
            onChange={(e) => setFilterDayNight(e.target.value)}
            className="bg-zinc-950 border border-zinc-800 text-zinc-300 text-xs rounded-lg px-3 py-2 focus:outline-none focus:border-amber-500"
          >
            <option value="ALL">All Lighting (DAY/NIGHT)</option>
            <option value="DAY">DAY</option>
            <option value="NIGHT">NIGHT</option>
            <option value="DAWN">DAWN</option>
          </select>
        </div>
      </div>

      {/* Scenes List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredScenes.map((scene) => {
          const sceneRisks = risks.filter(r => r.sceneNumber === scene.sceneNumber);
          const sceneResearch = research.filter(r => r.sceneNumber === scene.sceneNumber);
          const sceneContinuity = continuity.filter(c => c.sceneNumbers.includes(scene.sceneNumber));

          return (
            <div
              key={scene.id}
              onClick={() => setSelectedScene(scene)}
              className="bg-zinc-900 border border-zinc-800 hover:border-amber-500/40 rounded-xl p-5 space-y-3 cursor-pointer transition-all hover:bg-zinc-900/90 group flex flex-col justify-between"
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[10px] font-black font-mono px-2 py-0.5 rounded bg-zinc-800 text-amber-400 border border-zinc-700">
                    SCENE {scene.sceneNumber}
                  </span>
                  <div className="flex items-center gap-1.5 text-[10px] font-mono text-zinc-400">
                    <span className="px-1.5 py-0.5 rounded bg-zinc-950 border border-zinc-800">{scene.intExt}</span>
                    <span className="px-1.5 py-0.5 rounded bg-zinc-950 border border-zinc-800 flex items-center gap-1">
                      {scene.dayNight === 'NIGHT' ? <Moon className="w-3 h-3 text-indigo-400" /> : <Sun className="w-3 h-3 text-amber-400" />}
                      {scene.dayNight}
                    </span>
                  </div>
                </div>

                <h3 className="text-sm font-bold text-white group-hover:text-amber-400 transition-colors line-clamp-1">
                  {scene.heading}
                </h3>

                <p className="text-xs text-zinc-300 line-clamp-2">{scene.summary}</p>
              </div>

              <div className="pt-3 border-t border-zinc-800/80 space-y-2">
                <div className="flex items-center justify-between text-[11px] text-zinc-400">
                  <span className="flex items-center gap-1">
                    <Users className="w-3.5 h-3.5 text-blue-400" />
                    {scene.characters.join(', ')}
                  </span>
                  <span className="font-mono text-zinc-500">{scene.estimatedMinutes}m</span>
                </div>

                <div className="flex items-center justify-between gap-2 pt-1 text-[10px]">
                  <span className={`font-mono px-1.5 py-0.5 rounded ${
                    scene.complexity === 'HIGH' || scene.complexity === 'EXTREME'
                      ? 'bg-red-500/10 text-red-400 border border-red-500/20'
                      : 'bg-zinc-800 text-zinc-400'
                  }`}>
                    {scene.complexity} COMPLEXITY
                  </span>

                  <div className="flex items-center gap-2">
                    {sceneRisks.length > 0 && (
                      <span className="text-red-400 font-bold flex items-center gap-0.5">
                        <AlertTriangle className="w-3 h-3" /> {sceneRisks.length}
                      </span>
                    )}
                    {sceneResearch.length > 0 && (
                      <span className="text-amber-400 font-bold flex items-center gap-0.5">
                        <Search className="w-3 h-3" /> {sceneResearch.length}
                      </span>
                    )}
                    {sceneContinuity.length > 0 && (
                      <span className="text-pink-400 font-bold flex items-center gap-0.5">
                        <Layers className="w-3 h-3" /> {sceneContinuity.length}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Slide-over Scene Detail Modal Panel */}
      {selectedScene && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/80 backdrop-blur-sm">
          <div className="w-full max-w-2xl bg-zinc-950 border-l border-zinc-800 h-full overflow-y-auto p-6 space-y-6 shadow-2xl animate-in slide-in-from-right duration-200">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-4">
              <div>
                <span className="text-[10px] font-black font-mono text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                  SCENE {selectedScene.sceneNumber} DETAIL
                </span>
                <h2 className="text-lg font-bold text-white mt-1">{selectedScene.heading}</h2>
              </div>
              <button
                onClick={() => setSelectedScene(null)}
                className="p-2 text-zinc-400 hover:text-white bg-zinc-900 rounded-lg border border-zinc-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div className="p-4 bg-zinc-900 border border-zinc-800 rounded-xl space-y-2">
                <h4 className="text-xs font-bold text-zinc-400 uppercase tracking-wider font-mono">Summary</h4>
                <p className="text-sm text-zinc-200 leading-relaxed">{selectedScene.summary}</p>
              </div>

              {selectedScene.directorNotes && (
                <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-xl space-y-1">
                  <h4 className="text-xs font-bold text-amber-400 uppercase tracking-wider font-mono flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-amber-400" /> Director Creative Notes
                  </h4>
                  <p className="text-xs text-zinc-200 italic">{selectedScene.directorNotes}</p>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-zinc-900 border border-zinc-800 rounded-xl space-y-2">
                  <h4 className="text-xs font-bold text-zinc-400 uppercase tracking-wider font-mono flex items-center gap-1.5">
                    <Users className="w-3.5 h-3.5 text-blue-400" /> Cast Requirements
                  </h4>
                  <ul className="space-y-1 text-xs text-zinc-300">
                    {selectedScene.characters.map((c, i) => (
                      <li key={i} className="flex items-center gap-1.5">
                        <div className="w-1.5 h-1.5 bg-blue-400 rounded-full" /> {c}
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="p-4 bg-zinc-900 border border-zinc-800 rounded-xl space-y-2">
                  <h4 className="text-xs font-bold text-zinc-400 uppercase tracking-wider font-mono flex items-center gap-1.5">
                    <Box className="w-3.5 h-3.5 text-amber-400" /> Key Props & Dressing
                  </h4>
                  <ul className="space-y-1 text-xs text-zinc-300">
                    {selectedScene.props.map((p, i) => (
                      <li key={i} className="flex items-center gap-1.5">
                        <div className="w-1.5 h-1.5 bg-amber-400 rounded-full" /> {p}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {selectedScene.specialRequirements.length > 0 && (
                <div className="p-4 bg-zinc-900 border border-zinc-800 rounded-xl space-y-2">
                  <h4 className="text-xs font-bold text-zinc-400 uppercase tracking-wider font-mono">Special Production Needs</h4>
                  <div className="flex flex-wrap gap-2">
                    {selectedScene.specialRequirements.map((req, i) => (
                      <span key={i} className="text-xs font-mono bg-zinc-950 px-2.5 py-1 rounded border border-zinc-800 text-zinc-300">
                        {req}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
