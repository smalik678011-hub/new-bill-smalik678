import React, { useState, useEffect } from 'react';
import useAppStore from '../store';
import { useAppStore as getStoreRaw } from '../store';
import { BillItem, Quotation } from '../types';
import QuotationBuilder from '../components/quotation/QuotationBuilder';
import QuotationPreview from '../components/quotation/QuotationPreview';
import { 
  Plus, 
  Search, 
  FileText, 
  Briefcase, 
  CheckCircle, 
  Clock, 
  Coins,
  ChevronRight
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { supabase } from '../lib/supabase';

const mapDbQuoteToUi = (q: any): Quotation => {
  return {
    id: q.id,
    clientId: q.client_id || q.clientId || '',
    quoteNumber: q.number || q.quoteNumber || '',
    date: q.created_at ? q.created_at.split('T')[0] : (q.date || new Date().toISOString().split('T')[0]),
    validityDays: q.validity || q.validityDays || 15,
    items: typeof q.items === 'string' ? JSON.parse(q.items) : (q.items || []),
    discount: Number(q.discount || 0),
    advanceAmount: Number(q.advance || q.advanceAmount || 0),
    advanceMode: q.advance_mode || q.advanceMode || 'Cash',
    notes: q.notes || '',
    isConverted: q.status === 'Converted' || q.isConverted || false,
    category: q.category || 'Custom',
    conditions: q.conditions ? (Array.isArray(q.conditions) ? q.conditions : q.conditions.split('\n')) : []
  };
};

export default function NewQuotation() {
  const store = useAppStore();

  const [supabaseMode, setSupabaseMode] = useState(false);
  const [businessId, setBusinessId] = useState<string | null>(null);
  const [dbQuotes, setDbQuotes] = useState<Quotation[]>([]);
  const [dbClients, setDbClients] = useState<any[]>([]);
  const [loadingDb, setLoadingDb] = useState(false);
  
  // UI Screen Modes: 'list' | 'create'
  const [viewMode, setViewMode] = useState<'list' | 'create'>('list');
  
  // Search and status query state
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'All' | 'Pending' | 'Converted'>('All');
  const [categoryFilter, setCategoryFilter] = useState<string>('All');

  // Preview / Editor focus target
  const [selectedQuote, setSelectedQuote] = useState<Quotation | null>(null);

  const refreshQuotesData = async () => {
    try {
      setLoadingDb(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setSupabaseMode(false);
        setDbQuotes(store.quotations);
        setDbClients(store.clients);
        setLoadingDb(false);
        return;
      }

      const { data: businesses, error: bErr } = await supabase
        .from('profiles')
        .select('id')
        .eq('user_id', user.id);

      if (bErr || !businesses || businesses.length === 0) {
        setSupabaseMode(false);
        setDbQuotes(store.quotations);
        setDbClients(store.clients);
        setLoadingDb(false);
        return;
      }

      const activeBId = businesses[0].id;
      setBusinessId(activeBId);

      const [quotesRes, clientsRes] = await Promise.all([
        supabase.from('quotations').select('*').eq('business_id', activeBId),
        supabase.from('clients').select('*').eq('business_id', activeBId)
      ]);

      if (!quotesRes.error) {
        const mapped = (quotesRes.data || []).map(mapDbQuoteToUi);
        setSupabaseMode(true);
        setDbQuotes(mapped);
      } else {
        setSupabaseMode(false);
        setDbQuotes(store.quotations);
      }

      if (!clientsRes.error) {
        setDbClients(clientsRes.data || []);
      } else {
        setDbClients(store.clients);
      }
    } catch (e) {
      console.error(e);
      setSupabaseMode(false);
      setDbQuotes(store.quotations);
      setDbClients(store.clients);
    } finally {
      setLoadingDb(false);
    }
  };

  useEffect(() => {
    refreshQuotesData();
  }, [store.quotations, store.clients]);

  // Core Calculations for Listing Stats
  const calculateQuoteSubtotal = (itemsList: BillItem[]) => {
    return itemsList.reduce((sum, item) => sum + (item.rate * item.quantity), 0);
  };

  const getQuoteTotalValue = (quote: Quotation) => {
    const sub = calculateQuoteSubtotal(quote.items);
    return Math.max(0, sub - (quote.discount || 0));
  };

  // Safe handler to save new Quote
  const handleSaveQuotation = async (quoteData: Omit<Quotation, 'id' | 'isConverted'> & { advanceAmount?: number; advanceMode?: 'Cash' | 'Online'; category?: string; conditions?: string[] }) => {
    try {
      if (supabaseMode && businessId) {
        const sub = quoteData.items.reduce((sum, item) => sum + (item.rate * item.quantity), 0);
        const { error: insErr } = await supabase
          .from('quotations')
          .insert({
            business_id: businessId,
            client_id: quoteData.clientId,
            number: quoteData.quoteNumber,
            items: quoteData.items,
            subtotal: sub,
            discount: quoteData.discount,
            grand_total: Math.max(0, sub - (quoteData.discount || 0)),
            advance: quoteData.advanceAmount || 0,
            advance_mode: quoteData.advanceMode || 'Cash',
            validity: quoteData.validityDays || 15,
            notes: quoteData.notes || '',
            category: quoteData.category || 'Custom',
            conditions: quoteData.conditions ? quoteData.conditions.join('\n') : '',
            status: 'Pending'
          });
        if (insErr) throw insErr;
        toast.success('New quotation created on cloud database!');
        refreshQuotesData();
      } else {
        store.addQuotation({
          ...quoteData,
          isConverted: false
        });
        toast.success('New quotation saved successfully!');
      }

      // Clear states and load preview of newly saved quote immediately!
      setViewMode('list');
      
      // Attempt to load the newly added quote to open preview directly for rich feedback
      setTimeout(() => {
        const latestQuotes = supabaseMode ? dbQuotes : getStoreRaw.getState().quotations;
        const matchingNew = latestQuotes[latestQuotes.length - 1];
        if (matchingNew) {
          setSelectedQuote(matchingNew);
        }
      }, 150);

    } catch (err: any) {
      toast.error('Failed to save quotation!');
      console.error(err);
    }
  };

  // Convert Quote To Invoice handler
  const handleConvertQuoteToInvoice = async (quoteId: string) => {
    try {
      if (supabaseMode) {
        const { error: updErr } = await supabase
          .from('quotations')
          .update({
            status: 'Converted'
          })
          .eq('id', quoteId);
        if (updErr) throw updErr;

        // Fetch quote data to generate corresponding invoice
        const matchedQuote = dbQuotes.find(q => q.id === quoteId);
        if (matchedQuote && businessId) {
          const invNumber = `INV-${matchedQuote.quoteNumber.replace(/^(EST|ESTIMATE|QT|Q)-/gi, '') || Math.floor(1000 + Math.random() * 9000)}`;
          const sub = matchedQuote.items.reduce((s, i) => s + (i.rate * i.quantity), 0);
          
          await supabase
            .from('invoices')
            .insert({
              business_id: businessId,
              client_id: matchedQuote.clientId,
              quotation_id: matchedQuote.id,
              number: invNumber,
              items: matchedQuote.items,
              subtotal: sub,
              discount: matchedQuote.discount,
              grand_total: Math.max(0, sub - (matchedQuote.discount || 0)),
              status: 'Unpaid'
            });
        }
        toast.success('Estimate successfully converted to active Invoice!');
        refreshQuotesData();
      } else {
        store.convertQuoteToInvoice(quoteId);
        toast.success('Congratulations! Soft estimate converted to active Invoice.');
      }
      
      // Update selectedQuote state to force converted stamp in open preview
      setTimeout(() => {
        const updatedQuotes = supabaseMode ? dbQuotes : getStoreRaw.getState().quotations;
        const refreshedTarget = updatedQuotes.find(q => q.id === quoteId);
        if (refreshedTarget) {
          setSelectedQuote(refreshedTarget);
        }
      }, 150);
    } catch (err: any) {
      toast.error('Failed to convert estimate to invoice!');
      console.error(err);
    }
  };

  // Filter existing quotations
  const filteredQuotations = dbQuotes.filter(quote => {
    const matchedClient = dbClients.find(c => c.id === quote.clientId);
    const clientNameStr = (matchedClient?.name || '').toLowerCase();
    const numberStr = (quote.quoteNumber || '').toLowerCase();
    
    // Search query matched
    const matchesSearch = clientNameStr.includes(searchTerm.toLowerCase()) || numberStr.includes(searchTerm.toLowerCase());
    if (!matchesSearch) return false;

    // Status Filter category match
    if (statusFilter === 'Pending' && quote.isConverted) return false;
    if (statusFilter === 'Converted' && !quote.isConverted) return false;

    // Category Filter match
    if (categoryFilter !== 'All' && quote.category !== categoryFilter) return false;

    return true;
  });

  // Calculate high value insights
  const pendingCount = dbQuotes.filter(q => !q.isConverted).length;
  const totalValuePendingSum = dbQuotes
    .filter(q => !q.isConverted)
    .reduce((sum, q) => sum + getQuoteTotalValue(q), 0);

  const convertedValueSum = dbQuotes
    .filter(q => q.isConverted)
    .reduce((sum, q) => sum + getQuoteTotalValue(q), 0);

  return (
    <div className="space-y-5 pb-16">
      
      {/* Listing Mode Banner Header */}
      {viewMode === 'list' && (
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between bg-gradient-to-r from-gray-900 via-gray-900 to-gray-950 p-5 rounded-3xl border border-gray-800 shadow-xl relative overflow-hidden font-sans">
          <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/5 rounded-full blur-2xl pointer-events-none" />
          
          <div className="space-y-1">
            <div className="flex items-center space-x-1.5 animate-pulse">
              <span className="p-1 rounded-md bg-amber-500/10 text-amber-500 border border-amber-500/20">
                <Briefcase className="h-4 w-4" />
              </span>
              <span className="text-[9.5px] text-amber-500 font-extrabold uppercase tracking-widest font-mono">
                Estimate Ledger
              </span>
            </div>
            <h2 className="text-xl font-bold tracking-tight text-white font-sans">
              Quotation & Estimate Maker (Estimations Portal)
            </h2>
            <p className="text-xs text-gray-400">
              Issue soft quotes to clients and convert them to invoices with click of a button.
            </p>
          </div>

          <button
            onClick={() => setViewMode('create')}
            className="mt-4 sm:mt-0 bg-amber-500 hover:bg-amber-600 active:scale-95 text-white font-black py-2.5 px-4 rounded-xl text-xs flex items-center justify-center space-x-2 transition cursor-pointer self-start sm:self-auto shadow-md"
          >
            <Plus className="h-4.5 w-4.5 stroke-[2.5]" />
            <span>Create New Estimate</span>
          </button>
        </div>
      )}

      {/* Stats Widgets Panel */}
      {viewMode === 'list' && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 font-sans animate-fadeIn">
          
          {/* Active Estimates pending */}
          <div className="bg-gray-900 p-4 rounded-2xl border border-gray-850 shadow flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-[9.5px] text-gray-500 uppercase tracking-widest font-bold">Active Estimates Pending</span>
              <span className="text-xl font-black block text-amber-500">{pendingCount} Pending</span>
            </div>
            <div className="p-3 bg-amber-500/5 border border-amber-500/15 rounded-xl text-amber-500">
              <Clock className="h-5 w-5" />
            </div>
          </div>

          {/* Pending Bids value total */}
          <div className="bg-gray-900 p-4 rounded-2xl border border-gray-850 shadow flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-[9.5px] text-gray-500 uppercase tracking-widest font-bold">Estimated Outstanding Value</span>
              <span className="text-xl font-black text-rose-400 block">
                ₹{(totalValuePendingSum ?? 0).toLocaleString('en-IN')}
              </span>
            </div>
            <div className="p-3 bg-rose-500/5 border border-rose-500/15 rounded-xl text-rose-400">
              <Coins className="h-5 w-5" />
            </div>
          </div>

          {/* Converted into invoices totals */}
          <div className="bg-gray-900 p-4 rounded-2xl border border-gray-850 shadow flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-[9.5px] text-gray-500 uppercase tracking-widest font-bold">Converted Invoice Value</span>
              <span className="text-xl font-black text-emerald-400 block">
                ₹{(convertedValueSum ?? 0).toLocaleString('en-IN')}
              </span>
            </div>
            <div className="p-3 bg-emerald-500/5 border border-emerald-500/15 rounded-xl text-emerald-400">
              <CheckCircle className="h-5 w-5" />
            </div>
          </div>

        </div>
      )}

      {/* Dynamic Form Creator render */}
      {viewMode === 'create' && (
        <QuotationBuilder 
          onSave={handleSaveQuotation}
          onCancel={() => setViewMode('list')}
        />
      )}

      {/* Main Listing View interface */}
      {viewMode === 'list' && (
        <div className="space-y-4 font-sans animate-fadeIn">
          
          {/* Filters Area */}
          <div className="flex flex-col md:flex-row gap-3">
            
            {/* Search Input text block */}
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-3 h-4 w-4 text-gray-500" />
              <input 
                type="text"
                placeholder="Search by client name or estimate number (#)..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="w-full bg-gray-900 border border-gray-850 rounded-2xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-amber-500 transition-colors"
              />
            </div>

            {/* Quick Status Select buttons */}
            <div className="flex bg-[#0B0F1A] border border-gray-850 p-1 rounded-2xl space-x-1.5 md:w-80">
              {(['All', 'Pending', 'Converted'] as const).map((filter) => {
                const isActive = statusFilter === filter;
                const labelMap = { All: 'All', Pending: 'Pending', Converted: 'Invoiced' };
                return (
                  <button
                    key={filter}
                    onClick={() => setStatusFilter(filter)}
                    className={`flex-1 py-1 px-1.5 rounded-xl text-[10px] font-black text-center transition cursor-pointer ${
                      isActive 
                        ? 'bg-amber-500 text-black font-extrabold shadow' 
                        : 'text-gray-400 hover:text-white hover:bg-gray-855/50'
                    }`}
                  >
                    {labelMap[filter]}
                  </button>
                );
              })}
            </div>

            {/* Category selection selector dropdown */}
            <div className="md:w-56">
              <select
                value={categoryFilter}
                onChange={e => setCategoryFilter(e.target.value)}
                className="w-full bg-[#0B0F1A] border border-gray-855 rounded-2xl px-3 py-2.5 text-xs text-gray-300 focus:outline-none focus:border-amber-500 transition-colors cursor-pointer"
              >
                <option value="All">-- Filter by Work Category --</option>
                <option value="Electrical">Electrical</option>
                <option value="Plumbing">Plumbing</option>
                <option value="Construction">Construction</option>
                <option value="Painting">Painting</option>
                <option value="Interior">Interior</option>
                <option value="Custom">Custom</option>
              </select>
            </div>

          </div>

          {/* List render loop */}
          {filteredQuotations.length === 0 ? (
            <div className="bg-gray-900/40 border border-dashed border-gray-800 rounded-3xl p-16 text-center text-gray-500 space-y-3">
              <Briefcase className="h-10 w-10 text-gray-600 mx-auto" />
              <h4 className="text-xs font-bold text-gray-300">No estimates found</h4>
              <p className="text-[10px] text-gray-500 max-w-md mx-auto">
                Change search filters or click "Create New Estimate" above to issue a quotation.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredQuotations.map((quote) => {
                const clientObj = store.clients.find(c => c.id === quote.clientId);
                const finalSum = getQuoteTotalValue(quote);
                
                // Set badge status layout
                const isConverted = quote.isConverted;
                const statusBadgeBg = isConverted 
                  ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' 
                  : 'bg-amber-500/10 text-amber-500 border border-amber-500/20';
                const statusBadgeDot = isConverted ? 'bg-emerald-500' : 'bg-amber-500 animate-pulse';
                const statusLabel = isConverted ? '✓ Invoiced' : '⏳ Pending Estimate';

                return (
                  <div 
                    key={quote.id}
                    onClick={() => setSelectedQuote(quote)}
                    className="bg-gray-900/90 border border-gray-800/80 hover:border-amber-500/40 rounded-2xl p-4.5 transition cursor-pointer shadow hover:shadow-md flex flex-col justify-between space-y-3"
                  >
                    
                    {/* Upper row: logo initial & header */}
                    <div className="flex items-start justify-between">
                      <div className="flex items-center space-x-3 min-w-0">
                        <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-gray-850 to-gray-900 border border-gray-800 flex items-center justify-center text-amber-500 shrink-0">
                          <FileText className="h-5 w-5" />
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center space-x-2">
                            <span className="text-[10.5px] text-gray-500 font-mono font-bold select-all">#{quote.quoteNumber}</span>
                            <span className="text-[9px] text-gray-450 font-mono italic">{quote.date}</span>
                          </div>
                          <h4 className="text-sm font-black text-white hover:text-amber-500 transition-colors truncate">
                            {clientObj?.name || 'Unspecified Client'}
                          </h4>
                        </div>
                      </div>

                      {/* Financial Value box */}
                      <div className="text-right shrink-0">
                        <span className="text-[9px] text-gray-500 block font-bold font-mono">EST TOTAL</span>
                        <span className="text-[13.5px] font-black text-white">
                          ₹{(finalSum ?? 0).toLocaleString('en-IN')}
                        </span>
                      </div>
                    </div>

                    {/* Middle details table mock */}
                    <div className="bg-[#0B0F1A]/30 p-2.5 rounded-xl border border-gray-850 space-y-1.5 text-[11px] font-sans">
                      <div className="flex items-center justify-between text-gray-450">
                        <span>Category:</span>
                        <span className="font-mono text-gray-300 font-black uppercase text-[10px] bg-gray-950 px-1.5 py-0.5 rounded border border-gray-855">
                          {quote.category || 'Custom'}
                        </span>
                      </div>

                      <div className="flex items-center justify-between text-gray-450">
                        <span>Items Count:</span>
                        <span className="text-gray-300 font-bold">
                          {quote.items.length} items
                        </span>
                      </div>

                      {quote.advanceAmount && quote.advanceAmount > 0 ? (
                        <div className="flex items-center justify-between text-gray-400">
                          <span>Advance Received ({quote.advanceMode}):</span>
                          <span className="text-emerald-400 font-bold">
                            ₹{(quote.advanceAmount ?? 0).toLocaleString('en-IN')}
                          </span>
                        </div>
                      ) : null}

                      {quote.advanceAmount && quote.advanceAmount > 0 ? (
                        <div className="flex items-center justify-between text-[11.5px] border-t border-gray-850/45 pt-1 mt-1 font-bold">
                          <span className="text-amber-500">Dues Remaining:</span>
                          <span className="text-amber-400 font-bold">
                            ₹{((finalSum ?? 0) - (quote.advanceAmount ?? 0)).toLocaleString('en-IN')}
                          </span>
                        </div>
                      ) : null}
                    </div>

                    {/* Footer banner */}
                    <div className="flex items-center justify-between pt-2 border-t border-gray-850/60 text-[10px]">
                      
                      {/* Active sync status badge */}
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-black tracking-wider ${statusBadgeBg}`}>
                        <span className={`h-1 w-1 rounded-full mr-1 ${statusBadgeDot}`} />
                        {statusLabel}
                      </span>

                      <span className="text-amber-500 font-black flex items-center space-x-0.5 group">
                        <span>View Sheet Preview</span>
                        <ChevronRight className="h-3.5 w-3.5 transform group-hover:translate-x-0.5 transition-transform" />
                      </span>
                    </div>

                  </div>
                );
              })}
            </div>
          )}

        </div>
      )}

      {/* Render selected Quote preview sheet MODAL */}
      {selectedQuote && (
        <QuotationPreview 
          quotation={selectedQuote}
          onConvert={() => handleConvertQuoteToInvoice(selectedQuote.id)}
          onClose={() => setSelectedQuote(null)}
        />
      )}

    </div>
  );
}
