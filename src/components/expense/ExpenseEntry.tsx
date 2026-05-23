import React, { useState } from 'react';
import { Plus, Trash2, Calendar, Search, X, Wrench } from 'lucide-react';

interface ExpenseEntryProps {
  expenses: any[];
  onAddExpense: (category: string, amount: number, date: string, note: string) => Promise<void>;
  onDeleteExpense: (id: string) => Promise<void>;
  loading: boolean;
}

export default function ExpenseEntry({
  expenses,
  onAddExpense,
  onDeleteExpense,
  loading
}: ExpenseEntryProps) {

  const [showForm, setShowForm] = useState(false);
  const [category, setCategory] = useState('Material');
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [note, setNote] = useState('');
  const [search, setSearch] = useState('');
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      alert('Please enter a valid amount!');
      return;
    }

    setSaving(true);
    try {
      await onAddExpense(category, parsedAmount, date, note.trim() || 'Direct ledger scribble');
      setAmount('');
      setNote('');
      setShowForm(false);
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const filteredExpenses = expenses.filter(exp => {
    if (exp.type && exp.type !== 'Expense') return false;
    
    const term = search.toLowerCase();
    const catMatch = (exp.category || '').toLowerCase().includes(term);
    const noteMatch = (exp.note || exp.notes || '').toLowerCase().includes(term);
    return catMatch || noteMatch;
  });

  return (
    <div className="bg-[#0e1322] border border-gray-800 p-5 rounded-3xl space-y-4 shadow-xl select-none">
      
      {/* Tab Control Title & Show Form Button */}
      <div className="flex justify-between items-center border-b border-gray-800 pb-3">
        <div className="flex items-center space-x-2">
          <Wrench className="h-5 w-5 text-amber-500" />
          <h3 className="text-xs font-black uppercase tracking-wider text-gray-200">
            Direct Expense Journal
          </h3>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="bg-amber-500 hover:bg-amber-400 text-black font-black py-1.5 px-3 rounded-xl text-[11px] flex items-center space-x-1 transition cursor-pointer"
        >
          <Plus className="h-4 w-4" />
          <span>Record Expense</span>
        </button>
      </div>

      {loading && (
        <div className="text-center py-4 text-xs text-gray-550 italic animate-pulse font-mono">
          Syncing expenses...
        </div>
      )}

      {/* Slide / Fade in form layout */}
      {showForm && (
        <form onSubmit={handleSubmit} className="bg-gray-950 border border-gray-850 p-4 rounded-2xl space-y-3.5 shadow-inner">
          <div className="flex justify-between items-center pb-1.5 border-b border-gray-900">
            <h4 className="text-[11px] font-black text-amber-500 uppercase flex items-center">
              📝 New Expense Entry
            </h4>
            <button type="button" onClick={() => setShowForm(false)} className="text-gray-500 hover:text-white">
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            <div>
              <label className="text-[10px] uppercase font-bold text-gray-400 block mb-1">Category *</label>
              <select
                value={category}
                onChange={e => setCategory(e.target.value)}
                className="w-full bg-[#0B0F1A] border border-gray-800 rounded-xl p-2.5 text-xs text-secondary focus:outline-none"
              >
                <option value="Material">Material</option>
                <option value="Labour">Labour</option>
                <option value="Transport">Transport</option>
                <option value="Tool">Tools & Repair</option>
                <option value="Other">Other</option>
              </select>
            </div>

            <div>
              <label className="text-[10px] uppercase font-bold text-gray-400 block mb-1">Amount (₹) *</label>
              <div className="relative">
                <span className="absolute left-2.5 top-2.5 text-xs text-amber-500 font-bold">₹</span>
                <input
                  type="number"
                  required
                  placeholder="e.g. 1500"
                  value={amount}
                  onChange={e => setAmount(e.target.value)}
                  className="w-full bg-[#0B0F1A] border border-gray-800 rounded-xl py-2.5 pl-6 pr-2 text-xs text-white focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="text-[10px] uppercase font-bold text-gray-400 block mb-1">Expense Date *</label>
              <input
                type="date"
                required
                value={date}
                onChange={e => setDate(e.target.value)}
                className="w-full bg-[#0B0F1A] border border-gray-800 rounded-xl p-2.5 text-xs text-white focus:outline-none cursor-pointer"
              />
            </div>

            <div>
              <label className="text-[10px] uppercase font-bold text-gray-400 block mb-1">Remarks / Description</label>
              <input
                type="text"
                placeholder="e.g. Pappu Saria Aligarh"
                value={note}
                onChange={e => setNote(e.target.value)}
                className="w-full bg-[#0B0F1A] border border-gray-800 rounded-xl p-2.5 text-xs text-white focus:outline-none"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={saving}
            className="w-full bg-amber-500 hover:bg-amber-400 text-black py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition disabled:opacity-50 cursor-pointer font-mono"
          >
            {saving ? 'Saving...' : 'Save Expense'}
          </button>
        </form>
      )}

      {/* Search Input filter bar */}
      {expenses.length > 0 && (
        <div className="relative">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-500" />
          <input
            type="text"
            placeholder="Search by Cement, Aligarh, Material, Date etc..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full bg-gray-950 border border-gray-850 text-xs rounded-xl py-2 pl-9 pr-3 text-white placeholder-gray-650 focus:outline-[#f59e0b]"
          />
        </div>
      )}

      {/* Scrollable grid listing current month's expenses */}
      <div className="space-y-2 max-h-[350px] overflow-y-auto pr-1">
        {filteredExpenses.map(exp => (
          <div
            key={exp.id}
            className="bg-[#121622] hover:bg-[#161c2c] border border-gray-850 p-3.5 rounded-2xl flex items-center justify-between transition group"
          >
            <div className="flex items-center space-x-3.5">
              <div className="h-9 w-9 rounded-xl bg-rose-500/10 border border-rose-500/15 flex items-center justify-center font-black text-rose-450 font-mono text-sm shrink-0">
                ₹
              </div>

              <div>
                <div className="flex items-center space-x-2">
                  <h4 className="text-xs font-black text-white group-hover:text-amber-400 transition">
                    {exp.note || exp.notes || 'General ledger purchase'}
                  </h4>
                  <span className="bg-[#161b29] border border-gray-800 text-gray-400 text-[8.5px] px-1.5 py-0.5 rounded font-black uppercase tracking-wider">
                    {exp.category}
                  </span>
                </div>
                <div className="flex items-center space-x-2 text-[10.5px] text-gray-550 mt-1">
                  <span className="flex items-center space-x-0.5 font-mono">
                    <Calendar className="h-3 w-3 mr-0.5 text-gray-400" />
                    <span>{exp.date}</span>
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center space-x-3 shrink-0 ml-2">
              <span className="font-mono text-xs font-black text-rose-450">
                - ₹{(parseFloat(exp.amount?.toString() || '0') ?? 0).toLocaleString('en-IN')}
              </span>
              <button
                onClick={() => onDeleteExpense(exp.id)}
                className="text-gray-500 hover:text-red-400 hover:bg-red-500/15 p-2 rounded-xl transition cursor-pointer"
                title="Delete"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          </div>
        ))}

        {!loading && filteredExpenses.length === 0 && (
          <div className="text-center py-10 text-xs text-gray-550 bg-gray-950 rounded-2xl border border-dashed border-gray-850 p-4">
            No expenses found. {search ? 'Try changing your search keywords.' : 'Click "Record Expense" above to post a new transaction.'}
          </div>
        )}
      </div>

    </div>
  );
}
