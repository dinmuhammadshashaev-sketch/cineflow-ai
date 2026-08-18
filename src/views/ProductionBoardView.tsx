import React, { useState } from 'react';
import {
  Kanban,
  Plus,
  CheckCircle2,
  Clock,
  AlertOctagon,
  ChevronRight,
  ChevronLeft,
  Filter
} from 'lucide-react';
import { ProductionTask, TaskStatus, TaskCategory, TaskPriority } from '../types';

interface ProductionBoardViewProps {
  tasks: ProductionTask[];
  onUpdateTaskStatus: (taskId: string, status: TaskStatus) => void;
  onAddTask: (task: Partial<ProductionTask>) => void;
}

export const ProductionBoardView: React.FC<ProductionBoardViewProps> = ({
  tasks,
  onUpdateTaskStatus,
  onAddTask
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [showAddModal, setShowAddModal] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newCategory, setNewCategory] = useState<TaskCategory>('Script Breakdown');
  const [newPriority, setNewPriority] = useState<TaskPriority>('HIGH');
  const [newDescription, setNewDescription] = useState('');

  const columns: { id: TaskStatus; label: string; color: string }[] = [
    { id: 'BACKLOG', label: 'BACKLOG', color: 'border-zinc-700 text-zinc-400' },
    { id: 'TO DO', label: 'TO DO', color: 'border-blue-500/30 text-blue-400' },
    { id: 'IN PROGRESS', label: 'IN PROGRESS', color: 'border-amber-500/30 text-amber-400' },
    { id: 'BLOCKED', label: 'BLOCKED', color: 'border-red-500/30 text-red-400' },
    { id: 'DONE', label: 'DONE', color: 'border-emerald-500/30 text-emerald-400' }
  ];

  const filteredTasks = tasks.filter(
    t => selectedCategory === 'ALL' || t.category === selectedCategory
  );

  const handleCreateTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    onAddTask({
      title: newTitle.trim(),
      category: newCategory,
      priority: newPriority,
      description: newDescription.trim() || 'New production requirement.',
      status: 'TO DO',
      createdAt: new Date().toISOString()
    });

    setNewTitle('');
    setNewDescription('');
    setShowAddModal(false);
  };

  const moveNext = (task: ProductionTask) => {
    const statuses: TaskStatus[] = ['BACKLOG', 'TO DO', 'IN PROGRESS', 'BLOCKED', 'DONE'];
    const idx = statuses.indexOf(task.status);
    if (idx < statuses.length - 1) {
      onUpdateTaskStatus(task.id, statuses[idx + 1]);
    }
  };

  const movePrev = (task: ProductionTask) => {
    const statuses: TaskStatus[] = ['BACKLOG', 'TO DO', 'IN PROGRESS', 'BLOCKED', 'DONE'];
    const idx = statuses.indexOf(task.status);
    if (idx > 0) {
      onUpdateTaskStatus(task.id, statuses[idx - 1]);
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6 pb-16 animate-in fade-in duration-200">
      {/* Board Header & Filter */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-zinc-900 border border-zinc-800 p-4 rounded-xl">
        <div className="flex items-center gap-3">
          <Kanban className="w-5 h-5 text-amber-400" />
          <h2 className="text-base font-bold text-white">Production Kanban Board</h2>
          <span className="text-xs font-mono text-zinc-400">({tasks.length} tasks)</span>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <Filter className="w-3.5 h-3.5 text-zinc-500" />
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="bg-zinc-950 border border-zinc-800 text-zinc-300 text-xs rounded-lg px-3 py-1.5 focus:outline-none focus:border-amber-500"
            >
              <option value="ALL">All Departments</option>
              <option value="Script Breakdown">Script Breakdown</option>
              <option value="Casting">Casting</option>
              <option value="Location & Permits">Location & Permits</option>
              <option value="Art & Props">Art & Props</option>
              <option value="Camera & Lighting">Camera & Lighting</option>
              <option value="Sound">Sound</option>
              <option value="Schedule & Logistics">Schedule & Logistics</option>
              <option value="Safety & Legal">Safety & Legal</option>
            </select>
          </div>

          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-zinc-950 text-xs font-bold rounded-lg transition-colors"
          >
            <Plus className="w-3.5 h-3.5" /> Task
          </button>
        </div>
      </div>

      {/* Kanban Grid Columns */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4 items-start">
        {columns.map((col) => {
          const colTasks = filteredTasks.filter(t => t.status === col.id);

          return (
            <div key={col.id} className="bg-zinc-900/80 border border-zinc-800 rounded-xl p-3 space-y-3 min-h-[500px]">
              <div className={`p-2 border-b font-extrabold text-xs font-mono flex items-center justify-between ${col.color}`}>
                <span>{col.label}</span>
                <span className="bg-zinc-950 px-2 py-0.5 rounded text-zinc-300">{colTasks.length}</span>
              </div>

              <div className="space-y-3">
                {colTasks.map((task) => (
                  <div key={task.id} className="p-3 bg-zinc-950 border border-zinc-800 rounded-lg space-y-2 group shadow-sm hover:border-zinc-700 transition-colors">
                    <div className="flex items-center justify-between gap-1">
                      <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${
                        task.priority === 'CRITICAL' ? 'bg-red-500/20 text-red-400 border border-red-500/30' :
                        task.priority === 'HIGH' ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' :
                        'bg-zinc-800 text-zinc-400'
                      }`}>
                        {task.priority}
                      </span>
                      {task.sceneNumber && (
                        <span className="text-[9px] font-mono text-zinc-500">Sc. {task.sceneNumber}</span>
                      )}
                    </div>

                    <h4 className="text-xs font-bold text-zinc-100 leading-snug">{task.title}</h4>
                    <p className="text-[11px] text-zinc-400 line-clamp-2">{task.description}</p>

                    <div className="pt-2 border-t border-zinc-800/80 flex items-center justify-between text-[10px]">
                      <span className="text-zinc-500 font-mono truncate">{task.category}</span>

                      <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100 transition-opacity">
                        {col.id !== 'BACKLOG' && (
                          <button
                            onClick={() => movePrev(task)}
                            className="p-1 hover:bg-zinc-800 rounded text-zinc-400"
                            title="Move left"
                          >
                            <ChevronLeft className="w-3.5 h-3.5" />
                          </button>
                        )}
                        {col.id !== 'DONE' && (
                          <button
                            onClick={() => moveNext(task)}
                            className="p-1 hover:bg-zinc-800 rounded text-zinc-400"
                            title="Move right"
                          >
                            <ChevronRight className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}

                {colTasks.length === 0 && (
                  <div className="p-4 border border-dashed border-zinc-800 rounded-lg text-center text-[11px] text-zinc-600 font-mono">
                    Empty column
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Add Task Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <form onSubmit={handleCreateTask} className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 max-w-md w-full space-y-4 shadow-2xl">
            <h3 className="text-base font-bold text-white">Create Production Task</h3>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-zinc-300">Task Title *</label>
              <input
                type="text"
                required
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                placeholder="e.g., Secure vintage vehicle lease"
                className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-xs text-zinc-100 focus:outline-none focus:border-amber-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-zinc-300">Department</label>
                <select
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value as TaskCategory)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-2.5 py-2 text-xs text-zinc-100 focus:outline-none focus:border-amber-500"
                >
                  <option value="Script Breakdown">Script Breakdown</option>
                  <option value="Casting">Casting</option>
                  <option value="Location & Permits">Location & Permits</option>
                  <option value="Art & Props">Art & Props</option>
                  <option value="Camera & Lighting">Camera & Lighting</option>
                  <option value="Sound">Sound</option>
                  <option value="Schedule & Logistics">Schedule & Logistics</option>
                  <option value="Safety & Legal">Safety & Legal</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-zinc-300">Priority</label>
                <select
                  value={newPriority}
                  onChange={(e) => setNewPriority(e.target.value as TaskPriority)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-2.5 py-2 text-xs text-zinc-100 focus:outline-none focus:border-amber-500"
                >
                  <option value="LOW">LOW</option>
                  <option value="MEDIUM">MEDIUM</option>
                  <option value="HIGH">HIGH</option>
                  <option value="CRITICAL">CRITICAL</option>
                </select>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-zinc-300">Description</label>
              <textarea
                rows={3}
                value={newDescription}
                onChange={(e) => setNewDescription(e.target.value)}
                placeholder="Details..."
                className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-xs text-zinc-100 focus:outline-none focus:border-amber-500 resize-none"
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="px-4 py-2 bg-zinc-800 text-zinc-300 text-xs font-semibold rounded-lg"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-zinc-950 text-xs font-bold rounded-lg"
              >
                Save Task
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
