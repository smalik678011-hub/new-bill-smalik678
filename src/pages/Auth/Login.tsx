import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { toast } from 'react-hot-toast';
import { LogIn, Mail, Lock, ShieldCheck, Chrome, ArrowRight } from 'lucide-react';

export default function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error('Please enter your email and password!');
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      toast.success('Logged in successfully!');
      // Navigate to dashboard
      navigate('/');
    } catch (err: any) {
      toast.error(err.message || 'Login failed. Please check your credentials!');
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
      toast.error(err.message || 'Failed to initialize Google Login!');
    }
  };

  const handleDemoLogin = () => {
    setLoading(true);
    // Use a short delay to simulate high-tech verification
    setTimeout(() => {
      const demoUser = {
        id: 'demo-user-123',
        email: 'demo@billkaro.com',
        user_metadata: { full_name: 'Demo Account' }
      };
      localStorage.setItem('billkaro_demo_user', JSON.stringify(demoUser));
      toast.success('Demo mode logged in successfully! Welcome.');
      navigate('/');
    }, 400);
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-800 flex flex-col justify-center items-center p-4 selection:bg-blue-500/10 selection:text-blue-600">
      <div className="w-full max-w-md bg-[#FFFFFF] border border-slate-200/80 rounded-3xl p-6 md:p-8 space-y-6 shadow-xl relative overflow-hidden">
        {/* Subtle decorative background glow */}
        <div className="absolute top-0 right-0 w-48 h-48 bg-blue-500/5 rounded-full blur-3xl pointer-events-none -mr-16 -mt-16" />
        
        {/* Brand identity */}
        <div className="text-center space-y-2">
          <div className="inline-flex h-12 w-12 rounded-2xl bg-blue-50 border border-blue-100 items-center justify-center text-blue-600 shadow-inner">
            <ShieldCheck className="h-7 w-7" />
          </div>
          <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 font-sans">
            Bill<span className="text-[#0C56D1]">Karo</span>
          </h1>
          <p className="text-xs text-slate-500 font-medium font-sans">
            Smart digital ledger for modern growing businesses.
          </p>
        </div>

        {/* Demo Access Button - High Visibility & Priority */}
        <div className="space-y-3">
          <button
            onClick={handleDemoLogin}
            type="button"
            className="w-full bg-[#0C56D1] hover:bg-[#0b4cb0] border border-blue-700 text-white font-black py-4 rounded-2xl text-sm uppercase tracking-widest transition-all shadow-[0_4px_12px_rgba(12,86,209,0.15)] flex flex-col items-center justify-center group relative overflow-hidden cursor-pointer"
          >
            <div className="absolute inset-0 bg-white/20 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000 ease-in-out" />
            <span className="relative z-10 flex items-center space-x-2">
              <ArrowRight className="h-5 w-5" />
              <span>Explore Demo</span>
            </span>
          </button>
          <p className="text-[10px] text-slate-400 text-center uppercase tracking-tighter">
            Instant Access • No Password Required • Cloud Ready
          </p>
        </div>

        <div className="relative flex py-2 items-center">
          <div className="flex-grow border-t border-slate-100"></div>
          <span className="flex-shrink mx-4 text-slate-400 text-[10px] uppercase font-mono font-black">OR</span>
          <div className="flex-grow border-t border-slate-100"></div>
        </div>

        {/* Login Form */}
        <form onSubmit={handleEmailLogin} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-black text-slate-700 block">Email Address</label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email (e.g. name@gmail.com)"
                className="w-full bg-white border border-slate-200 focus:border-[#0C56D1] text-sm text-slate-800 rounded-xl py-2.5 pl-10 pr-4 placeholder-slate-400 focus:outline-none transition-colors"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-black text-slate-700 block">Password</label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-white border border-slate-200 focus:border-[#0C56D1] text-sm text-slate-800 rounded-xl py-2.5 pl-10 pr-4 placeholder-slate-400 focus:outline-none transition-colors"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#0C56D1] hover:bg-[#0b4cb0] text-white font-black py-3 rounded-xl text-xs uppercase tracking-wider transition-all shadow-md hover:shadow-lg flex items-center justify-center space-x-2 disabled:bg-slate-100 disabled:text-slate-400 disabled:cursor-not-allowed cursor-pointer"
          >
            {loading ? (
              <span className="animate-pulse">Please wait...</span>
            ) : (
              <>
                <LogIn className="h-4 w-4" />
                <span>Sign In</span>
              </>
            )}
          </button>
        </form>

        <div className="relative flex py-2 items-center">
          <div className="flex-grow border-t border-slate-100"></div>
          <span className="flex-shrink mx-4 text-slate-400 text-[10px] uppercase font-mono font-black">OR</span>
          <div className="flex-grow border-t border-slate-100"></div>
        </div>

        {/* Google OAuth Login - Professional Branding */}
        <button
          onClick={handleGoogleLogin}
          type="button"
          className="w-full bg-[#4285F4] hover:bg-[#3367D6] text-white text-xs font-black py-3.5 rounded-xl flex items-center justify-center space-x-3 transition-all shadow-md hover:shadow-lg cursor-pointer border border-[#4285F4]"
        >
          <div className="bg-white p-1 rounded-sm">
            <Chrome className="h-3.5 w-3.5 text-[#4285F4]" />
          </div>
          <span>SIGN IN WITH GOOGLE</span>
        </button>

        {/* Signup Link */}
        <div className="text-center pt-2">
          <p className="text-xs text-slate-600">
            Need an account?{' '}
            <Link to="/signup" className="text-[#0C56D1] hover:underline font-black ml-1">
              Create Free Account (Register)
            </Link>
          </p>
        </div>
      </div>

      {/* Visual simple credit */}
      <span className="text-[10px] text-slate-400 font-mono mt-8 uppercase select-none">
        Securely powered by Supabase Authentication
      </span>
    </div>
  );
}
