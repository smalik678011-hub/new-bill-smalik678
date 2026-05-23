import React, { useState } from 'react';
import { X, UserPlus, Phone, MapPin, Calendar, HelpCircle, Save } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAppStore } from '../../store';
import { toast } from 'react-hot-toast';

interface AddClientModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function AddClientModal({ isOpen, onClose, onSuccess }: AddClientModalProps) {
  const store = useAppStore();
  const [loading, setLoading] = useState(false);

  // Form Fields
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [source, setSource] = useState('Direct');
  const [deadline, setDeadline] = useState('');
  const [notes, setNotes] = useState('');
  const [clientType, setClientType] = useState<'Contractor' | 'Regular' | 'Supplier' | 'Individual'>('Regular');
  const [initialDue, setInitialDue] = useState('0');

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error('Please enter the client name!');
      return;
    }

    setLoading(true);
    try {
      // 1. Try to fetch Auth / Supabase status
      const { data: { user } } = await supabase.auth.getUser();

      if (user) {
        // Fetch user's business
        const { data: businessData, error: bErr } = await supabase
          .from('profiles')
          .select('id')
          .eq('user_id', user.id);

        if (bErr) throw bErr;

        if (businessData && businessData.length > 0) {
          const businessId = businessData[0].id;

          // Save to Supabase using exact columns from schema.sql
          const { data: newDbClient, error: clientErr } = await supabase
            .from('clients')
            .insert({
              business_id: businessId,
              name,
              phone: phone || 'NA',
              address: address || '',
              source: source || 'Direct',
              status: 'Active',
              deadline: deadline || null,
              notes: notes || ''
            })
            .select();

          if (clientErr) throw clientErr;

          // If there is initial due, we create a corresponding invoice for initial due tracking
          const parsedDue = parseFloat(initialDue) || 0;
          if (parsedDue > 0 && newDbClient && newDbClient.length > 0) {
            const clientUuid = newDbClient[0].id;
            const { error: invErr } = await supabase
              .from('invoices')
              .insert({
                business_id: businessId,
                client_id: clientUuid,
                number: `INV-OPEN-${Math.floor(1000 + Math.random() * 9000)}`,
                items: [{ name: 'Opening Outstanding Balance', quantity: 1, rate: parsedDue, unit: 'Job', gstPercent: 0 }],
                subtotal: parsedDue,
                grand_total: parsedDue,
                status: 'Unpaid',
                payments: []
              });
            if (invErr) {
              console.warn('Could not record opening balance invoice:', invErr);
            }
          }

          toast.success('New client added to cloud database successfully!');
          onSuccess();
          onClose();
          return;
        }
      }

      // 2. Fallback to local Zustand store
      const parsedDue = parseFloat(initialDue) || 0;
      store.addClient({
        name,
        phone: phone || 'NA',
        clientType,
        totalDue: parsedDue,
        totalPaid: 0
      });

      toast.success('New client added to local ledger!');
      onSuccess();
      onClose();
    } catch (err: any) {
      console.error(err);
      toast.error(`Error: ${err.message || 'Failed to add client'}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#0B0F1A]/85 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-gray-900 border border-gray-800 rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl animate-scaleUp">
        {/* Header */}
        <div className="bg-[#0D121F] px-6 py-4 border-b border-gray-800 flex items-center justify-between font-sans">
          <div className="flex items-center space-x-2">
            <div className="p-1.5 bg-amber-500/10 border border-amber-500/25 text-amber-500 rounded-xl">
              <UserPlus className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-sm text-gray-100 uppercase tracking-wider">
                Create New Client Account
              </h3>
              <p className="text-[10px] text-gray-500">Registry Portal</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 bg-gray-950/60 hover:bg-gray-850 text-gray-400 hover:text-white rounded-full transition cursor-pointer"
          >
            <X className="h-4.5 w-4.5" />
          </button>
        </div>

        {/* Inputs Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[75vh] overflow-y-auto font-sans">
          {/* Client Name */}
          <div>
            <label className="text-[10px] text-gray-450 block mb-1 font-bold uppercase tracking-wider">
              Client Name *
            </label>
            <input 
              required
              type="text" 
              placeholder="e.g. Ram Singh (Contractor)"
              value={name}
              onChange={e => setName(e.target.value)}
              className="w-full bg-[#0B0F1A] border border-gray-850 hover:border-gray-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-amber-500 transition-colors"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Phone */}
            <div>
              <label className="text-[10px] text-gray-455 block mb-1 font-bold uppercase tracking-wider">
                Mobile Number (Phone)
              </label>
              <div className="relative">
                <Phone className="absolute left-3 top-3 h-3.5 w-3.5 text-gray-550" />
                <input 
                  type="tel" 
                  placeholder="e.g. 9876543210"
                  maxLength={10}
                  value={phone}
                  onChange={e => setPhone(e.target.value.replace(/\D/g, ''))}
                  className="w-full bg-[#0B0F1A] border border-gray-850 hover:border-gray-800 rounded-xl pl-9 pr-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-amber-500 transition-colors"
                />
              </div>
            </div>

            {/* Client type */}
            <div>
              <label className="text-[10px] text-gray-455 block mb-1 font-bold uppercase tracking-wider">
                Client Type
              </label>
              <select
                value={clientType}
                onChange={e => setClientType(e.target.value as any)}
                className="w-full bg-[#0B0F1A] border border-gray-855 hover:border-gray-800 rounded-xl px-3 py-2.5 text-xs text-gray-300 focus:outline-none focus:border-amber-500 transition-colors"
              >
                <option value="Regular">Regular Client</option>
                <option value="Contractor">Contractor</option>
                <option value="Supplier">Supplier</option>
                <option value="Individual">Individual Buyer</option>
              </select>
            </div>
          </div>

          {/* Delivery Deadline */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-[10px] text-gray-455 block mb-1 font-bold uppercase tracking-wider">
                Delivery Deadline
              </label>
              <div className="relative">
                <Calendar className="absolute left-3 top-3 h-3.5 w-3.5 text-gray-550" />
                <input 
                  type="date" 
                  value={deadline}
                  onChange={e => setDeadline(e.target.value)}
                  className="w-full bg-[#0B0F1A] border border-gray-855 hover:border-gray-800 rounded-xl pl-9 pr-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-amber-500 transition-colors"
                />
              </div>
            </div>

            {/* Source */}
            <div>
              <label className="text-[10px] text-gray-455 block mb-1 font-bold uppercase tracking-wider">
                Client Source / Referral
              </label>
              <div className="relative">
                <HelpCircle className="absolute left-3 top-3 h-3.5 w-3.5 text-gray-550" />
                <input 
                  type="text" 
                  placeholder="e.g. Google Search, Facebook, Word of mouth"
                  value={source}
                  onChange={e => setSource(e.target.value)}
                  className="w-full bg-[#0B0F1A] border border-gray-855 hover:border-gray-800 rounded-xl pl-9 pr-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-amber-500 transition-colors"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Opening Balance (Outstanding) */}
            <div>
              <label className="text-[10px] text-gray-455 block mb-2 font-bold uppercase tracking-wider">
                Opening Balance
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-2.5 text-gray-500 text-xs font-black">₹</span>
                <input 
                  type="number" 
                  placeholder="e.g. 4500 (if dues exist)"
                  value={initialDue}
                  onChange={e => setInitialDue(e.target.value)}
                  className="w-full bg-[#0B0F1A] border border-gray-855 hover:border-gray-800 rounded-xl pl-7 pr-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-amber-500 transition-colors"
                />
              </div>
            </div>

            {/* Full Address */}
            <div>
              <label className="text-[10px] text-gray-455 block mb-2 font-bold uppercase tracking-wider">
                Full Address
              </label>
              <div className="relative">
                <MapPin className="absolute left-3 top-3 h-3.5 w-3.5 text-gray-555" />
                <input 
                  type="text" 
                  placeholder="e.g. GT Road, Aligarh, UP"
                  value={address}
                  onChange={e => setAddress(e.target.value)}
                  className="w-full bg-[#0B0F1A] border border-gray-855 hover:border-gray-800 rounded-xl pl-9 pr-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-amber-500 transition-colors"
                />
              </div>
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="text-[10px] text-gray-455 block mb-1 font-bold uppercase tracking-wider">
              Client Notes / Instructions
            </label>
            <textarea 
              rows={3}
              placeholder="e.g. Safety gate fabrication. 12mm bars to be used."
              value={notes}
              onChange={e => setNotes(e.target.value)}
              className="w-full bg-[#0B0F1A] border border-gray-855 hover:border-gray-800 rounded-2xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-amber-500 transition-colors"
            />
          </div>

          {/* Submit Trigger */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-amber-500 hover:bg-amber-600 disabled:bg-amber-500/40 text-white py-3 rounded-2xl font-black text-xs uppercase cursor-pointer flex items-center justify-center space-x-2 transition shadow-lg shrink-0"
            >
              {loading ? (
                <div className="h-4 w-4 border-2 border-white/25 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <Save className="h-4 w-4 stroke-[2.5]" />
                  <span>Save & Open Account</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
