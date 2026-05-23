import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import Sidebar from './Sidebar';
import BottomNav from './BottomNav';
import { 
  Building, 
  ClipboardCheck, 
  Calculator, 
  TrendingUp, 
  CreditCard, 
  Package, 
  X, 
  LogOut, 
  CheckCircle2, 
  Sparkles
} from 'lucide-react';
import { toast } from 'react-hot-toast';


interface AppLayoutProps {
  children: React.ReactNode;
}

export default function AppLayout({ children }: AppLayoutProps) {

  const navigate = useNavigate();
  const location = useLocation();
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showMoreMenu, setShowMoreMenu] = useState(false);

  useEffect(() => {
    // Check for demo mode session first
    const demoUser = localStorage.getItem('billkaro_demo_user');
    if (demoUser) {
      setSession({ user: JSON.parse(demoUser) });
      setLoading(false);
      return;
    }

    // 1. Get current active session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        setSession(session);
      }
      setLoading(false);
    });

    // 2. Listen for active subscription/auth mutations
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      // Only clear session if not in demo mode
      if (!localStorage.getItem('billkaro_demo_user')) {
        setSession(session);
      }
      setLoading(false);
    });

    return () => {
      subscription?.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (!loading) {
      const isAuthPage = location.pathname === '/signin' || location.pathname === '/signup';
      if (!session && !isAuthPage) {
        navigate('/signin', { replace: true });
      } else if (session && isAuthPage) {
        navigate('/', { replace: true });
      }
    }
  }, [session, loading, location.pathname, navigate]);

  const handleLogout = async () => {
    setShowMoreMenu(false);
    localStorage.removeItem('billkaro_demo_user');
    try {
      await supabase.auth.signOut();
      toast.success('लॉगआउट सफल रहा!');
      navigate('/signin');
    } catch (err) {
      // Still navigate and clean up locally even if sign out fails
      navigate('/signin');
    }
  };

  // Skip layouts if hitting authentication screens
  const isAuthPage = location.pathname === '/signin' || location.pathname === '/signup';

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0B0F1A] flex flex-col justify-center items-center font-sans">
        <div className="h-10 w-10 border-4 border-amber-500/20 border-t-amber-500 rounded-full animate-spin mb-4" />
        <span className="text-gray-400 text-sm font-black animate-pulse">BillKaro लोड हो रहा है...</span>
      </div>
    );
  }

  if (isAuthPage) {
    return <>{children}</>;
  }

  const handleMoreItemNavigate = (path: string) => {
    setShowMoreMenu(false);
    navigate(path);
  };

  return (
    <div className="min-h-screen bg-[#0B0F1A] text-gray-100 flex flex-col md:flex-row relative">
      {/* 1. Desktop Sidebar */}
      <Sidebar />

      {/* 2. Main content area */}
      <div className="flex-1 flex flex-col min-w-0 pb-20 md:pb-0 overflow-y-auto max-h-screen">
        {/* Content viewer */}
        <main className="p-4 max-w-5xl w-full mx-auto animate-fadeIn">
          {children}
        </main>
      </div>

      {/* 3. Mobile Bottom navigation */}
      <BottomNav onMoreClick={() => setShowMoreMenu(true)} />

      {/* More menu drawer bottom overlay */}
      {showMoreMenu && (
        <div className="fixed inset-0 z-50 bg-[#0B0F1A]/90 md:hidden flex flex-col justify-end">
          {/* Backdrop click closer */}
          <div className="flex-1" onClick={() => setShowMoreMenu(false)} />
          
          <div className="bg-gray-900 border-t border-gray-800 rounded-t-3xl pt-5 pb-8 px-6 space-y-5 animate-slideUp max-h-[85vh] overflow-y-auto shadow-2xl">
            {/* Header section */}
            <div className="flex items-center justify-between pb-3 border-b border-gray-800">
              <div className="flex items-center space-x-2">
                <Sparkles className="h-5 w-5 text-amber-500" />
                <h3 className="font-extrabold text-sm text-gray-200">अन्य जरूरी टूल्स (BillKaro Utilities)</h3>
              </div>
              <button 
                onClick={() => setShowMoreMenu(false)}
                className="p-1 text-gray-400 hover:text-white hover:bg-gray-800 rounded-full cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Grid list of other menu modules */}
            <div className="grid grid-cols-2 gap-3.5">
              <button
                onClick={() => handleMoreItemNavigate('/quotations')}
                className="flex items-center space-x-3 bg-gray-950/70 border border-gray-850 p-3.5 rounded-2xl hover:border-amber-500/40 text-left transition cursor-pointer"
              >
                <div className="h-9 w-9 bg-amber-500/10 rounded-xl flex items-center justify-center text-amber-500">
                  <ClipboardCheck className="h-5 w-5" />
                </div>
                <div>
                  <span className="text-xs font-black text-gray-200 block">एस्टीमेट बही</span>
                  <span className="text-[9.5px] text-gray-500 block leading-none mt-0.5">Quotations</span>
                </div>
              </button>

              <button
                onClick={() => handleMoreItemNavigate('/profit')}
                className="flex items-center space-x-3 bg-gray-950/70 border border-gray-850 p-3.5 rounded-2xl hover:border-amber-500/40 text-left transition cursor-pointer"
              >
                <div className="h-9 w-9 bg-emerald-500/10 rounded-xl flex items-center justify-center text-emerald-400">
                  <Calculator className="h-5 w-5" />
                </div>
                <div>
                  <span className="text-xs font-black text-gray-200 block">प्राइवेट बचत</span>
                  <span className="text-[9.5px] text-gray-500 block leading-none mt-0.5">Marge Profits</span>
                </div>
              </button>

              <button
                onClick={() => handleMoreItemNavigate('/expenses')}
                className="flex items-center space-x-3 bg-gray-950/70 border border-gray-850 p-3.5 rounded-2xl hover:border-amber-500/40 text-left transition cursor-pointer"
              >
                <div className="h-9 w-9 bg-cyan-500/10 rounded-xl flex items-center justify-center text-cyan-400">
                  <TrendingUp className="h-5 w-5" />
                </div>
                <div>
                  <span className="text-xs font-black text-gray-200 block">कमाई-खर्चा</span>
                  <span className="text-[9.5px] text-gray-500 block leading-none mt-0.5">Kamaai Kharcha</span>
                </div>
              </button>

              <button
                onClick={() => handleMoreItemNavigate('/digital-card')}
                className="flex items-center space-x-3 bg-gray-950/70 border border-gray-850 p-3.5 rounded-2xl hover:border-amber-500/40 text-left transition cursor-pointer"
              >
                <div className="h-9 w-9 bg-purple-500/10 rounded-xl flex items-center justify-center text-purple-400">
                  <CreditCard className="h-5 w-5" />
                </div>
                <div>
                  <span className="text-xs font-black text-gray-200 block">डिजिटल कार्ड</span>
                  <span className="text-[9.5px] text-gray-500 block leading-none mt-0.5">Visiting Cards</span>
                </div>
              </button>

              <button
                onClick={() => handleMoreItemNavigate('/stock')}
                className="flex items-center space-x-3 bg-gray-950/70 border border-gray-850 p-3.5 rounded-2xl hover:border-amber-500/40 text-left transition cursor-pointer"
              >
                <div className="h-9 w-9 bg-amber-500/10 rounded-xl flex items-center justify-center text-amber-500">
                  <Package className="h-5 w-5" />
                </div>
                <div>
                  <span className="text-xs font-black text-gray-200 block">स्टॉक माल</span>
                  <span className="text-[9.5px] text-gray-500 block leading-none mt-0.5">Inventory</span>
                </div>
              </button>

              <button
                onClick={() => handleMoreItemNavigate('/settings')}
                className="flex items-center space-x-3 bg-gray-950/70 border border-gray-850 p-3.5 rounded-2xl hover:border-amber-500/40 text-left transition cursor-pointer"
              >
                <div className="h-9 w-9 bg-gray-600/10 rounded-xl flex items-center justify-center text-gray-300">
                  <Building className="h-5 w-5" />
                </div>
                <div>
                  <span className="text-xs font-black text-gray-200 block">सिटिंग्स व प्रोफाइल</span>
                  <span className="text-[9.5px] text-gray-500 block leading-none mt-0.5">Settings Info</span>
                </div>
              </button>
            </div>

            {/* Logout actions layout */}
            <div className="pt-2">
              <button
                onClick={handleLogout}
                className="w-full flex items-center justify-center space-x-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/10 p-3.5 rounded-xl transition cursor-pointer font-black text-xs uppercase"
              >
                <LogOut className="h-4.5 w-4.5" />
                <span>लॉगआउट करें (Sign Out)</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
