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
  const [language, setLanguage] = useState('Hindi'); // Hindi, English, Hinglish
  const [loading, setLoading] = useState(false);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !password || !phone || !businessName) {
      toast.error('कृपया सभी आवश्यक बॉक्स भरें!');
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

      toast.success('अकाउंट सफलतापूर्वक तैयार हो गया है!');
      navigate('/');
    } catch (err: any) {
      toast.error(err.message || 'अकाउंट बनाने में कोई गड़बड़ी हुई। दोबारा प्रयास करें!');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0B0F1A] text-gray-100 flex flex-col justify-center items-center py-10 px-4 select-none selection:bg-amber-500 selection:text-white">
      <div className="w-full max-w-lg bg-gray-900 border border-gray-800 rounded-2xl p-6 md:p-8 space-y-6 shadow-2xl relative overflow-hidden">
        {/* Subtle decorative background glow */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/10 rounded-full blur-2xl pointer-events-none" />

        {/* Brand identity */}
        <div className="text-center space-y-2">
          <div className="inline-flex h-12 w-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 items-center justify-center text-amber-500 shadow-inner">
            <ShieldCheck className="h-7 w-7" />
          </div>
          <h1 className="text-2xl font-extrabold tracking-tight text-white font-sans">
            Bill<span className="text-amber-500">Karo</span>
          </h1>
          <p className="text-xs text-gray-400">
            मजबूत व्यापार का मजबूत डिजिटल बही खाता।
          </p>
        </div>

        {/* Registration form */}
        <form onSubmit={handleRegister} className="space-y-4">
          <h2 className="text-sm font-bold text-amber-500 uppercase tracking-widest border-b border-gray-800 pb-1.5 flex items-center">
            <UserPlus className="h-4.5 w-4.5 mr-1.5" />
            रजिस्ट्रेशन एंड प्रोफाइल सेटअप (Setup Your Ledger)
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Owner Name */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-gray-300 block">मालिक का नाम (Owner Name) *</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-500" />
                <input
                  type="text"
                  required
                  placeholder="अपना शुभ नाम डालें"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-[#0B0F1A] border border-gray-800 focus:border-amber-500 text-xs text-white rounded-xl py-2 pl-9 pr-4 placeholder-gray-600 focus:outline-none transition-colors"
                />
              </div>
            </div>

            {/* Email Address */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-gray-300 block">ईमेल (Email Address) *</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-500" />
                <input
                  type="email"
                  required
                  placeholder="e.g. name@gmail.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-[#0B0F1A] border border-gray-800 focus:border-amber-500 text-xs text-white rounded-xl py-2 pl-9 pr-4 placeholder-gray-600 focus:outline-none transition-colors"
                />
              </div>
            </div>

            {/* Password */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-gray-300 block">पासवर्ड (Password) *</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-500" />
                <input
                  type="password"
                  required
                  placeholder="अंक या अक्षर (Min 6)"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-[#0B0F1A] border border-gray-800 focus:border-amber-500 text-xs text-white rounded-xl py-2 pl-9 pr-4 placeholder-gray-600 focus:outline-none transition-colors"
                />
              </div>
            </div>

            {/* Phone number */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-gray-300 block">मोबाइल नंबर (Mobile No.) *</label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-500" />
                <input
                  type="tel"
                  required
                  placeholder="e.g. 9876543210"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))}
                  className="w-full bg-[#0B0F1A] border border-gray-800 focus:border-amber-500 text-xs text-white rounded-xl py-2 pl-9 pr-4 placeholder-gray-600 focus:outline-none transition-colors"
                />
              </div>
            </div>

            {/* Business name */}
            <div className="space-y-1.5 md:col-span-2">
              <label className="text-xs font-semibold text-gray-300 block">फर्म/दुकान का नाम (Business/Firm Name) *</label>
              <div className="relative">
                <Briefcase className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-500" />
                <input
                  type="text"
                  required
                  placeholder="e.g. Aman Fabrication Works"
                  value={businessName}
                  onChange={(e) => setBusinessName(e.target.value)}
                  className="w-full bg-[#0B0F1A] border border-gray-800 focus:border-amber-500 text-xs text-white rounded-xl py-2 pl-9 pr-4 placeholder-gray-600 focus:outline-none transition-colors"
                />
              </div>
            </div>

            {/* Business type preference */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-gray-300 block flex items-center">
                <Briefcase className="h-3 w-3 mr-1 text-amber-500" /> व्यापार का प्रकार (Business Type)
              </label>
              <select
                value={businessType}
                onChange={(e) => setBusinessType(e.target.value)}
                className="w-full bg-[#0B0F1A] border border-gray-800 text-xs text-white rounded-xl p-2 focus:outline-none focus:border-amber-500"
              >
                <option value="Fabrication">Fabrication Workshop (लोहा/स्टील वर्क्स)</option>
                <option value="Contractor">Civil / Mechanical Contractor (ठेकेदार)</option>
                <option value="Shop">Retail / Wholesale Shop (दुकान)</option>
                <option value="Factory">Manufacturing Unit (फैक्ट्री)</option>
                <option value="Service">Service / Consultancy (सर्विस)</option>
              </select>
            </div>

            {/* Language preference */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-gray-300 block flex items-center">
                <Globe className="h-3 w-3 mr-1 text-amber-500" /> भाषा का माध्यम (Language)
              </label>
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                className="w-full bg-[#0B0F1A] border border-gray-800 text-xs text-white rounded-xl p-2 focus:outline-none focus:border-amber-500"
              >
                <option value="Hindi">हिन्दी (Hindi)</option>
                <option value="English">английский (English)</option>
                <option value="Hinglish">हिंग्लिश (Hinglish)</option>
              </select>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-4 bg-amber-500 hover:bg-amber-600 text-white font-black py-3 rounded-xl text-xs uppercase tracking-wider transition-all shadow-lg hover:shadow-amber-500/20 flex items-center justify-center space-x-2 disabled:bg-gray-800 disabled:text-gray-400 disabled:cursor-not-allowed cursor-pointer"
          >
            {loading ? (
              <span className="animate-pulse">रजिस्ट्रेशन प्रगति पर है...</span>
            ) : (
              <>
                <UserCheck className="h-4 w-4" />
                <span>अकाउंट बनाएं (Create Free Account)</span>
              </>
            )}
          </button>
        </form>

        <div className="text-center pt-2 border-t border-gray-800">
          <p className="text-xs text-gray-400">
            पहले से ही खाता है?{' '}
            <Link to="/signin" className="text-amber-500 hover:underline font-extrabold ml-1">
              यहाँ लॉगइन करें (Sign In)
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
