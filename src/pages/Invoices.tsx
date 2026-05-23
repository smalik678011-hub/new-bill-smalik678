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
        toast.success('जीएसटी इनवॉइस / पक्का बिल सुरक्षित सहेज लिया गया (Cloud)!');
        refreshInvoicesData();
      } else {
        addInvoice(invoicePayload);
        toast.success('जीएसटी इनवॉइस / पक्का बिल सुरक्षित सहेज लिया गया!');
      }
      setActiveView('LIST');
    } catch (e: any) {
      toast.error('इनवॉइस सहेजने में त्रुटि!');
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
        toast.success('इनवॉइस सफलतापूर्वक अपडेट हो चूका है (Cloud)!');
        refreshInvoicesData();
      } else {
        updateInvoice(editingInvoice.id, invoicePayload);
        toast.success('इनवॉइस सफलतापूर्वक अपडेट हो चूका है!');
      }
      setActiveView('LIST');
      setEditingInvoice(undefined);
    } catch (e: any) {
      toast.error('इनवॉइस अपडेट करने में त्रुटि!');
      console.error(e);
    }
  };

  // Handle Delete Invoice
  const handleDelete = async (id: string, number: string) => {
    const isConfirmed = window.confirm(`क्या आप सचमुच इनवॉइस ${number} को डिलीट करना चाहते हैं? ग्राहक का शेष बकाया भी संशोधित हो जाएगा।`);
    if (isConfirmed) {
      try {
        if (supabaseMode) {
          const { error: delErr } = await supabase
            .from('invoices')
            .delete()
            .eq('id', id);
          if (delErr) throw delErr;
          toast.success(`इनवॉइस ${number} डिलीट कर दिया गया (Cloud)!`);
          refreshInvoicesData();
        } else {
          deleteInvoice(id);
          toast.success(`इनवॉइस ${number} डिलीट कर दिया गया!`);
        }
      } catch (e: any) {
        toast.error('इनवॉइस डिलीट करने में गड़बड़ हुई!');
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
      
      {/* Visual Header / Screen Title */}
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 border-b border-gray-800/60 pb-5">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-white uppercase tracking-tight flex items-center">
            <span className="h-8.5 w-8.5 bg-amber-500 text-white flex items-center justify-center rounded-2xl mr-3 font-mono font-black shadow-lg">i</span>
            <span>कर एवं पक्के बिल (Tax Invoices Ledger)</span>
          </h2>
          <p className="text-[11px] text-gray-550 mt-1 uppercase tracking-wider font-medium">Business Ledger & GST Compliant Sales Manager</p>
        </div>

        {activeView === 'LIST' && (
          <button
            onClick={() => setActiveView('CREATE')}
            className="bg-amber-500 hover:bg-amber-600 active:scale-98 text-white px-5 py-3 rounded-2xl text-xs font-black uppercase tracking-wider transition cursor-pointer flex items-center justify-center space-x-2 shadow-md"
          >
            <PlusCircle className="h-5 w-5 stroke-[2.5]" />
            <span>नया इनवॉइस बनाएँ (Create Invoice)</span>
          </button>
        )}
      </div>

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
            <div className="bg-[#241712] border border-amber-500/20 p-4 sm:p-5 rounded-3xl text-left flex items-start justify-between">
              <div className="space-y-1">
                <span className="text-[10px] text-amber-500 font-extrabold block uppercase font-mono tracking-wider">कुल बकाया बैलेंस (Due)</span>
                <span className="text-lg sm:text-2xl font-black text-amber-400 block font-mono">
                  ₹{(totalOutstanding ?? 0).toLocaleString('en-IN')}
                </span>
                <span className="text-[9.5px] text-gray-500 block">Collect balance immediately</span>
              </div>
              <div className="p-2.5 bg-amber-500/15 text-amber-450 border border-amber-500/20 rounded-2xl hidden sm:block">
                <AlertCircle className="h-5 w-5" />
              </div>
            </div>

            {/* Stat B: Total Collected */}
            <div className="bg-[#0B1C14] border border-emerald-500/20 p-4 sm:p-5 rounded-3xl text-left flex items-start justify-between">
              <div className="space-y-1">
                <span className="text-[10px] text-emerald-500 font-extrabold block uppercase font-mono tracking-wider">प्राप्त जमा राशि (Collected)</span>
                <span className="text-lg sm:text-2xl font-black text-emerald-400 block font-mono">
                  ₹{(totalCollected ?? 0).toLocaleString('en-IN')}
                </span>
                <span className="text-[9.5px] text-gray-550 block">Successfully credited in bank/cash</span>
              </div>
              <div className="p-2.5 bg-emerald-500/15 text-emerald-450 border border-emerald-500/20 rounded-2xl hidden sm:block">
                <CheckCircle2 className="h-5 w-5" />
              </div>
            </div>

            {/* Stat C: Total Invoiced overall */}
            <div className="bg-gray-900 border border-gray-850 p-4 sm:p-5 rounded-3xl text-left flex items-start justify-between">
              <div className="space-y-1">
                <span className="text-[10px] text-gray-450 block uppercase font-mono tracking-wider font-extrabold">कुल बिकवाली योग (Turnover)</span>
                <span className="text-lg sm:text-2xl font-black text-white block font-mono">
                  ₹{(totalBilling ?? 0).toLocaleString('en-IN')}
                </span>
                <span className="text-[9.5px] text-gray-500 block">All-time billing volume</span>
              </div>
              <div className="p-2.5 bg-gray-950 border border-gray-800 text-gray-400 rounded-2xl hidden sm:block">
                <TrendingUp className="h-5 w-5" />
              </div>
            </div>

            {/* StatD: All Bills count */}
            <div className="bg-gray-900 border border-gray-850 p-4 sm:p-5 rounded-3xl text-left flex items-start justify-between">
              <div className="space-y-1">
                <span className="text-[10px] text-gray-450 block uppercase font-mono tracking-wider font-extrabold">कुल इनवॉइस गिनती (Count)</span>
                <span className="text-lg sm:text-2xl font-black text-white block font-mono">
                  {invoicesCount} Bills
                </span>
                <span className="text-[9.5px] text-gray-500 block">GST non-GST merged</span>
              </div>
              <div className="p-2.5 bg-gray-950 border border-gray-800 text-gray-400 rounded-2xl hidden sm:block">
                <FileSpreadsheet className="h-5 w-5" />
              </div>
            </div>

          </div>

          {/* Section 2: Advanced Search Toolbars */}
          <div className="bg-gray-900 border border-gray-850 p-5 rounded-3xl space-y-4">
            <h3 className="text-xs font-black text-amber-500 uppercase tracking-widest font-mono flex items-center">
              <ListFilter className="h-4.5 w-4.5 mr-2" />
              <span>इनवॉइस फ़िल्टर एवं खोज उपकरण (Filter & Sort Desk)</span>
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-3.5">
              
              {/* Keyword Search */}
              <div className="relative">
                <Search className="absolute left-3.5 top-3 h-4 w-4 text-gray-550" />
                <input 
                  type="text"
                  placeholder="ग्राहक का नाम, बिल संख्या खोजें..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="w-full bg-[#0B0F1A] border border-gray-850 rounded-2xl pl-10 pr-4 py-2.5 text-xs text-secondary-white focus:outline-none focus:border-amber-500"
                />
              </div>

              {/* Status Filter Dropdown */}
              <div>
                <select
                  value={statusFilter}
                  onChange={e => setStatusFilter(e.target.value)}
                  className="w-full bg-[#0B0F1A] border border-gray-850 rounded-2xl px-4 py-2.8 text-xs text-white focus:outline-none"
                >
                  <option value="ALL">सभी भुगतान श्रेणियाँ (All Statuses)</option>
                  <option value="Paid">Paid Only (चुक्ता बिल)</option>
                  <option value="Partial">Partial Only (आंशिक भुगतान)</option>
                  <option value="Unpaid">Unpaid Only (भुगतान प्राप्त नहीं)</option>
                  <option value="Draft">Draft Only (ड्राफ्ट बिल)</option>
                  <option value="Sent">Sent Only (भेजे गए बिल)</option>
                  <option value="Overdue">Overdue Only (समय सीमा समाप्त)</option>
                </select>
              </div>

              {/* GST Filter Dropdown */}
              <div>
                <select
                  value={gstFilter}
                  onChange={e => setGstFilter(e.target.value)}
                  className="w-full bg-[#0B0F1A] border border-gray-850 rounded-2xl px-4 py-2.8 text-xs text-white focus:outline-none"
                >
                  <option value="ALL">सभी टैक्स प्रकार (All Bil types)</option>
                  <option value="GST">GST Bills Only (जीएसटी बिल)</option>
                  <option value="NON_GST">Non-GST Bills Only (लोकल अन्य बिल)</option>
                </select>
              </div>

              {/* Sorting List Dropdown */}
              <div>
                <select
                  value={sortBy}
                  onChange={e => setSortBy(e.target.value)}
                  className="w-full bg-[#0B0F1A] border border-gray-850 rounded-2xl px-4 py-2.8 text-xs text-white focus:outline-none font-sans"
                >
                  <option value="DATE_DESC">दिनांक: नवीन पहले (Newest Date)</option>
                  <option value="DATE_ASC">दिनांक: पुराना पहले (Oldest Date)</option>
                  <option value="AMOUNT_DESC">बिल राशि: घटते क्रम में (Highest ₹)</option>
                  <option value="AMOUNT_ASC">बिल राशि: बढ़ते क्रम में (Lowest ₹)</option>
                </select>
              </div>

            </div>
          </div>

          {/* Section 3: Primary Invoices List Table */}
          {sortedInvoices.length === 0 ? (
            <div className="bg-gray-900 border border-gray-850 rounded-3xl p-12 text-center text-gray-500 space-y-2">
              <FileText className="h-12 w-12 mx-auto text-gray-700 animate-pulse" />
              <h4 className="text-sm font-black text-gray-400">कोई बिल नहीं मिला!</h4>
              <p className="text-xs max-w-sm mx-auto leading-relaxed">
                दिए गए मापदंडों के अनुसार कोई इनवॉइस नहीं मिला। कृपया फ़िल्टर बदलें या ऊपर बटन पर क्लिक करके नया पक्का बिल बनाएँ।
              </p>
            </div>
          ) : (
            <div className="bg-gray-900 border border-gray-850 rounded-3xl overflow-hidden shadow-lg">
              
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-gray-300">
                  <thead className="bg-[#0D121F] text-gray-400 font-mono text-[9px] uppercase border-b border-gray-800">
                    <tr>
                      <th className="py-4 pl-4 sm:pl-6">इनवॉइस विवरण (Invoice)</th>
                      <th className="py-4">क्रेता / ग्राहक (Client)</th>
                      <th className="py-4 font-mono text-center">बिल तिथि (Dates)</th>
                      <th className="py-4 text-center">टैक्स (GST)</th>
                      <th className="py-4 text-right font-mono pr-4">वित्तीय पत्रक (Finances)</th>
                      <th className="py-4 text-center">स्थिति (Status)</th>
                      <th className="py-4 text-center pr-4 sm:pr-6">कार्य (Actions Panel)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-855/35">
                    {sortedInvoices.map((inv) => {
                      const clientMatch = dbClients.find(c => c.id === inv.clientId);
                      const displayClientName = clientMatch?.name || 'अज्ञात ग्राहक';
                      const balanceRemaining = Math.max(0, inv.totalAmount - inv.paidAmount);

                      return (
                        <React.Fragment key={inv.id}>
                          <tr className="hover:bg-gray-950/40 transition-colors">
                          
                          {/* SNo / Invoice Number */}
                          <td className="py-4 pl-4 sm:pl-6 leading-tight">
                            <span className="font-extrabold text-white text-[13px] block font-mono select-all">
                              {inv.invoiceNumber}
                            </span>
                            <span className="text-[10px] text-gray-500 font-medium">Unique digital register token</span>
                          </td>

                          {/* Customer matched */}
                          <td className="py-4 leading-tight">
                            <span className="font-black text-gray-150 block text-[12px]">
                              {displayClientName}
                            </span>
                            {clientMatch?.phone && clientMatch.phone !== 'NA' && (
                              <span className="text-[10px] text-gray-500 font-mono">+91 {clientMatch.phone}</span>
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
                              प्राप्त: ₹{(inv.paidAmount ?? 0).toLocaleString('en-IN')}
                            </div>
                            {balanceRemaining > 0 && (
                              <div className="text-[10px] text-amber-500">
                                बकाया: ₹{(balanceRemaining ?? 0).toLocaleString('en-IN')}
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
                                title="इनवॉइस प्रीव्यू देखें"
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
                                className="p-2 bg-gray-950 hover:bg-gray-850 text-sky-400 hover:text-sky-300 rounded-xl transition border border-gray-850 cursor-pointer"
                                title="एडिट करें"
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
                                title="डिलीट करें"
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
