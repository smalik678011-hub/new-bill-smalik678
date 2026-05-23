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
    <header className="bg-[#0B0F1A] border-b border-gray-800 sticky top-0 z-50 px-3 sm:px-4 py-2.5 sm:py-3 shadow-md">
      <div className="flex items-center justify-between">
        {/* Brand & Active Dhandha */}
        <div className="flex items-center space-x-1.5 sm:space-x-2.5 min-w-0">
          <div className="h-8 w-8 sm:h-9 sm:w-9 rounded-lg bg-amber-500 flex items-center justify-center font-bold text-black shadow-lg shadow-amber-500/20 text-base sm:text-lg shrink-0">
            BK
          </div>
          <div className="min-w-0">
            <h1 className="text-[#F59E0B] font-extrabold text-xs sm:text-base tracking-tight leading-none">
              BillKaro
            </h1>
            <span className="text-[9px] sm:text-[10px] text-gray-400 font-mono font-medium flex items-center mt-0.5 max-w-[65px] sm:max-w-[150px] md:max-w-none truncate">
              <Building className="h-2.5 w-2.5 mr-1 text-amber-500/80 shrink-0" />
              <span className="truncate">{profile.businessName || 'Mera Karobar'}</span>
            </span>
          </div>
        </div>

        {/* Actions & Controllers */}
        <div className="flex items-center space-x-1 sm:space-x-2 min-w-0 shrink-0">
          {/* Subscription Tier Controller */}
          <div className="flex items-center space-x-0.5 sm:space-x-1 bg-gray-900 p-0.5 sm:p-1 rounded-full border border-gray-800">
            <button
              onClick={() => setSubscription('FREE')}
              className={`px-1.5 sm:px-2.5 py-0.5 sm:py-1 rounded-full text-[9px] sm:text-[10px] font-bold transition-all ${
                subscription === 'FREE'
                  ? 'bg-gray-600 text-white'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              FREE
            </button>
            <button
              onClick={() => setSubscription('PRO')}
              className={`px-1.5 sm:px-2.5 py-0.5 sm:py-1 rounded-full text-[9px] sm:text-[10px] font-bold transition-all flex items-center space-x-0.5 ${
                subscription === 'PRO'
                  ? 'bg-amber-500 text-[#0B0F1A]'
                  : 'text-amber-500/80 hover:text-amber-400'
              }`}
            >
              <Zap className="h-2 w-2 sm:h-2.5 sm:w-2.5 fill-current" />
              <span>PRO</span>
            </button>
            <button
              onClick={() => setSubscription('YEARLY')}
              className={`px-1.5 sm:px-2.5 py-0.5 sm:py-1 rounded-full text-[9px] sm:text-[10px] font-bold transition-all flex items-center space-x-0.5 ${
                subscription === 'YEARLY'
                  ? 'bg-emerald-500 text-[#0B0F1A]'
                  : 'text-emerald-400 hover:text-emerald-300'
              }`}
            >
              <ShieldCheck className="h-2 w-2 sm:h-2.5 sm:w-2.5" />
              <span className="hidden sm:inline">{t('साल (₹1499)')}</span>
              <span className="inline sm:hidden">{t('Year')}</span>
            </button>
          </div>

          {/* Floating Language Dropdown */}
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setLangOpen(!langOpen)}
              className="flex items-center space-x-1 sm:space-x-1.5 bg-gray-900 hover:bg-gray-800 text-gray-300 hover:text-white px-2 sm:px-3 py-1 sm:py-1.5 rounded-full border border-gray-800 text-[10px] sm:text-xs font-bold transition-all duration-150 focus:outline-none"
              title="Change Language"
            >
              <Globe className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-amber-500" />
              <span className="text-[9px] sm:text-[10px] uppercase tracking-wider">{getLanguageLabel(language)}</span>
              <ChevronDown className={`h-2.5 w-2.5 sm:h-3 sm:w-3 text-gray-400 transition-transform duration-200 ${langOpen ? 'rotate-180' : ''}`} />
            </button>

            {langOpen && (
              <div 
                className="absolute right-0 mt-2 w-36 rounded-lg bg-[#0F172A] border border-gray-800 shadow-xl z-[100] overflow-hidden py-1 divide-y divide-gray-800/60"
              >
                <div className="px-2.5 py-1 text-[9px] text-gray-500 uppercase tracking-widest font-semibold bg-gray-950/40">
                  Language / भाषा
                </div>
                <button
                  onClick={() => {
                    setLanguage('English');
                    setLangOpen(false);
                  }}
                  className={`w-full text-left px-3 py-2 text-xs flex items-center justify-between transition-colors ${
                    language === 'English'
                      ? 'bg-amber-500/10 text-amber-500 font-semibold'
                      : 'text-gray-300 hover:bg-gray-800 hover:text-white'
                  }`}
                >
                  <span>English</span>
                  {language === 'English' && <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />}
                </button>
                <button
                  onClick={() => {
                    setLanguage('Hindi');
                    setLangOpen(false);
                  }}
                  className={`w-full text-left px-3 py-2 text-xs flex items-center justify-between transition-colors ${
                    language === 'Hindi'
                      ? 'bg-amber-500/10 text-amber-500 font-semibold'
                      : 'text-gray-300 hover:bg-gray-800 hover:text-white'
                  }`}
                >
                  <span>हिंदी (Hindi)</span>
                  {language === 'Hindi' && <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />}
                </button>
                <button
                  onClick={() => {
                    setLanguage('Hinglish');
                    setLangOpen(false);
                  }}
                  className={`w-full text-left px-3 py-2 text-xs flex items-center justify-between transition-colors ${
                    language === 'Hinglish'
                      ? 'bg-amber-500/10 text-amber-500 font-semibold'
                      : 'text-gray-300 hover:bg-gray-800 hover:text-white'
                  }`}
                >
                  <span>Hinglish</span>
                  {language === 'Hinglish' && <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />}
                </button>
              </div>
            )}
          </div>

          {/* Logout Button */}
          <button
            onClick={handleLogout}
            className="flex items-center space-x-1 sm:space-x-1.5 bg-gray-900 hover:bg-red-500/10 text-red-400 hover:text-red-300 px-2 sm:px-3 py-1 sm:py-1.5 rounded-full border border-gray-800 hover:border-red-500/30 text-[10px] sm:text-xs font-bold transition-all duration-150 focus:outline-none cursor-pointer"
            title="Log Out"
          >
            <LogOut className="h-3.5 w-3.5" />
            <span className="text-[10px] uppercase tracking-wider hidden sm:inline">{t('लॉगआउट')}</span>
          </button>
        </div>
      </div>

      {/* Mini notification banner if on free */}
      {subscription === 'FREE' && (
        <div className="mt-2 text-center bg-amber-500/10 border border-amber-500/20 rounded py-1 px-2 flex items-center justify-between">
          <span className="text-[10px] text-amber-500 flex items-center font-medium">
            <Award className="h-3 w-3 mr-1 animate-pulse animate-duration-1000 shrink-0" />
            <span className="truncate ml-1">{t('Free Trial active. Cards may have watermark. Limit: 5 Client maximum.')}</span>
          </span>
          <button 
            onClick={() => setSubscription('PRO')}
            className="text-[9px] bg-amber-500 text-black px-1.5 py-0.5 rounded font-bold hover:bg-amber-400 shrink-0 ml-2"
          >
            {t('Upgrade Now')}
          </button>
        </div>
      )}
    </header>
  );
}
