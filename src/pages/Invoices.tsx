import React, { useState, useEffect } from 'react';
import { 
  FileText, 
  PlusCircle, 
  Search, 
  Filter, 
  Calendar, 
  Coins, 
  Briefcase, 
  TrendingUp, 
  AlertCircle,
  Eye,
  CreditCard,
  Edit2,
  Trash2,
  ListFilter,
  CheckCircle2,
  FileSpreadsheet,
  History,
  Share2
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAppStore } from '../store';
import { Invoice } from '../types';
import InvoiceBuilder from '../components/invoice/InvoiceBuilder';
import PaymentEntry from '../components/invoice/PaymentEntry';
import InvoicePreview from '../components/invoice/InvoicePreview';
import { toast } from 'react-hot-toast';
import { supabase } from '../lib/supabase';


const mapDbInvoiceToUi = (inv: any): Invoice => {
  let paidSum = 0;
  let parsedPayments: any[] = [];
  if (inv.payments) {
    if (typeof inv.payments === 'string') {
      try {
        parsedPayments = JSON.parse(inv.payments);
      } catch (e) {
        parsedPayments = [];
      }
    } else if (Array.isArray(inv.payments)) {
      parsedPayments = inv.payments;
    }
    paidSum = parsedPayments.reduce((s: number, p: any) => s + Number(p.amount || 0), 0);
  }

  return {
    id: inv.id,
    invoiceNumber: inv.number || inv.invoiceNumber || '',
    clientId: inv.client_id || inv.clientId || '',
    date: inv.created_at ? inv.created_at.split('T')[0] : (inv.date || new Date().toISOString().split('T')[0]),
    dueDate: inv.due_date || inv.dueDate || new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    items: typeof inv.items === 'string' ? JSON.parse(inv.items) : (inv.items || []),
    discount: Number(inv.discount || 0),
    notes: inv.notes || '',
    isGstApplied: inv.gst_percent > 0 || inv.isGstApplied || false,
    totalAmount: Number(inv.grand_total || inv.totalAmount || 0),
    paidAmount: paidSum,
    status: inv.status || 'Unpaid',
    payments: parsedPayments
  };
};

export default function Invoices() {
  const navigate = useNavigate();

  const { invoices: storeInvoices, clients: storeClients, addInvoice, updateInvoice, deleteInvoice } = useAppStore();

  const [supabaseMode, setSupabaseMode] = useState(false);
  const [businessId, setBusinessId] = useState<string | null>(null);
  const [dbInvoices, setDbInvoices] = useState<Invoice[]>([]);
  const [dbClients, setDbClients] = useState<any[]>([]);
  const [loadingDb, setLoadingDb] = useState(false);

  // Component views toggle
  const [activeView, setActiveView] = useState<'LIST' | 'CREATE' | 'EDIT'>('LIST');
  const [editingInvoice, setEditingInvoice] = useState<Invoice | undefined>(undefined);
  
  // Modals overlays state
  const [previewingInvoice, setPreviewingInvoice] = useState<Invoice | null>(null);
  const [payingInvoice, setPayingInvoice] = useState<Invoice | null>(null);
  const [expandedInvoiceId, setExpandedInvoiceId] = useState<string | null>(null);

  const handleWhatsAppShare = (inv: Invoice) => {
    // Simplify for now, just format the message
    const whatsappMessage = `*Invoice: ${inv.invoiceNumber}*\nView details here: <link_to_preview>`; // Placeholder
    
    if (navigator.share) {
      navigator.share({
        title: 'Invoice',
        text: whatsappMessage,
      }).catch(console.error);
    } else {
      // Fallback
      const encodedText = encodeURIComponent(whatsappMessage);
      window.open(`https://api.whatsapp.com/send?text=${encodedText}`, '_blank');
    }
  };
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [gstFilter, setGstFilter] = useState<string>('ALL'); // ALL, GST, NON_GST
  const [sortBy, setSortBy] = useState<string>('DATE_DESC');

  const refreshInvoicesData = async () => {
    try {
      setLoadingDb(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setSupabaseMode(false);
        setDbInvoices(storeInvoices);
        setDbClients(storeClients);
        setLoadingDb(false);
        return;
      }

      const { data: businesses, error: bErr } = await supabase
        .from('profiles')
        .select('id')
        .eq('user_id', user.id);

      if (bErr || !businesses || businesses.length === 0) {
        setSupabaseMode(false);
        setDbInvoices(storeInvoices);
        setDbClients(storeClients);
        setLoadingDb(false);
        return;
      }

      const activeBId = businesses[0].id;
      setBusinessId(activeBId);

      const [invoicesRes, clientsRes] = await Promise.all([
        supabase.from('invoices').select('*').eq('business_id', activeBId),
        supabase.from('clients').select('*').eq('business_id', activeBId)
      ]);

      if (!invoicesRes.error) {
        const mapped = (invoicesRes.data || []).map(mapDbInvoiceToUi);
        setSupabaseMode(true);
        setDbInvoices(mapped);
      } else {
        setSupabaseMode(false);
        setDbInvoices(storeInvoices);
      }

      if (!clientsRes.error) {
        setDbClients(clientsRes.data || []);
      } else {
        setDbClients(storeClients);
      }
    } catch (e) {
      console.error(e);
      setSupabaseMode(false);
      setDbInvoices(storeInvoices);
      setDbClients(storeClients);
    } finally {
      setLoadingDb(false);
    }
  };

  useEffect(() => {
    refreshInvoicesData();
  }, [storeInvoices, storeClients]);

  // Statistics Calculations
  const totalBilling = dbInvoices.reduce((s, inv) => s + inv.totalAmount, 0);
  const totalCollected = dbInvoices.reduce((s, inv) => s + inv.paidAmount, 0);
  const totalOutstanding = Math.max(0, totalBilling - totalCollected);
  const invoicesCount = dbInvoices.length;

  // Handle Create Success
  const handleCreateSave = async (invoicePayload: Omit<Invoice, 'id'>) => {
    try {
      if (supabaseMode && businessId) {
        const { error: insErr } = await supabase
          .from('invoices')
          .insert({
            business_id: businessId,
            client_id: invoicePayload.clientId,
            number: invoicePayload.invoiceNumber,
            items: invoicePayload.items,
            subtotal: invoicePayload.items.reduce((s, i) => s + (i.rate * i.quantity), 0),
            gst_percent: invoicePayload.isGstApplied ? 18 : 0,
            gst_amount: invoicePayload.isGstApplied ? invoicePayload.items.reduce((s, i) => s + ((i.rate * i.quantity * i.gstPercent) / 100), 0) : 0,
            discount: invoicePayload.discount,
            grand_total: invoicePayload.totalAmount,
            status: invoicePayload.status,
            payments: invoicePayload.payments || []
          });
        if (insErr) throw insErr;
        toast.success('GST Invoice saved securely in cloud!');
        refreshInvoicesData();
      } else {
        addInvoice(invoicePayload);
        toast.success('GST Invoice saved securely!');
      }
      setActiveView('LIST');
    } catch (e: any) {
      toast.error('Error saving invoice!');
      console.error(e);
    }
  };

  // Handle Edit Success
  const handleEditSave = async (invoicePayload: Omit<Invoice, 'id'>) => {
    if (!editingInvoice) return;
    try {
      if (supabaseMode) {
        const { error: updErr } = await supabase
          .from('invoices')
          .update({
            number: invoicePayload.invoiceNumber,
            client_id: invoicePayload.clientId,
            items: invoicePayload.items,
            subtotal: invoicePayload.items.reduce((s, i) => s + (i.rate * i.quantity), 0),
            grand_total: invoicePayload.totalAmount,
            discount: invoicePayload.discount,
            status: invoicePayload.status,
            payments: invoicePayload.payments || []
          })
          .eq('id', editingInvoice.id);
        if (updErr) throw updErr;
        toast.success('Invoice updated successfully in cloud!');
        refreshInvoicesData();
      } else {
        updateInvoice(editingInvoice.id, invoicePayload);
        toast.success('Invoice updated successfully!');
      }
      setActiveView('LIST');
      setEditingInvoice(undefined);
    } catch (e: any) {
      toast.error('Error updating invoice!');
      console.error(e);
    }
  };

  // Handle Delete Invoice
  const handleDelete = async (id: string, number: string) => {
    const isConfirmed = window.confirm(`Are you sure you want to delete invoice ${number}? The client's outstanding balance will also be recalculated.`);
    if (isConfirmed) {
      try {
        if (supabaseMode) {
          const { error: delErr } = await supabase
            .from('invoices')
            .delete()
            .eq('id', id);
          if (delErr) throw delErr;
          toast.success(`Invoice ${number} deleted successfully in cloud!`);
          refreshInvoicesData();
        } else {
          deleteInvoice(id);
          toast.success(`Invoice ${number} deleted successfully!`);
        }
      } catch (e: any) {
        toast.error('Error deleting invoice!');
        console.error(e);
      }
    }
  };

  // Filtering Logic
  const filteredInvoices = dbInvoices.filter(inv => {
    // 1. Search Query Client name or Invoice Number matching
    const clientName = dbClients.find(c => c.id === inv.clientId)?.name?.toLowerCase() || '';
    const invNumber = inv.invoiceNumber?.toLowerCase() || '';
    const matchesSearch = clientName.includes(searchQuery.toLowerCase()) || invNumber.includes(searchQuery.toLowerCase());

    // 2. Status Match
    // Invoices status could be Draft, Sent, Unpaid, Partial, Overdue, Paid
    const matchesStatus = statusFilter === 'ALL' || 
      inv.status?.toLowerCase() === statusFilter.toLowerCase();

    // 3. GST Filter Match
    const matchesGst = gstFilter === 'ALL' || 
      (gstFilter === 'GST' ? inv.isGstApplied : !inv.isGstApplied);

    return matchesSearch && matchesStatus && matchesGst;
  });

  // Sorting Logic
  const sortedInvoices = [...filteredInvoices].sort((a, b) => {
    if (sortBy === 'DATE_DESC') {
      return new Date(b.date).getTime() - new Date(a.date).getTime();
    }
    if (sortBy === 'DATE_ASC') {
      return new Date(a.date).getTime() - new Date(b.date).getTime();
    }
    if (sortBy === 'AMOUNT_DESC') {
      return b.totalAmount - a.totalAmount;
    }
    if (sortBy === 'AMOUNT_ASC') {
      return a.totalAmount - b.totalAmount;
    }
    return 0;
  });

  // Render Status Badge
  const renderStatusBadge = (status: string) => {
    switch (status) {
      case 'Paid':
        return (
          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-500/10 text-emerald-450 border border-emerald-500/20 font-mono">
            ● PAID
          </span>
        );
      case 'Partial':
        return (
          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-500/10 text-amber-450 border border-amber-500/20 font-mono">
            ● PARTIAL
          </span>
        );
      case 'Unpaid':
        return (
          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-[#FF4500]/10 text-[#FF6347] border border-[#FF4500]/20 font-mono">
            ● UNPAID
          </span>
        );
      case 'Draft':
        return (
          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-gray-800 text-gray-400 border border-gray-700 font-mono">
            ● DRAFT
          </span>
        );
      case 'Sent':
        return (
          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-sky-500/10 text-sky-400 border border-sky-500/20 font-mono">
            ● SENT
          </span>
        );
      case 'Overdue':
        return (
          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-rose-500/10 text-rose-450 border border-rose-500/20 font-mono">
            ● OVERDUE
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-gray-850 text-gray-400 border border-gray-75 * font-mono">
            ● {status}
          </span>
        );
    }
  };

  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6">
      
      {/* UPGRADE BANNER */}
      <div className="bg-gradient-to-r from-orange-50 to-orange-100 dark:from-orange-950/20 dark:to-orange-900/10 border border-orange-200 dark:border-orange-500/20 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-3 max-w-7xl mx-auto shadow-sm">
        <div className="flex items-center gap-2.5 text-center sm:text-left">
          <span className="text-xl">🔒</span>
          <span className="text-xs text-orange-900 dark:text-orange-300 font-extrabold font-sans">Free Trial active · Max 5 clients allowed</span>
        </div>
        <button 
          className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-black px-5 py-2.5 rounded-xl text-xs uppercase tracking-wider transition-all shadow-md shadow-orange-500/25 border-0 cursor-pointer active:scale-98"
          onClick={() => navigate('/pricing')}
        >
          Upgrade →
        </button>
      </div>

      {/* PAGE HEADER */}
      <div className="flex items-center gap-3.5 py-1">
        <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-amber-500 rounded-2xl flex items-center justify-center text-2xl shadow-lg shadow-orange-500/30 text-white shrink-0">
          🧾
        </div>
        <div className="text-left font-sans">
          <h1 className="text-xl font-black text-[#0B0F1A] dark:text-white tracking-tight leading-none uppercase">Tax Invoices</h1>
          <p className="text-[10px] text-orange-500 font-extrabold uppercase tracking-widest mt-2">GST Compliant Sales Manager</p>
        </div>
      </div>

      {/* CREATE BUTTON */}
      {activeView === 'LIST' && (
        <div className="w-full">
          <button 
            onClick={() => setActiveView('CREATE')}
            className="w-full bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white border-0 py-4.5 rounded-2xl font-black text-xs uppercase tracking-widest flex items-center justify-center space-x-2.5 shadow-lg shadow-orange-500/20 active:scale-[0.98] transition-all cursor-pointer text-center"
          >
            <div className="w-5 h-5 rounded-full border border-white/60 flex items-center justify-center text-sm font-light leading-none">+</div>
            <span>Create New Tax Invoice</span>
          </button>
        </div>
      )}

      {/* Primary Routing Render Box */}
      {activeView === 'CREATE' && (
        <InvoiceBuilder 
          onSave={handleCreateSave}
          onCancel={() => setActiveView('LIST')}
        />
      )}

      {activeView === 'EDIT' && editingInvoice && (
        <InvoiceBuilder 
          initialData={editingInvoice}
          onSave={handleEditSave}
          onCancel={() => {
            setActiveView('LIST');
            setEditingInvoice(undefined);
          }}
        />
      )}

      {activeView === 'LIST' && (
        <div className="space-y-6 animate-fadeIn">
          
          {/* Section 1: Dashboard statistics widget box */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            
            {/* Stat A: Total Outstanding */}
            <div className="bg-gradient-to-br from-[#2D1B00] to-[#3D2400] border border-orange-500/10 p-5 rounded-3xl text-left flex items-start justify-between shadow-md">
              <div className="space-y-1">
                <span className="text-[10px] text-amber-500 font-extrabold block uppercase tracking-wider font-mono">Total Outstanding Due</span>
                <span className="text-xl sm:text-2xl font-black text-white block font-mono">
                  ₹{(totalOutstanding ?? 0).toLocaleString('en-IN')}
                </span>
                <span className="text-[9px] text-[#FFEDD5]/40 block leading-snug">Collect balance immediately</span>
              </div>
              <div className="p-2 bg-amber-500/10 text-amber-500 border border-amber-500/15 rounded-xl hidden sm:block">
                <AlertCircle className="h-4.5 w-4.5" />
              </div>
            </div>

            {/* Stat B: Total Collected */}
            <div className="bg-gradient-to-br from-[#052E16] to-[#083923] border border-emerald-500/10 p-5 rounded-3xl text-left flex items-start justify-between shadow-md">
              <div className="space-y-1">
                <span className="text-[10px] text-emerald-455 font-extrabold block uppercase tracking-wider font-mono">Total Collected Amount</span>
                <span className="text-xl sm:text-2xl font-black text-white block font-mono">
                  ₹{(totalCollected ?? 0).toLocaleString('en-IN')}
                </span>
                <span className="text-[9px] text-[RGBA(209,250,229,0.4)] block leading-snug">Successfully credited in bank/cash</span>
              </div>
              <div className="p-2 bg-emerald-500/10 text-emerald-400 border border-emerald-500/15 rounded-xl hidden sm:block">
                <CheckCircle2 className="h-4.5 w-4.5" />
              </div>
            </div>

            {/* Stat C: Total Invoiced overall */}
            <div className="bg-gray-905 border border-gray-800 p-4 sm:p-5 rounded-3xl text-left flex items-start justify-between">
              <div className="space-y-1">
                <span className="text-[10px] text-gray-450 block uppercase font-mono tracking-wider font-extrabold">Total Billing Turnover</span>
                <span className="text-lg sm:text-2xl font-black text-white block font-mono">
                  ₹{(totalBilling ?? 0).toLocaleString('en-IN')}
                </span>
                <span className="text-[9.5px] text-gray-500 block">All-time billing volume</span>
              </div>
              <div className="p-2.5 bg-gray-950 border border-gray-800 text-gray-400 rounded-2xl hidden sm:block">
                <TrendingUp className="h-4.5 w-4.5" />
              </div>
            </div>

            {/* StatD: All Bills count */}
            <div className="bg-gray-905 border border-gray-800 p-4 sm:p-5 rounded-3xl text-left flex items-start justify-between">
              <div className="space-y-1">
                <span className="text-[10px] text-gray-450 block uppercase font-mono tracking-wider font-extrabold">Invoices Count</span>
                <span className="text-lg sm:text-2xl font-black text-white block font-mono">
                  {invoicesCount} Bills
                </span>
                <span className="text-[9.5px] text-gray-500 block">GST non-GST merged</span>
              </div>
              <div className="p-2.5 bg-gray-950 border border-gray-800 text-gray-400 rounded-2xl hidden sm:block">
                <FileSpreadsheet className="h-4.5 w-4.5" />
              </div>
            </div>

          </div>

          {/* Section 2: Advanced Search Toolbars */}
          <div className="bg-[#111927]/60 border border-gray-800 p-5 rounded-3xl space-y-4">
            <h3 className="text-xs font-black text-orange-500 uppercase tracking-widest font-mono flex items-center">
              <ListFilter className="h-4 w-4 mr-2" />
              <span>Invoices Filter & Search Panel</span>
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-3.5">
              
              {/* Keyword Search */}
              <div className="relative font-sans">
                <Search className="absolute left-3.5 top-3.5 h-4 w-4 text-gray-500" />
                <input 
                  type="text"
                  placeholder="Search client name, invoice number..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="w-full bg-[#0B0F1A] border border-gray-800 rounded-2xl pl-10 pr-4 py-3 text-xs text-secondary-white focus:outline-none focus:border-orange-500 transition-colors"
                />
              </div>

              {/* Status Filter Dropdown */}
              <div className="font-sans">
                <select
                  value={statusFilter}
                  onChange={e => setStatusFilter(e.target.value)}
                  className="w-full bg-[#0B0F1A] border border-gray-800 rounded-2xl px-4 py-3.2 text-xs text-white focus:outline-none focus:border-orange-500 transition-colors"
                >
                  <option value="ALL">All Statuses</option>
                  <option value="Paid">Paid Only</option>
                  <option value="Partial">Partial Only</option>
                  <option value="Unpaid">Unpaid Only</option>
                  <option value="Draft">Draft Only</option>
                  <option value="Sent">Sent Only</option>
                  <option value="Overdue">Overdue Only</option>
                </select>
              </div>

              {/* GST Filter Dropdown */}
              <div className="font-sans">
                <select
                  value={gstFilter}
                  onChange={e => setGstFilter(e.target.value)}
                  className="w-full bg-[#0B0F1A] border border-gray-800 rounded-2xl px-4 py-3.2 text-xs text-white focus:outline-none focus:border-orange-500 transition-colors"
                >
                  <option value="ALL">All Bill Types</option>
                  <option value="GST">GST Bills Only</option>
                  <option value="NON_GST">Non-GST Bills Only</option>
                </select>
              </div>

              {/* Sorting List Dropdown */}
              <div className="font-sans">
                <select
                  value={sortBy}
                  onChange={e => setSortBy(e.target.value)}
                  className="w-full bg-[#0B0F1A] border border-gray-800 rounded-2xl px-4 py-3.2 text-xs text-white focus:outline-none focus:border-orange-500 transition-colors"
                >
                  <option value="DATE_DESC">Date: Newest to Oldest</option>
                  <option value="DATE_ASC">Date: Oldest to Newest</option>
                  <option value="AMOUNT_DESC">Amount: Highest First</option>
                  <option value="AMOUNT_ASC">Amount: Lowest First</option>
                </select>
              </div>

            </div>
          </div>

          {/* SECTION HEAD */}
          <div className="flex justify-between items-center pt-2">
            <h2 className="text-xs font-black text-gray-200 uppercase tracking-widest">Recent Invoices ({sortedInvoices.length})</h2>
            <span className="text-[10px] text-orange-500 font-extrabold uppercase tracking-widest cursor-pointer">See all</span>
          </div>

          {/* Section 3: Primary Invoices List Container */}
          {sortedInvoices.length === 0 ? (
            <div className="bg-[#111927]/40 border border-gray-800 rounded-3xl p-12 text-center text-gray-500 space-y-2">
              <FileText className="h-12 w-12 mx-auto text-gray-700 animate-pulse" />
              <h4 className="text-sm font-black text-gray-400 font-sans">No Invoices Found!</h4>
              <p className="text-xs max-w-sm mx-auto leading-relaxed font-sans">
                No invoice matches your filter criteria. Try changing filters or create a new invoice.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              
              {/* MOBILE VIEW: CARD DECK (block md:hidden) */}
              <div className="block md:hidden space-y-3 pb-6">
                {sortedInvoices.map((inv) => {
                  const clientMatch = dbClients.find(c => c.id === inv.clientId);
                  const displayClientName = clientMatch?.name || 'Unknown Client';
                  const initials = displayClientName.charAt(0).toUpperCase() || 'NA';
                  const balanceRemaining = Math.max(0, inv.totalAmount - inv.paidAmount);

                  return (
                    <div 
                      key={inv.id}
                      className="bg-[#111927]/80 border border-gray-800 rounded-2xl p-4.5 space-y-3.5 shadow-sm relative group hover:border-orange-500/30 transition-all text-left"
                    >
                      {/* Top Header Row of the Card */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 rounded-xl bg-orange-500/10 border border-orange-500/15 flex items-center justify-center font-black text-xs text-orange-500 font-mono">
                            {initials}
                          </div>
                          <div className="text-left">
                            <h4 className="text-xs font-black text-white leading-tight">{displayClientName}</h4>
                            <span className="text-[9px] text-gray-455 font-mono block mt-0.5">{inv.invoiceNumber}</span>
                          </div>
                        </div>

                        {/* Status badge */}
                        <div>
                          <span className={`text-[8.5px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full border ${
                            inv.status === 'Paid' 
                              ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' 
                              : inv.status === 'Partial' 
                                ? 'bg-orange-500/10 text-orange-450 border border-orange-500/20' 
                                : 'bg-rose-500/10 text-rose-455 border border-rose-500/20'
                          }`}>
                            {inv.status}
                          </span>
                        </div>
                      </div>

                      {/* Middle Details Box */}
                      <div className="grid grid-cols-2 gap-2 bg-[#0B0F1A]/50 p-3 rounded-xl border border-gray-800/40 text-left">
                        <div>
                          <span className="text-[8px] text-gray-550 block uppercase font-mono tracking-wider">Invoice Date</span>
                          <span className="text-[10px] text-gray-300 font-bold font-mono">{inv.date}</span>
                        </div>
                        <div>
                          <span className="text-[8px] text-orange-500 block uppercase font-mono tracking-wider">Due Date</span>
                          <span className="text-[10px] text-amber-500 font-bold font-mono">{inv.dueDate}</span>
                        </div>
                        <div className="col-span-2 pt-1.5 border-t border-gray-800/30 flex justify-between items-center">
                          <div>
                            <span className="text-[8px] text-gray-550 block uppercase font-mono tracking-wider">Grand Total</span>
                            <span className="text-xs font-black text-white font-mono">₹{(inv.totalAmount ?? 0).toLocaleString('en-IN')}</span>
                          </div>
                          {balanceRemaining > 0 && (
                            <div className="text-right">
                              <span className="text-[8px] text-orange-500 block uppercase font-mono tracking-wider">Outstanding Due</span>
                              <span className="text-xs font-black text-amber-450 font-mono">₹{(balanceRemaining ?? 0).toLocaleString('en-IN')}</span>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Action Triggers Grid */}
                      <div className="flex items-center justify-between gap-2 pt-1">
                        <button
                          onClick={() => setPreviewingInvoice(inv)}
                          className="flex-1 py-1.8 bg-gray-950 hover:bg-gray-900 border border-gray-800 rounded-xl text-[9.5px] font-bold text-gray-300 flex items-center justify-center space-x-1 cursor-pointer font-sans"
                        >
                          <Eye className="h-3.5 w-3.5 text-emerald-400" />
                          <span>View Invoice</span>
                        </button>

                        <button
                          onClick={() => setPayingInvoice(inv)}
                          className="flex-1 py-1.8 bg-orange-500/10 hover:bg-orange-500/20 border border-orange-500/20 rounded-xl text-[9.5px] font-black text-orange-450 flex items-center justify-center space-x-1 cursor-pointer font-sans"
                        >
                          <CreditCard className="h-3.5 w-3.5" />
                          <span>Record Payment</span>
                        </button>

                        <div className="flex items-center space-x-1">
                          <button
                            onClick={() => {
                              setEditingInvoice(inv);
                              setActiveView('EDIT');
                            }}
                            className="p-1.8 bg-gray-950 border border-gray-800 rounded-xl text-sky-400 hover:text-sky-305 cursor-pointer"
                            title="Edit"
                          >
                            <Edit2 className="h-3.5 w-3.5" />
                          </button>
                          <button
                            onClick={() => handleWhatsAppShare(inv)}
                            className="p-1.8 bg-gray-950 border border-gray-800 rounded-xl text-blue-450 hover:text-blue-350 cursor-pointer"
                            title="Share"
                          >
                            <Share2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* DESKTOP VIEW: TABULAR LIST GRID (hidden md:block) */}
              <div className="hidden md:block bg-[#111927]/60 border border-gray-800 rounded-3xl overflow-hidden shadow-lg">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs text-gray-300">
                    <thead className="bg-[#0D121F] text-gray-400 font-mono text-[9px] uppercase border-b border-gray-800">
                      <tr>
                        <th className="py-4 pl-4 sm:pl-6">Invoice Number</th>
                        <th className="py-4 font-bold">Client</th>
                        <th className="py-4 font-mono text-center">Dates</th>
                        <th className="py-4 text-center">Tax (GST)</th>
                        <th className="py-4 text-right font-mono pr-4">Finances</th>
                        <th className="py-4 text-center">Status</th>
                        <th className="py-4 text-center pr-4 sm:pr-6">Actions</th>
                      </tr>
                    </thead>
                  <tbody className="divide-y divide-gray-855/35">
                    {sortedInvoices.map((inv) => {
                      const clientMatch = dbClients.find(c => c.id === inv.clientId);
                      const displayClientName = clientMatch?.name || 'Unknown Client';
                      const balanceRemaining = Math.max(0, inv.totalAmount - inv.paidAmount);

                      return (
                        <React.Fragment key={inv.id}>
                          <tr className="hover:bg-gray-950/40 transition-colors">
                          
                          {/* SNo / Invoice Number */}
                          <td className="py-4 pl-4 sm:pl-6 leading-tight">
                            <span className="font-extrabold text-white text-[13px] block font-mono select-all">
                              {inv.invoiceNumber}
                            </span>
                            <span className="text-[10px] text-gray-550 font-medium">Unique digital register token</span>
                          </td>

                          {/* Customer matched */}
                          <td className="py-4 leading-tight">
                            <span className="font-black text-gray-150 block text-[12px]">
                              {displayClientName}
                            </span>
                            {clientMatch?.phone && clientMatch.phone !== 'NA' && (
                              <span className="text-[10px] text-gray-550 font-mono">+91 {clientMatch.phone}</span>
                            )}
                          </td>

                          {/* Created date / Due dates */}
                          <td className="py-4 text-center leading-tight">
                            <span className="text-gray-350 font-mono block">{inv.date}</span>
                            <span className="text-[10px] text-amber-500 font-mono">Due: {inv.dueDate}</span>
                          </td>

                          {/* GST toggle */}
                          <td className="py-4 text-center">
                            {inv.isGstApplied ? (
                              <span className="bg-[#0B1C14] border border-emerald-500/20 px-2 py-0.5 rounded text-[10px] font-bold text-emerald-400 uppercase font-mono tracking-wider">
                                {inv.gstType || 'CGST_SGST'}
                              </span>
                            ) : (
                              <span className="bg-gray-950 border border-gray-850 px-2 py-0.5 rounded text-[10px] font-bold text-gray-550 uppercase">
                                Non-GST
                              </span>
                            )}
                          </td>

                          {/* Financier totals */}
                          <td className="py-4 text-right pr-4 leading-tight font-mono">
                            <div className="text-[12.5px] font-black text-white">
                              ₹{(inv.totalAmount ?? 0).toLocaleString('en-IN')}
                            </div>
                            <div className="text-[10px] text-emerald-500">
                              Collected: ₹{(inv.paidAmount ?? 0).toLocaleString('en-IN')}
                            </div>
                            {balanceRemaining > 0 && (
                              <div className="text-[10px] text-amber-500 font-bold">
                                Due: ₹{(balanceRemaining ?? 0).toLocaleString('en-IN')}
                              </div>
                            )}
                          </td>

                          {/* Status Badge */}
                          <td className="py-4 text-center">
                            {renderStatusBadge(inv.status)}
                          </td>

                          {/* Controls Panel */}
                          <td className="py-4 text-center pr-4 sm:pr-6">
                            <div className="flex items-center justify-center space-x-1.5 invoice-row-actions">
                              
                              {/* Open Preview slip */}
                              <button
                                onClick={() => setPreviewingInvoice(inv)}
                                className="p-2 bg-gray-950 hover:bg-gray-850 text-emerald-400 hover:text-emerald-300 rounded-xl transition border border-gray-850 cursor-pointer"
                                title="View Invoice Preview"
                              >
                                <Eye className="h-4 w-4" />
                              </button>

                              {/* Quick Pay action */}
                              <button
                                onClick={() => setPayingInvoice(inv)}
                                className="flex items-center space-x-1.5 px-3 py-2 bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 hover:text-amber-300 rounded-xl transition border border-amber-500/20 cursor-pointer"
                                title="Quick Pay"
                              >
                                <CreditCard className="h-4 w-4" />
                                <span className="text-[10px] font-black">Pay</span>
                              </button>

                              {/* Edit invoice */}
                              <button
                                onClick={() => {
                                  setEditingInvoice(inv);
                                  setActiveView('EDIT');
                                }}
                                className="p-2 bg-gray-950 hover:bg-gray-550 text-sky-400 hover:text-sky-300 rounded-xl transition border border-gray-850 cursor-pointer"
                                title="Edit Invoice"
                              >
                                <Edit2 className="h-4 w-4" />
                              </button>

                              {/* History action */}
                              <button
                                onClick={() => setExpandedInvoiceId(expandedInvoiceId === inv.id ? null : inv.id)}
                                className="p-2 bg-gray-950 hover:bg-gray-850 text-indigo-400 hover:text-indigo-300 rounded-xl transition border border-gray-850 cursor-pointer"
                                title="Payment History"
                              >
                                <History className="h-4 w-4" />
                              </button>

                              {/* Share action */}
                              <button
                                onClick={() => handleWhatsAppShare(inv)}
                                className="p-2 bg-gray-950 hover:bg-gray-850 text-blue-400 hover:text-blue-300 rounded-xl transition border border-gray-850 cursor-pointer"
                                title="Share"
                              >
                                <Share2 className="h-4 w-4" />
                              </button>

                              {/* Delete invoice ledger */}
                              <button
                                onClick={() => handleDelete(inv.id, inv.invoiceNumber)}
                                className="p-2 bg-gray-950 hover:bg-rose-500/10 text-rose-500 hover:text-rose-400 rounded-xl transition border border-gray-850 cursor-pointer"
                                title="Delete Invoice"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>

                            </div>
                          </td>

                        </tr>
                        {expandedInvoiceId === inv.id && (
                          <tr className="bg-gray-950/50">
                            <td colSpan={7} className="p-4 border-b border-gray-850">
                              <div className="space-y-3">
                                <h5 className="text-[10px] font-black text-gray-400 uppercase tracking-wider">Payment History</h5>
                                {inv.payments && inv.payments.length > 0 ? (
                                  <div className="space-y-2">
                                    {inv.payments.map((p, idx) => (
                                      <div key={p.id || idx} className="flex justify-between items-center text-[11px] text-gray-300 bg-gray-900 p-2 rounded-lg">
                                        <span className="font-mono">{p.date}</span>
                                        <span>{p.mode}</span>
                                        <span className="font-black text-emerald-400">₹{p.amount.toLocaleString('en-IN')}</span>
                                      </div>
                                    ))}
                                  </div>
                                ) : (
                                  <p className="text-[10px] text-gray-600">No payments found.</p>
                                )}
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    );
                  })}
                  </tbody>
                </table>
              </div>

            </div>
          </div>
          )}

        </div>
      )}

      {/* Preview Overlay Modal popup */}
      {previewingInvoice && (
        <InvoicePreview 
          invoice={previewingInvoice}
          onClose={() => setPreviewingInvoice(null)}
        />
      )}

      {/* Record Payment Overlay Modal popup */}
      {payingInvoice && (
        <PaymentEntry 
          invoice={payingInvoice}
          onClose={() => setPayingInvoice(null)}
        />
      )}

    </div>
  );
}
