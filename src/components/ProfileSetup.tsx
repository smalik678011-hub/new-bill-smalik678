import React, { useState } from 'react';
import useAppStore from '../store';
import { Save, AlertCircle, Sparkles, Building, CheckCircle } from 'lucide-react';


export default function ProfileSetup() {

  const { profile, updateProfile } = useAppStore();

  const [form, setForm] = useState({
    businessName: profile.businessName || '',
    ownerName: profile.ownerName || '',
    phone: profile.phone || '',
    address: profile.address || '',
    gstNumber: profile.gstNumber || '',
    isRegisteredGST: profile.isRegisteredGST || false,
    bankName: profile.bankName || '',
    accountNumber: profile.accountNumber || '',
    ifscCode: profile.ifscCode || '',
    upiId: profile.upiId || '',
    signatureText: profile.signatureText || ''
  });

  const [showToast, setShowToast] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateProfile(form);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 3000);
  };

  return (
    <div className="space-y-4">
      {/* Visual Header */}
      <div className="flex items-center space-x-2 pb-1 border-b border-gray-800">
        <Building className="h-5 w-5 text-amber-500" />
        <h2 className="text-base font-bold text-gray-100">Dhandha Profile Setup (Mera Karobar)</h2>
      </div>

      {showToast && (
        <div className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 p-2.5 rounded text-xs flex items-center space-x-2 animate-pulse">
          <CheckCircle className="h-4 w-4 text-emerald-500" />
          <span>Profile changes successfully save ho gaye hain!</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4 bg-gray-900 p-5 rounded-2xl border border-gray-800">
        <h3 className="text-xs font-bold text-amber-500 uppercase tracking-wider">Karobar details</h3>
        
        <div className="space-y-3">
          <div>
            <label className="text-[11px] text-gray-400 block font-medium mb-1">दुकान / कंपनी का नाम (Business Name) *</label>
            <input 
              type="text" 
              required
              placeholder="e.g. Aman Welding Works"
              value={form.businessName}
              onChange={e => setForm({ ...form, businessName: e.target.value })}
              className="w-full bg-[#0B0F1A] border border-gray-800 rounded p-2 text-xs text-white focus:outline-none focus:border-amber-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] text-gray-400 block font-medium mb-1">मालिक का नाम (Owner Name) *</label>
              <input 
                type="text" 
                required
                placeholder="e.g. Aman Sharma"
                value={form.ownerName}
                onChange={e => setForm({ ...form, ownerName: e.target.value })}
                className="w-full bg-[#0B0F1A] border border-gray-800 rounded p-2 text-xs text-white focus:outline-none focus:border-amber-500"
              />
            </div>
            <div>
              <label className="text-[11px] text-gray-400 block font-medium mb-1">मोबाइल नंबर (Phone) *</label>
              <input 
                type="text" 
                maxLength={10}
                required
                placeholder="9876543210"
                value={form.phone}
                onChange={e => setForm({ ...form, phone: e.target.value.replace(/\D/g, '') })}
                className="w-full bg-[#0B0F1A] border border-gray-800 rounded p-2 text-xs text-white focus:outline-none focus:border-amber-500"
              />
            </div>
          </div>

          <div>
            <label className="text-[11px] text-gray-400 block font-medium mb-1">दुकान / काम का पता (Address) *</label>
            <textarea 
              rows={2}
              required
              placeholder="Full workshop or store address..."
              value={form.address}
              onChange={e => setForm({ ...form, address: e.target.value })}
              className="w-full bg-[#0B0F1A] border border-gray-800 rounded p-2 text-xs text-white focus:outline-none focus:border-amber-500"
            />
          </div>
        </div>

        {/* GST Registration Panel */}
        <div className="border-t border-gray-800 pt-4 mt-2">
          <div className="flex items-center justify-between mb-3 bg-[#0B0F1A] p-2 rounded">
            <div>
              <h4 className="text-[12px] font-bold text-gray-100">क्या आप GST रजिस्टर्ड हैं?</h4>
              <p className="text-[10px] text-gray-400">GST bill banane ke liye ise chalu karein</p>
            </div>
            <input 
              type="checkbox"
              checked={form.isRegisteredGST}
              onChange={e => setForm({ ...form, isRegisteredGST: e.target.checked })}
              className="w-4 h-4 accent-amber-500 cursor-pointer"
            />
          </div>

          {form.isRegisteredGST && (
            <div className="mt-2 animate-fadeIn">
              <label className="text-[11px] text-gray-400 block font-medium mb-1">GSTIN Number</label>
              <input 
                type="text" 
                placeholder="e.g. 09AABCU1234F1Z8"
                autoCapitalize="characters"
                value={form.gstNumber}
                onChange={e => setForm({ ...form, gstNumber: e.target.value.toUpperCase() })}
                className="w-full bg-[#0B0F1A] border border-gray-800 rounded p-2 text-xs text-white focus:outline-none focus:border-amber-500 font-mono tracking-wider"
              />
            </div>
          )}
        </div>

        {/* Bank & Payment details */}
        <div className="border-t border-gray-800 pt-4 mt-2">
          <h3 className="text-xs font-bold text-amber-500 uppercase tracking-wider mb-3">बैंक खाता विवरण (Bill par aane wale details)</h3>
          
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] text-gray-400 block font-medium mb-1">बैंक का नाम (Bank Name)</label>
                <input 
                  type="text" 
                  placeholder="e.g. SBI, HDFC"
                  value={form.bankName}
                  onChange={e => setForm({ ...form, bankName: e.target.value })}
                  className="w-full bg-[#0B0F1A] border border-gray-800 rounded p-2 text-xs text-white focus:outline-none focus:border-amber-500"
                />
              </div>
              <div>
                <label className="text-[11px] text-gray-400 block font-medium mb-1">UPI ID (Fast payment)</label>
                <input 
                  type="text" 
                  placeholder="name@ybl, etc."
                  value={form.upiId}
                  onChange={e => setForm({ ...form, upiId: e.target.value })}
                  className="w-full bg-[#0B0F1A] border border-gray-800 rounded p-2 text-xs text-white focus:outline-none focus:border-amber-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] text-gray-400 block font-medium mb-1">खाता संख्या (Account Number)</label>
                <input 
                  type="text" 
                  placeholder="Enter Account Number"
                  value={form.accountNumber}
                  onChange={e => setForm({ ...form, accountNumber: e.target.value })}
                  className="w-full bg-[#0B0F1A] border border-gray-800 rounded p-2 text-xs text-white focus:outline-none focus:border-amber-500 font-mono"
                />
              </div>
              <div>
                <label className="text-[11px] text-gray-400 block font-medium mb-1">IFSC कोड (IFSC Code)</label>
                <input 
                  type="text" 
                  placeholder="e.g. SBIN0001234"
                  autoCapitalize="characters"
                  value={form.ifscCode}
                  onChange={e => setForm({ ...form, ifscCode: e.target.value.toUpperCase() })}
                  className="w-full bg-[#0B0F1A] border border-gray-800 rounded p-2 text-xs text-white focus:outline-none focus:border-amber-500 font-mono"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Signature details */}
        <div className="border-t border-gray-800 pt-4 mt-2">
          <label className="text-[11px] text-gray-400 block font-medium mb-1">बिल के नीचे सिग्नेचर नाम (Signature Label on Bills)</label>
          <input 
            type="text" 
            placeholder="e.g. Proprietor / Partner"
            value={form.signatureText}
            onChange={e => setForm({ ...form, signatureText: e.target.value })}
            className="w-full bg-[#0B0F1A] border border-gray-800 rounded p-2 text-xs text-white focus:outline-none focus:border-amber-500"
          />
        </div>

        <button
          type="submit"
          className="w-full bg-amber-500 hover:bg-amber-400 text-[#0B0F1A] font-bold py-2.5 px-4 rounded text-xs flex items-center justify-center space-x-2 transition cursor-pointer shadow-lg shadow-amber-500/10"
        >
          <Save className="h-4 w-4 font-bold" />
          <span>विवरण सहेजें (Save Profile Details)</span>
        </button>
      </form>
    </div>
  );
}
