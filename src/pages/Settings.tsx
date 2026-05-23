import React, { useState } from 'react';
import useAppStore from '../store';
import { Building, CreditCard, ShieldCheck, Key, Lock, PhoneCall, HelpCircle, Check, Languages } from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';

import BusinessProfile from '../components/settings/BusinessProfile';
import SubscriptionStatus from '../components/settings/SubscriptionStatus';


export default function Settings() {

  const { profitPin, updateProfitPin, subscription } = useAppStore();

  const [activeTab, setActiveTab] = useState<'profile' | 'billing' | 'security'>('profile');

  // PIN security states
  const [currentPin, setCurrentPin] = useState('');
  const [newPinVal, setNewPinVal] = useState('');
  const [confirmNewPinVal, setConfirmNewPinVal] = useState('');

  const handleUpdatePin = (e: React.FormEvent) => {
    e.preventDefault();
    if (currentPin !== profitPin) {
      toast.error('Incorrect Current PIN!');
      return;
    }

    if (newPinVal.length < 4 || !/^\d+$/.test(newPinVal)) {
      toast.error('New PIN must be exactly 4 digits!');
      return;
    }

    if (newPinVal !== confirmNewPinVal) {
      toast.error('New PIN and Confirm PIN do not match!');
      return;
    }

    updateProfitPin(newPinVal);
    toast.success('Security PIN updated successfully!');
    setCurrentPin('');
    setNewPinVal('');
    setConfirmNewPinVal('');
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-2 pb-20 space-y-6 select-none animate-fadeIn">
      <Toaster position="top-center" />

      {/* Settings Screen Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-gray-900 border border-gray-800 p-5 rounded-3xl gap-4 shadow-lg">
        <div className="flex items-center space-x-3">
          <div className="h-10 w-10 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-500">
            <Building className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-sm font-black text-gray-100 uppercase tracking-wide">
              Settings & Choice <span className="text-xs text-amber-500 font-mono">(Business Settings Hub)</span>
            </h1>
            <p className="text-xs text-gray-450 mt-0.5">
              Manage your business profile, membership plan, and private ledger security PIN.
            </p>
          </div>
        </div>
      </div>

      {/* Roster tab buttons bar */}
      <div className="flex bg-[#0d121f] p-1.5 rounded-2xl border border-gray-800 w-full overflow-x-auto">
        <button
          onClick={() => setActiveTab('profile')}
          className={`flex-1 px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition cursor-pointer flex items-center justify-center space-x-1.5 ${
            activeTab === 'profile' ? 'bg-amber-500 text-white font-extrabold shadow-md' : 'text-gray-400 hover:text-white'
          }`}
        >
          <Building className="h-4 w-4 shrink-0" />
          <span>🏢 Business Profile</span>
        </button>

        <button
          onClick={() => setActiveTab('billing')}
          className={`flex-1 px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition cursor-pointer flex items-center justify-center space-x-1.5 ${
            activeTab === 'billing' ? 'bg-amber-500 text-white font-extrabold shadow-md' : 'text-gray-400 hover:text-white'
          }`}
        >
          <CreditCard className="h-4 w-4 shrink-0" />
          <span>💳 Plans & Limits</span>
        </button>

        <button
          onClick={() => setActiveTab('security')}
          className={`flex-1 px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition cursor-pointer flex items-center justify-center space-x-1.5 ${
            activeTab === 'security' ? 'bg-amber-500 text-white font-extrabold shadow-md' : 'text-gray-400 hover:text-white'
          }`}
        >
          <Lock className="h-4 w-4 shrink-0" />
          <span>🔒 Safety PIN Lock</span>
        </button>
      </div>

      {/* Router rendering blocks */}
      <div className="mt-4">
        {activeTab === 'profile' && (
          <BusinessProfile />
        )}

        {activeTab === 'billing' && (
          <SubscriptionStatus />
        )}

        {activeTab === 'security' && (
          <div className="bg-gray-950 border border-gray-850 p-6 rounded-3xl space-y-5 animate-fadeIn">
            
            {/* Header Lock */}
            <div className="flex items-center space-x-2 border-b border-gray-900 pb-3">
              <Lock className="h-5 w-5 text-amber-500" />
              <div>
                <h4 className="text-xs font-black text-white uppercase">Private Profit Ledger PIN Security</h4>
                <p className="text-[10px] text-gray-500 mt-0.5">Please fill out the form below to update your Private Margin / Profit Ledger security lock PIN.</p>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              
              {/* Form changing segment */}
              <form onSubmit={handleUpdatePin} className="lg:col-span-2 space-y-4">
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div>
                    <label className="text-[10px] text-gray-400 uppercase font-black block mb-1">Current PIN *</label>
                    <input 
                      type="password" 
                      maxLength={4}
                      required
                      placeholder="e.g. 1234"
                      value={currentPin}
                      onChange={e => setCurrentPin(e.target.value.replace(/\D/g, ''))}
                      className="w-full bg-[#0B0F1A] border border-gray-800 rounded-xl p-2.5 text-xs text-white text-center font-mono focus:outline-none focus:border-amber-500"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] text-gray-400 uppercase font-black block mb-1">New 4-Digit Security PIN *</label>
                    <input 
                      type="password" 
                      maxLength={4}
                      required
                      placeholder="e.g. 9999"
                      value={newPinVal}
                      onChange={e => setNewPinVal(e.target.value.replace(/\D/g, ''))}
                      className="w-full bg-[#0B0F1A] border border-gray-800 rounded-xl p-2.5 text-xs text-white text-center font-mono focus:outline-none focus:border-amber-500"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] text-gray-400 uppercase font-black block mb-1">Confirm New PIN *</label>
                    <input 
                      type="password" 
                      maxLength={4}
                      required
                      placeholder="e.g. 9999"
                      value={confirmNewPinVal}
                      onChange={e => setConfirmNewPinVal(e.target.value.replace(/\D/g, ''))}
                      className="w-full bg-[#0B0F1A] border border-gray-800 rounded-xl p-2.5 text-xs text-white text-center font-mono focus:outline-none focus:border-amber-500"
                    />
                  </div>
                </div>

                <div className="flex justify-end pt-2">
                  <button
                    type="submit"
                    className="bg-amber-500 hover:bg-amber-400 text-white px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider flex items-center space-x-1.5 transition cursor-pointer font-mono"
                  >
                    <Check className="h-4.5 w-4.5" />
                    <span>Update Security PIN</span>
                  </button>
                </div>

              </form>

              {/* Informative helper sidebar */}
              <div className="bg-[#0e1322] border border-gray-850 p-4 rounded-2xl space-y-2 text-[11px] text-gray-300 leading-relaxed">
                <span className="text-[10px] font-black uppercase text-amber-500 block tracking-wider">Where is this PIN used?</span>
                <p>
                  This safety PIN is requested when you open your Private Estimate Margin / Profit Ledger. It ensures that in your absence, no staff, workers, or clients can view your actual business savings, margins, or profits.
                </p>
                <div className="bg-gray-950 p-2.5 rounded-xl text-[10px] border border-gray-900 font-mono text-gray-500 mt-2">
                  Default Initial PIN: <b>1234</b>
                </div>
              </div>

            </div>

          </div>
        )}
      </div>

    </div>
  );
}
