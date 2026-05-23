import React, { useState } from 'react';
import { Award, DollarSign, Check, X, CreditCard, ChevronDown, Calendar, AlertCircle, TrendingUp, History, ClipboardList } from 'lucide-react';


interface SalarySummaryProps {
  workers: any[];
  attendance: any[];
  payments: any[]; // List of labor payment expenses
  onAddPayment: (workerId: string, amount: number, date: string, notes: string) => Promise<void>;
  loading: boolean;
}

export default function SalarySummary({
  workers,
  attendance,
  payments,
  onAddPayment,
  loading
}: SalarySummaryProps) {

  
  const [selectedWorker, setSelectedWorker] = useState<any | null>(null);
  const [payAmount, setPayAmount] = useState('');
  const [payDate, setPayDate] = useState(new Date().toISOString().split('T')[0]);
  const [payNotes, setPayNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const [filterMonth, setFilterMonth] = useState(new Date().getMonth());
  const [filterYear, setFilterYear] = useState(new Date().getFullYear());
  const [activeTab, setActiveTab] = useState<'roster' | 'payments'>('roster');

  const monthsHindi = [
    'जनवरी (Jan)', 'फ़रवरी (Feb)', 'मार्च (Mar)', 'अप्रैल (Apr)',
    'मई (May)', 'जून (Jun)', 'जुलाई (Jul)', 'अगस्त (Aug)',
    'सितम्बर (Sep)', 'अक्टूबर (Oct)', 'नवम्बर (Nov)', 'दिसम्बर (Dec)'
  ];

  // Map over workers to calculate days worked, earnings, payments made, and pending balances for the selected month/year
  const workersWagesList = workers.map(worker => {
    // 1. Get attendance records for this month & year
    const workerAttendance = attendance.filter(rec => {
      if (rec.worker_id !== worker.id && rec.workerId !== worker.id) return false;
      const recDate = new Date(rec.date);
      return recDate.getMonth() === filterMonth && recDate.getFullYear() === filterYear;
    });

    const presentDays = workerAttendance.filter(r => r.status === 'Present').length;
    const halfDays = workerAttendance.filter(r => r.status === 'HalfDay').length;
    const absentDays = workerAttendance.filter(r => r.status === 'Absent').length;

    // Days calculation: Present count + 0.5 * half days
    const totalDaysWorked = presentDays + (halfDays * 0.5);
    const totalSalaryEarned = totalDaysWorked * (worker.daily_rate || worker.dailyRate || 0);

    // 2. Fetch payments made to this worker
    // A payment is recorded in the expenses ledger with a search pattern in 'note' like `[WorkerID: ${worker.id}]`
    const workerPayments = payments.filter(p => {
      const noteStr = p.note || p.notes || '';
      return noteStr.includes(`WorkerID: ${worker.id}`) || noteStr.includes(`[WorkerID: ${worker.id}]`);
    });

    const totalPaid = workerPayments.reduce((sum, p) => sum + (parseFloat(p.amount) || 0), 0);
    const balancePending = Math.max(0, totalSalaryEarned - totalPaid);

    // Paid status
    let status: 'Paid' | 'Partial' | 'Unpaid' = 'Unpaid';
    if (totalSalaryEarned === 0) {
      status = 'Paid';
    } else if (totalPaid >= totalSalaryEarned) {
      status = 'Paid';
    } else if (totalPaid > 0) {
      status = 'Partial';
    }

    return {
      ...worker,
      presentDays,
      halfDays,
      absentDays,
      totalDaysWorked,
      totalSalaryEarned,
      workerPayments,
      totalPaid,
      balancePending,
      status
    };
  });

  // Calculate Consolidated month-end summaries across all workers
  const totalWorkersActive = workersWagesList.filter(w => w.totalDaysWorked > 0).length;
  const grandTotalEarned = workersWagesList.reduce((sum, w) => sum + w.totalSalaryEarned, 0);
  const grandTotalPaid = workersWagesList.reduce((sum, w) => sum + w.totalPaid, 0);
  const grandTotalPending = workersWagesList.reduce((sum, w) => sum + w.balancePending, 0);

  const handleOpenPayModal = (worker: any) => {
    setSelectedWorker(worker);
    setPayAmount(String(worker.balancePending));
    setPayNotes(`Wage paid for month of ${monthsHindi[filterMonth]}`);
  };

  const handlePaySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedWorker) return;

    const parsedAmount = parseFloat(payAmount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      alert('कृपया सही पेमेंट राशि भरें!');
      return;
    }

    setSaving(true);
    try {
      const formattedNotes = `[WorkerID: ${selectedWorker.id}] ${payNotes || 'Salary payment'}`;
      await onAddPayment(selectedWorker.id, parsedAmount, payDate, formattedNotes);
      setSelectedWorker(null);
      setPayAmount('');
      setPayNotes('');
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="bg-[#0e1322] border border-gray-800 p-5 rounded-3xl space-y-5 shadow-xl select-none">
      
      {/* Tab Filter row + Months selecting */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3.5 border-b border-gray-800 pb-3">
        <div className="flex bg-gray-950 p-1 rounded-xl border border-gray-800">
          <button
            onClick={() => setActiveTab('roster')}
            className={`px-3 py-1.5 rounded-lg text-[10px] uppercase font-black tracking-wider transition cursor-pointer ${
              activeTab === 'roster' ? 'bg-amber-500 text-white font-black shadow-lg shadow-amber-500/20' : 'text-gray-400 hover:text-white'
            }`}
          >
            मजदूरी बही (Roster List)
          </button>
          <button
            onClick={() => setActiveTab('payments')}
            className={`px-3 py-1.5 rounded-lg text-[10px] uppercase font-black tracking-wider transition cursor-pointer ${
              activeTab === 'payments' ? 'bg-amber-500 text-white font-black shadow-lg shadow-amber-500/20' : 'text-gray-400 hover:text-white'
            }`}
          >
            भुगतान इतिहास (Payments History)
          </button>
        </div>

        <div className="flex items-center space-x-2">
          <span className="text-gray-400 text-[11px] font-bold">महीना:</span>
          <select
            value={filterMonth}
            onChange={e => setFilterMonth(parseInt(e.target.value))}
            className="bg-gray-950 border border-gray-800 rounded-xl p-1.5 text-[11px] font-bold text-white cursor-pointer"
          >
            {monthsHindi.map((m, idx) => (
              <option key={idx} value={idx}>{m}</option>
            ))}
          </select>

          <select
            value={filterYear}
            onChange={e => setFilterYear(parseInt(e.target.value))}
            className="bg-gray-950 border border-gray-800 rounded-xl p-1.5 text-[11px] font-bold text-white cursor-pointer"
          >
            {[2025, 2026, 2027].map(yr => (
              <option key={yr} value={yr}>{yr}</option>
            ))}
          </select>
        </div>
      </div>

      {loading && (
        <div className="text-center py-6 text-xs text-gray-550 italic font-mono animate-pulse">
          डेटा सिंक किया जा रहा है...
        </div>
      )}

      {/* TAB A: ROSTER SUMMARY GRID */}
      {activeTab === 'roster' && !loading && (
        <div className="space-y-4">
          
          <div className="space-y-2 max-h-[350px] overflow-y-auto pr-1">
            {workersWagesList.map(worker => (
              <div 
                key={worker.id}
                className="bg-[#121626] border border-gray-850 p-4 rounded-2xl flex flex-col md:flex-row justify-between items-stretch md:items-center gap-4 transition hover:border-gray-800"
              >
                <div>
                  <div className="flex items-center space-x-2">
                    <h4 className="text-xs font-black text-white">{worker.name}</h4>
                    {worker.status === 'Paid' ? (
                      <span className="bg-emerald-500/10 border border-emerald-500/25 text-emerald-400 text-[8.5px] font-extrabold px-1.5 py-0.5 rounded uppercase">
                        ✓ PAID
                      </span>
                    ) : worker.status === 'Partial' ? (
                      <span className="bg-amber-500/10 border border-amber-500/25 text-amber-400 text-[8.5px] font-extrabold px-1.5 py-0.5 rounded uppercase">
                        ½ PARTIAL
                      </span>
                    ) : (
                      <span className="bg-red-500/10 border border-red-500/25 text-red-400 text-[8.5px] font-extrabold px-1.5 py-0.5 rounded uppercase">
                        PENDING
                      </span>
                    )}
                  </div>

                  <div className="text-[10.5px] text-gray-400 mt-1 flex flex-wrap gap-x-3 gap-y-1">
                    <span>Rate: <b className="text-gray-300 font-bold">₹{worker.daily_rate || worker.dailyRate}/Day</b></span>
                    <span>Worked: <b className="text-amber-500 font-bold">{worker.totalDaysWorked} Days</b> ({worker.presentDays}P, {worker.halfDays}H)</span>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-3.5 shrink-0 bg-gray-950/45 p-3 sm:p-0 rounded-xl sm:bg-transparent">
                  {/* Ledger math details */}
                  <div className="grid grid-cols-3 gap-3 text-right">
                    <div className="text-left sm:text-right">
                      <span className="text-[8px] uppercase text-gray-400 block tracking-tight">Total Earned</span>
                      <span className="font-mono text-xs text-white font-black">₹{(worker.totalSalaryEarned ?? 0).toLocaleString('en-IN')}</span>
                    </div>

                    <div className="text-left sm:text-right">
                      <span className="text-[8px] uppercase text-gray-400 block tracking-tight">Total Paid</span>
                      <span className="font-mono text-xs text-emerald-400 font-black">₹{(worker.totalPaid ?? 0).toLocaleString('en-IN')}</span>
                    </div>

                    <div className="text-left sm:text-right">
                      <span className="text-[8px] uppercase text-gray-400 block tracking-tight">Net Pending</span>
                      <span className="font-mono text-xs text-rose-400 font-black">₹{(worker.balancePending ?? 0).toLocaleString('en-IN')}</span>
                    </div>
                  </div>

                  {/* Settle mark button */}
                  {worker.balancePending > 0 ? (
                    <button
                      onClick={() => handleOpenPayModal(worker)}
                      className="bg-emerald-500 hover:bg-emerald-400 text-[#000] font-black py-1.5 px-3 rounded-xl text-[10.5px] uppercase tracking-wider transition shrink-0 select-none cursor-pointer flex items-center justify-center space-x-1"
                    >
                      <DollarSign className="h-3 w-3 inline shrink-0" />
                      <span>Settle Pay</span>
                    </button>
                  ) : (
                    <span className="text-[10px] text-gray-500 font-black select-none text-center block sm:inline py-1">Complete ✓</span>
                  )}
                </div>
              </div>
            ))}

            {workers.length === 0 && (
              <div className="text-center py-10 text-xs text-gray-500">
                मजदूरी बही खाली है। पहले कारीगर जोड़ें।
              </div>
            )}
          </div>

          {/* MONTH-END CONSOLIDATE STATISTICS CARD */}
          {workers.length > 0 && (
            <div className="bg-gradient-to-br from-[#121626] to-[#151c33] border border-gray-800 p-4.5 rounded-2xl space-y-3.5 shadow-md">
              <div className="flex items-center space-x-2 border-b border-gray-850 pb-2">
                <ClipboardList className="h-4 w-4 text-amber-500" />
                <h5 className="text-[10.5px] uppercase tracking-wider font-extrabold text-[#94a3b8]">
                  {monthsHindi[filterMonth]} {filterYear} महीना-अन्त सारांश (Month-End Summary)
                </h5>
              </div>

              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                <div className="bg-[#0B0F1A] p-2.5 rounded-xl border border-gray-850">
                  <span className="text-[8.5px] uppercase text-gray-400 block font-bold">सक्रिय मजदूर (Active Workers)</span>
                  <span className="text-lg font-black font-mono text-white mt-0.5 block">{totalWorkersActive}</span>
                </div>

                <div className="bg-[#0B0F1A] p-2.5 rounded-xl border border-gray-850">
                  <span className="text-[8.5px] uppercase text-gray-400 block font-bold">कुल वेतन बना (Gross Payroll)</span>
                  <span className="text-lg font-black font-mono text-amber-450 mt-0.5 block">₹{(grandTotalEarned ?? 0).toLocaleString('en-IN')}</span>
                </div>

                <div className="bg-[#0B0F1A] p-2.5 rounded-xl border border-gray-850">
                  <span className="text-[8.5px] uppercase text-gray-400 block font-bold">कुल भुगतान हुआ (Gross Paid)</span>
                  <span className="text-lg font-black font-mono text-emerald-400 mt-0.5 block">₹{(grandTotalPaid ?? 0).toLocaleString('en-IN')}</span>
                </div>

                <div className="bg-[#0B0F1A] p-2.5 rounded-xl border border-gray-850">
                  <span className="text-[8.5px] uppercase text-gray-400 block font-bold">शेष भुगतान लंबित (Outstanding Due)</span>
                  <span className="text-lg font-black font-mono text-[#F43F5E] mt-0.5 block">₹{(grandTotalPending ?? 0).toLocaleString('en-IN')}</span>
                </div>
              </div>
            </div>
          )}

        </div>
      )}

      {/* TAB B: ALL HISTORICAL PAYMENTS FILED FOR WORKERS */}
      {activeTab === 'payments' && !loading && (
        <div className="space-y-3 max-h-[380px] overflow-y-auto pr-1">
          {payments.filter(p => {
            const noteStr = p.note || p.notes || '';
            const isLabourTx = noteStr.includes('WorkerID:') || noteStr.includes('[WorkerID:');
            if (!isLabourTx) return false;
            const pmDate = new Date(p.date);
            return pmDate.getMonth() === filterMonth && pmDate.getFullYear() === filterYear;
          }).map(p => {
            // Find associate worker
            const noteStr = p.note || p.notes || '';
            const matchedWorker = workers.find(w => noteStr.includes(`WorkerID: ${w.id}`) || noteStr.includes(`[WorkerID: ${w.id}]`));
            
            return (
              <div 
                key={p.id}
                className="bg-[#121626] border border-gray-850 p-3.5 rounded-2xl flex items-center justify-between"
              >
                <div className="flex items-center space-x-3">
                  <div className="h-8 w-8 rounded-lg bg-emerald-500/10 border border-emerald-500/10 flex items-center justify-center text-emerald-400 text-xs">
                    ₹
                  </div>
                  <div>
                    <h5 className="text-[11.5px] font-black text-white">
                      {matchedWorker ? matchedWorker.name : 'Unknown Worker'}
                    </h5>
                    <p className="text-[9.5px] text-gray-400 mt-0.5">
                      Date: <b className="font-mono text-gray-300">{p.date}</b> • Notes: {p.note || p.notes}
                    </p>
                  </div>
                </div>

                <div className="text-right font-mono text-xs font-black text-emerald-400">
                  + ₹{(parseFloat(p.amount || 0) ?? 0).toLocaleString('en-IN')}
                </div>
              </div>
            );
          })}

          {payments.filter(p => {
            const noteStr = p.note || p.notes || '';
            const isLabourTx = noteStr.includes('WorkerID:') || noteStr.includes('[WorkerID:');
            if (!isLabourTx) return false;
            const pmDate = new Date(p.date);
            return pmDate.getMonth() === filterMonth && pmDate.getFullYear() === filterYear;
          }).length === 0 && (
            <div className="text-center py-10 text-xs text-gray-500 italic block">
              इस महीने में कोई सैलरी भुगतान नहीं किया गया।
            </div>
          )}
        </div>
      )}

      {/* SETTLE PAY PAYMENT MODAL POPUP */}
      {selectedWorker && (
        <div className="fixed inset-0 bg-[#0B0F1A]/85 flex items-center justify-center p-3 z-50 animate-fadeIn">
          <form 
            onSubmit={handlePaySubmit}
            className="bg-[#0e1322] border border-gray-800 w-full max-w-sm rounded-3xl shadow-2xl p-5 space-y-4"
          >
            <div className="flex justify-between items-center pb-2.5 border-b border-gray-800">
              <div>
                <span className="text-[9px] uppercase text-amber-500 font-bold block tracking-wider font-mono">Dihadi Payment Journal</span>
                <h4 className="font-black text-xs text-white">{selectedWorker.name}</h4>
              </div>
              <button 
                type="button" 
                onClick={() => setSelectedWorker(null)} 
                className="text-gray-400 hover:text-white p-1"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Micro wage ledger */}
            <div className="bg-gray-950 p-3.5 border border-gray-850 rounded-xl space-y-1.5 text-[10px] font-mono leading-tight">
              <div className="flex justify-between text-gray-450">
                <span>दहाड़ी का रेट:</span>
                <span>₹{selectedWorker.daily_rate || selectedWorker.dailyRate}/Day</span>
              </div>
              <div className="flex justify-between text-gray-450">
                <span>कुल कमाया:</span>
                <span>₹{(selectedWorker.totalSalaryEarned ?? 0).toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between text-gray-450 border-b border-gray-850 pb-1.5">
                <span>पहले चुकाया:</span>
                <span className="text-emerald-400">₹{(selectedWorker.totalPaid ?? 0).toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between text-rose-400 font-extrabold pt-1.5">
                <span>Outstanding Balance:</span>
                <span className="text-xs">₹{(selectedWorker.balancePending ?? 0).toLocaleString('en-IN')}</span>
              </div>
            </div>

            {/* Inputs */}
            <div className="space-y-3">
              <div>
                <label className="text-[9.5px] text-gray-400 font-bold block mb-1">पेमेंट की राशि भरें (Payment Amount ₹) *</label>
                <input
                  type="number"
                  required
                  placeholder="e.g. 1500"
                  value={payAmount}
                  onChange={e => setPayAmount(e.target.value)}
                  className="w-full bg-[#0B0F1A] border border-gray-850 p-2.5 rounded-xl text-xs text-white focus:outline-none focus:border-amber-500 text-center font-bold"
                  max={selectedWorker.balancePending}
                />
              </div>

              <div>
                <label className="text-[9.5px] text-gray-400 font-bold block mb-1">भुगतान की तारीख (Payment Date) *</label>
                <input
                  type="date"
                  required
                  value={payDate}
                  onChange={e => setPayDate(e.target.value)}
                  className="w-full bg-[#0B0F1A] border border-gray-850 p-2.5 rounded-xl text-xs text-white focus:outline-none focus:border-amber-500 text-center font-bold"
                />
              </div>

              <div>
                <label className="text-[9.5px] text-gray-400 font-bold block mb-1">विवरण / नोट (Payment Notes)</label>
                <input
                  type="text"
                  placeholder="e.g. UPI Se Paid / Advance"
                  value={payNotes}
                  onChange={e => setPayNotes(e.target.value)}
                  className="w-full bg-[#0B0F1A] border border-gray-850 p-2.5 rounded-xl text-xs text-white focus:outline-none focus:border-amber-500"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={saving}
              className="w-full bg-emerald-500 hover:bg-emerald-400 text-black font-extrabold py-2.5 rounded-xl text-xs uppercase transition cursor-pointer"
            >
              {saving ? 'Syncing...' : 'भुगतान दर्ज करें (Confirm Settle)'}
            </button>
          </form>
        </div>
      )}

    </div>
  );
}
