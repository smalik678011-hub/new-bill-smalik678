import React, { useState, useEffect } from 'react';
import useAppStore from '../store';
import { supabase } from '../lib/supabase';
import toast, { Toaster } from 'react-hot-toast';
import { TrendingUp, FileText, LayoutDashboard, Wrench, Bell, Users, Wifi, WifiOff } from 'lucide-react';

import MonthlyPL from '../components/expense/MonthlyPL';
import ExpenseEntry from '../components/expense/ExpenseEntry';
import FixedExpenses from '../components/expense/FixedExpenses';
import ClientBreakdown from '../components/expense/ClientBreakdown';


export default function Expenses() {

  const store = useAppStore();

  const [expenses, setExpenses] = useState<any[]>([]);
  const [fixedExpenses, setFixedExpenses] = useState<any[]>([]);
  const [invoices, setInvoices] = useState<any[]>([]);
  const [clients, setClients] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [supabaseMode, setSupabaseMode] = useState(false);
  const [businessId, setBusinessId] = useState<string>('');
  
  const [filterMonth, setFilterMonth] = useState(new Date().getMonth());
  const [filterYear, setFilterYear] = useState(new Date().getFullYear());
  const [activeTab, setActiveTab] = useState<'pldash' | 'direct' | 'fixed' | 'client'>('pldash');

  const monthsHindi = [
    'जनवरी (Jan)', 'फ़रवरी (Feb)', 'मार्च (Mar)', 'अप्रैल (Apr)',
    'मई (May)', 'जून (Jun)', 'जुलाई (Jul)', 'अगस्त (Aug)',
    'सितम्बर (Sep)', 'अक्टूबर (Oct)', 'नवम्बर (Nov)', 'दिसम्बर (Dec)'
  ];

  const refreshData = async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const { data: { user }, error: userErr } = await supabase.auth.getUser();
      if (userErr || !user) {
        loadLocalFallback();
        return;
      }

      // Fetch user's business
      const { data: bData, error: bErr } = await supabase
        .from('profiles')
        .select('id')
        .eq('user_id', user.id);

      if (bErr || !bData || bData.length === 0) {
        loadLocalFallback();
        return;
      }

      const activeBId = bData[0].id;
      setBusinessId(activeBId);

      // In parallel fetch expenses, fixed_expenses, invoices, and clients
      const [expRes, fixedRes, invRes, clientRes] = await Promise.all([
        supabase.from('expenses').select('*').eq('business_id', activeBId).order('date', { ascending: false }),
        supabase.from('fixed_expenses').select('*').eq('business_id', activeBId).order('created_at', { ascending: false }),
        supabase.from('invoices').select('*').eq('business_id', activeBId).order('date', { ascending: false }),
        supabase.from('clients').select('*').eq('business_id', activeBId).order('name', { ascending: true })
      ]);

      if (expRes.error || fixedRes.error || invRes.error || clientRes.error) {
        console.error('Fetch error:', expRes.error, fixedRes.error, invRes.error, clientRes.error);
        loadLocalFallback();
        return;
      }

      setSupabaseMode(true);
      setExpenses(expRes.data || []);
      setFixedExpenses(fixedRes.data || []);
      setInvoices(invRes.data || []);
      setClients(clientRes.data || []);
    } catch (err) {
      console.warn('Network / session fallback to offline ledger:', err);
      loadLocalFallback();
    } finally {
      if (!silent) setLoading(false);
    }
  };

  const loadLocalFallback = () => {
    setSupabaseMode(false);
    
    // Map offline direct expenses
    const localExpenses = store.transactions
      .filter(tx => tx.type === 'Expense')
      .map(tx => ({
        id: tx.id,
        category: tx.category,
        amount: tx.amount,
        date: tx.date,
        note: tx.notes,
        type: 'Expense'
      }));

    // Map offline fixed expenses
    const localFixed = store.recurringExpenses.map(re => ({
      id: re.id,
      name: re.name,
      amount: re.amount,
      due_date: re.dueDate,
      frequency: 'Monthly',
      status: re.isPaidThisMonth ? 'Paid' : 'Unpaid'
    }));

    // Local Invoices and Clients
    setExpenses(localExpenses);
    setFixedExpenses(localFixed);
    setInvoices(store.invoices);
    setClients(store.clients);
  };

  useEffect(() => {
    refreshData();
  }, [store.transactions, store.recurringExpenses, store.invoices, store.clients]);

  // Actions
  const handleAddExpense = async (category: string, amount: number, date: string, note: string) => {
    if (supabaseMode && businessId) {
      const { error } = await supabase
        .from('expenses')
        .insert([{
          business_id: businessId,
          category,
          amount,
          date,
          note,
          type: 'Expense'
        }]);

      if (error) {
        toast.error('खर्च्चा जोड़ने में समस्या आयी!');
        console.error(error);
        return;
      }
      toast.success('नया दैनिक खर्च्चा बही में जोड़ लिया गया है!');
      refreshData(true);
    } else {
      store.addTransaction({
        type: 'Expense',
        category,
        amount,
        date,
        notes: note
      });
      toast.success('लोकल बही में खर्चा नोट कर लिया गया!');
    }
  };

  const handleDeleteExpense = async (id: string) => {
    const isConfirmed = confirm('क्या आप वाकई इस खर्चे को डिलीट करना चाहते हैं?');
    if (!isConfirmed) return;

    if (supabaseMode) {
      const { error } = await supabase
        .from('expenses')
        .delete()
        .eq('id', id);

      if (error) {
        toast.error('खर्चा डिलीट करने में गड़बड़ हुई!');
        return;
      }
      toast.success('खर्चा रजिस्टर से हटा दिया गया!');
      refreshData(true);
    } else {
      store.deleteTransaction(id);
      toast.success('लोकल खर्चे से हटा दिया गया है!');
    }
  };

  const handleAddFixedExpense = async (name: string, amount: number, frequency: 'Monthly' | 'Quarterly', dueDate: string) => {
    if (supabaseMode && businessId) {
      const { error } = await supabase
        .from('fixed_expenses')
        .insert([{
          business_id: businessId,
          name,
          amount,
          frequency,
          due_date: dueDate,
          status: 'Unpaid'
        }]);

      if (error) {
        toast.error('मासिक खर्चा जोड़ने में गड़बड़ हुई!');
        console.error(error);
        return;
      }
      toast.success(`नया नियमित खर्च "${name}" जोड़ दिया गया है!`);
      refreshData(true);
    } else {
      store.addRecurringExpense({
        name,
        amount,
        dueDate,
        category: 'Other'
      });
      toast.success(`लोकल रजिस्टर में "${name}" जोड़ दिया गया है!`);
    }
  };

  const handleToggleFixedStatus = async (id: string, currentStatus: string) => {
    const nextStatus = currentStatus === 'Paid' ? 'Pending' : 'Paid';

    if (supabaseMode) {
      const { error } = await supabase
        .from('fixed_expenses')
        .update({ status: nextStatus, updated_at: new Date().toISOString() })
        .eq('id', id);

      if (error) {
        toast.error('स्टेटस अपडेट नहीं हो पाया!');
        return;
      }
      toast.success(`सफलतापूर्वक: खर्चा ${nextStatus === 'Paid' ? 'Paid' : 'Pending'} मार्क हो गया!`);
      refreshData(true);
    } else {
      store.toggleRecurringPaid(id);
      toast.success(`लोकल नियमित खर्चा ${nextStatus === 'Paid' ? 'Paid' : 'Pending'} मार्क हो गया!`);
    }
  };

  const handleDeleteFixedExpense = async (id: string) => {
    const isConfirmed = confirm('क्या आप इस बंधे खर्चे को हमेशा के लिए डिलीट करना चाहते हैं?');
    if (!isConfirmed) return;

    if (supabaseMode) {
      const { error } = await supabase
        .from('fixed_expenses')
        .delete()
        .eq('id', id);

      if (error) {
        toast.error('डिलीट करने में त्रुटि!');
        return;
      }
      toast.success('बंधा खर्चा हटा दिया गया!');
      refreshData(true);
    } else {
      store.deleteRecurringExpense(id);
      toast.success('लोकल रजिस्टर से बंधा खर्चा हटा दिया गया!');
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-3 pb-20 space-y-6">
      <Toaster position="top-center" reverseOrder={false} />

      {/* Main Panel Header Frame */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-gray-900 border border-gray-800 p-5 rounded-3xl gap-4 shadow-lg">
        <div className="flex items-center space-x-3">
          <div className="h-10 w-10 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-500">
            <TrendingUp className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-sm font-black text-gray-100 flex items-center gap-1.5 uppercase tracking-wide">
              खर्चा और मुनाफ़ा रजिस्टर <span className="text-xs text-amber-500 font-mono">(Expense & Profit Ledger)</span>
            </h1>
            <p className="text-xs text-gray-450 mt-0.5">
              सभी प्रत्यक्ष खर्चे, किराया/मशीनें/बिजली के बँधे मासिक खर्चे लिखें, और नेट मुनाफ़े (P&L) का विश्लेषण करें।
            </p>
          </div>
        </div>

        {/* Sync Mode Indicator Pill */}
        <div className={`px-4 py-2 rounded-2xl border flex items-center space-x-2 text-[10.5px] font-black uppercase tracking-wide shrink-0 ${
          supabaseMode 
            ? 'bg-emerald-500/5 border-emerald-500/10 text-emerald-400' 
            : 'bg-amber-500/5 border-amber-500/10 text-amber-400'
        }`}>
          {supabaseMode ? (
            <>
              <Wifi className="h-3.5 w-3.5 shrink-0" />
              <span>क्लाउड डेटाबेस सक्रिय (Sync Active)</span>
            </>
          ) : (
            <>
              <WifiOff className="h-3.5 w-3.5 shrink-0" />
              <span>लोकल मोड सक्रिय (Local Offline Book)</span>
            </>
          )}
        </div>
      </div>

      {/* Roster Controls Row - Filter Months & Select Tab */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 bg-[#0d121f] p-3 rounded-2xl border border-gray-800">
        
        {/* Navigation Tab bar */}
        <div className="flex bg-[#070912] p-1 rounded-xl border border-gray-900 w-full lg:w-auto overflow-x-auto">
          <button
            onClick={() => setActiveTab('pldash')}
            className={`flex-1 lg:flex-initial px-4 py-2.5 rounded-lg text-xs font-black uppercase tracking-wider transition cursor-pointer whitespace-nowrap ${
              activeTab === 'pldash' ? 'bg-amber-500 text-black font-extrabold' : 'text-gray-400 hover:text-white'
            }`}
          >
            📊 P&L चार्ट और रिपोर्ट
          </button>
          <button
            onClick={() => setActiveTab('direct')}
            className={`flex-1 lg:flex-initial px-4 py-2.5 rounded-lg text-xs font-black uppercase tracking-wider transition cursor-pointer whitespace-nowrap ${
              activeTab === 'direct' ? 'bg-amber-500 text-black font-extrabold' : 'text-gray-400 hover:text-white'
            }`}
          >
            💰 नगद खर्च (Expense)
          </button>
          <button
            onClick={() => setActiveTab('fixed')}
            className={`flex-1 lg:flex-initial px-4 py-2.5 rounded-lg text-xs font-black uppercase tracking-wider transition cursor-pointer whitespace-nowrap ${
              activeTab === 'fixed' ? 'bg-amber-500 text-black font-extrabold' : 'text-gray-400 hover:text-white'
            }`}
          >
            📅 बँधे मासिक खर्चे (Fixed)
          </button>
          <button
            onClick={() => setActiveTab('client')}
            className={`flex-1 lg:flex-initial px-4 py-2.5 rounded-lg text-xs font-black uppercase tracking-wider transition cursor-pointer whitespace-nowrap ${
              activeTab === 'client' ? 'bg-amber-500 text-black font-extrabold' : 'text-gray-400 hover:text-white'
            }`}
          >
            👤 ग्राहक वार रिपोर्ट
          </button>
        </div>

        {/* Global Date Selectors */}
        <div className="flex items-center space-x-2.5 w-full lg:w-auto justify-end">
          <span className="text-gray-400 text-xs font-bold">महीने की रिपोर्ट देखें:</span>
          <select
            value={filterMonth}
            onChange={e => setFilterMonth(parseInt(e.target.value))}
            className="bg-gray-950 border border-gray-800 rounded-xl py-2 px-3 text-xs font-bold text-white cursor-pointer focus:outline-none"
          >
            {monthsHindi.map((m, idx) => (
              <option key={idx} value={idx}>{m}</option>
            ))}
          </select>

          <select
            value={filterYear}
            onChange={e => setFilterYear(parseInt(e.target.value))}
            className="bg-gray-950 border border-gray-800 rounded-xl py-2 px-3 text-xs font-bold text-white cursor-pointer focus:outline-none"
          >
            {[2025, 2026, 2027].map(yr => (
              <option key={yr} value={yr}>{yr}</option>
            ))}
          </select>
        </div>

      </div>

      {/* Render selected active Tab panel */}
      <div className="space-y-6">
        {activeTab === 'pldash' && (
          <MonthlyPL
            invoices={invoices}
            expenses={expenses}
            fixedExpenses={fixedExpenses}
            filterMonth={filterMonth}
            filterYear={filterYear}
          />
        )}

        {activeTab === 'direct' && (
          <ExpenseEntry
            expenses={expenses}
            onAddExpense={handleAddExpense}
            onDeleteExpense={handleDeleteExpense}
            loading={loading}
          />
        )}

        {activeTab === 'fixed' && (
          <FixedExpenses
            fixedExpenses={fixedExpenses}
            onAddFixedExpense={handleAddFixedExpense}
            onToggleFixedStatus={handleToggleFixedStatus}
            onDeleteFixedExpense={handleDeleteFixedExpense}
            loading={loading}
          />
        )}

        {activeTab === 'client' && (
          <ClientBreakdown
            clients={clients}
            invoices={invoices}
            filterMonth={filterMonth}
            filterYear={filterYear}
          />
        )}
      </div>

    </div>
  );
}
