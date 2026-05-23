import React, { useEffect, useState } from 'react';
import useAppStore from '../store';
import { toast } from 'react-hot-toast';
import { supabase } from '../lib/supabase';
import useTranslation from '../hooks/useTranslation';
import Papa from 'papaparse';
import { 
  IndianRupee, 
  ArrowUpRight, 
  ArrowDownLeft, 
  Users, 
  ClipboardCheck, 
  Calculator, 
  AlertCircle,
  FileSpreadsheet,
  Calendar,
  Phone,
  CheckCircle2,
  Clock,
  PlusCircle,
  TrendingUp,
  Sliders,
  Sparkles,
  CloudLightning,
  Cloud,
  Check
} from 'lucide-react';

interface DashboardProps {
  onNavigate: (tab: string) => void;
}

export default function Dashboard({ onNavigate }: DashboardProps) {

  // 1. Local Fallback State (Zustand Store)
  const store = useAppStore();
  const { t } = useTranslation();
  
  // 2. State for Real-Time Supabase Sync
  const [supabaseMode, setSupabaseMode] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);
  const [sbStats, setSbStats] = useState({
    pendingAmount: 0,
    monthlyIncome: 0,
    activeClientsCount: 0,
    unpaidInvoicesCount: 0,
    todayDeadlines: [] as any[],
    recentInvoices: [] as any[]
  });

  const todayStr = new Date().toISOString().split('T')[0];

  useEffect(() => {
    async function loadRealTimeDashboard() {
      setLoading(true);
      try {
        const { data: { user }, error: userErr } = await supabase.auth.getUser();
        if (userErr || !user) {
          setSupabaseMode(false);
          setLoading(false);
          return;
        }

        const { data: businessData, error: bErr } = await supabase
          .from('profiles')
          .select('*')
          .eq('user_id', user.id);

        if (bErr || !businessData || businessData.length === 0) {
          setSupabaseMode(false);
          setLoading(false);
          return;
        }

        const activeBusiness = businessData[0];
        const bId = activeBusiness.id;

        const [clientsRes, invoicesRes, expensesRes] = await Promise.all([
          supabase.from('clients').select('*').eq('business_id', bId),
          supabase.from('invoices').select('*').eq('business_id', bId),
          supabase.from('expenses').select('*').eq('business_id', bId)
        ]);

        if (clientsRes.error || invoicesRes.error) {
          setSupabaseMode(false);
          setLoading(false);
          return;
        }

        const dbClients = clientsRes.data || [];
        const dbInvoices = invoicesRes.data || [];
        const dbExpenses = expensesRes.data || [];

        const pendingAmount = dbInvoices
          .filter((inv: any) => inv.status !== 'Paid')
          .reduce((sum: number, inv: any) => {
            const grandTotal = Number(inv.grand_total || 0);
            let paidSum = 0;
            if (typeof inv.payments === 'string') {
              try {
                const parsed = JSON.parse(inv.payments);
                if (Array.isArray(parsed)) {
                  paidSum = parsed.reduce((pAcc: number, item: any) => pAcc + Number(item.amount || 0), 0);
                }
              } catch (e) {
                paidSum = Number(inv.paid_amount || 0);
              }
            } else if (Array.isArray(inv.payments)) {
              paidSum = inv.payments.reduce((pAcc: number, item: any) => pAcc + Number(item.amount || 0), 0);
            } else {
              paidSum = Number(inv.paid_amount || 0);
            }
            return sum + (grandTotal - paidSum);
          }, 0);

        const startOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
        const startOfMonthStr = startOfMonth.toISOString().split('T')[0];

        const monthlyIncome = dbExpenses
          .filter((exp: any) => {
            const isIncome = exp.type?.toLowerCase() === 'income';
            const isThisMonth = exp.date >= startOfMonthStr;
            return isIncome && isThisMonth;
          })
          .reduce((sum: number, exp: any) => sum + Number(exp.amount || 0), 0);

        const activeClientsCount = dbClients.filter((c: any) => c.status?.toLowerCase() === 'active' || !c.status).length;
        const unpaidInvoicesCount = dbInvoices.filter((inv: any) => inv.status !== 'Paid').length;
        const todayDeadlines = dbClients
          .filter((c: any) => c.deadline === todayStr)
          .map((c: any) => ({
            id: c.id,
            name: c.name,
            phone: c.phone || 'NA',
            notes: c.notes || 'No work details specified'
          }));

        const recentInvoices = dbInvoices
          .sort((a: any, b: any) => new Date(b.created_at || b.date).getTime() - new Date(a.created_at || a.date).getTime())
          .slice(0, 5)
          .map((inv: any) => {
            const matchedClient = dbClients.find((col: any) => col.id === inv.client_id);
            return {
              id: inv.id,
              invoiceNumber: inv.number || 'INV-TEMP',
              clientName: matchedClient ? matchedClient.name : 'ग्राहक (Unspecified)',
              date: inv.date,
              grandTotal: Number(inv.grand_total || inv.totalAmount || 0),
              status: inv.status || 'Unpaid'
            };
          });

        setSbStats({
          pendingAmount,
          monthlyIncome,
          activeClientsCount,
          unpaidInvoicesCount,
          todayDeadlines,
          recentInvoices
        });
        setSupabaseMode(true);
      } catch (err) {
        setSupabaseMode(false);
      } finally {
        setLoading(false);
      }
    }

    loadRealTimeDashboard();
  }, [store.clients, store.invoices, store.transactions, todayStr]);

  const checkLenaBaqi = store.clients.reduce((acc, c) => c.totalDue > 0 ? acc + c.totalDue : acc, 0);
  const checkUnpaidInvoicesCount = store.invoices.filter(i => i.status !== 'Paid').length;
  
  const startOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
  const startOfMonthStr = startOfMonth.toISOString().split('T')[0];
  const localMonthlyIncome = store.transactions
    .filter(t => t.type === 'Income' && t.date >= startOfMonthStr)
    .reduce((acc, t) => acc + t.amount, 0);

  const localActiveClientsCount = store.clients.length;

  const localRecentInvoices = [...store.invoices]
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 5)
    .map(inv => {
      const client = store.clients.find(c => c.id === inv.clientId);
      return {
        id: inv.id,
        invoiceNumber: inv.invoiceNumber,
        clientName: client ? client.name : 'Unknown Client',
        date: inv.date,
        grandTotal: inv.totalAmount,
        status: inv.status
      };
    });

  const pendingAmount = supabaseMode ? sbStats.pendingAmount : checkLenaBaqi;
  const monthlyIncome = supabaseMode ? sbStats.monthlyIncome : localMonthlyIncome;
  const activeClientsCount = supabaseMode ? sbStats.activeClientsCount : localActiveClientsCount;
  const unpaidInvoicesCount = supabaseMode ? sbStats.unpaidInvoicesCount : checkUnpaidInvoicesCount;
  const todayDeadlines = supabaseMode ? sbStats.todayDeadlines : [];
  const recentInvoices = supabaseMode ? sbStats.recentInvoices : localRecentInvoices;

  const handleCallClient = (phoneNumber: string) => {
    if (!phoneNumber || phoneNumber === 'NA') return;
    window.location.href = `tel:${phoneNumber}`;
  };

  const handleExportReport = () => {
    const data = [
        ...store.invoices.map(inv => ({
            Type: 'Invoice',
            Number: inv.invoiceNumber,
            Client: store.clients.find(c => c.id === inv.clientId)?.name || 'Unknown',
            Date: inv.date,
            Amount: inv.totalAmount,
            Status: inv.status
        })),
        ...store.transactions.map(t => ({
            Type: 'Transaction',
            Number: 'N/A',
            Client: 'N/A',
            Date: t.date,
            Amount: t.amount,
            Status: t.type
        }))
    ];

    const csv = Papa.unparse(data);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `billkaro_report_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleDownloadBackup = () => {
    const backupData = {
        clients: store.clients,
        invoices: store.invoices,
        transactions: store.transactions,
        timestamp: new Date().toISOString()
    };
    const jsonStr = JSON.stringify(backupData, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `billkaro_backup_${new Date().toISOString().split('T')[0]}.json`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('Backup downloaded successfully!');
  };

  const getStatusStyle = (status: string) => {
    const norm = status?.toLowerCase();
    if (norm === 'paid') {
      return {
        pill: 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20',
        dot: 'bg-emerald-500'
      };
    } else if (norm === 'partial') {
      return {
        pill: 'bg-amber-500/10 text-amber-500 border border-amber-500/20',
        dot: 'bg-amber-500'
      };
    } else {
      return {
        pill: 'bg-rose-500/10 text-rose-400 border border-rose-500/20',
        dot: 'bg-rose-500 font-bold'
      };
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between bg-gradient-to-r from-gray-900 via-gray-900 to-gray-950 p-5 rounded-2xl border border-gray-800 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/5 rounded-full blur-2xl pointer-events-none" />
        <div className="space-y-1">
          <div className="flex items-center space-x-1.5">
            <span className="p-1 rounded-md bg-amber-500/10 text-amber-500 border border-amber-500/20">
              <Sparkles className="h-4 w-4" />
            </span>
            <span className="text-[10px] text-amber-500 font-extrabold uppercase tracking-widest font-mono">Ledger Dashboard</span>
          </div>
          <h2 className="text-xl font-bold tracking-tight text-white font-sans">
            व्यापार का हिसाब-किताब
          </h2>
          <p className="text-xs text-gray-550">
            {supabaseMode ? t('सारे बिल और भुगतान सुरक्षित क्लाउड डेटाबेस से सिंक हैं।') : t('लोकल बही खाता मोड सक्रिय है। इंटरनेट आने पर सुरक्षित हो जाएगा।')}
          </p>
        </div>

        <div className="mt-3.5 sm:mt-0 flex items-center">
          <div className={'inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-full text-[10px] font-bold ' + (
            supabaseMode 
              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/25' 
              : 'bg-amber-500/10 text-amber-500 border border-amber-500/25'
          )}>
            {supabaseMode ? (
              <>
                <Cloud className="h-3 w-3 animate-pulse" />
                <span>{t('क्लाउड डेटा एक्टिव (Supabase Live)')}</span>
              </>
            ) : (
              <>
                <CloudLightning className="h-3 w-3" />
                <span>{t('ऑफ़लाइन डेटा (Local Khata Only)')}</span>
              </>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-gray-900 rounded-2xl p-4.5 border border-gray-800 relative shadow-md">
          <span className="text-[10px] text-gray-400 block font-bold uppercase tracking-wider">{t('कुल बकाया (Lena Baqi)')}</span>
          <div className="flex items-center justify-between mt-1.5">
            <span className={'text-xl font-black ' + (pendingAmount > 0 ? 'text-red-400' : 'text-gray-100')}>
              ₹{(pendingAmount ?? 0).toLocaleString('en-IN')}
            </span>
            <div className={'p-1.5 rounded-xl ' + (pendingAmount > 0 ? 'bg-red-500/10 text-red-400' : 'bg-gray-800 text-gray-500')}>
              <AlertCircle className="h-4.5 w-4.5" />
            </div>
          </div>
          <span className="text-[9px] text-gray-550 block mt-1.5">
            {pendingAmount > 0 ? t('⚠️ वसूली बाकी है!') : t('कोई बकाया भुगतान नहीं है।')}
          </span>
        </div>

        <div className="bg-gray-900 rounded-2xl p-4.5 border border-gray-800 relative shadow-md">
          <span className="text-[10px] text-gray-400 block font-bold uppercase tracking-wider">{t('महीने की कमाई (Income)')}</span>
          <div className="flex items-center justify-between mt-1.5">
            <span className="text-xl font-black text-emerald-400">
              ₹{(monthlyIncome ?? 0).toLocaleString('en-IN')}
            </span>
            <div className="p-1.5 bg-emerald-500/10 text-emerald-400 rounded-xl">
              <TrendingUp className="h-4.5 w-4.5" />
            </div>
          </div>
          <span className="text-[9px] text-gray-550 block mt-1.5">{t('इस महीने आई कुल नगदी')}</span>
        </div>

        <div onClick={() => onNavigate('clients')} className="bg-gray-900 rounded-2xl p-4.5 border border-gray-800 relative shadow-md group hover:border-amber-500/30 transition cursor-pointer">
          <span className="text-[10px] text-gray-400 block font-bold uppercase tracking-wider">{t('सक्रिय ग्राहक (Active)')}</span>
          <div className="flex items-center justify-between mt-1.5">
            <span className="text-xl font-black text-amber-500">
              {activeClientsCount}
            </span>
            <div className="p-1.5 bg-amber-500/10 text-amber-500 rounded-xl group-hover:bg-amber-500/20 transition">
              <Users className="h-4.5 w-4.5" />
            </div>
          </div>
          <span className="text-[9px] text-gray-550 block mt-1.5">{t('सारे ग्राहक खता सूची')}</span>
        </div>

        <div onClick={() => onNavigate('invoices')} className="bg-gray-900 rounded-2xl p-4.5 border border-gray-800 relative shadow-md group hover:border-cyan-500/30 transition cursor-pointer">
          <span className="text-[10px] text-gray-400 block font-bold uppercase tracking-wider">{t('बाकी बिल (Unpaid Bills)')}</span>
          <div className="flex items-center justify-between mt-1.5">
            <span className={'text-xl font-black ' + (unpaidInvoicesCount > 0 ? 'text-amber-500' : 'text-gray-300')}>
              {unpaidInvoicesCount}
            </span>
            <div className="p-1.5 bg-cyan-500/10 text-cyan-400 rounded-xl group-hover:bg-cyan-500/20 transition">
              <FileSpreadsheet className="h-4.5 w-4.5" />
            </div>
          </div>
          <span className="text-[9px] text-gray-550 block mt-1.5">{t('अधूरी/बाकी पेमेंट की संख्या')}</span>
        </div>
      </div>

      <div>
        <h3 className="text-[11px] font-black text-gray-400 mb-3 uppercase tracking-wider font-mono">{t('त्वरित काम (Quick Actions)')}</h3>
        <div className="grid grid-cols-3 gap-3">
          <button
            onClick={() => onNavigate('clients')}
            className="flex flex-col items-center justify-center p-4 bg-gray-900 border border-gray-850 hover:bg-amber-500/5 hover:border-amber-500/35 rounded-2xl transition shadow-sm cursor-pointer group text-center"
          >
            <div className="h-10 w-10 bg-amber-500/10 text-amber-500 rounded-xl flex items-center justify-center mb-2 group-hover:scale-110 transition">
              <PlusCircle className="h-5 w-5" />
            </div>
            <span className="text-xs font-black text-white block">{t('नया ग्राहक')}</span>
            <span className="text-[8px] text-gray-500 block font-mono mt-0.5">{t('Add Client')}</span>
          </button>

          <button
            onClick={() => onNavigate('invoices')}
            className="flex flex-col items-center justify-center p-4 bg-gray-900 border border-gray-850 hover:bg-emerald-500/5 hover:border-emerald-500/35 rounded-2xl transition shadow-sm cursor-pointer group text-center"
          >
            <div className="h-10 w-10 bg-emerald-500/10 text-emerald-400 rounded-xl flex items-center justify-center mb-2 group-hover:scale-110 transition">
              <FileSpreadsheet className="h-5 w-5" />
            </div>
            <span className="text-xs font-black text-white block">{t('नया पक्का बिल')}</span>
            <span className="text-[8px] text-gray-500 block font-mono mt-0.5">{t('Create Invoice')}</span>
          </button>

          <button
            onClick={() => onNavigate('labour')}
            className="flex flex-col items-center justify-center p-4 bg-gray-900 border border-gray-850 hover:bg-cyan-500/5 hover:border-cyan-500/35 rounded-2xl transition shadow-sm cursor-pointer group text-center"
          >
            <div className="h-10 w-10 bg-cyan-500/10 text-cyan-400 rounded-xl flex items-center justify-center mb-2 group-hover:scale-110 transition">
              <CheckCircle2 className="h-5 w-5" />
            </div>
            <span className="text-xs font-black text-white block">{t('हाजिरी भरें')}</span>
            <span className="text-[8px] text-gray-500 block font-mono mt-0.5">{t('Mark Attendance')}</span>
          </button>
        </div>
      </div>

      <button 
        onClick={handleExportReport}
        className="fixed bottom-6 right-6 bg-amber-500 hover:bg-amber-600 text-black p-4 rounded-full shadow-lg flex items-center space-x-2 font-black z-50 transition-all hover:scale-105"
      >
        <FileSpreadsheet className="h-5 w-5" />
        <span className="hidden sm:inline">Export Report</span>
      </button>

      <button 
        onClick={handleDownloadBackup}
        className="fixed bottom-24 right-6 bg-gray-800 hover:bg-gray-700 text-white p-4 rounded-full shadow-lg flex items-center space-x-2 font-black z-50 transition-all hover:scale-105"
      >
        <Clock className="h-5 w-5" />
        <span className="hidden sm:inline">Backup Data</span>
      </button>

      {todayDeadlines.length > 0 && (
        <div className="bg-[#1C160C] border border-amber-500/20 rounded-2xl p-4.5 shadow">
          <div className="flex items-center space-x-2 pb-2.5 border-b border-amber-500/10">
            <span className="p-1 rounded bg-amber-500/20 text-amber-500">
              <Calendar className="h-4.5 w-4.5" />
            </span>
            <h4 className="text-xs font-black text-amber-500 uppercase tracking-widest font-mono">
              आज की डेडलाइन्स (Today's Scheduled Deliveries)
            </h4>
          </div>

          <div className="divide-y divide-amber-900/10 mt-3 space-y-3">
            {todayDeadlines.map((c: any) => (
              <div key={c.id} className="flex items-center justify-between pt-1">
                <div>
                  <h5 className="text-xs font-bold text-gray-100">{c.name}</h5>
                  <p className="text-[10px] text-amber-200/70">{c.notes}</p>
                </div>
                
                {c.phone && c.phone !== 'NA' && (
                  <button
                    onClick={() => handleCallClient(c.phone)}
                    className="bg-amber-500 hover:bg-amber-600 text-black p-2 rounded-xl flex items-center space-x-1.5 transition cursor-pointer text-[10px] font-black"
                  >
                    <Phone className="h-3 w-3" />
                    <span>कॉल (Call)</span>
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5 shadow-lg">
        <div className="flex items-center justify-between pb-4 border-b border-gray-800">
          <div className="flex items-center space-x-2">
            <span className="h-6.5 w-6.5 bg-amber-500/10 border border-amber-500/20 flex items-center justify-center rounded-lg text-amber-500">
              <ClipboardCheck className="h-4 w-4" />
            </span>
            <h4 className="text-xs font-black text-gray-200 uppercase tracking-widest font-mono">हाल के पक्के बिल (Recent Invoices)</h4>
          </div>
          <button
            onClick={() => onNavigate('invoices')}
            className="text-[10px] font-extrabold text-amber-500 hover:underline cursor-pointer flex items-center space-x-1"
          >
            <span>सभी देखें</span>
            <span>&rarr;</span>
          </button>
        </div>

        {recentInvoices.length === 0 ? (
          <div className="text-center py-7 text-gray-500 space-y-1.5">
            <p className="text-xs font-bold">कोई बिल नहीं मिला (No Bills Set)</p>
            <p className="text-[10px] text-gray-600">पक्का बिल बनाने के लिए "नया पक्का बिल" चुनें।</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-800 mt-2">
            {recentInvoices.map((inv: any) => {
              const statusCfg = getStatusStyle(inv.status);
              return (
                <div key={inv.id} className="flex items-center justify-between py-3 px-1 hover:bg-gray-850/30 transition-all rounded-xl">
                  <div className="space-y-0.5">
                    <div className="flex items-center space-x-2">
                      <span className="text-xs font-black text-gray-100">{inv.clientName}</span>
                      <span className="text-[9.5px] text-gray-500 font-mono">({inv.invoiceNumber})</span>
                    </div>
                    <span className="text-[9px] text-gray-500 block">{inv.date}</span>
                  </div>

                  <div className="flex items-center space-x-3 text-right">
                    <span className="text-xs font-black text-white">
                      ₹{(inv.grandTotal ?? 0).toLocaleString('en-IN')}
                    </span>

                    <span className={'inline-flex items-center px-2 py-1 rounded-full text-[9px] font-black tracking-wider ' + statusCfg.pill}>
                      <span className={'h-1.5 w-1.5 rounded-full mr-1.5 ' + statusCfg.dot} />
                      {inv.status?.toUpperCase()}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="bg-gradient-to-tr from-gray-900 to-gray-950 border border-gray-800 rounded-2xl p-4 flex items-start space-x-3 shadow-inner">
        <div className="h-7 w-7 rounded bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-500 flex-shrink-0">
          <Sliders className="h-4 w-4" />
        </div>
        <div>
          <h4 className="text-[11px] font-black text-amber-500 uppercase tracking-widest font-mono">मजबूत सुरक्षा और विश्वसनीयता:</h4>
          <p className="text-[10px] text-gray-400 mt-1 leading-relaxed">
            BillKaro क्लाउड और लोकल स्टोरेज का शानदार कॉम्बो प्रदान करता है। डेटा खुद-ब-खुद ऑटो-सेव होता रहता है जिससे आपके ग्राहकों का लेन-देन, एस्टीमेट और वेंडर का हिसाब कभी नहीं खोएगा।
          </p>
        </div>
      </div>
    </div>
  );
}
