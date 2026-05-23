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
          
          <div className="bg-white rounded-t-[32px] pt-5 pb-8 px-6 space-y-5 animate-slideUp max-h-[85vh] overflow-y-auto shadow-2xl">
            {/* Header section */}
            <div className="flex items-center justify-between pb-3">
              <div className="flex items-center space-x-2">
                <Sparkles className="h-6 w-6 text-orange-500" />
                <h3 className="font-black text-lg text-gray-900">BillKaro Utilities</h3>
              </div>
              <button 
                onClick={() => setShowMoreMenu(false)}
                className="p-1.5 bg-orange-100 text-orange-600 hover:bg-orange-200 rounded-full cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Grid list of other menu modules */}
            <div className="grid grid-cols-2 gap-4">
              <button
                onClick={() => handleMoreItemNavigate('/quotations')}
                className="flex flex-col items-center space-y-3 bg-white border border-orange-100 p-4 rounded-3xl shadow-sm hover:border-orange-300 text-center transition cursor-pointer"
              >
                <div className="h-12 w-12 bg-orange-500 rounded-2xl flex items-center justify-center text-white">
                  <ClipboardCheck className="h-6 w-6" />
                </div>
                <div>
                  <span className="text-sm font-black text-gray-900 block">एस्टीमेट बही</span>
                  <span className="text-xs text-orange-600 block leading-none mt-1">Quotations</span>
                </div>
              </button>

              <button
                onClick={() => handleMoreItemNavigate('/profit')}
                className="flex flex-col items-center space-y-3 bg-white border border-orange-100 p-4 rounded-3xl shadow-sm hover:border-orange-300 text-center transition cursor-pointer"
              >
                <div className="h-12 w-12 bg-orange-500 rounded-2xl flex items-center justify-center text-white">
                  <Calculator className="h-6 w-6" />
                </div>
                <div>
                  <span className="text-sm font-black text-gray-900 block">प्राइवेट बचत</span>
                  <span className="text-xs text-orange-600 block leading-none mt-1">Marge Profits</span>
                </div>
              </button>

              <button
                onClick={() => handleMoreItemNavigate('/expenses')}
                className="flex flex-col items-center space-y-3 bg-white border border-orange-100 p-4 rounded-3xl shadow-sm hover:border-orange-300 text-center transition cursor-pointer"
              >
                <div className="h-12 w-12 bg-orange-500 rounded-2xl flex items-center justify-center text-white">
                  <TrendingUp className="h-6 w-6" />
                </div>
                <div>
                  <span className="text-sm font-black text-gray-900 block">कमाई-खर्चा</span>
                  <span className="text-xs text-orange-600 block leading-none mt-1">Kamaai Kharcha</span>
                </div>
              </button>

              <button
                onClick={() => handleMoreItemNavigate('/digital-card')}
                className="flex flex-col items-center space-y-3 bg-white border border-orange-100 p-4 rounded-3xl shadow-sm hover:border-orange-300 text-center transition cursor-pointer"
              >
                <div className="h-12 w-12 bg-orange-500 rounded-2xl flex items-center justify-center text-white">
                  <CreditCard className="h-6 w-6" />
                </div>
                <div>
                  <span className="text-sm font-black text-gray-900 block">डिजिटल कार्ड</span>
                  <span className="text-xs text-orange-600 block leading-none mt-1">Visiting Cards</span>
                </div>
              </button>

              <button
                onClick={() => handleMoreItemNavigate('/stock')}
                className="flex flex-col items-center space-y-3 bg-white border border-orange-100 p-4 rounded-3xl shadow-sm hover:border-orange-300 text-center transition cursor-pointer"
              >
                <div className="h-12 w-12 bg-orange-500 rounded-2xl flex items-center justify-center text-white">
                  <Package className="h-6 w-6" />
                </div>
                <div>
                  <span className="text-sm font-black text-gray-900 block">स्टॉक माल</span>
                  <span className="text-xs text-orange-600 block leading-none mt-1">Inventory</span>
                </div>
              </button>

              <button
                onClick={() => handleMoreItemNavigate('/settings')}
                className="flex flex-col items-center space-y-3 bg-white border border-orange-100 p-4 rounded-3xl shadow-sm hover:border-orange-300 text-center transition cursor-pointer"
              >
                <div className="h-12 w-12 bg-orange-500 rounded-2xl flex items-center justify-center text-white">
                  <Building className="h-6 w-6" />
                </div>
                <div>
                  <span className="text-sm font-black text-gray-900 block">सिटिंग्स व प्रोफाइल</span>
                  <span className="text-xs text-orange-600 block leading-none mt-1">Settings Info</span>
                </div>
              </button>
            </div>

            {/* Logout actions layout */}
            <div className="pt-2">
              <button
                onClick={handleLogout}
                className="w-full flex items-center justify-center space-x-2 bg-orange-500 text-white p-4 rounded-[24px] transition cursor-pointer font-black text-sm uppercase shadow-lg shadow-orange-500/30"
              >
                <LogOut className="h-5 w-5" />
                <span>SIGN OUT</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
