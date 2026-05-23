import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { toast } from 'react-hot-toast';
import { LogIn, Mail, Lock, ShieldCheck, Chrome } from 'lucide-react';


export default function Login() {

  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error('कृपया ईमेल और पासवर्ड भरें!');
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      toast.success('लॉगइन सफल रहा!');
      // Navigate to dashboard
      navigate('/');
    } catch (err: any) {
      toast.error(err.message || 'लॉगइन में समस्या आई। क्रेडेंशियल चेक करें!');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: window.location.origin,
        },
      });
      if (error) throw error;
    } catch (err: any) {
      toast.error(err.message || 'Google लॉगइन शुरू नहीं हो पाया!');
    }
  };

  return (
    <div className="min-h-screen bg-[#0B0F1A] text-gray-100 flex flex-col justify-center items-center p-4 selection:bg-amber-500 selection:text-black">
      <div className="w-full max-w-md bg-gray-900 border border-gray-800 rounded-2xl p-6 md:p-8 space-y-6 shadow-2xl relative overflow-hidden">
        {/* Subtle decorative background glow */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/10 rounded-full blur-2xl pointer-events-none" />
        
        {/* Brand identity */}
        <div className="text-center space-y-2">
          <div className="inline-flex h-12 w-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 items-center justify-center text-amber-400 shadow-inner">
            <ShieldCheck className="h-7 w-7" />
          </div>
          <h1 className="text-2xl font-extrabold tracking-tight text-white font-sans">
            Bill<span className="text-amber-500">Karo</span>
          </h1>
          <p className="text-xs text-gray-200 font-medium">
            मजबूत व्यापार का मजबूत डिजिटल बही खाता।
          </p>
        </div>

        {/* Login Form */}
        <form onSubmit={handleEmailLogin} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-black text-gray-100 block">ईमेल (Email Address)</label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-300" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="अपना ईमेल डालें (e.g. name@gmail.com)"
                className="w-full bg-[#0B0F1A] border border-gray-700 focus:border-amber-500 text-sm text-white rounded-xl py-2.5 pl-10 pr-4 placeholder-gray-450 focus:outline-none transition-colors"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-black text-gray-100 block">पासवर्ड (Password)</label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-300" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-[#0B0F1A] border border-gray-700 focus:border-amber-500 text-sm text-white rounded-xl py-2.5 pl-10 pr-4 placeholder-gray-450 focus:outline-none transition-colors"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-amber-500 hover:bg-amber-600 text-[#0B0F1A] font-black py-3 rounded-xl text-xs uppercase tracking-wider transition-all shadow-lg hover:shadow-amber-500/25 flex items-center justify-center space-x-2 disabled:bg-gray-800 disabled:text-gray-400 disabled:cursor-not-allowed cursor-pointer"
          >
            {loading ? (
              <span className="animate-pulse">प्रतीक्षा करें...</span>
            ) : (
              <>
                <LogIn className="h-4 w-4" />
                <span>लॉगइन करें (Sign In)</span>
              </>
            )}
          </button>
        </form>

        <div className="relative flex py-2 items-center">
          <div className="flex-grow border-t border-gray-700"></div>
          <span className="flex-shrink mx-4 text-gray-300 text-[10px] uppercase font-mono font-black">अथवा</span>
          <div className="flex-grow border-t border-gray-700"></div>
        </div>

        {/* Google OAuth Login */}
        <button
          onClick={handleGoogleLogin}
          type="button"
          className="w-full bg-white hover:bg-gray-50 border border-gray-300 text-xs font-extrabold text-gray-900 py-3 rounded-xl flex items-center justify-center space-x-2.5 transition cursor-pointer"
        >
          <Chrome className="h-4 w-4" />
          <span>Google के साथ आगे बढ़ें</span>
        </button>

        {/* Signup Link */}
        <div className="text-center pt-2">
          <p className="text-xs text-gray-300">
            नया खाता चाहिए?{' '}
            <Link to="/signup" className="text-amber-400 hover:underline font-black ml-1">
              यहाँ नया अकाउंट बनाएं (Register)
            </Link>
          </p>
        </div>
      </div>

      {/* Visual simple credit */}
      <span className="text-[10px] text-gray-350 font-mono mt-8 uppercase select-none">
        Securely powered by Supabase Authentication
      </span>
    </div>
  );
}
