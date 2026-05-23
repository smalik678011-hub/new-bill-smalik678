import React, { useState } from 'react';
import { Users, Plus, Trash2, Phone, DollarSign, Search, UserCheck, X, Award } from 'lucide-react';


export interface WorkerProps {
  workers: any[];
  onAddWorker: (name: string, dailyRate: number, phone: string) => Promise<void>;
  onDeleteWorker: (id: string) => Promise<void>;
  loading: boolean;
}

export default function WorkerList({ workers, onAddWorker, onDeleteWorker, loading }: WorkerProps) {

  const [showAddForm, setShowAddForm] = useState(false);
  const [name, setName] = useState('');
  const [dailyRate, setDailyRate] = useState('500');
  const [phone, setPhone] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !dailyRate) return;

    setSaving(true);
    try {
      await onAddWorker(name.trim(), parseFloat(dailyRate) || 500, phone.trim() || 'NA');
      setName('');
      setDailyRate('500');
      setPhone('');
      setShowAddForm(false);
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const filteredWorkers = workers.filter(w => 
    w.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    w.phone.includes(searchQuery)
  );

  return (
    <div className="bg-gray-905 border border-gray-800 p-5 rounded-3xl space-y-4 shadow-xl select-none">
      
      {/* Title Header Row */}
      <div className="flex justify-between items-center border-b border-gray-800 pb-3">
        <div className="flex items-center space-x-2">
          <Users className="h-5 w-5 text-amber-500" />
          <h3 className="text-xs font-black uppercase tracking-wider text-gray-200">
            मजदूर एवं कारीगर लिस्ट ({workers.length})
          </h3>
        </div>
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="bg-amber-500 hover:bg-amber-400 text-white font-black py-1.5 px-3 rounded-xl text-[11px] flex items-center space-x-1 transition select-none cursor-pointer"
        >
          <Plus className="h-4 w-4" />
          <span>नया कारीगर</span>
        </button>
      </div>

      {/* Add Worker Inline Modal / Form */}
      {showAddForm && (
        <form onSubmit={handleSubmit} className="bg-gray-950 border border-gray-850 p-4 rounded-2xl space-y-3.5 shadow-inner animate-fadeIn">
          <div className="flex justify-between items-center pb-1.5 border-b border-gray-900">
            <h4 className="text-[11px] font-black text-amber-500 uppercase flex items-center">
              <UserCheck className="h-3.5 w-3.5 mr-1" /> नया कारीगर सहेजें
            </h4>
            <button type="button" onClick={() => setShowAddForm(false)} className="text-gray-500 hover:text-white">
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <label className="text-[10px] uppercase font-bold text-gray-400 block mb-1">नाम (Karigar Name) *</label>
              <input
                type="text"
                required
                placeholder="e.g., Manoj Welder Aligarh"
                value={name}
                onChange={e => setName(e.target.value)}
                className="w-full bg-[#0B0F1A] border border-gray-800 rounded-xl p-2.5 text-xs text-white placeholder-gray-600 focus:outline-none focus:border-amber-500"
              />
            </div>

            <div>
              <label className="text-[10px] uppercase font-bold text-gray-400 block mb-1">दैनिक दहाड़ी दर (₹/Day) *</label>
              <div className="relative">
                <span className="absolute left-2.5 top-2.5 text-xs text-amber-500 font-bold">₹</span>
                <input
                  type="number"
                  required
                  placeholder="e.g., 500"
                  value={dailyRate}
                  onChange={e => setDailyRate(e.target.value)}
                  className="w-full bg-[#0B0F1A] border border-gray-800 rounded-xl py-2.5 pl-6 pr-2 text-xs text-white focus:outline-none focus:border-amber-500"
                />
              </div>
            </div>

            <div>
              <label className="text-[10px] uppercase font-bold text-gray-400 block mb-1">मोबाइल नंबर (Phone No.)</label>
              <input
                type="text"
                maxLength={10}
                placeholder="e.g., 9823xxxxxx"
                value={phone}
                onChange={e => setPhone(e.target.value.replace(/\D/g, ''))}
                className="w-full bg-[#0B0F1A] border border-gray-800 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-amber-500"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={saving}
            className="w-full bg-amber-500 hover:bg-amber-400 text-white py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition disabled:opacity-50 cursor-pointer font-mono"
          >
            {saving ? 'Saving...' : 'करीगर को रजिस्टर में जोड़ें (Save Worker)'}
          </button>
        </form>
      )}

      {/* Search Input Bar */}
      {workers.length > 0 && (
        <div className="relative">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-500" />
          <input
            type="text"
            placeholder="Manoj, Suresh, Rajesh, Phone No. से सर्च करें..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full bg-gray-950 border border-gray-850 text-xs rounded-xl py-2 pl-9 pr-3 text-white placeholder-gray-650 focus:outline-none focus:border-amber-500"
          />
        </div>
      )}

      {/* Workers Directory List */}
      <div className="space-y-2 max-h-[290px] overflow-y-auto pr-1">
        {filteredWorkers.map(worker => (
          <div
            key={worker.id}
            className="bg-[#121622] hover:bg-[#161c2c] border border-gray-850 p-3.5 rounded-2xl flex items-center justify-between transition group"
          >
            <div className="flex items-center space-x-3">
              <div className="h-9 w-9 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center font-black text-amber-400">
                {worker.name.substring(0, 1).toUpperCase()}
              </div>

              <div>
                <h4 className="text-xs font-black text-white group-hover:text-amber-400 transition">
                  {worker.name}
                </h4>
                <div className="flex items-center space-x-3 text-[10.5px] text-gray-400 mt-1">
                  <span className="flex items-center">
                    <span className="text-amber-500 font-bold mr-1">₹{worker.daily_rate || worker.dailyRate}</span>/Day
                  </span>
                  {worker.phone && worker.phone !== 'NA' && (
                    <span className="flex items-center space-x-1 select-all hover:text-gray-200">
                      <Phone className="h-3 w-3 text-gray-500 mr-0.5" />
                      <span>{worker.phone}</span>
                    </span>
                  )}
                </div>
              </div>
            </div>

            <button
              onClick={() => onDeleteWorker(worker.id)}
              className="text-gray-500 hover:text-red-400 hover:bg-red-500/10 p-2 rounded-xl transition cursor-pointer shrink-0"
              title="रजिस्टर से निकालें"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        ))}

        {loading && (
          <div className="text-center py-6 text-xs text-gray-550 italic font-mono animate-pulse">
            कारीगर लिस्ट लोड हो रही है...
          </div>
        )}

        {!loading && filteredWorkers.length === 0 && (
          <div className="text-center py-8 text-xs text-gray-500 bg-gray-950 rounded-2xl border border-dashed border-gray-850 p-4">
            कोई कारिगर नहीं मिला। {searchQuery ? 'सर्च कीवर्ड बदलें' : 'ऊपर "नया कारीगर" दबाकर चालू करें।'}
          </div>
        )}
      </div>
    </div>
  );
}
