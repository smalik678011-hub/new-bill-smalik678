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
  Check,
  FileText,
  X,
  QrCode,
  Share2,
  Copy,
  Eye
} from 'lucide-react';
import { generatePendingPaymentsPDF } from '../lib/pdf';
import { QRCodeSVG } from 'qrcode.react';
import { motion, AnimatePresence } from 'motion/react';

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
  const [isBaqiModalOpen, setIsBaqiModalOpen] = useState(false);
  const [isQRModalOpen, setIsQRModalOpen] = useState(false);
  const [previewClient, setPreviewClient] = useState<any>(null);
  const [isDownloadingBaqi, setIsDownloadingBaqi] = useState(false);
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
              clientName: matchedClient ? matchedClient.name : 'Customer (Unspecified)',
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

  const handleDownloadBaqiPDF = async () => {
    setIsDownloadingBaqi(true);
    const loader = toast.loading('Generating outstanding balance report...');
    try {
      const doc = generatePendingPaymentsPDF({
        clients: store.clients,
        invoices: store.invoices,
        profile: store.profile
      });
      doc.save(`LENA_BAQI_REPORT_${new Date().toISOString().split('T')[0]}.pdf`);
      toast.success('Lena Baqi Report Downloaded!');
    } catch (e) {
      console.error(e);
      toast.error('Failed to generate report.');
    } finally {
      toast.dismiss(loader);
      setIsDownloadingBaqi(false);
    }
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

  const lowStockItems = store.inventory.filter(item => item.stockCount < item.minimumRequired);

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
            Business Ledger
          </h2>
          <p className="text-xs text-gray-550">
            {supabaseMode ? 'All bills and payments are securely synchronized with the cloud.' : 'Local offline ledger mode active. Data is saved locally.'}
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
                <span>Cloud Sync Active</span>
              </>
            ) : (
              <>
                <CloudLightning className="h-3 w-3" />
                <span>Local Offline Ledger</span>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Low Stock Alert Notification */}
      {lowStockItems.length > 0 && (
        <div className="bg-rose-500/10 border border-rose-500/20 rounded-2xl p-4 flex items-center justify-between shadow-lg shadow-rose-500/5 animate-fadeIn">
          <div className="flex items-center space-x-3">
            <div className="h-10 w-10 bg-rose-500/20 text-rose-500 rounded-xl flex items-center justify-center animate-pulse">
              <AlertCircle className="h-6 w-6" />
            </div>
            <div className="min-w-0">
              <h4 className="text-xs font-black text-rose-500 uppercase tracking-widest font-mono">Low Stock Alert</h4>
              <p className="text-[10px] text-gray-400 mt-0.5 truncate pr-2">
                {lowStockItems.length} items are running below minimum required stock.
              </p>
            </div>
          </div>
          <button
            onClick={() => onNavigate('stock')}
            className="flex-shrink-0 px-4 py-2 bg-rose-500 text-white rounded-xl text-[10px] font-black uppercase tracking-wider hover:bg-rose-600 transition shadow-lg shadow-rose-500/20 cursor-pointer"
          >
            View Inventory
          </button>
        </div>
      )}

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-gray-900 rounded-2xl p-4.5 border border-gray-800 relative shadow-md group hover:border-amber-500/30 transition">
          <span className="text-[10px] text-gray-400 block font-bold uppercase tracking-wider">Total Outstanding</span>
          <div className="flex items-center justify-between mt-1.5">
            <span className={'text-xl font-black ' + (pendingAmount > 0 ? 'text-red-400' : 'text-gray-100')}>
              ₹{(pendingAmount ?? 0).toLocaleString('en-IN')}
            </span>
            <button
              onClick={handleDownloadBaqiPDF}
              disabled={isDownloadingBaqi || pendingAmount <= 0}
              className="p-1.5 rounded-xl bg-red-500/10 text-red-400 hover:bg-red-500 hover:text-white transition cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
              title="Download PDF Report"
            >
              <FileText className="h-4.5 w-4.5" />
            </button>
          </div>
          <span className="text-[9px] text-gray-550 block mt-1.5">
            {pendingAmount > 0 ? '⚠️ Dues Pending!' : 'No Outstanding Balances'}
          </span>
        </div>

        <div className="bg-gray-900 rounded-2xl p-4.5 border border-gray-800 relative shadow-md">
          <span className="text-[10px] text-gray-400 block font-bold uppercase tracking-wider">Monthly Income</span>
          <div className="flex items-center justify-between mt-1.5">
            <span className="text-xl font-black text-emerald-400">
              ₹{(monthlyIncome ?? 0).toLocaleString('en-IN')}
            </span>
            <div className="p-1.5 bg-emerald-500/10 text-emerald-400 rounded-xl">
              <TrendingUp className="h-4.5 w-4.5" />
            </div>
          </div>
          <span className="text-[9px] text-gray-550 block mt-1.5">Total cash inflow this month</span>
        </div>

        <div onClick={() => onNavigate('clients')} className="bg-gray-900 rounded-2xl p-4.5 border border-gray-800 relative shadow-md group hover:border-amber-500/30 transition cursor-pointer">
          <span className="text-[10px] text-gray-400 block font-bold uppercase tracking-wider">Active Clients</span>
          <div className="flex items-center justify-between mt-1.5">
            <span className="text-xl font-black text-amber-500">
              {activeClientsCount}
            </span>
            <div className="p-1.5 bg-amber-500/10 text-amber-500 rounded-xl group-hover:bg-amber-500/20 transition">
              <Users className="h-4.5 w-4.5" />
            </div>
          </div>
          <span className="text-[9px] text-gray-550 block mt-1.5">All customer ledger accounts</span>
        </div>

        <div onClick={() => onNavigate('invoices')} className="bg-gray-900 rounded-2xl p-4.5 border border-gray-800 relative shadow-md group hover:border-amber-500/30 transition cursor-pointer">
          <span className="text-[10px] text-gray-400 block font-bold uppercase tracking-wider">Unpaid Invoices</span>
          <div className="flex items-center justify-between mt-1.5">
            <span className={'text-xl font-black ' + (unpaidInvoicesCount > 0 ? 'text-amber-500' : 'text-gray-300')}>
              {unpaidInvoicesCount}
            </span>
            <div className="p-1.5 bg-amber-500/10 text-amber-500 rounded-xl group-hover:bg-amber-500/20 transition">
              <FileSpreadsheet className="h-4.5 w-4.5" />
            </div>
          </div>
          <span className="text-[9px] text-gray-550 block mt-1.5">Number of outstanding unpaid bills</span>
        </div>
      </div>

      <div>
        <h3 className="text-[11px] font-black text-gray-400 mb-3 uppercase tracking-wider font-mono">Quick Actions</h3>
        <div className="grid grid-cols-3 gap-3">
          <button
            onClick={() => onNavigate('clients')}
            className="flex flex-col items-center justify-center p-4 bg-amber-500 border border-amber-600 hover:bg-amber-600 rounded-2xl transition shadow-lg shadow-amber-500/20 cursor-pointer group text-center"
          >
            <div className="h-10 w-10 bg-white/20 text-white rounded-xl flex items-center justify-center mb-2 group-hover:scale-110 transition">
              <PlusCircle className="h-5 w-5" />
            </div>
            <span className="text-xs font-black text-white block">Add Client</span>
          </button>

          <button
            onClick={() => onNavigate('invoices')}
            className="flex flex-col items-center justify-center p-4 bg-amber-500 border border-amber-600 hover:bg-amber-600 rounded-2xl transition shadow-lg shadow-amber-500/20 cursor-pointer group text-center"
          >
            <div className="h-10 w-10 bg-white/20 text-white rounded-xl flex items-center justify-center mb-2 group-hover:scale-110 transition">
              <FileSpreadsheet className="h-5 w-5" />
            </div>
            <span className="text-xs font-black text-white block">New Invoice</span>
          </button>

          <button
            onClick={() => onNavigate('labour')}
            className="flex flex-col items-center justify-center p-4 bg-amber-500 border border-amber-600 hover:bg-amber-600 rounded-2xl transition shadow-lg shadow-amber-500/20 cursor-pointer group text-center"
          >
            <div className="h-10 w-10 bg-white/20 text-white rounded-xl flex items-center justify-center mb-2 group-hover:scale-110 transition">
              <CheckCircle2 className="h-5 w-5" />
            </div>
            <span className="text-xs font-black text-white block">Mark Attendance</span>
          </button>

          <button
            onClick={() => setIsBaqiModalOpen(true)}
            className="flex flex-col items-center justify-center p-4 bg-rose-500 border border-rose-600 hover:bg-rose-600 rounded-2xl transition shadow-lg shadow-rose-500/20 cursor-pointer group text-center"
          >
            <div className="h-10 w-10 bg-white/20 text-white rounded-xl flex items-center justify-center mb-2 group-hover:scale-110 transition">
              <FileText className="h-5 w-5" />
            </div>
            <span className="text-xs font-black text-white block">Owed Report</span>
          </button>

          <button
            onClick={() => {
              if (!store.profile.upiId) {
                toast.error('Please set your UPI ID in Profile Settings first!');
                onNavigate('settings');
                return;
              }
              setIsQRModalOpen(true);
            }}
            className="flex flex-col items-center justify-center p-4 bg-emerald-500 border border-emerald-600 hover:bg-emerald-600 rounded-2xl transition shadow-lg shadow-emerald-500/20 cursor-pointer group text-center"
          >
            <div className="h-10 w-10 bg-white/20 text-white rounded-xl flex items-center justify-center mb-2 group-hover:scale-110 transition">
              <QrCode className="h-5 w-5" />
            </div>
            <span className="text-xs font-black text-white block">Share UPI QR</span>
          </button>
        </div>
      </div>

      <button 
        onClick={handleExportReport}
        className="fixed bottom-6 right-6 bg-amber-500 hover:bg-amber-600 text-white p-4 rounded-full shadow-lg flex items-center space-x-2 font-black z-50 transition-all hover:scale-105"
      >
        <FileSpreadsheet className="h-5 w-5" />
        <span className="hidden sm:inline">Export Report</span>
      </button>

      <button 
        onClick={handleDownloadBackup}
        className="fixed bottom-24 right-6 bg-amber-500 hover:bg-amber-600 text-white p-4 rounded-full shadow-lg flex items-center space-x-2 font-black z-50 transition-all hover:scale-105"
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
                    className="bg-amber-500 hover:bg-amber-600 text-white p-2 rounded-xl flex items-center space-x-1.5 transition cursor-pointer text-[10px] font-black"
                  >
                    <Phone className="h-3 w-3" />
                    <span>Call</span>
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
            <h4 className="text-xs font-black text-gray-200 uppercase tracking-widest font-mono">Recent Invoices</h4>
          </div>
          <button
            onClick={() => onNavigate('invoices')}
            className="text-[10px] font-extrabold text-amber-500 hover:underline cursor-pointer flex items-center space-x-1"
          >
            <span>View All</span>
            <span>&rarr;</span>
          </button>
        </div>

        {recentInvoices.length === 0 ? (
          <div className="text-center py-7 text-gray-500 space-y-1.5">
            <p className="text-xs font-bold">No Invoices Found</p>
            <p className="text-[10px] text-gray-600">Select "New Invoice" to create a bill.</p>
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
          <h4 className="text-[11px] font-black text-amber-500 uppercase tracking-widest font-mono">Robust Security & Reliability:</h4>
          <p className="text-[10px] text-gray-400 mt-1 leading-relaxed">
            BillKaro combines cloud synchronization and local storage securely. Your data automatically saves to ensure you never lose track of transactions, estimates, or account histories.
          </p>
        </div>
      </div>

      {/* Lena Baqi Report Modal */}
      {isBaqiModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setIsBaqiModalOpen(false)} />
          <div className="relative w-full max-w-2xl bg-gray-900 border border-gray-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            {/* Header */}
            <div className="p-5 border-b border-gray-800 flex items-center justify-between bg-gray-900/50 backdrop-blur">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-rose-500/10 rounded-xl text-rose-500 border border-rose-500/20">
                  <FileText className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-white uppercase tracking-wider">Pending Recovery Report</h3>
                  <p className="text-[10px] text-gray-500 font-mono">Summary of all outstanding payments</p>
                </div>
              </div>
              <button 
                onClick={() => setIsBaqiModalOpen(false)}
                className="p-2 hover:bg-gray-800 rounded-full transition text-gray-400 hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-5 custom-scrollbar">
              <div className="bg-amber-500/5 border border-amber-500/10 rounded-2xl p-4 mb-6">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-[10px] text-amber-500/80 font-black uppercase tracking-widest block mb-1">Total Recovery Pending</span>
                    <h4 className="text-2xl font-black text-amber-500">₹{(pendingAmount ?? 0).toLocaleString('en-IN')}</h4>
                  </div>
                  <div className="h-12 w-12 bg-amber-500/10 rounded-2xl flex items-center justify-center text-amber-500 border border-amber-500/20">
                    <IndianRupee className="h-6 w-6" />
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <div className="grid grid-cols-4 px-2 text-[10px] font-black text-gray-500 uppercase tracking-widest pb-1">
                  <div className="col-span-2">Client Name</div>
                  <div className="text-right">Mobile</div>
                  <div className="text-right">Owed Amount</div>
                </div>
                
                {store.clients.filter(c => c.totalDue > 0).length === 0 ? (
                  <div className="text-center py-10 bg-gray-950/50 rounded-2xl border border-dashed border-gray-800">
                    <Check className="h-10 w-10 text-emerald-500 mx-auto mb-3 opacity-20" />
                    <p className="text-xs text-gray-550 font-bold">All dues cleared! (No Pending Dues)</p>
                  </div>
                ) : (
                  store.clients
                    .filter(c => c.totalDue > 0)
                    .sort((a, b) => b.totalDue - a.totalDue)
                    .map(client => {
                      const clientWeight = (client.totalDue / (pendingAmount || 1)) * 100;
                      return (
                        <div key={client.id} className="p-3.5 bg-gray-950/40 border border-gray-800/50 rounded-2xl hover:border-gray-700 transition-all group space-y-3">
                          <div className="grid grid-cols-4 items-center">
                            <div className="col-span-2">
                              <div className="flex items-center space-x-2">
                                <span className="text-xs font-bold text-gray-100 block">{client.name}</span>
                                <button 
                                  onClick={() => setPreviewClient(client)}
                                  className="p-1.5 hover:bg-gray-800 rounded-lg text-gray-500 hover:text-amber-500 transition-colors cursor-pointer"
                                  title="Quick View Invoices"
                                >
                                  <Eye className="h-3.5 w-3.5" />
                                </button>
                              </div>
                              <span className="text-[9px] text-gray-500 font-mono italic">Client ID: {client.id.slice(0, 8)}</span>
                            </div>
                            <div className="text-right">
                              <span className="text-[10px] font-mono text-gray-400">{client.phone || '-'}</span>
                            </div>
                            <div className="text-right">
                              <span className="text-xs font-black text-rose-500">₹{client.totalDue.toLocaleString('en-IN')}</span>
                            </div>
                          </div>
                          
                          {/* Recovery Weight Progress Bar */}
                          <div className="space-y-1">
                            <div className="w-full h-1 bg-gray-900 rounded-full overflow-hidden">
                              <div 
                                className="h-full bg-rose-500/60 group-hover:bg-rose-500 transition-all duration-500" 
                                style={{ width: `${clientWeight}%` }}
                              />
                            </div>
                            <div className="flex justify-between items-center text-[8px] font-mono text-gray-600">
                              <span>Recovery Weight</span>
                              <span>{clientWeight.toFixed(1)}% of total dues</span>
                            </div>
                          </div>
                        </div>
                      )
                    })
                )}
              </div>
            </div>

            {/* Footer Actions */}
            <div className="p-5 border-t border-gray-800 bg-gray-900/80 backdrop-blur flex items-center justify-between select-none">
              <div className="flex items-center space-x-2 text-[10px] text-gray-500 font-mono">
                <AlertCircle className="h-3 w-3 text-amber-500" />
                <span>Showing top active recoveries.</span>
              </div>
              <button
                disabled={isDownloadingBaqi || store.clients.filter(c => c.totalDue > 0).length === 0}
                onClick={handleDownloadBaqiPDF}
                className="bg-rose-500 hover:bg-rose-600 disabled:opacity-50 disabled:cursor-not-allowed text-white px-6 py-2.5 rounded-xl text-[11px] font-black uppercase tracking-widest flex items-center space-x-2 transition shadow-lg shadow-rose-500/20 cursor-pointer"
              >
                <FileText className="h-4 w-4" />
                <span>Download PDF Report</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* UPI QR Modal */}
      {isQRModalOpen && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setIsQRModalOpen(false)} />
          <div className="relative w-full max-w-sm bg-white rounded-3xl shadow-2xl overflow-hidden flex flex-col items-center p-8 text-center animate-scaleIn">
            <button 
              onClick={() => setIsQRModalOpen(false)}
              className="absolute top-4 right-4 p-2 hover:bg-gray-100 rounded-full transition text-gray-400"
            >
              <X className="h-5 w-5" />
            </button>

            <div className="mb-6">
              <h3 className="text-lg font-black text-gray-900 border-b-4 border-amber-500 inline-block pb-1 tracking-tighter">SCAN & PAY</h3>
              <p className="text-xs text-gray-500 font-mono mt-2 uppercase tracking-widest truncate max-w-[250px]">{store.profile.businessName || 'Merchant'}</p>
            </div>

            <div className="bg-white p-4 rounded-3xl border-4 border-gray-100 shadow-inner flex items-center justify-center mb-6 overflow-hidden">
              <QRCodeSVG 
                value={`upi://pay?pa=${store.profile.upiId}&pn=${encodeURIComponent(store.profile.businessName || 'Business')}&cu=INR`} 
                size={220}
                level="H"
                includeMargin={true}
              />
            </div>

            <div className="space-y-4 w-full">
              <div className="bg-gray-50 p-3 rounded-2xl border border-gray-100">
                <span className="text-[10px] text-gray-400 uppercase font-black block mb-1">UPI ID</span>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-gray-900 break-all">{store.profile.upiId}</span>
                  <button 
                    onClick={() => {
                      navigator.clipboard.writeText(store.profile.upiId);
                      toast.success('UPI ID Copied!');
                    }}
                    className="p-1.5 text-amber-500 hover:bg-amber-50 rounded-lg transition"
                  >
                    <Copy className="h-4 w-4" />
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => {
                    const upiUri = `upi://pay?pa=${store.profile.upiId}&pn=${encodeURIComponent(store.profile.businessName || 'Business')}&cu=INR`;
                    navigator.clipboard.writeText(upiUri);
                    toast.success('Payment link copied!');
                  }}
                  className="flex items-center justify-center space-x-2 bg-gray-900 text-white py-3 rounded-2xl text-[10px] font-black uppercase tracking-wider hover:bg-black transition cursor-pointer"
                >
                  <Copy className="h-4 w-4" />
                  <span>Copy Link</span>
                </button>
                <button
                  onClick={() => {
                    const upiUri = `upi://pay?pa=${store.profile.upiId}&pn=${encodeURIComponent(store.profile.businessName || 'Business')}&cu=INR`;
                    const text = `Hey, please pay using this UPI QR or link: ${upiUri}`;
                    window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`, '_blank');
                  }}
                  className="flex items-center justify-center space-x-2 bg-emerald-500 text-white py-3 rounded-2xl text-[10px] font-black uppercase tracking-wider hover:bg-emerald-600 transition shadow-lg shadow-emerald-500/20 cursor-pointer"
                >
                  <Share2 className="h-4 w-4" />
                  <span>WhatsApp</span>
                </button>
              </div>
            </div>

            <p className="mt-6 text-[9px] text-gray-400 font-medium">Safe and Secure Payments via UPI Infrastructure</p>
          </div>
        </div>
      )}

      {/* Client Dues Quick Preview */}
      <AnimatePresence>
        {previewClient && (
          <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm" 
              onClick={() => setPreviewClient(null)} 
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              transition={{ type: 'spring', duration: 0.4, bounce: 0.3 }}
              className="relative w-full max-w-sm bg-gray-900 border border-gray-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[80vh]"
            >
              <div className="p-4 border-b border-gray-800 flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div className="p-1.5 bg-amber-500/10 rounded-lg text-amber-500">
                    <Eye className="h-4 w-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-black text-white uppercase tracking-wider">{previewClient.name}</h4>
                    <p className="text-[9px] text-gray-500 font-mono">Unpaid Invoices Breakdown</p>
                  </div>
                </div>
                <button 
                  onClick={() => setPreviewClient(null)}
                  className="p-1.5 hover:bg-gray-800 rounded-full transition text-gray-400 hover:text-white"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
              
              <div className="flex-1 overflow-y-auto p-4 space-y-2">
                {store.invoices
                  .filter(inv => inv.clientId === previewClient.id && inv.status !== 'Paid')
                  .length === 0 ? (
                    <div className="text-center py-6">
                      <Check className="h-8 w-8 text-emerald-500 mx-auto opacity-20 mb-2" />
                      <p className="text-[10px] text-gray-500 font-bold uppercase">No specific unpaid invoices found.</p>
                    </div>
                  ) : (
                    store.invoices
                      .filter(inv => inv.clientId === previewClient.id && inv.status !== 'Paid')
                      .map(inv => (
                        <div key={inv.id} className="p-3 bg-gray-950/50 border border-gray-800/50 rounded-xl flex justify-between items-center group">
                          <div className="space-y-0.5">
                            <span className="text-[10px] font-black text-gray-300 block">{inv.invoiceNumber}</span>
                            <span className="text-[9px] text-gray-600 font-mono">{inv.date}</span>
                          </div>
                          <div className="text-right">
                            <span className="text-xs font-black text-rose-500 block">₹{(inv.totalAmount - (inv.paidAmount || 0)).toLocaleString('en-IN')}</span>
                            <div className="flex items-center justify-end space-x-1">
                              <div className={`h-1 w-1 rounded-full ${inv.status === 'Partial' ? 'bg-amber-500' : 'bg-rose-500'}`} />
                              <span className="text-[8px] text-gray-600 font-black uppercase tracking-tighter">{inv.status}</span>
                            </div>
                          </div>
                        </div>
                      ))
                  )}
              </div>

              <div className="p-4 border-t border-gray-800 bg-gray-950/50 space-y-3">
                <div className="flex justify-between items-center text-[10px] uppercase font-black tracking-widest text-amber-500">
                  <span>Total Due Amount</span>
                  <span>₹{previewClient.totalDue.toLocaleString('en-IN')}</span>
                </div>
                
                {previewClient.phone && previewClient.phone !== 'NA' && (
                  <button
                    onClick={() => handleCallClient(previewClient.phone)}
                    className="w-full bg-emerald-500 hover:bg-emerald-600 text-white py-3 rounded-xl flex items-center justify-center space-x-2 transition-all shadow-lg shadow-emerald-500/10 cursor-pointer group"
                  >
                    <Phone className="h-4 w-4 group-hover:animate-bounce" />
                    <span className="text-[11px] font-black uppercase tracking-widest">Call Now</span>
                  </button>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
