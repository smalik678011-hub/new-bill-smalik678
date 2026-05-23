import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAppStore } from '../store';
import { motion } from 'motion/react';
import { 
  User, 
  Phone, 
  MapPin, 
  Calendar, 
  HelpCircle, 
  FileSpreadsheet, 
  ClipboardCheck, 
  Trash2, 
  Edit3, 
  Save, 
  X, 
  ChevronLeft, 
  Sparkles,
  PlusCircle,
  FileText
} from 'lucide-react';
import { toast } from 'react-hot-toast';

export default function ClientDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const store = useAppStore();

  // Loaders
  const [supabaseMode, setSupabaseMode] = useState(false);
  const [loading, setLoading] = useState(true);

  // States
  const [client, setClient] = useState<any>(null);
  const [invoices, setInvoices] = useState<any[]>([]);
  const [quotations, setQuotations] = useState<any[]>([]);
  
  // Tabs: 'invoices' | 'quotations'
  const [activeTab, setActiveTab] = useState<'invoices' | 'quotations'>('invoices');

  // Edit Mode States
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editAddress, setEditAddress] = useState('');
  const [editSource, setEditSource] = useState('');
  const [editDeadline, setEditDeadline] = useState('');
  const [editNotes, setEditNotes] = useState('');

  // Parallel loading of individual client detail
  const loadClientDetail = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        // Fallback to local
        setSupabaseMode(false);
        const match = store.clients.find(c => c.id === id);
        if (match) {
          setClient(match);
          setEditFields(match);
          
          // Map local invoices & quotes
          const matchInvs = store.invoices.filter(i => i.clientId === id);
          const matchQuotes = store.quotations.filter(q => q.clientId === id);
          setInvoices(matchInvs);
          setQuotations(matchQuotes);
        } else {
          toast.error('Client details not found!');
          navigate('/clients');
        }
        setLoading(false);
        return;
      }

      // Supabase Query
      const { data: clientData, error: cErr } = await supabase
        .from('clients')
        .select('*')
        .eq('id', id);

      if (cErr || !clientData || clientData.length === 0) {
        // Fall it back
        setSupabaseMode(false);
        const match = store.clients.find(c => c.id === id);
        if (match) {
          setClient(match);
          setEditFields(match);
          setInvoices(store.invoices.filter(i => i.clientId === id));
          setQuotations(store.quotations.filter(q => q.clientId === id));
        } else {
          toast.error('Client details not found!');
          navigate('/clients');
        }
        setLoading(false);
        return;
      }

      const cl = clientData[0];
      setClient(cl);
      setEditFields(cl);

      // Fetch linked client invoices + estimates from cloud
      const [invsRes, quotesRes] = await Promise.all([
        supabase.from('invoices').select('*').eq('client_id', id),
        supabase.from('quotations').select('*').eq('client_id', id)
      ]);

      setSupabaseMode(true);
      setInvoices(invsRes.data || []);
      setQuotations(quotesRes.data || []);
    } catch (err) {
      console.warn('Real-time profile fetch failed, using local backup. Error:', err);
      setSupabaseMode(false);
      const match = store.clients.find(c => c.id === id);
      if (match) {
        setClient(match);
        setEditFields(match);
        setInvoices(store.invoices.filter(i => i.clientId === id));
        setQuotations(store.quotations.filter(q => q.clientId === id));
      } else {
        navigate('/clients');
      }
    } finally {
      setLoading(false);
    }
  };

  const setEditFields = (c: any) => {
    setEditName(c.name || '');
    setEditPhone(c.phone === 'NA' ? '' : (c.phone || ''));
    setEditAddress(c.address || '');
    setEditSource(c.source || 'Direct');
    setEditDeadline(c.deadline || '');
    setEditNotes(c.notes || '');
  };

  useEffect(() => {
    loadClientDetail();
  }, [id, store.clients, store.invoices, store.quotations]);

  // Edit fields saver
  const handleSaveEdit = async () => {
    if (!editName.trim()) {
      toast.error('Please enter the client name!');
      return;
    }

    try {
      if (supabaseMode) {
        const { error: patchErr } = await supabase
          .from('clients')
          .update({
            name: editName,
            phone: editPhone || 'NA',
            address: editAddress,
            source: editSource,
            deadline: editDeadline || null,
            notes: editNotes
          })
          .eq('id', id);

        if (patchErr) throw patchErr;
        toast.success('Client updated successfully!');
        setIsEditing(false);
        loadClientDetail();
        return;
      }

      // Fallback local
      store.updateClient(id!, {
        name: editName,
        phone: editPhone || 'NA'
      });
      toast.success('Local client updated successfully!');
      setIsEditing(false);
      loadClientDetail();
    } catch (err: any) {
      toast.error(`Error: ${err.message || 'Update failed'}`);
    }
  };

  // Safe Deletion Handler
  const handleDeleteClient = async () => {
    const isConfirmed = window.confirm(`Are you sure you want to permanently delete client account "${client?.name}"? All associated invoices and estimates will be removed.`);
    if (!isConfirmed) return;

    try {
      if (supabaseMode) {
        const { error: removeErr } = await supabase
          .from('clients')
          .delete()
          .eq('id', id);

        if (removeErr) throw removeErr;
        toast.success('Client account permanently deleted from cloud!');
        navigate('/clients');
        return;
      }

      // Fallback local
      store.deleteClient(id!);
      toast.success('Client deleted from local ledger!');
      navigate('/clients');
    } catch (err: any) {
      toast.error(`Error: ${err.message || 'Deletion failed'}`);
    }
  };

  const handleCall = () => {
    if (!client?.phone || client.phone === 'NA') return;
    window.location.href = `tel:${client.phone}`;
  };

  // Calculate dynamic due outstanding sum
  const totalAmountSum = invoices.reduce((sum, inv) => {
    return sum + Number(inv.grand_total || inv.totalAmount || 0);
  }, 0);

  const paidAmountSum = invoices.reduce((sum, inv) => {
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
    return sum + paidSum;
  }, 0);

  const netOutstandingBalance = supabaseMode 
    ? (totalAmountSum - paidAmountSum)
    : (client?.totalDue || 0);

  if (loading) {
    return (
      <div className="min-h-[50vh] flex flex-col justify-center items-center">
        <div className="h-10 w-10 border-4 border-amber-500/25 border-t-amber-500 rounded-full animate-spin mb-4" />
        <span className="text-gray-400 text-xs font-black animate-pulse">Loading profile ledger...</span>
      </div>
    );
  }

  return (
    <div className="space-y-5 pb-16">
      {/* Back to registry navigation */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate('/clients')}
          className="flex items-center space-x-1 px-3 py-1.5 rounded-xl bg-gray-900 border border-gray-850 text-gray-300 hover:text-white transition cursor-pointer"
        >
          <ChevronLeft className="h-4 w-4" />
          <span className="text-xs font-black">Registry List</span>
        </button>

        <div className="flex items-center space-x-2">
          {/* Edit toggle */}
          {!isEditing ? (
            <button
              onClick={() => setIsEditing(true)}
              className="p-2 bg-gray-900 border border-gray-850 text-amber-500 hover:text-amber-400 rounded-xl transition cursor-pointer"
              title="Edit Profile"
            >
              <Edit3 className="h-4.5 w-4.5" />
            </button>
          ) : (
            <button
              onClick={() => setIsEditing(false)}
              className="p-2 bg-gray-900 border border-gray-850 text-gray-400 hover:text-white rounded-xl transition cursor-pointer"
              title="Cancel"
            >
              <X className="h-4.5 w-4.5" />
            </button>
          )}

          {/* Delete action */}
          <button
            onClick={handleDeleteClient}
            className="p-2 bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500/20 rounded-xl transition cursor-pointer"
            title="Permanently Delete"
          >
            <Trash2 className="h-4.5 w-4.5" />
          </button>
        </div>
      </div>

      {/* Profile summary screen */}
      <motion.div 
        className="bg-gray-900 rounded-3xl p-6 border border-gray-800 shadow-xl relative overflow-hidden"
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.05, ease: [0.16, 1, 0.3, 1] }}
      >
        <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/5 rounded-full blur-2xl pointer-events-none" />
        
        {isEditing ? (
          /* Profile fields inline editor */
          <div className="space-y-4">
            <h3 className="text-xs font-black text-amber-500 uppercase tracking-widest font-mono">Edit Client Details</h3>
            
            <div>
              <label className="text-[9.5px] uppercase tracking-wide text-gray-450 block mb-1">Client Full Name *</label>
              <input 
                type="text"
                value={editName}
                onChange={e => setEditName(e.target.value)}
                className="w-full bg-[#0B0F1A] border border-gray-850 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-amber-500"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="text-[9.5px] uppercase tracking-wide text-gray-450 block mb-1">Mobile Number (Phone)</label>
                <input 
                  type="text"
                  maxLength={10}
                  value={editPhone}
                  onChange={e => setEditPhone(e.target.value.replace(/\D/g, ''))}
                  className="w-full bg-[#0B0F1A] border border-gray-855 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-amber-500"
                />
              </div>
              <div>
                <label className="text-[9.5px] uppercase tracking-wide text-gray-450 block mb-1">Work Deadline</label>
                <input 
                  type="date"
                  value={editDeadline}
                  onChange={e => setEditDeadline(e.target.value)}
                  className="w-full bg-[#0B0F1A] border border-gray-855 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-amber-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="text-[9.5px] uppercase tracking-wide text-gray-450 block mb-1">Full Address</label>
                <input 
                  type="text"
                  value={editAddress}
                  onChange={e => setEditAddress(e.target.value)}
                  className="w-full bg-[#0B0F1A] border border-gray-855 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-amber-500"
                />
              </div>
              <div>
                <label className="text-[9.5px] uppercase tracking-wide text-gray-450 block mb-1">Client Reference (Source)</label>
                <input 
                  type="text"
                  value={editSource}
                  onChange={e => setEditSource(e.target.value)}
                  className="w-full bg-[#0B0F1A] border border-gray-855 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-amber-500"
                />
              </div>
            </div>

            <div>
              <label className="text-[9.5px] uppercase tracking-wide text-gray-450 block mb-1">Client Notes (General)</label>
              <textarea 
                rows={3}
                value={editNotes}
                onChange={e => setEditNotes(e.target.value)}
                className="w-full bg-[#0B0F1A] border border-gray-855 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-amber-500"
              />
            </div>

            <button
              onClick={handleSaveEdit}
              className="w-full bg-amber-500 text-white py-2.5 rounded-xl font-black text-xs uppercase flex items-center justify-center space-x-1.5 hover:bg-amber-600 transition cursor-pointer"
            >
              <Save className="h-4 w-4" />
              <span>Save Updates</span>
            </button>
          </div>
        ) : (
          /* Profile Cards Details Info */
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
            <div className="flex items-start space-x-4">
              <div className="h-16 w-16 bg-gradient-to-tr from-amber-500 to-amber-600 rounded-2xl flex items-center justify-center text-white font-black text-2xl border-4 border-gray-800 shadow-lg shrink-0">
                {client?.name?.charAt(0) || 'B'}
              </div>
              
              <div className="space-y-1.5 min-w-0">
                <div className="flex items-center space-x-2">
                  <h2 className="text-lg font-black text-white tracking-tight truncate select-all">{client?.name}</h2>
                  <span className="text-[9px] bg-amber-500/15 border border-amber-500/25 text-amber-500 px-2 py-0.5 rounded-full font-black uppercase tracking-wider font-mono">
                    {client?.source || 'Direct'}
                  </span>
                </div>

                <div className="flex flex-wrap gap-y-1 gap-x-4 text-xs text-gray-400">
                  {client?.phone && client.phone !== 'NA' && (
                    <button 
                      onClick={handleCall}
                      className="flex items-center hover:text-amber-500 transition-colors font-bold hover:underline cursor-pointer"
                    >
                      <Phone className="h-3.5 w-3.5 mr-1.5 text-amber-500" />
                      <span>{client.phone}</span>
                    </button>
                  )}

                  {client?.deadline && (
                    <div className="flex items-center">
                      <Calendar className="h-3.5 w-3.5 mr-1.5 text-amber-500" />
                      <span className="font-bold">Deadline: {client.deadline}</span>
                    </div>
                  )}
                </div>

                {client?.address && (
                  <div className="flex items-center text-xs text-gray-500">
                    <MapPin className="h-3.5 w-3.5 mr-1.5 text-gray-600 shrink-0" />
                    <span className="truncate">{client.address}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Dynamic account ledger outstanding box */}
            <div className="bg-[#0B0F1A]/70 border border-gray-850 p-4.5 rounded-2xl min-w-[200px] text-right flex flex-col justify-center">
              <span className="text-[10px] text-gray-500 uppercase tracking-widest font-mono block">A/C Due Outstanding</span>
              <span className={`text-xl font-black block mt-1 ${netOutstandingBalance > 0 ? 'text-rose-400' : 'text-emerald-400'}`}>
                ₹{(netOutstandingBalance ?? 0).toLocaleString('en-IN')}
              </span>
              <span className="text-[9px] text-gray-505 block mt-1 leading-none italic font-bold">
                {netOutstandingBalance > 0 ? '⚠️ Outstanding Dues Pending' : 'All Dues Cleared'}
              </span>
            </div>
          </div>
        )}
      </motion.div>

      {/* Static Notes display (if not in editing mode) */}
      {!isEditing && client?.notes && (
        <motion.div 
          className="bg-[#1C160C] border border-amber-500/20 rounded-2xl p-4 shadow"
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
        >
          <div className="flex items-center space-x-1.5">
            <Sparkles className="h-3.5 w-3.5 text-amber-500" />
            <h4 className="text-[10px] font-black text-amber-500 uppercase tracking-wider font-mono">Important Client Instructions & Notes</h4>
          </div>
          <p className="text-xs text-gray-300 mt-2 leading-relaxed whitespace-pre-line">{client.notes}</p>
        </motion.div>
      )}

      {/* Profile content ledger tabs switcher */}
      <div className="border-b border-gray-800 flex items-center justify-between pb-0.5">
        <div className="flex space-x-6">
          <button
            onClick={() => setActiveTab('invoices')}
            className={`pb-3 text-xs font-black tracking-wide cursor-pointer transition-all border-b-2 flex items-center space-x-2 ${
              activeTab === 'invoices' 
                ? 'border-amber-500 text-amber-500' 
                : 'border-transparent text-gray-400 hover:text-white'
            }`}
          >
            <FileSpreadsheet className="h-4 w-4" />
            <span>Invoices ({invoices.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('quotations')}
            className={`pb-3 text-xs font-black tracking-wide cursor-pointer transition-all border-b-2 flex items-center space-x-2 ${
              activeTab === 'quotations' 
                ? 'border-amber-500 text-amber-500' 
                : 'border-transparent text-gray-400 hover:text-white'
            }`}
          >
            <ClipboardCheck className="h-4 w-4" />
            <span>Estimates ({quotations.length})</span>
          </button>
        </div>

        {/* Quick action: Generate Invoice/Quotation */}
        <button
          onClick={() => navigate(activeTab === 'invoices' ? '/invoices' : '/quotations')}
          className="text-[10px] bg-amber-500 text-white py-1.5 px-3 rounded-lg font-black uppercase flex items-center space-x-1 hover:bg-amber-600 transition cursor-pointer"
        >
          <PlusCircle className="h-3.5 w-3.5" />
          <span>Add New ({activeTab === 'invoices' ? 'Invoice' : 'Estimate'})</span>
        </button>
      </div>

      {/* Render sub list based on selected Tab */}
      <motion.div 
        className="space-y-3 font-sans"
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.15, ease: [0.16, 1, 0.3, 1] }}
      >
        {activeTab === 'invoices' ? (
          /* Render invoices */
          invoices.length === 0 ? (
            <div className="bg-gray-900/30 border border-dashed border-gray-850 rounded-2xl py-12 text-center text-gray-500">
              <FileSpreadsheet className="h-8 w-8 text-gray-700 mx-auto mb-2" />
              <p className="text-xs font-bold text-gray-400">No invoices found for this client!</p>
              <p className="text-[10px] text-gray-500 mt-1">Click "Add New" to record a new invoice or receive a payments entry.</p>
            </div>
          ) : (
            invoices.map((inv) => {
              const invNumber = inv.number || inv.invoiceNumber;
              const finalAmt = Number(inv.grand_total || inv.totalAmount || 0);
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

              const status = inv.status || 'Unpaid';
              let statColor = 'bg-rose-500/10 text-rose-400 border border-rose-500/20';
              let statDot = 'bg-rose-500';

              if (status?.toLowerCase() === 'paid') {
                statColor = 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20';
                statDot = 'bg-emerald-500';
              } else if (status?.toLowerCase() === 'partial') {
                statColor = 'bg-amber-500/10 text-amber-500 border border-amber-500/20';
                statDot = 'bg-amber-500';
              }

              return (
                <div 
                  key={inv.id} 
                  className="bg-gray-900 border border-gray-850 rounded-2xl p-4 flex items-center justify-between hover:border-gray-800 transition"
                >
                  <div className="space-y-1">
                    <div className="flex items-center space-x-2">
                      <span className="text-xs font-black text-gray-250 font-mono font-sans font-bold">Invoice: {invNumber}</span>
                      <span className="text-[10px] text-gray-500 font-mono">{inv.date}</span>
                    </div>

                    <div className="flex items-center text-[10px] text-gray-500">
                      <span>Items: ({inv.items ? (typeof inv.items === 'string' ? JSON.parse(inv.items).length : inv.items.length) : 0})</span>
                    </div>
                  </div>

                  <div className="flex items-center space-x-4">
                    <div className="text-right">
                      <span className="text-xs font-black text-white block">₹{(finalAmt ?? 0).toLocaleString('en-IN')}</span>
                      {finalAmt - paidSum > 0 && (
                        <span className="text-[9px] text-rose-450 block font-bold mt-0.5 font-sans">₹{((finalAmt ?? 0) - (paidSum ?? 0)).toLocaleString('en-IN')} Due</span>
                      )}
                    </div>

                    {/* Status badge */}
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-[9px] font-black tracking-wide ${statColor}`}>
                      <span className={`h-1 w-1 rounded-full mr-1 ${statDot}`} />
                      {status.toUpperCase()}
                    </span>
                  </div>
                </div>
              );
            })
          )
        ) : (
          /* Render quotations estimates */
          quotations.length === 0 ? (
            <div className="bg-gray-900/30 border border-dashed border-gray-850 rounded-2xl py-12 text-center text-gray-500">
              <ClipboardCheck className="h-8 w-8 text-gray-700 mx-auto mb-2" />
              <p className="text-xs font-bold text-gray-400">No estimates found for this client!</p>
              <p className="text-[10px] text-gray-500 mt-1">Click "Add New" to issue a proposal or quote for items.</p>
            </div>
          ) : (
            quotations.map((quote) => {
              const qNo = quote.number || quote.quoteNumber;
              const qAmt = Number(quote.total || quote.totalAmount || 0);
              const qStatus = quote.status || (quote.isConverted ? 'Converted' : 'Draft');
              
              let qStatColor = 'bg-gray-800 text-gray-400 border border-gray-800';
              if (qStatus.toLowerCase() === 'converted') {
                qStatColor = 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20';
              } else if (qStatus.toLowerCase() === 'sent') {
                qStatColor = 'bg-amber-500/10 text-amber-500 border border-amber-500/20';
              }

              return (
                <div 
                  key={quote.id} 
                  className="bg-gray-900 border border-gray-855 rounded-2xl p-4 flex items-center justify-between hover:border-gray-800 transition"
                >
                  <div className="space-y-1">
                    <div className="flex items-center space-x-2">
                      <span className="text-xs font-black text-gray-250 font-mono font-sans font-bold">Estimate: {qNo}</span>
                      <span className="text-[10px] text-gray-550 font-mono">{quote.date}</span>
                    </div>

                    <div className="text-[10px] text-gray-500">
                      <span>Validity: {quote.validity || quote.validityDays || 15} days ({quote.conditions || 'No special conditions documented'})</span>
                    </div>
                  </div>

                  <div className="flex items-center space-x-4">
                    <span className="text-xs font-black text-white font-sans font-bold">
                      ₹{(qAmt ?? 0).toLocaleString('en-IN')}
                    </span>

                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-[8.5px] font-black uppercase tracking-wider ${qStatColor}`}>
                      {qStatus}
                    </span>
                  </div>
                </div>
              );
            })
          )
        )}
      </motion.div>
    </div>
  );
}
