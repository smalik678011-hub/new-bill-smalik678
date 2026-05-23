import React, { useState } from 'react';
import { Plus, Trash2, Bell, AlertTriangle, CreditCard, CheckCircle2, Calendar, HelpCircle, X, ShieldAlert } from 'lucide-react';


interface FixedExpensesProps {
  fixedExpenses: any[];
  onAddFixedExpense: (name: string, amount: number, frequency: 'Monthly' | 'Quarterly', dueDate: string) => Promise<void>;
  onToggleFixedStatus: (id: string, currentStatus: string) => Promise<void>;
  onDeleteFixedExpense: (id: string) => Promise<void>;
  loading: boolean;
}

export default function FixedExpenses({
  fixedExpenses,
  onAddFixedExpense,
  onToggleFixedStatus,
  onDeleteFixedExpense,
  loading
}: FixedExpensesProps) {

  
  const [showAddForm, setShowAddForm] = useState(false);
  const [name, setName] = useState('');
  const [amount, setAmount] = useState('');
  const [frequency, setFrequency] = useState<'Monthly' | 'Quarterly'>('Monthly');
  const [dueDateStr, setDueDateStr] = useState('5'); // e.g. 5th day of month
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !amount) return;

    setSaving(true);
    try {
      // Create readable format for day
      const suffix = dueDateStr === '1' ? 'st' : dueDateStr === '2' ? 'nd' : dueDateStr === '3' ? 'rd' : 'th';
      const formattedDueDate = `${dueDateStr}${suffix} day of month`;

      await onAddFixedExpense(name.trim(), parseFloat(amount) || 0, frequency, formattedDueDate);
      setName('');
      setAmount('');
      setDueDateStr('5');
      setFrequency('Monthly');
      setShowAddForm(false);
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  // Check if a fixed expense is Overdue or Due Soon
  const getDueStatusAndBadge = (fe: any) => {
    const today = new Date();
    const currentDay = today.getDate();
    
    // Attempt to extract due day digit from strings like "5th day of month" or "10th"
    const digitMatch = (fe.due_date || fe.dueDate || '').match(/\d+/);
    const dueDay = digitMatch ? parseInt(digitMatch[0]) : 5;

    const isPaid = (fe.status === 'Paid');

    if (isPaid) {
      return {
        badgeColor: 'bg-emerald-500/10 border-emerald-500/25 text-emerald-400',
        badgeText: '✓ PAID',
        isOverdue: false
      };
    }

    if (currentDay > dueDay) {
      return {
        badgeColor: 'bg-rose-500/10 border-rose-500/25 text-rose-400 animate-pulse',
        badgeText: '⏳ Overdue (विलंबित)',
        isOverdue: true
      };
    } else if (currentDay === dueDay) {
      return {
        badgeColor: 'bg-amber-500/10 border-amber-500/25 text-amber-400 animate-pulse',
        badgeText: '⚡ DUE TODAY (आज तिथि है)',
        isOverdue: false
      };
    } else if (dueDay - currentDay <= 3) {
      return {
        badgeColor: 'bg-amber-500/10 border-amber-500/10 text-amber-500',
        badgeText: '🔔 DUE SOON (निकट है)',
        isOverdue: false
      };
    }

    return {
      badgeColor: 'bg-gray-800 border-gray-700 text-gray-400',
      badgeText: `Due on ${dueDay}`,
      isOverdue: false
    };
  };

  return (
    <div className="bg-[#0e1322] border border-gray-800 p-5 rounded-3xl space-y-4 shadow-xl select-none">
      
      {/* Title block */}
      <div className="flex justify-between items-center border-b border-gray-800 pb-3">
        <div className="flex items-center space-x-2">
          <Bell className="h-5 w-5 text-amber-500" />
          <h3 className="text-xs font-black uppercase tracking-wider text-gray-200">
            मासिक बँधे खर्चे (Recurring Costs Ledger)
          </h3>
        </div>
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="bg-amber-500 hover:bg-amber-400 text-black font-black py-1.5 px-3 rounded-xl text-[11px] flex items-center space-x-1 transition cursor-pointer"
        >
          <Plus className="h-4 w-4" />
          <span>नया मासिक खर्च जोड़ें</span>
        </button>
      </div>

      {loading && (
        <div className="text-center py-4 text-xs text-gray-550 italic animate-pulse font-mono">
          डेटा सिंक किया जा रहा है...
        </div>
      )}

      {/* Add fixed costs Inline form */}
      {showAddForm && (
        <form onSubmit={handleSubmit} className="bg-gray-950 border border-gray-850 p-4 rounded-2xl space-y-3.5 shadow-inner">
          <div className="flex justify-between items-center pb-1.5 border-b border-gray-900">
            <h4 className="text-[11px] font-black text-amber-500 uppercase flex items-center">
              ⚙️ नया नियमित खर्च जोड़ें (Add Recurring Fixed Cost)
            </h4>
            <button type="button" onClick={() => setShowAddForm(false)} className="text-gray-500 hover:text-white">
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            <div>
              <label className="text-[10px] uppercase font-bold text-gray-400 block mb-1">खर्च का नाम (Expense Name) *</label>
              <input
                type="text"
                required
                placeholder="e.g. Workshop Rent / Bijli"
                value={name}
                onChange={e => setName(e.target.value)}
                className="w-full bg-[#0B0F1A] border border-gray-800 rounded-xl p-2.5 text-xs text-secondary focus:outline-none"
              />
            </div>

            <div>
              <label className="text-[10px] uppercase font-bold text-gray-400 block mb-1">रकम (Amount ₹) *</label>
              <div className="relative">
                <span className="absolute left-2.5 top-2.5 text-xs text-amber-500 font-bold">₹</span>
                <input
                  type="number"
                  required
                  placeholder="e.g. 5000"
                  value={amount}
                  onChange={e => setAmount(e.target.value)}
                  className="w-full bg-[#0B0F1A] border border-gray-800 rounded-xl py-2.5 pl-6 pr-2 text-xs text-white focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="text-[10px] uppercase font-bold text-gray-400 block mb-1">अंतराल (Frequency) *</label>
              <select
                value={frequency}
                onChange={e => setFrequency(e.target.value as any)}
                className="w-full bg-[#0B0F1A] border border-gray-800 rounded-xl p-2.5 text-xs text-white focus:outline-none"
              >
                <option value="Monthly">Monthly (हर महीने)</option>
                <option value="Quarterly">Quarterly (हर तिमाही / 3 Month)</option>
              </select>
            </div>

            <div>
              <label className="text-[10px] uppercase font-bold text-gray-400 block mb-1">देय तारीख (Due Day of Month) *</label>
              <select
                value={dueDateStr}
                onChange={e => setDueDateStr(e.target.value)}
                className="w-full bg-[#0B0F1A] border border-gray-800 rounded-xl p-2.5 text-xs text-white focus:outline-none"
              >
                {Array.from({ length: 28 }, (_, i) => String(i + 1)).map(dayNum => (
                  <option key={dayNum} value={dayNum}>{dayNum} तारीख को</option>
                ))}
              </select>
            </div>
          </div>

          <button
            type="submit"
            disabled={saving}
            className="w-full bg-amber-500 hover:bg-amber-400 text-black py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition disabled:opacity-50 cursor-pointer font-mono"
          >
            {saving ? 'Saving...' : 'बँधा खर्चा सिंक करें (Save Recurring Expense)'}
          </button>
        </form>
      )}

      {/* Roster list view */}
      <div className="space-y-2 max-h-[350px] overflow-y-auto pr-1">
        {fixedExpenses.map(fe => {
          const { badgeColor, badgeText, isOverdue } = getDueStatusAndBadge(fe);
          const isPaid = fe.status === 'Paid';

          return (
            <div
              key={fe.id}
              className="bg-[#121622] hover:bg-[#161c2c] border border-gray-850 p-4 rounded-3xl flex flex-col md:flex-row justify-between items-stretch md:items-center gap-4 transition"
            >
              <div className="flex items-center space-x-3.5">
                <div className={`h-10 w-10 rounded-xl flex items-center justify-center font-black transition shrink-0 border ${
                  isPaid 
                    ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' 
                    : 'bg-rose-500/10 border-rose-500/15 text-rose-450'
                }`}>
                  <CreditCard className="h-5 w-5" />
                </div>

                <div>
                  <div className="flex items-center flex-wrap gap-2">
                    <h4 className="text-xs font-black text-white">{fe.name}</h4>
                    <span className="bg-gray-800 border border-gray-700 text-gray-300 font-mono text-[8px] px-1.5 py-0.5 rounded tracking-wide uppercase">
                      {fe.frequency || 'Monthly'}
                    </span>
                    <span className={`text-[8.5px] px-1.5 py-0.5 rounded font-black border uppercase ${badgeColor}`}>
                      {badgeText}
                    </span>
                  </div>
                  <div className="flex items-center space-x-3.5 text-[10.5px] text-gray-500 mt-1">
                    <span className="font-mono">Due Day: {fe.due_date || fe.dueDate}</span>
                  </div>
                </div>
              </div>

              <div className="flex justify-between sm:justify-end items-center space-x-4 shrink-0 bg-gray-950 p-3.5 md:p-0 rounded-2xl md:bg-transparent">
                <div className="text-right">
                  <span className="text-[8px] uppercase text-gray-400 block tracking-tight">Cost / Amount</span>
                  <span className="font-mono text-xs font-black text-rose-400">
                    ₹{(parseFloat(fe.amount?.toString() || '0') ?? 0).toLocaleString('en-IN')}
                  </span>
                </div>

                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => onToggleFixedStatus(fe.id, fe.status)}
                    className={`py-1.5 px-3 rounded-lg text-[9.5px] font-black uppercase text-center border transition cursor-pointer select-none ${
                      isPaid
                        ? 'bg-emerald-500/15 border-emerald-400 text-emerald-400 hover:bg-emerald-500 hover:text-black hover:font-bold'
                        : 'bg-rose-500/15 border-rose-400 text-rose-400 hover:bg-rose-500 hover:text-white hover:font-bold'
                    }`}
                  >
                    {isPaid ? 'MARK PENDING' : 'MARK PAID'}
                  </button>

                  <button
                    onClick={() => onDeleteFixedExpense(fe.id)}
                    className="text-gray-500 hover:text-red-400 hover:bg-red-500/15 p-2 rounded-xl transition cursor-pointer"
                    title="रद्द करें"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}

        {fixedExpenses.length === 0 && (
          <div className="text-center py-10 text-xs text-gray-550 bg-gray-950 rounded-2xl border border-dashed border-gray-850">
            कोई बंधा हुआ मासिक खर्च नहीं है। ऊपर बटन दबाकर बिजली बिल या किराया बही दर्ज करें!
          </div>
        )}
      </div>

    </div>
  );
}
