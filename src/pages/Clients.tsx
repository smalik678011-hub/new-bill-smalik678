import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAppStore } from '../store';
import useTranslation from '../hooks/useTranslation';
import ClientCard from '../components/clients/ClientCard';
import AddClientModal from '../components/clients/AddClientModal';
import { 
  Users, 
  Search, 
  SlidersHorizontal, 
  Plus, 
  Sparkles, 
  TrendingDown, 
  AlertCircle, 
  HelpCircle,
  Cloud,
  CloudLightning,
  RefreshCw
} from 'lucide-react';
import { toast } from 'react-hot-toast';



export default function Clients() {

  const store = useAppStore();
  const { t } = useTranslation();
  const [supabaseMode, setSupabaseMode] = useState(false);
  const [loading, setLoading] = useState(true);

  // Lists loaded from Supabase or store
  const [clients, setClients] = useState<any[]>([]);
  const [invoices, setInvoices] = useState<any[]>([]);
  const [quotes, setQuotes] = useState<any[]>([]);
  
  // UI States
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'All' | 'Due' | 'Clear' | 'Overdue'>('All');
  const [showAddModal, setShowAddModal] = useState(false);

  // Parallel remote or local fetching
  const refreshClientData = async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        // Fallback to local
        setSupabaseMode(false);
        setClients(store.clients);
        setInvoices(store.invoices);
        setQuotes(store.quotations);
        setLoading(false);
        return;
      }

      // Business check
      const { data: businesses, error: bErr } = await supabase
        .from('profiles')
        .select('id')
        .eq('user_id', user.id);

      if (bErr || !businesses || businesses.length === 0) {
        setSupabaseMode(false);
        setClients(store.clients);
        setInvoices(store.invoices);
        setQuotes(store.quotations);
        setLoading(false);
        return;
      }

      const activeBId = businesses[0].id;

      // Parallel queries
      const [clientsRes, invoicesRes, quotesRes] = await Promise.all([
        supabase.from('clients').select('*').eq('business_id', activeBId).order('created_at', { ascending: false }),
        supabase.from('invoices').select('*').eq('business_id', activeBId),
        supabase.from('quotations').select('*').eq('business_id', activeBId)
      ]);

      if (clientsRes.error) {
        throw clientsRes.error;
      }

      setSupabaseMode(true);
      setClients(clientsRes.data || []);
      setInvoices(invoicesRes.data || []);
      setQuotes(quotesRes.data || []);
    } catch (err) {
      console.warn('Real-time clients syncing error. Displaying local cache:', err);
      setSupabaseMode(false);
      setClients(store.clients);
      setInvoices(store.invoices);
      setQuotes(store.quotations);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshClientData();
  }, [store.clients, store.invoices, store.quotations]);

  // Dynamically calculate pending due sum per client
  const getClientDueSum = (clientId: string) => {
    if (supabaseMode) {
      const clientInvoices = invoices.filter(inv => inv.client_id === clientId);
      const totalOutstanding = clientInvoices.reduce((sum, inv) => {
        if (inv.status === 'Paid') return sum;
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
      return totalOutstanding;
    } else {
      const matchedLocal = store.clients.find(c => c.id === clientId);
      return matchedLocal ? matchedLocal.totalDue : 0;
    }
  };

  // Safe fetch last activity date from newest quotation or invoice
  const getClientLastActivity = (clientId: string) => {
    const clientInvoices = supabaseMode 
      ? invoices.filter(inv => inv.client_id === clientId)
      : store.invoices.filter(inv => inv.clientId === clientId);
      
    if (clientInvoices.length === 0) return 'कोई बिलिंग नहीं (No Logs)';
    
    // Sort and grab date
    const sorted = [...clientInvoices].sort((a,b) => new Date(b.created_at || b.date).getTime() - new Date(a.created_at || a.date).getTime());
    return sorted[0].date || sorted[0].created_at?.split('T')[0] || '';
  };

  // Perform search + dual state filters
  const filteredAndMappedClients = clients.map(c => {
    const calculatedDue = getClientDueSum(c.id);
    const lastActive = getClientLastActivity(c.id);
    return {
      ...c,
      calculatedDue,
      lastActivityDate: lastActive
    };
  }).filter(c => {
    const searchString = search.toLowerCase();
    const matchesSearch = c.name.toLowerCase().includes(searchString) || 
                          (c.phone && c.phone.includes(searchString));

    if (!matchesSearch) return false;

    // Filter by financial categories
    const todayStr = new Date().toISOString().split('T')[0];
    if (statusFilter === 'Due') {
      return c.calculatedDue > 0;
    }
    if (statusFilter === 'Clear') {
      return c.calculatedDue === 0;
    }
    if (statusFilter === 'Overdue') {
      return c.calculatedDue > 0 && c.deadline && c.deadline < todayStr;
    }

    return true;
  });

  // Calculate Total Book receivable sum (from the list of clients)
  const totalReceivables = clients.reduce((sum, c) => {
    const due = getClientDueSum(c.id);
    return due > 0 ? sum + due : sum;
  }, 0);

  return (
    <div className="space-y-5 pb-16">
      {/* Upper header section */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between bg-gradient-to-r from-gray-900 via-gray-900 to-gray-950 p-5 rounded-3xl border border-gray-800 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/5 rounded-full blur-2xl pointer-events-none" />
        <div className="space-y-1">
          <div className="flex items-center space-x-1.5 animate-pulse">
            <span className="p-1 rounded-md bg-amber-500/10 text-amber-500 border border-amber-500/20">
              <Users className="h-4 w-4" />
            </span>
            <span className="text-[9.5px] text-amber-500 font-extrabold uppercase tracking-widest font-mono">
              खता बुक प्रबंधन
            </span>
          </div>
          <h2 className="text-xl font-bold tracking-tight text-white font-sans flex items-center">
            ग्राहक खाता बुक (My Clients)
          </h2>
          <p className="text-xs text-gray-550">
            {supabaseMode 
              ? t('बही खाता लाइव क्लाउड डेटा से सिंक्रोनाइज्ड है।') 
              : t('सभी एंट्रीज फोन के लोकल बही खाता स्टोरेज में सुरक्षित हैं।')}
          </p>
        </div>

        {/* Dynamic header stats block */}
        <div className="mt-4 sm:mt-0 flex items-center space-x-3">
          <div className="p-3 bg-red-500/5 border border-red-500/10 rounded-2xl text-right">
            <span className="text-[9px] text-gray-400 block uppercase font-mono font-bold">{t('कुल बकाया वसूली')}</span>
            <span className="text-sm font-black text-red-400">
              ₹{(totalReceivables ?? 0).toLocaleString('en-IN')}
            </span>
          </div>

          <button 
            onClick={() => refreshClientData()}
            className="p-3 bg-gray-950 hover:bg-gray-850 hover:text-white rounded-2xl border border-gray-800 text-gray-400 transition"
            title="Reload register"
          >
            <RefreshCw className="h-4.5 w-4.5" />
          </button>
        </div>
      </div>

      {/* Sync State Badge */}
      <div className="flex items-center justify-between px-1">
        <div className={`inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-[9px] font-black tracking-widest ${
          supabaseMode 
            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/25' 
            : 'bg-amber-500/10 text-amber-500 border border-amber-500/25'
        }`}>
          {supabaseMode ? (
            <>
              <Cloud className="h-3 w-3" />
              <span>SUPABASE LIVE SYNC</span>
            </>
          ) : (
            <>
              <CloudLightning className="h-3 w-3 animate-pulse" />
              <span>LOCAL PERSISTED CONTAINER STATE</span>
            </>
          )}
        </div>

        <span className="text-xs text-gray-450 font-black">
          सक्रिय सूची: {filteredAndMappedClients.length} ग्राहक खाते
        </span>
      </div>

      {/* Filter Options and Search panel */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {/* Search Input bar */}
        <div className="relative md:col-span-2">
          <Search className="absolute left-3 top-3 h-4 w-4 text-gray-500" />
          <input 
            type="text" 
            placeholder="ग्राहक का नाम, पता या मोबाइल नंबर खोजें..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full bg-gray-900 border border-gray-850 rounded-2xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-amber-500 transition-colors"
          />
        </div>

        {/* Quick select tabs */}
        <div className="flex bg-[#0B0F1A] border border-gray-850 p-1 rounded-2xl space-x-1">
          {(['All', 'Due', 'Clear', 'Overdue'] as const).map((filter) => {
            const isActive = statusFilter === filter;
            const labelMap = { All: 'सभी', Due: 'उधार', Clear: 'चुक्ता', Overdue: 'लेट' };
            return (
              <button
                key={filter}
                onClick={() => setStatusFilter(filter)}
                className={`flex-1 py-1 px-1.5 rounded-xl text-[10px] font-black text-center transition cursor-pointer ${
                  isActive 
                    ? 'bg-amber-500 text-black font-extrabold shadow' 
                    : 'text-gray-400 hover:text-white hover:bg-gray-850/50'
                }`}
              >
                {labelMap[filter]}
              </button>
            );
          })}
        </div>
      </div>

      {/* Main clients mapping queue */}
      {loading ? (
        <div className="bg-gray-900 border border-gray-800 rounded-3xl p-16 text-center shadow-lg">
          <div className="h-8 w-8 border-4 border-amber-500/25 border-t-amber-500 rounded-full animate-spin mx-auto mb-3" />
          <p className="text-xs text-gray-400 font-bold">{t('ग्राहक बही लोड हो रही है...')}</p>
        </div>
      ) : filteredAndMappedClients.length === 0 ? (
        <div className="bg-gray-900/40 border border-dashed border-gray-800 rounded-3xl p-12 text-center text-gray-500 space-y-2">
          <Users className="h-10 w-10 text-gray-600 mx-auto" />
          <h4 className="text-xs font-bold text-gray-300">{t('कोई ग्राहक खाता नहीं मिला (No Results)')}</h4>
          <p className="text-[10px] text-gray-550 max-w-sm mx-auto">
            सर्च की जाँच करें या एक नया ग्राहक खाता खोलने के लिए नीचे दिए गए प्लस (+) बटन पर टैप करें।
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredAndMappedClients.map((client) => (
            <ClientCard 
              key={client.id} 
              client={client} 
              dueDateSum={client.calculatedDue} 
            />
          ))}
        </div>
      )}

      {/* Floating Action Button (FAB) (Add new client) */}
      <button
        onClick={() => setShowAddModal(true)}
        className="fixed bottom-20 right-6 md:bottom-8 md:right-8 z-40 bg-amber-500 hover:bg-amber-600 text-white p-4 rounded-full shadow-2xl hover:scale-110 active:scale-95 transition-all text-xs font-bold uppercase cursor-pointer border-2 border-gray-900"
        title="नया ग्राहक जोड़ें"
      >
        <Plus className="h-6 w-6 stroke-[3px]" />
      </button>

      {/* Add Client Modal */}
      <AddClientModal 
        isOpen={showAddModal} 
        onClose={() => setShowAddModal(false)} 
        onSuccess={() => refreshClientData()}
      />
    </div>
  );
}
