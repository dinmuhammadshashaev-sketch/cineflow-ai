import React from 'react';
import { Calendar, Clock, MapPin, AlertTriangle, Users, Sun, Moon } from 'lucide-react';
import { ShootDay, Scene } from '../types';

interface ScheduleViewProps {
  shootDays: ShootDay[];
  scenes: Scene[];
}

export const ScheduleView: React.FC<ScheduleViewProps> = ({ shootDays, scenes }) => {
  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6 pb-16 animate-in fade-in duration-200">
      {/* Schedule Header */}
      <div className="bg-gradient-to-r from-zinc-900 via-zinc-900 to-zinc-950 border border-zinc-800 rounded-2xl p-6 shadow-xl flex items-center justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold px-2 py-0.5 rounded bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5" /> Call Sheet Optimizer
            </span>
          </div>
          <h2 className="text-xl font-extrabold text-white">OPTIMIZED SHOOTING SCHEDULE</h2>
          <p className="text-xs text-zinc-400">
            Scenes grouped by location efficiency, lighting blocks, turnaround rest, and cast availability.
          </p>
        </div>
      </div>

      {/* Days List */}
      <div className="space-y-6">
        {shootDays.map((day) => {
          const dayScenes = scenes.filter(s => day.sceneNumbers.includes(s.sceneNumber));

          return (
            <div key={day.id} className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 space-y-4 shadow-xl">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-zinc-800 pb-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 font-extrabold text-sm font-mono">
                    DAY {day.dayNumber}
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-white">{day.locationName}</h3>
                    <p className="text-xs text-zinc-400 font-mono">{day.date || 'Target Date TBD'}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2 text-xs font-mono">
                  <span className="px-2.5 py-1 rounded bg-zinc-950 border border-zinc-800 text-cyan-400">
                    {day.dayNightFocus}
                  </span>
                  <span className="px-2.5 py-1 rounded bg-zinc-950 border border-zinc-800 text-zinc-300">
                    Est. {day.estimatedHours} Hours
                  </span>
                </div>
              </div>

              {day.warnings && day.warnings.length > 0 && (
                <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-lg text-xs text-amber-300 space-y-1">
                  <span className="font-bold uppercase font-mono text-[10px] flex items-center gap-1 text-amber-400">
                    <AlertTriangle className="w-3.5 h-3.5" /> Day Warnings & Safety Protocol
                  </span>
                  <ul className="list-disc list-inside space-y-0.5">
                    {day.warnings.map((w, idx) => (
                      <li key={idx}>{w}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Scenes Table */}
              <div className="space-y-2">
                <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider font-mono">Scheduled Scenes Sequence</span>
                <div className="space-y-2">
                  {dayScenes.map((sc) => (
                    <div key={sc.id} className="p-3 bg-zinc-950 border border-zinc-800 rounded-lg flex items-center justify-between gap-4">
                      <div className="flex items-center gap-3">
                        <span className="text-xs font-black font-mono px-2 py-0.5 bg-zinc-900 border border-zinc-800 text-amber-400 rounded shrink-0">
                          SC {sc.sceneNumber}
                        </span>
                        <div>
                          <p className="text-xs font-bold text-zinc-100">{sc.heading}</p>
                          <p className="text-[11px] text-zinc-400 line-clamp-1">{sc.summary}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 shrink-0 text-xs font-mono">
                        <span className="text-zinc-400 flex items-center gap-1">
                          <Users className="w-3.5 h-3.5 text-blue-400" /> {sc.characters.length} Cast
                        </span>
                        <span className="text-zinc-500">{sc.estimatedMinutes}m</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
