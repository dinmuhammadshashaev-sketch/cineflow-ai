import React, { useState } from 'react';
import { Clapperboard, ArrowRight, ArrowLeft, DollarSign, Calendar, MapPin, FileText } from 'lucide-react';
import { ProductionType, Production } from '../types';
import { storage } from '../services/storage/StorageProvider';
import { generateId } from '../lib/id';

interface NewProductionViewProps {
  onCreated: (production: Production) => void;
  onCancel: () => void;
}

export const NewProductionView: React.FC<NewProductionViewProps> = ({ onCreated, onCancel }) => {
  const [title, setTitle] = useState('');
  const [type, setType] = useState<ProductionType>('Short Film');
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState('');
  const [budget, setBudget] = useState<number>(0);
  const [currency, setCurrency] = useState('USD');
  const [targetShootingDates, setTargetShootingDates] = useState('');
  const [shootingDaysCount, setShootingDaysCount] = useState<number>(3);
  const [notes, setNotes] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setError('Production title is required.');
      return;
    }

    const newProd: Production = {
      id: generateId('prod'),
      title: title.trim(),
      type,
      description: description.trim() || 'Custom film project brief.',
      location: location.trim() || 'Target Location TBD',
      budget: Number(budget) || 0,
      currency: currency || 'USD',
      targetShootingDates: targetShootingDates.trim() || 'Dates TBD',
      shootingDaysCount: Number(shootingDaysCount) || 3,
      notes: notes.trim(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      scriptText: '',
      readinessScore: 10,
      status: 'Draft'
    };

    storage.saveProduction(newProd);
    storage.setActiveProductionId(newProd.id);
    onCreated(newProd);
  };

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-6 pb-16 animate-in fade-in duration-200">
      <div className="flex items-center justify-between border-b border-zinc-800 pb-4">
        <div className="flex items-center gap-3">
          <button
            onClick={onCancel}
            className="p-2 text-zinc-400 hover:text-white bg-zinc-900 rounded-lg border border-zinc-800 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <Clapperboard className="w-5 h-5 text-amber-400" />
              New Film Production Brief
            </h2>
            <p className="text-xs text-zinc-400">Establish high-level production scope and shooting parameters.</p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 space-y-6 shadow-xl">
        {error && (
          <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-xs font-semibold">
            {error}
          </div>
        )}

        <div className="space-y-4">
          <h3 className="text-sm font-bold text-amber-400 uppercase tracking-wider font-mono">1. Production Core</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-2 space-y-1.5">
              <label className="text-xs font-bold text-zinc-300">Production Title *</label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => { setTitle(e.target.value); setError(''); }}
                placeholder="e.g., Midnight Horizon"
                className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3.5 py-2.5 text-sm text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-amber-500"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-zinc-300">Category / Type</label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value as ProductionType)}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2.5 text-sm text-zinc-100 focus:outline-none focus:border-amber-500"
              >
                <option value="Short Film">Short Film</option>
                <option value="Feature Film">Feature Film</option>
                <option value="Commercial">Commercial</option>
                <option value="Music Video">Music Video</option>
                <option value="Documentary">Documentary</option>
                <option value="Other">Other</option>
              </select>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-zinc-300">Logline / Description (Optional)</label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Brief summary of story premise or project goals..."
              className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3.5 py-2 text-sm text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-amber-500 resize-none"
            />
          </div>
        </div>

        <div className="space-y-4 pt-4 border-t border-zinc-800">
          <h3 className="text-sm font-bold text-amber-400 uppercase tracking-wider font-mono">2. Location & Budget Constraints</h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-zinc-300 flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-zinc-400" /> Primary Location / Region
              </label>
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="e.g., Seattle Waterfront, WA"
                className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3.5 py-2 text-sm text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-amber-500"
              />
            </div>

            <div className="grid grid-cols-3 gap-2">
              <div className="col-span-2 space-y-1.5">
                <label className="text-xs font-bold text-zinc-300 flex items-center gap-1.5">
                  <DollarSign className="w-3.5 h-3.5 text-zinc-400" /> Estimated Budget
                </label>
                <input
                  type="number"
                  value={budget || ''}
                  placeholder="0"
                  onChange={(e) => setBudget(Number(e.target.value))}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-zinc-100 focus:outline-none focus:border-amber-500"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-zinc-300">Currency</label>
                <input
                  type="text"
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-2.5 py-2 text-sm text-zinc-100 uppercase focus:outline-none focus:border-amber-500 text-center"
                />
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-4 pt-4 border-t border-zinc-800">
          <h3 className="text-sm font-bold text-amber-400 uppercase tracking-wider font-mono">3. Shooting Dates & Logistics</h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-zinc-300 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-zinc-400" /> Target Shooting Window
              </label>
              <input
                type="text"
                value={targetShootingDates}
                onChange={(e) => setTargetShootingDates(e.target.value)}
                placeholder="e.g., Oct 15 - Oct 18, 2026"
                className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3.5 py-2 text-sm text-zinc-100 focus:outline-none focus:border-amber-500"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-zinc-300">Target Shoot Days Count</label>
              <input
                type="number"
                min={1}
                max={30}
                value={shootingDaysCount}
                onChange={(e) => setShootingDaysCount(Number(e.target.value))}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3.5 py-2 text-sm text-zinc-100 focus:outline-none focus:border-amber-500"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-zinc-300 flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-zinc-400" /> Special Constraints / Notes
            </label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g., Requires night rain rigging and antique audio props"
              className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3.5 py-2 text-sm text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-amber-500"
            />
          </div>
        </div>

        <div className="pt-4 border-t border-zinc-800 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-semibold rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-zinc-950 font-black text-xs rounded-lg shadow-lg transition-transform transform hover:scale-[1.02]"
          >
            Continue to Screenplay
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </form>
    </div>
  );
};
