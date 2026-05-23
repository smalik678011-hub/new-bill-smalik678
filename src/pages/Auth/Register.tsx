import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { toast } from 'react-hot-toast';
import { UserPlus, Mail, Lock, Phone, User, Briefcase, Globe, ShieldCheck } from 'lucide-react';
import { useAppStore } from '../../store';

export default function Register() {
  const navigate = useNavigate();
  const updateProfile = useAppStore((state) => state.updateProfile);

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [businessName, setBusinessName] = useState('');
  const [businessType, setBusinessType] = useState('Fabrication'); // Contractor, Shop, Factory, Service, Fabrication
  const [language, setLanguage] = useState('English'); // Automatically defaults to English
  const [loading, setLoading] = useState(false);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !password || !phone || !businessName) {
      toast.error('Please fill in all required fields!');
      return;
    }

    setLoading(true);
    try {
      // 1. Supabase Sign Up
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: name,
            phone: phone,
          }
        }
      });

      if (error) throw error;

      const user = data.user;
      if (!user) {
        throw new Error('Registration failed. Please try again.');
      }

      // 2. Local State Sync - Initialize the business profile with standard defaults plus custom register selections
      localStorage.setItem('billkaro_language', language);
      updateProfile({
        businessName: businessName,
        ownerName: name,
        phone: phone,
        address: 'Aligarh, Uttar Pradesh', // default location
        isRegisteredGST: false,
        bankName: '',
        accountNumber: '',
        ifscCode: '',
        upiId: `${phone}@upi`,
        signatureText: name,
        language: language as any,
      });

      // 3. Supabase tables writes (graceful insert of the user & business metadata, handling if Supabase settings are restricted or offline)
      try {
        // Attempt insert in SQL schema if connected fully and schema table available
        // User record insertion
        const { error: userTableErr } = await supabase.from('users').insert([{
          id: user.id,
          email: email,
          name: name,
          plan: 'FREE'
        }]);

        if (!userTableErr) {
          // Business record insertion
          const { data: bData, error: bTableErr } = await supabase.from('profiles').insert([{
            user_id: user.id,
            name: businessName,
            owner: name,
            phone: phone,
            language: language,
            type: businessType,
            address: 'Aligarh, Uttar Pradesh'
          }]).select();

          if (!bTableErr && bData && bData.length > 0) {
            // Link back business_id onto users
            await supabase.from('users').update({ business_id: bData[0].id }).eq('id', user.id);
          }
        }
      } catch (dbErr) {
        console.warn('Supabase DB Schema Tables insertion was bypassed or not ready yet:', dbErr);
      }

      toast.success('Account created successfully!');
      navigate('/');
    } catch (err: any) {
      toast.error(err.message || 'Failed to create account. Please try again!');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-800 flex flex-col justify-center items-center py-10 px-4 select-none selection:bg-blue-500/10 selection:text-blue-600">
      <div className="w-full max-w-lg bg-[#FFFFFF] border border-slate-200/80 rounded-3xl p-6 md:p-8 space-y-6 shadow-xl relative overflow-hidden">
        {/* Subtle decorative background glow */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 rounded-full blur-2xl pointer-events-none" />

        {/* Brand identity */}
        <div className="text-center space-y-2">
          <div className="inline-flex h-12 w-12 rounded-2xl bg-blue-50 border border-blue-100 items-center justify-center text-blue-600 shadow-inner">
            <ShieldCheck className="h-7 w-7" />
          </div>
          <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 font-sans">
            Bill<span className="text-[#0C56D1]">Karo</span>
          </h1>
          <p className="text-xs text-slate-500 font-sans">
            Smart digital ledger for modern growing businesses.
          </p>
        </div>

        {/* Registration form */}
        <form onSubmit={handleRegister} className="space-y-4">
          <h2 className="text-sm font-bold text-[#0C56D1] uppercase tracking-widest border-b border-slate-100 pb-1.5 flex items-center font-sans">
            <UserPlus className="h-4.5 w-4.5 mr-1.5" />
            Profile Registration & Shop Setup
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Owner Name */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-600 block">Owner Name *</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                <input
                  type="text"
                  required
                  placeholder="Enter your full name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-white border border-slate-200 focus:border-[#0C56D1] text-xs text-slate-800 rounded-xl py-2 pl-9 pr-4 placeholder-slate-400 focus:outline-none transition-colors"
                />
              </div>
            </div>

            {/* Email Address */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-600 block">Email Address *</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                <input
                  type="email"
                  required
                  placeholder="e.g. name@gmail.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-white border border-slate-200 focus:border-[#0C56D1] text-xs text-slate-800 rounded-xl py-2 pl-9 pr-4 placeholder-slate-400 focus:outline-none transition-colors"
                />
              </div>
            </div>

            {/* Password */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-600 block">Password *</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                <input
                  type="password"
                  required
                  placeholder="Minimum 6 characters"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-white border border-slate-200 focus:border-[#0C56D1] text-xs text-slate-800 rounded-xl py-2 pl-9 pr-4 placeholder-slate-400 focus:outline-none transition-colors"
                />
              </div>
            </div>

            {/* Phone number */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-600 block">Mobile Number *</label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                <input
                  type="tel"
                  required
                  placeholder="e.g. 9876543210"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))}
                  className="w-full bg-white border border-slate-200 focus:border-[#0C56D1] text-xs text-slate-800 rounded-xl py-2 pl-9 pr-4 placeholder-slate-400 focus:outline-none transition-colors"
                />
              </div>
            </div>

            {/* Business name */}
            <div className="space-y-1.5 md:col-span-2">
              <label className="text-xs font-semibold text-slate-600 block">Business/Firm Name *</label>
              <div className="relative">
                <Briefcase className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                <input
                  type="text"
                  required
                  placeholder="e.g. Aman Fabrication Works"
                  value={businessName}
                  onChange={(e) => setBusinessName(e.target.value)}
                  className="w-full bg-white border border-slate-200 focus:border-[#0C56D1] text-xs text-slate-800 rounded-xl py-2 pl-9 pr-4 placeholder-slate-400 focus:outline-none transition-colors"
                />
              </div>
            </div>

            {/* Business type preference */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-600 block flex items-center">
                <Briefcase className="h-3 w-3 mr-1 text-[#0C56D1]" /> Business Type
              </label>
              <select
                value={businessType}
                onChange={(e) => setBusinessType(e.target.value)}
                className="w-full bg-white border border-slate-200 text-xs text-slate-800 rounded-xl p-2 focus:outline-none focus:border-[#0C56D1]"
              >
                <option value="Fabrication">Fabrication Workshop</option>
                <option value="Contractor">Civil / Mechanical Contractor</option>
                <option value="Shop">Retail / Wholesale Shop</option>
                <option value="Factory">Manufacturing Unit</option>
                <option value="Service">Service / Consultancy</option>
              </select>
            </div>

            {/* Lock preference banner */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-600 block flex items-center">
                <Globe className="h-3 w-3 mr-1 text-[#0C56D1]" /> Default Language
              </label>
              <div className="w-full bg-blue-50/50 border border-blue-100 text-xs text-[#0C56D1] rounded-xl p-2.5 font-bold uppercase tracking-wider select-none">
                🇺🇸 English NATIVE
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-4 bg-[#0C56D1] hover:bg-[#0b4cb0] text-white font-black py-3 rounded-xl text-xs uppercase tracking-wider transition-all shadow-md hover:shadow-lg flex items-center justify-center space-x-2 disabled:bg-slate-100 disabled:text-slate-400 disabled:cursor-not-allowed cursor-pointer"
          >
            {loading ? (
              <span className="animate-pulse">Registering account...</span>
            ) : (
              <>
                <UserCheck className="h-4 w-4" />
                <span>Create Free Account</span>
              </>
            )}
          </button>
        </form>

        <div className="text-center pt-2 border-t border-slate-100">
          <p className="text-xs text-slate-600">
            Already have an account?{' '}
            <Link to="/signin" className="text-[#0C56D1] hover:underline font-extrabold ml-1 font-sans">
              Sign In Here
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

function UserCheck(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <polyline points="16 11 18 13 22 9" />
    </svg>
  );
}
