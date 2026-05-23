import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import useAppStore from '../store';
import useTranslation from '../hooks/useTranslation';
import { useLanguage } from '../context/LanguageContext';
import { ShieldCheck, Award, Zap, Building, Clock, Globe, ChevronDown, LogOut } from 'lucide-react';
import { supabase } from '../lib/supabase';
import toast from 'react-hot-toast';

export default function Header() {

  const { profile, subscription, setSubscription } = useAppStore();
  const { t } = useTranslation();
  const { language, setLanguage } = useLanguage();
  const [langOpen, setLangOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setLangOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const getLanguageLabel = (lang: string) => {
    switch (lang) {
      case 'English':
        return 'EN';
      case 'Hindi':
        return 'हिं';
      case 'Hinglish':
        return 'HNG';
      default:
        return 'EN';
    }
  };

  const handleLogout = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      toast.success('लॉगआउट सफल रहा!');
      navigate('/signin');
    } catch (err: any) {
      toast.error('लॉगआउट में त्रुटि हुई!');
    }
  };

  return (
    <header className="bg-[#0B0F1A] border-b border-gray-800 sticky top-0 z-50 px-2 sm:px-4 py-2.5 sm:py-3 shadow-md">
      <div className="flex items-center justify-between gap-1.5 ">
        {/* Brand & Active Dhandha */}
        <div className="flex items-center space-x-1.5 sm:space-x-2.5 min-w-0 shrink">
          <div className="h-7 w-7 sm:h-9 sm:w-9 rounded-lg bg-amber-500 flex items-center justify-center font-bold text-white shadow-lg shadow-amber-500/20 text-sm sm:text-lg shrink-0">
            BK
          </div>
          <div className="min-w-0">
            <h1 className="font-black text-[10px] sm:text-base tracking-tighter leading-none text-white transition-colors truncate">
              Bill<span className="text-amber-500">Karo</span>
            </h1>
            <span className="text-[8px] sm:text-[10px] text-gray-400 font-mono font-medium flex items-center mt-0.5 truncate bg-gray-900/40 rounded px-1 max-w-[50px] sm:max-w-none">
              <Building className="h-2 w-2 sm:h-2.5 sm:w-2.5 mr-0.5 sm:mr-1 text-amber-500/80 shrink-0" />
              <span className="truncate">{profile.businessName || 'Mera Karobar'}</span>
            </span>
          </div>
        </div>

        {/* Actions & Controllers */}
        <div className="flex items-center space-x-1 sm:space-x-2 min-w-0 shrink-0">
          {/* Subscription Tier Controller */}
          <div className="flex items-center space-x-0.5 bg-gray-900 p-0.5 sm:p-1 rounded-full border border-gray-800">
            <button
              onClick={() => setSubscription('FREE')}
              className={`px-1.5 sm:px-2.5 py-0.5 sm:py-1 rounded-full text-[8px] sm:text-[10px] font-bold transition-all ${
                subscription === 'FREE'
                  ? 'bg-amber-500 text-white shadow-sm'
                  : 'text-gray-400 hover:text-amber-500'
              }`}
            >
              FREE
            </button>
            <button
              onClick={() => setSubscription('PRO')}
              className={`px-1 sm:px-2 py-0.5 sm:py-1 rounded-full text-[8px] sm:text-[10px] font-bold transition-all flex items-center space-x-0.5 ${
                subscription === 'PRO'
                  ? 'bg-amber-500 text-white shadow-lg shadow-amber-500/20'
                  : 'text-amber-500/80 hover:text-amber-500'
              }`}
            >
              <Zap className="h-2 w-2 sm:h-2.5 sm:w-2.5 fill-current" />
              <span className="hidden xs:inline">PRO</span>
            </button>
            <button
              onClick={() => setSubscription('YEARLY')}
              className={`px-1 sm:px-2 py-0.5 sm:py-1 rounded-full text-[8px] sm:text-[10px] font-bold transition-all flex items-center space-x-0.5 ${
                subscription === 'YEARLY'
                  ? 'bg-amber-600 text-white shadow-lg shadow-amber-600/20'
                  : 'text-emerald-400 hover:text-emerald-500'
              }`}
            >
              <ShieldCheck className="h-2 w-2 sm:h-2.5 sm:w-2.5" />
              <span className="hidden sm:inline">{t('साल (₹1499)')}</span>
              <span className="hidden xs:inline sm:hidden">{t('Year')}</span>
              <span className="inline xs:hidden font-mono">1Y</span>
            </button>
          </div>

          {/* Static English Badge Indicator */}
          <div className="flex items-center space-x-1 bg-indigo-600/10 text-indigo-400 px-2.5 py-1 rounded-full border border-indigo-500/10 text-[9px] sm:text-xxs font-black uppercase tracking-wider">
            <Globe className="h-2.5 w-2.5" />
            <span>English</span>
          </div>

          {/* Logout Button */}
          <button
            onClick={handleLogout}
            className="flex items-center space-x-1 sm:space-x-1.5 bg-indigo-600 hover:bg-indigo-700 text-white px-1 sm:px-3 py-1 sm:py-1.5 rounded-full border border-indigo-700 text-[10px] sm:text-xs font-black transition-all duration-150 focus:outline-none cursor-pointer"
            title="Log Out"
          >
            <LogOut className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-white" />
            <span className="text-[10px] uppercase tracking-wider hidden sm:inline">{t('LOG OUT')}</span>
          </button>
        </div>
      </div>

      {/* Mini notification banner if on free */}
      {subscription === 'FREE' && (
        <div className="mt-2 text-center bg-gray-900 border border-amber-500/30 rounded py-1 px-2.5 flex items-center justify-between shadow-inner overflow-hidden">
          <span className="text-[8px] sm:text-[10px] text-gray-300 flex items-center font-medium min-w-0">
            <Award className="h-2.5 w-2.5 sm:h-3 sm:w-3 mr-1 text-amber-500 animate-pulse animate-duration-1000 shrink-0" />
            <span className="truncate">{t('Free Trial active. Limit: 5 Client maximum.')}</span>
          </span>
          <button 
            onClick={() => setSubscription('PRO')}
            className="text-[8px] sm:text-[9.5px] bg-amber-500 text-white px-2 py-0.5 sm:px-2.5 sm:py-1 rounded font-black hover:bg-amber-600 shrink-0 ml-1.5 shadow-lg shadow-amber-500/20"
          >
            {t('Upgrade')}
          </button>
        </div>
      )}
    </header>
  );
}
