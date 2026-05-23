import React, { useState, useEffect } from 'react';
import useAppStore from '../../store';
import { supabase } from '../../lib/supabase';
import { 
  Lock, 
  Unlock, 
  TrendingUp, 
  Calculator, 
  Trash2, 
  Key, 
  AlertTriangle, 
  ShieldAlert, 
  Plus,
  Coins,
  ArrowRight,
  TrendingDown,
  Info,
  Calendar,
  FileText,
  User
} from 'lucide-react';
import { toast } from 'react-hot-toast';


export default function ProfitCalculator() {

  const store = useAppStore();
  
  // Custom states
  const [supabaseMode, setSupabaseMode] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);
  const [businessId, setBusinessId] = useState<string | null>(null);

  // Synced state variables
  const [invoices, setInvoices] = useState<any[]>([]);
  const [clients, setClients] = useState<any[]>([]);
  const [profitEntries, setProfitEntries] = useState<any[]>([]);

  // Locker PIN flow
  const { 
    profitPin, 
    isProfitUnlocked, 
    setProfitUnlocked, 
    updateProfitPin 
  } = useAppStore();

  const [pinInput, setPinInput] = useState('');
  const [errorText, setErrorText] = useState('');
  const [showPinSetup, setShowPinSetup] = useState(false);
  const [newPin, setNewPin] = useState('');

  // Form states
  const [selectedInvoiceId, setSelectedInvoiceId] = useState('');
  const [materialCost, setMaterialCost] = useState('');
  const [labourCost, setLabourCost] = useState('');
  const [transportCost, setTransportCost] = useState('');
  const [otherCost, setOtherCost] = useState('');

  // Dual data fetch (Supabase vs local storage)
  const refreshData = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        loadLocalFallback();
        return;
      }

      const { data: bData, error: bErr } = await supabase
        .from('profiles')
        .select('id')
        .eq('user_id', user.id);

      if (bErr || !bData || bData.length === 0) {
        loadLocalFallback();
        return;
      }

      const bId = bData[0].id;
      setBusinessId(bId);

      // Fetch all required data for matching
      const [invRes, clientsRes, profitRes] = await Promise.all([
        supabase.from('invoices').select('*').eq('business_id', bId).order('created_at', { ascending: false }),
        supabase.from('clients').select('*').eq('business_id', bId),
        supabase.from('profit_entries').select('*').order('created_at', { ascending: false })
      ]);

      if (invRes.error || clientsRes.error || profitRes.error) {
        throw new Error('Supabase fetch failed');
      }

      setInvoices(invRes.data || []);
      setClients(clientsRes.data || []);
      setProfitEntries(profitRes.data || []);
      setSupabaseMode(true);
    } catch (e) {
      console.warn('Supabase sync issue in Profit Calculator. Using local fallback:', e);
      loadLocalFallback();
    } finally {
      setLoading(false);
    }
  };

  const loadLocalFallback = () => {
    setSupabaseMode(false);
    setInvoices(store.invoices || []);
    setClients(store.clients || []);
    
    // Load profit entries from localStorage
    try {
      const cached = localStorage.getItem('local_profit_entries');
      if (cached) {
        setProfitEntries(JSON.parse(cached));
      } else {
        setProfitEntries([]);
      }
    } catch (e) {
      setProfitEntries([]);
    }
    setLoading(false);
  };

  useEffect(() => {
    refreshData();
  }, [store.invoices, store.clients]);

  // Handle Lock-Unlock
  const handleUnlock = (e: React.FormEvent) => {
    e.preventDefault();
    if (pinInput === profitPin) {
      setProfitUnlocked(true);
      setErrorText('');
      toast.success('🔒 Locker Unlocked Safely!');
    } else {
      setErrorText('Galat PIN! Dubara koshish karein. (Default PIN: 1234)');
    }
    setPinInput('');
  };

  const handlePinUpdate = (e: React.FormEvent) => {
    e.preventDefault();
    if (newPin.length !== 4 || isNaN(parseInt(newPin))) {
      toast.error('PIN sirf 4 अंकों का नंबर होना चाहिए!');
      return;
    }
    updateProfitPin(newPin);
    setShowPinSetup(false);
    setNewPin('');
    toast.success('नया सिक्योरिटी PIN सेट कर दिया गया है!');
  };

  // Derived calculations helper
  const getSelectedInvoiceDetails = () => {
    if (!selectedInvoiceId) return null;
    const inv = invoices.find(i => i.id === selectedInvoiceId);
    if (!inv) return null;

    // Map properties based on schema (grand_total vs totalAmount)
    const grandTotal = parseFloat(inv.grand_total || inv.totalAmount || 0);
    const invoiceNumber = inv.number || inv.invoiceNumber || 'INV-Unknown';
    const clientId = inv.client_id || inv.clientId;
    const client = clients.find(c => c.id === clientId);

    return {
      id: inv.id,
      invoiceNumber,
      grandTotal,
      clientName: client ? client.name : 'Unknown Grahak'
    };
  };

  const selectedInv = getSelectedInvoiceDetails();

  // Calculation values
  const revenue = selectedInv ? selectedInv.grandTotal : 0;
  const matCost = parseFloat(materialCost) || 0;
  const labCost = parseFloat(labourCost) || 0;
  const transCost = parseFloat(transportCost) || 0;
  const othCost = parseFloat(otherCost) || 0;

  const totalExpense = matCost + labCost + transCost + othCost;
  const netProfit = revenue - totalExpense;
  const profitMarginPercent = revenue > 0 ? (netProfit / revenue) * 100 : 0;
  const isLoss = netProfit < 0;

  // Handle Save
  const handleSaveCalculation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedInvoiceId) {
      toast.error('कृपया पहले एक इनवॉइस चुनें!');
      return;
    }

    setLoading(true);
    try {
      if (supabaseMode) {
        const { error } = await supabase
          .from('profit_entries')
          .insert({
            invoice_id: selectedInvoiceId,
            material_cost: matCost,
            labour_cost: labCost,
            transport: transCost,
            other: othCost,
            total_expense: totalExpense,
            net_profit: netProfit
          });
        
        if (error) throw error;
        toast.success('प्रॉफिट बहीखाता क्लाउड पर सुरक्षित हो चूका है!');
      } else {
        // Safe offline saving
        const newEntry = {
          id: 'lp_' + Date.now().toString(),
          invoice_id: selectedInvoiceId,
          material_cost: matCost,
          labour_cost: labCost,
          transport: transCost,
          other: othCost,
          total_expense: totalExpense,
          net_profit: netProfit,
          created_at: new Date().toISOString()
        };

        const nextEntries = [newEntry, ...profitEntries];
        setProfitEntries(nextEntries);
        localStorage.setItem('local_profit_entries', JSON.stringify(nextEntries));
        toast.success('प्रॉफिट एंट्री लोकल स्टोरेज में नोट कर ली गयी!');
      }

      // Reset form fields
      setSelectedInvoiceId('');
      setMaterialCost('');
      setLabourCost('');
      setTransportCost('');
      setOtherCost('');
      refreshData();
    } catch (err: any) {
      console.error(err);
      toast.error(`त्रुटि: ${err.message || 'प्रॉफिट सेव करने में समस्या आई'}`);
    } finally {
      setLoading(false);
    }
  };

  // Handle Delete
  const handleDeleteCalculation = async (id: string) => {
    const isConfirmed = window.confirm('क्या आप सचमुच इस प्राइवेट प्रॉफिट एंट्री को हटाना चाहते हैं?');
    if (!isConfirmed) return;

    setLoading(true);
    try {
      if (supabaseMode) {
        const { error } = await supabase
          .from('profit_entries')
          .delete()
          .eq('id', id);
        if (error) throw error;
        toast.success('प्रॉफिट रिकॉर्ड हटा दिया गया है!');
      } else {
        const nextEntries = profitEntries.filter(e => e.id !== id);
        setProfitEntries(nextEntries);
        localStorage.setItem('local_profit_entries', JSON.stringify(nextEntries));
        toast.success('प्रॉफिट रिकॉर्ड लोकल बहीखाता से हटा दिया गया!');
      }
      refreshData();
    } catch (err: any) {
      console.error(err);
      toast.error(`हटाने में विफलता: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Screen: Locked PIN input screen
  if (!isProfitUnlocked) {
    return (
      <div className="max-w-md mx-auto bg-gray-900 border border-gray-800 rounded-3xl p-8 text-center space-y-6 shadow-2xl mt-12 animate-scaleUp">
        <div className="mx-auto h-16 w-16 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-500 shadow-lg">
          <Lock className="h-8 w-8 animate-pulse" />
        </div>
        
        <div>
          <h2 className="text-lg font-black text-gray-100 uppercase tracking-wider font-sans">
            🔒 अपना प्राइवेट ओनर केबिन
          </h2>
          <p className="text-xs text-gray-400 mt-2 leading-relaxed">
            यह सेक्शन सिर्फ आपके (बिज़नेस ओनर) के लिए है। ग्राहक, कारीगर या लेबर के सामने आपके वास्तविक मुनाफे (मार्जिन) को छिपाने के लिए यहाँ पासवर्ड सिक्योरिटी लॉक लगा है।
          </p>
        </div>

        <form onSubmit={handleUnlock} className="space-y-4">
          <div>
            <label className="text-[10px] text-gray-500 uppercase font-black block mb-2 font-mono">
              ओनर 4-Digit Secure PIN दर्ज करें
            </label>
            <input 
              type="password"
              maxLength={4}
              required
              placeholder="••••"
              value={pinInput}
              onChange={e => setPinInput(e.target.value.replace(/\D/g, ''))}
              className="bg-[#0B0F1A] border border-gray-800 rounded-2xl tracking-[1.5em] text-center text-white py-3.5 px-4 font-mono font-black text-xl focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 w-full"
            />
          </div>

          {errorText && (
            <span className="text-xs text-red-400 font-bold block">{errorText}</span>
          )}

          <button
            type="submit"
            className="w-full bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black py-3 rounded-2xl text-xs font-black uppercase tracking-wider transition shadow-md cursor-pointer duration-200"
          >
            Locker Kholein (Unlock Dashboard)
          </button>
        </form>

        <div className="pt-2 border-t border-gray-800/60">
          <p className="text-[11px] text-gray-500">
            💡 डिफ़ॉल्ट कोड: <span className="font-mono text-amber-500 font-bold">1234</span> (अनलॉक करके अन्दर इसे बदलें)
          </p>
        </div>
      </div>
    );
  }

  // Helpers for displaying details on past entries
  const getInvoiceNumberForEntry = (invoiceId: string) => {
    const inv = invoices.find(i => i.id === invoiceId);
    if (!inv) return 'INV-Removed';
    return inv.number || inv.invoiceNumber || 'INV-Unknown';
  };

  const getClientNameForEntry = (invoiceId: string) => {
    const inv = invoices.find(i => i.id === invoiceId);
    if (!inv) return 'Unknown Grahak';
    const clientId = inv.client_id || inv.clientId;
    const client = clients.find(c => c.id === clientId);
    return client ? client.name : 'Unknown Grahak';
  };

  const getRevenueForEntry = (invoiceId: string) => {
    const inv = invoices.find(i => i.id === invoiceId);
    if (!inv) return 0;
    return parseFloat(inv.grand_total || inv.totalAmount || 0);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto px-4 md:px-0">
      
      {/* Visual Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-gray-800 pb-4 gap-4">
        <div>
          <div className="flex items-center space-x-2.5">
            <div className="p-1.5 bg-amber-500/10 border border-amber-500/20 text-amber-500 rounded-xl">
              <Calculator className="h-5 w-5" />
            </div>
            <h2 className="text-base font-black text-gray-100 font-sans tracking-wide uppercase">
              प्राइवेट बचत और मुनाफा रिपोर्ट (Private Profit Dashboard)
            </h2>
          </div>
          <p className="text-[11px] text-gray-400 mt-1">
            यहाँ हर इनवॉइस बिल की शुद्ध लागत, मजदूरी और बाकी खर्चे घटाकर खुद के शुद्ध मुनाफे का वास्तविक बहीखाता सहेजें।
          </p>
        </div>
        
        <div className="flex items-center space-x-2">
          <span className="text-[10px] hidden md:inline px-2.5 py-1 bg-gray-900 border border-gray-850 rounded-xl font-mono font-bold text-gray-400 text-center">
            Mode: {supabaseMode ? '🟢 Cloud Online' : '🟡 Local Offline'}
          </span>
          <button
            onClick={() => setProfitUnlocked(false)}
            className="bg-gray-900 text-gray-300 font-bold py-1.5 px-3 rounded-xl text-xs hover:text-white transition flex items-center space-x-1 border border-gray-800"
          >
            <Lock className="h-3.5 w-3.5" />
            <span>Lock Zone</span>
          </button>
        </div>
      </div>

      {/* Warning Box explaining exclusion */}
      <div className="bg-amber-500/5 border border-amber-500/10 rounded-2xl p-4 flex items-start space-x-3 text-amber-400">
        <Info className="h-5 w-5 flex-shrink-0 mt-0.5 text-amber-500" />
        <div>
          <span className="text-xs font-bold uppercase tracking-wide block">⚠️ आवश्यक सुरक्षा सुचना (Owner Privacy Shield)</span>
          <p className="text-[11px] text-amber-500/80 leading-relaxed mt-1">
            यह ओनर-केबिन सेक्शन केवल आपके स्वयं के विवेक के लिए है। <b>मुनाफा रिपोर्ट कभी भी ग्राहक के PDF बिल या शेयर किये गए लिंक में प्रदर्शित नहीं की जाती है।</b> यह आपकी गोपनीयता बनाए रखता है ताकि कोई आपके मार्जिन को न जान सके।
          </p>
        </div>
      </div>

      {/* Main Grid Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Step 1: Input Costs Panel */}
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5 space-y-4">
          <div className="flex items-center space-x-2 border-b border-gray-800 pb-3">
            <Plus className="h-4.5 w-4.5 text-amber-500" />
            <h3 className="text-xs font-black uppercase tracking-wider text-gray-200">
              नया मार्जिन रिकॉर्ड जोड़ें
            </h3>
          </div>

          <form onSubmit={handleSaveCalculation} className="space-y-4">
            {/* Invoice selector */}
            <div>
              <label className="text-[10px] uppercase font-bold text-gray-400 block mb-1.5">
                किस बिल (Invoice) पर चेक करना है? *
              </label>
              <select
                required
                value={selectedInvoiceId}
                onChange={e => setSelectedInvoiceId(e.target.value)}
                className="w-full bg-[#0B0F1A] border border-gray-800 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-amber-500"
              >
                <option value="">-- बिल चुनें / Invoice Select Karo --</option>
                {invoices.map(inv => {
                  const num = inv.number || inv.invoiceNumber || 'INV-Unknown';
                  const gTotal = parseFloat(inv.grand_total || inv.totalAmount || 0);
                  const client = clients.find(c => c.id === (inv.client_id || inv.clientId));
                  return (
                    <option key={inv.id} value={inv.id}>
                      {num} - {client?.name || 'Grahak'} (₹{(gTotal ?? 0).toLocaleString('en-IN')})
                    </option>
                  );
                })}
              </select>
            </div>

            {/* Cost inputs */}
            <div className="space-y-3.5">
              <div>
                <label className="text-[10px] uppercase font-bold text-gray-400 block mb-1">
                  सामग्री ख़रीद लागत (Material Purchase Cost ₹)
                </label>
                <input 
                  type="number" 
                  min="0"
                  step="any"
                  placeholder="₹ 0"
                  value={materialCost}
                  onChange={e => setMaterialCost(e.target.value)}
                  className="w-full bg-[#0B0F1A] border border-gray-800 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="text-[10px] uppercase font-bold text-gray-400 block mb-1">
                  लेबर मजदूरी खर्चा (Labour Wages Cost ₹)
                </label>
                <input 
                  type="number" 
                  min="0"
                  step="any"
                  placeholder="₹ 0"
                  value={labourCost}
                  onChange={e => setLabourCost(e.target.value)}
                  className="w-full bg-[#0B0F1A] border border-gray-800 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="text-[10px] uppercase font-bold text-gray-400 block mb-1">
                  गाड़ी / ट्रांसपोर्ट भाड़ा (Transport Freight ₹)
                </label>
                <input 
                  type="number" 
                  min="0"
                  step="any"
                  placeholder="₹ 0"
                  value={transportCost}
                  onChange={e => setTransportCost(e.target.value)}
                  className="w-full bg-[#0B0F1A] border border-gray-800 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="text-[10px] uppercase font-bold text-gray-400 block mb-1">
                  अन्य एक्स्ट्रा खर्चे (Other Overheads / Food / Tea ₹)
                </label>
                <input 
                  type="number" 
                  min="0"
                  step="any"
                  placeholder="₹ 0"
                  value={otherCost}
                  onChange={e => setOtherCost(e.target.value)}
                  className="w-full bg-[#0B0F1A] border border-gray-800 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-amber-500"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-black py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition font-mono shadow cursor-pointer disabled:opacity-50"
            >
              {loading ? 'प्रोसेसिंग...' : 'सुरक्षित नोट करें / Save Calculation'}
            </button>
          </form>
        </div>

        {/* Step 2: Live Monitor Realtime calculations panel */}
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5 flex flex-col justify-between">
          <div>
            <h3 className="text-xs font-black uppercase tracking-wider text-gray-300 border-b border-gray-800 pb-3 flex items-center">
              <TrendingUp className="h-4.5 w-4.5 text-amber-500 mr-2" />
              लाइव मार्जिन और बचत कैलकुलेटर
            </h3>

            {selectedInv ? (
              <div className="space-y-4 pt-4">
                <div className="bg-gray-950 p-3 rounded-xl border border-gray-850">
                  <span className="text-[9px] uppercase tracking-wide text-gray-550 block font-mono">चयनित इनवॉइस</span>
                  <div className="flex items-center space-x-1.5 mt-0.5">
                    <FileText className="h-3.5 w-3.5 text-amber-500" />
                    <span className="text-xs font-black text-white">{selectedInv.invoiceNumber}</span>
                  </div>
                  <div className="flex items-center space-x-1.5 mt-1">
                    <User className="h-3.5 w-3.5 text-gray-450" />
                    <span className="text-xs font-medium text-gray-300">{selectedInv.clientName}</span>
                  </div>
                </div>

                {/* Mathematical items */}
                <div className="space-y-2.5 font-mono text-xs">
                  <div className="flex justify-between items-center text-gray-400">
                    <span>1. कुल कमाई (Revenue):</span>
                    <span className="font-bold text-white">₹{(revenue ?? 0).toLocaleString('en-IN')}</span>
                  </div>
                  <div className="flex justify-between items-center text-gray-400">
                    <span>2. सामग्री खर्चा (Material):</span>
                    <span>- ₹{(matCost ?? 0).toLocaleString('en-IN')}</span>
                  </div>
                  <div className="flex justify-between items-center text-gray-400">
                    <span>3. लेबर खर्चा (Labour):</span>
                    <span>- ₹{(labCost ?? 0).toLocaleString('en-IN')}</span>
                  </div>
                  <div className="flex justify-between items-center text-gray-400">
                    <span>4. ट्रांसपोर्ट किराया (Transport):</span>
                    <span>- ₹{(transCost ?? 0).toLocaleString('en-IN')}</span>
                  </div>
                  <div className="flex justify-between items-center text-gray-400 pb-2 border-b border-gray-800">
                    <span>5. अन्य खर्चा (Other Costs):</span>
                    <span>- ₹{(othCost ?? 0).toLocaleString('en-IN')}</span>
                  </div>

                  <div className="flex justify-between items-center text-sm font-black pt-1">
                    <span className="text-gray-300">Total Expenditure:</span>
                    <span className="text-orange-400">₹{(totalExpense ?? 0).toLocaleString('en-IN')}</span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-16 text-gray-500">
                <Calculator className="h-10 w-10 mx-auto text-gray-700 animate-bounce mb-3" />
                <p className="text-xs">कृपया बाईं ओर से कोई इनवॉइस चुनें जिससे लाइव मार्जिन और मुनाफे की गणित यहाँ दिख सके।</p>
              </div>
            )}
          </div>

          {selectedInv && (
            <div className="mt-6 pt-4 border-t border-gray-800">
              <div className={`p-4 rounded-xl border text-center transition-all ${isLoss ? 'bg-red-950/20 border-red-500/25 text-red-400' : 'bg-emerald-950/20 border-emerald-500/25 text-emerald-450'}`}>
                <div className="flex items-center justify-center space-x-2">
                  {isLoss ? <TrendingDown className="h-5 w-5 text-red-500" /> : <TrendingUp className="h-5 w-5 text-emerald-500" />}
                  <span className="text-xs font-black uppercase tracking-widest">{isLoss ? 'नुकसान (Net Loss)' : 'शुद्ध मुनाफा (Net Profit)'}</span>
                </div>
                
                <h2 className="text-2xl font-black mt-1.5 font-mono">
                  {isLoss ? '-' : '+'}₹{Math.abs(netProfit ?? 0).toLocaleString('en-IN')}
                </h2>

                <div className="mt-2 text-[10px] uppercase font-black tracking-widest">
                  Profit Margin : {profitMarginPercent.toFixed(1)}%
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Step 3: PIN Security Lock settings */}
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5 flex flex-col justify-between">
          <div>
            <h3 className="text-xs font-black uppercase tracking-wider text-gray-300 border-b border-gray-800 pb-3 flex items-center">
              <Key className="h-4.5 w-4.5 text-amber-500 mr-2" />
              Locker PIN Settings
            </h3>
            
            <p className="text-[11px] text-gray-400 leading-relaxed mt-3">
              दुकान या साइड पर काम करते वक़्त ओनर ज़ोन को सुरक्षित रखने के लिए अपना गुप्त पासकोड (PIN) समय-समय पर बदलते रहें।
            </p>
          </div>

          <div className="mt-6 pt-4 border-t border-gray-800">
            {!showPinSetup ? (
              <button 
                type="button" 
                onClick={() => setShowPinSetup(true)}
                className="w-full bg-gray-950 hover:bg-gray-850 border border-gray-800 text-xs font-bold text-gray-300 py-2 rounded-xl flex items-center justify-center space-x-1.5 select-none cursor-pointer"
              >
                <Key className="h-4 w-4 text-amber-500" />
                <span>Change Locker Security PIN</span>
              </button>
            ) : (
              <form onSubmit={handlePinUpdate} className="space-y-3">
                <div className="flex space-x-2">
                  <input 
                    type="password" 
                    placeholder="New 4-digit PIN"
                    maxLength={4}
                    required
                    value={newPin}
                    onChange={e => setNewPin(e.target.value.replace(/\D/g, ''))}
                    className="flex-1 bg-[#0B0F1A] border border-gray-800 rounded-xl text-xs p-2 text-center tracking-widest font-bold"
                  />
                  <button type="submit" className="bg-emerald-500 text-black px-4 py-2 rounded-xl text-xs font-black uppercase font-mono">
                    Save
                  </button>
                </div>
                <button 
                  type="button" 
                  onClick={() => setShowPinSetup(false)} 
                  className="text-[10px] text-gray-500 hover:text-white uppercase block text-center w-full"
                >
                  Cancel Escape
                </button>
              </form>
            )}
          </div>
        </div>

      </div>

      {/* HISTORICAL RECORDS LISTING */}
      <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5">
        <h3 className="text-xs font-black uppercase tracking-wider text-gray-400 mb-4 border-b border-gray-850 pb-2 flex items-center">
          <Coins className="h-4.5 w-4.5 mr-2 text-amber-500" />
          प्रॉफिट मार्जिन बही-खाता रजिस्टर (Saved Margin Notebook)
        </h3>

        {profitEntries.length > 0 ? (
          <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
            {profitEntries.map((e) => {
              const invNum = getInvoiceNumberForEntry(e.invoice_id);
              const clientName = getClientNameForEntry(e.invoice_id);
              const rev = getRevenueForEntry(e.invoice_id);

              const profit = parseFloat(e.net_profit || 0);
              const percent = rev > 0 ? (profit / rev) * 100 : 0;
              const hasLoss = profit < 0;

              return (
                <div key={e.id} className="bg-[#121625]/80 p-4 rounded-xl border border-gray-850 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 hover:border-gray-700 transition">
                  {/* Left info */}
                  <div className="space-y-1">
                    <div className="flex items-center space-x-2">
                      <span className="bg-amber-500/10 text-amber-500 border border-amber-500/20 text-[10px] font-mono font-bold px-2 py-0.5 rounded">
                        {invNum}
                      </span>
                      <span className="text-xs font-extrabold text-gray-200">
                        {clientName}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-x-4 gap-y-1 font-mono text-[10px] text-gray-400 pt-1">
                      <div>सामग्री (Material): ₹{(parseFloat(e.material_cost || 0) ?? 0).toLocaleString('en-IN')}</div>
                      <div>कारीगरी (Labour): ₹{(parseFloat(e.labour_cost || 0) ?? 0).toLocaleString('en-IN')}</div>
                      <div>किराया (Transport): ₹{(parseFloat(e.transport || 0) ?? 0).toLocaleString('en-IN')}</div>
                      <div>अन्य (Other): ₹{(parseFloat(e.other || 0) ?? 0).toLocaleString('en-IN')}</div>
                    </div>
                  </div>

                  {/* Financial outcome status */}
                  <div className="flex items-center justify-between md:justify-end w-full md:w-auto space-x-4 border-t md:border-t-0 pt-2 md:pt-0 border-gray-850">
                    <div className="font-mono text-left md:text-right">
                      <div className="text-[10px] text-gray-500">कमाई: ₹{(rev ?? 0).toLocaleString('en-IN')} | खर्चा: ₹{(parseFloat(e.total_expense || 0) ?? 0).toLocaleString('en-IN')}</div>
                      <div className="flex items-center space-x-1.5 mt-0.5">
                        <span className={`text-xs font-black px-2 py-0.5 rounded tracking-wide ${hasLoss ? 'bg-red-500/10 text-red-400 border border-red-500/25' : 'bg-emerald-500/10 text-emerald-450 border border-emerald-500/25'}`}>
                          {hasLoss ? 'नुकसान' : 'बचत'}: ₹{Math.abs(profit ?? 0).toLocaleString('en-IN')} ({percent.toFixed(1)}%)
                        </span>
                      </div>
                    </div>

                    <button
                      onClick={() => handleDeleteCalculation(e.id)}
                      className="text-gray-500 hover:text-red-400 border border-transparent hover:border-red-500/20 hover:bg-red-500/5 p-1.5 rounded-xl transition cursor-pointer"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-12 text-gray-500 bg-gray-950/20 rounded-2xl border border-dashed border-gray-850">
            <Coins className="h-10 w-10 mx-auto text-gray-800 animate-pulse mb-2" />
            <p className="text-xs font-mono">कोई प्राइवेट प्रॉफिट बचत एंट्री सहेजी नहीं गयी है।</p>
          </div>
        )}
      </div>

    </div>
  );
}
