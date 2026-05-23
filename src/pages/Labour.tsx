import React, { useState, useEffect } from 'react';
import useAppStore from '../store';
import { supabase } from '../lib/supabase';
import toast, { Toaster } from 'react-hot-toast';
import WorkerList from '../components/labour/WorkerList';
import AttendanceCalendar from '../components/labour/AttendanceCalendar';
import SalarySummary from '../components/labour/SalarySummary';
import { UserCheck, ShieldAlert, Wifi, WifiOff } from 'lucide-react';
import { useTranslation } from '../hooks/useTranslation';


export default function Labour() {

  const store = useAppStore();
  const { t } = useTranslation();

  const [workers, setWorkers] = useState<any[]>([]);
  const [attendance, setAttendance] = useState<any[]>([]);
  const [payments, setPayments] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [supabaseMode, setSupabaseMode] = useState(false);
  const [businessId, setBusinessId] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'workers' | 'attendance' | 'salary'>('attendance');

  // Load and refresh records
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

      // Parallel fetching workers and expenses (which includes salary payments)
      const [workersRes, expensesRes, attendanceRes] = await Promise.all([
        supabase.from('workers').select('*').eq('business_id', activeBId).order('name', { ascending: true }),
        supabase.from('expenses').select('*').eq('business_id', activeBId).order('date', { ascending: false }),
        supabase.from('attendance').select('*')
      ]);

      if (workersRes.error) throw workersRes.error;

      setSupabaseMode(true);
      
      const loadedWorkers = workersRes.data || [];
      const workerIds = loadedWorkers.map(w => w.id);

      // Filter attendance records to keep those that belong to the current business's workers
      const loadedAttendance = (attendanceRes.data || []).filter((att: any) => 
        workerIds.includes(att.worker_id) || workerIds.includes(att.workerId)
      );

      setWorkers(loadedWorkers);
      setAttendance(loadedAttendance);
      setPayments(expensesRes.data || []);
    } catch (e) {
      console.warn('Supabase sync issue in Labour, falling back to offline:', e);
      loadLocalFallback();
    } finally {
      if (!silent) setLoading(false);
    }
  };

  const loadLocalFallback = () => {
    setSupabaseMode(false);
    
    // Map local labour list structure
    const localWorkers = store.labourList.map(item => ({
      id: item.id,
      name: item.name,
      daily_rate: item.dailyRate, // match postgres schema
      phone: item.phone
    }));
    
    // Map local attendance
    const localAttendance = store.attendance.map(item => ({
      id: item.id,
      worker_id: item.labourId, // match postgres schema
      date: item.date,
      status: item.status
    }));

    // Map local wage payments (expenses database)
    const localPayments = store.transactions
      .filter(tx => tx.type === 'Expense' && tx.category === 'Labour Wages Paid')
      .map(tx => ({
        id: tx.id,
        category: tx.category,
        amount: tx.amount,
        date: tx.date,
        note: tx.notes
      }));

    setWorkers(localWorkers);
    setAttendance(localAttendance);
    setPayments(localPayments);
  };

  useEffect(() => {
    refreshData();
  }, [store.labourList, store.attendance, store.transactions]);

  // Handle actions
  const handleAddWorker = async (name: string, dailyRate: number, phone: string) => {
    if (supabaseMode && businessId) {
      const { data, error } = await supabase
        .from('workers')
        .insert([{
          business_id: businessId,
          name,
          daily_rate: dailyRate,
          phone
        }])
        .select();

      if (error) {
        toast.error('Could not add worker!');
        console.error(error);
        return;
      }
      toast.success(`${name} added to registry successfully!`);
      refreshData(true);
    } else {
      // Local fall
      store.addLabour({ name, dailyRate, phone });
      toast.success(`${name} added to local ledger successfully!`);
    }
  };

  const handleDeleteWorker = async (id: string) => {
    const isConfirmed = confirm('Are you sure you want to remove this worker? All associated attendance records will be deleted.');
    if (!isConfirmed) return;

    if (supabaseMode) {
      const { error } = await supabase
        .from('workers')
        .delete()
        .eq('id', id);

      if (error) {
        toast.error('Could not remove worker!');
        return;
      }
      toast.success('Worker removed from registry successfully!');
      refreshData(true);
    } else {
      store.deleteLabour(id);
      toast.success('Worker removed from local register successfully!');
    }
  };

  const handleMarkAttendance = async (workerId: string, date: string, status: 'Present' | 'HalfDay' | 'Absent') => {
    if (supabaseMode) {
      try {
        // Query to check if attendance for this worker on this date exists
        const { data: existing, error: curErr } = await supabase
          .from('attendance')
          .select('id')
          .eq('worker_id', workerId)
          .eq('date', date);

        if (curErr) throw curErr;

        if (existing && existing.length > 0) {
          // Update
          const { error: updErr } = await supabase
            .from('attendance')
            .update({ status, updated_at: new Date().toISOString() })
            .eq('id', existing[0].id);

          if (updErr) throw updErr;
        } else {
          // Insert
          const { error: insErr } = await supabase
            .from('attendance')
            .insert([{
              worker_id: workerId,
              date,
              status
            }]);

          if (insErr) throw insErr;
        }

        toast.success('Attendance status synced successfully!');
        refreshData(true);
      } catch (err) {
        console.error(err);
        toast.error('Could not sync attendance status!');
      }
    } else {
      store.setAttendance(workerId, date, status);
      toast.success('Local attendance status updated successfully!');
    }
  };

  const handleBulkMarkPresent = async (date: string) => {
    if (workers.length === 0) {
      toast.error('No workers available to mark attendance!');
      return;
    }

    try {
      if (supabaseMode) {
        setLoading(true);
        // Dispatch sequence
        for (const worker of workers) {
          const { data: existing } = await supabase
            .from('attendance')
            .select('id')
            .eq('worker_id', worker.id)
            .eq('date', date);

          if (existing && existing.length > 0) {
            await supabase
              .from('attendance')
              .update({ status: 'Present' })
              .eq('id', existing[0].id);
          } else {
            await supabase
              .from('attendance')
              .insert([{
                worker_id: worker.id,
                date,
                status: 'Present'
              }]);
          }
        }
        toast.success(`All ${workers.length} workers marked as Present!`);
        refreshData();
      } else {
        workers.forEach(worker => {
          store.setAttendance(worker.id, date, 'Present');
        });
        toast.success(`Attendance recorded for all ${workers.length} workers!`);
      }
    } catch (err) {
      console.error(err);
      toast.error('Could not mark attendance for workers!');
      setLoading(false);
    }
  };

  const handleAddPayment = async (workerId: string, amount: number, date: string, notes: string) => {
    if (supabaseMode && businessId) {
      const { error } = await supabase
        .from('expenses')
        .insert([{
          business_id: businessId,
          category: 'Labour Wages Paid',
          amount,
          date,
          note: notes,
          type: 'Expense'
        }]);

      if (error) {
        toast.error('Could not record wage payment!');
        console.error(error);
        return;
      }
      toast.success('Wage payment saved in cloud ledger!');
      refreshData(true);
    } else {
      // Local
      store.addTransaction({
        type: 'Expense',
        category: 'Labour Wages Paid',
        amount: amount,
        date,
        notes
      });
      toast.success('Wage payment saved in local transaction book!');
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-3 pb-20 space-y-6">
      
      {/* Toast elements */}
      <Toaster position="top-center" reverseOrder={false} />

      {/* Main Panel Header Frame */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-gray-900 border border-gray-800 p-5 rounded-3xl gap-4 shadow-lg">
        <div className="flex items-center space-x-3">
          <div className="h-10 w-10 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-500">
            <UserCheck className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-sm font-black text-gray-100 flex items-center gap-1.5 uppercase tracking-wide">
              <span>Labour & Attendance Registry</span> <span className="text-xs text-amber-500 font-mono">(Labour Roster Suite)</span>
            </h1>
            <p className="text-xs text-gray-450 mt-0.5">
              <span>Track daily attendance, view monthly calendars, and manage payroll books seamlessly.</span>
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
              <span>Cloud Sync Active</span>
            </>
          ) : (
            <>
              <WifiOff className="h-3.5 w-3.5 shrink-0" />
              <span>Local Offline Ledger Mode</span>
            </>
          )}
        </div>
      </div>

      {/* Tab Navigation Menu */}
      <div className="flex bg-[#0d121f] p-1.5 rounded-2xl border border-gray-800">
        <button
          onClick={() => setActiveTab('attendance')}
          className={`flex-1 py-3 text-xs font-black uppercase tracking-wider transition rounded-xl cursor-pointer ${
            activeTab === 'attendance' ? 'bg-amber-500 text-white font-extrabold' : 'text-gray-450 hover:text-white'
          }`}
        >
          <span>📅 Attendance Calendar (Monthly & Bulk)</span>
        </button>
        <button
          onClick={() => setActiveTab('workers')}
          className={`flex-1 py-3 text-xs font-black uppercase tracking-wider transition rounded-xl cursor-pointer ${
            activeTab === 'workers' ? 'bg-amber-500 text-white font-extrabold' : 'text-gray-450 hover:text-white'
          }`}
        >
          <span>👷 Manage Workers Registry</span>
        </button>
        <button
          onClick={() => setActiveTab('salary')}
          className={`flex-1 py-3 text-xs font-black uppercase tracking-wider transition rounded-xl cursor-pointer ${
            activeTab === 'salary' ? 'bg-amber-500 text-white font-extrabold' : 'text-gray-450 hover:text-white'
          }`}
        >
          <span>💰 Wages & Payroll Ledger</span>
        </button>
      </div>

      {/* Active Area Viewport */}
      <div className="space-y-6">
        {activeTab === 'attendance' && (
          <AttendanceCalendar
            workers={workers}
            attendance={attendance}
            onMarkAttendance={handleMarkAttendance}
            onBulkMarkPresent={handleBulkMarkPresent}
            loading={loading}
          />
        )}

        {activeTab === 'workers' && (
          <WorkerList
            workers={workers}
            onAddWorker={handleAddWorker}
            onDeleteWorker={handleDeleteWorker}
            loading={loading}
          />
        )}

        {activeTab === 'salary' && (
          <SalarySummary
            workers={workers}
            attendance={attendance}
            payments={payments}
            onAddPayment={handleAddPayment}
            loading={loading}
          />
        )}
      </div>

    </div>
  );
}
