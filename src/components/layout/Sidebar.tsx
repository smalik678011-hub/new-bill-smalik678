import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { useAppStore } from '../../store';
import useTranslation from '../../hooks/useTranslation';
import { 
  LayoutDashboard, 
  Users, 
  ClipboardCheck, 
  FileText, 
  Calculator, 
  UserCheck, 
  TrendingUp, 
  CreditCard, 
  Package, 
  Building, 
  ChevronLeft, 
  ChevronRight, 
  LogOut,
  Sparkles
} from 'lucide-react';
import { toast } from 'react-hot-toast';



export default function Sidebar() {

  const navigate = useNavigate();
  const location = useLocation();
  const currentPath = location.pathname;
  const [collapsed, setCollapsed] = useState(false);
  const { t } = useTranslation();

  const profile = useAppStore((state) => state.profile);
  const subscription = useAppStore((state) => state.subscription);

  const menuItems = [
    { id: 'dashboard', path: '/', label: 'डैशबोर्ड (Overview)', icon: LayoutDashboard },
    { id: 'clients', path: '/clients', label: 'ग्राहक खाता (Clients)', icon: Users },
    { id: 'quotations', path: '/quotations', label: 'एस्टीमेट (Quotations)', icon: ClipboardCheck },
    { id: 'invoices', path: '/invoices', label: 'पक्का बिल (Invoices)', icon: FileText },
    { id: 'profit', path: '/profit', label: 'प्राइवेट बचत (Estimate Margin)', icon: Calculator },
    { id: 'labour', path: '/labour', label: 'हाज़िरी रजिस्टर (Labour Attendance)', icon: UserCheck },
    { id: 'expenses', path: '/expenses', label: 'कमार्इ-खर्चा (Expense Book)', icon: TrendingUp },
    { id: 'digital-card', path: '/digital-card', label: 'डिजिटल कार्ड (Visiting Card)', icon: CreditCard },
    { id: 'stock', path: '/stock', label: 'स्टॉक माल (Inventory)', icon: Package },
    { id: 'profile', path: '/settings', label: 'सेटिंग्स और प्रोफाइल (Settings)', icon: Building },
  ];

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
    <aside 
      className={`hidden md:flex flex-col h-screen sticky top-0 bg-[#1a3a6b] border-r border-gray-800/20 transition-all duration-300 ${
        collapsed ? 'w-20' : 'w-72'
      } z-30 select-none`}
    >
      {/* Brand logo & collapse switch */}
      <div className="flex items-center justify-between p-4 border-b border-gray-800">
        {!collapsed && (
          <div className="flex items-center space-x-2">
            <div className="h-8 w-8 bg-[rgba(255,255,255,0.15)] border border-transparent flex items-center justify-center rounded-xl text-[#FFFFFF]">
              <Sparkles className="h-4.5 w-4.5 text-[#FFFFFF]" />
            </div>
            <span className="font-extrabold tracking-tight text-[#FFFFFF] text-base font-sans">
              Bill<span className="text-[#FFFFFF]">Karo</span>
            </span>
          </div>
        )}
        
        {collapsed && (
          <div className="mx-auto h-8 w-8 bg-[rgba(255,255,255,0.15)] border border-transparent flex items-center justify-center rounded-xl text-[#FFFFFF]">
            <Sparkles className="h-4.5 w-4.5 text-[#FFFFFF]" />
          </div>
        )}

        <button 
          onClick={() => setCollapsed(!collapsed)}
          className="p-1.5 hover:bg-[rgba(255,255,255,0.15)] rounded-lg text-[#FFFFFF] hover:text-[#FFFFFF] transition cursor-pointer"
        >
          {collapsed ? <ChevronRight className="h-4 w-4 text-[#FFFFFF]" /> : <ChevronLeft className="h-4 w-4 text-[#FFFFFF]" />}
        </button>
      </div>

      {/* User profile brief & subscription status */}
      <div className="p-4 border-b border-gray-800 bg-[rgba(255,255,255,0.05)]">
        <div className="flex items-center space-x-3">
          <div className="h-10 w-10 rounded-full bg-gradient-to-tr from-amber-500 to-amber-600 flex items-center justify-center text-[#FFFFFF] font-black text-sm border-2 border-gray-800">
            {profile.ownerName?.charAt(0) || 'B'}
          </div>
          {!collapsed && (
            <div className="flex-1 min-w-0">
              <h4 className="text-xs font-black text-[#FFFFFF] truncate">{profile.ownerName || 'Ledger Owner'}</h4>
              <p className="text-[10px] text-[#FFFFFF] truncate">{profile.businessName || 'Business Name'}</p>
              
              {/* Badge */}
              <div className="flex items-center mt-1">
                <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-bold ${
                  subscription === 'PRO' || subscription === 'YEARLY' 
                    ? 'bg-[#F97316] border border-transparent text-[#FFFFFF]' 
                    : 'bg-gray-800 text-[#FFFFFF] border border-gray-700'
                }`}>
                  {subscription === 'PRO' || subscription === 'YEARLY' ? '⭐ PRO MEMBER' : 'FREE ACCOUNT'}
                </span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Navigation list */}
      <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1 scrollbar-thin">
        {menuItems.map((item) => {
          const isActive = currentPath === item.path;
          return (
            <button
              key={item.id}
              onClick={() => navigate(item.path)}
              className={`w-full flex items-center space-x-3 p-2.5 rounded-xl transition-all cursor-pointer ${
                isActive 
                  ? 'bg-[#F97316] text-[#FFFFFF] border border-transparent font-extrabold shadow-md' 
                  : 'text-[#FFFFFF] hover:bg-[rgba(255,255,255,0.15)] hover:text-[#FFFFFF] border border-transparent'
              }`}
            >
              <item.icon className="h-4.5 w-4.5 text-[#FFFFFF]" />
              {!collapsed && (
                <span className="text-xs font-black truncate text-[#FFFFFF]">{t(item.label)}</span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Logout triggers */}
      <div className="p-4 border-t border-gray-800">
        <button
          onClick={handleLogout}
          className="w-full flex items-center space-x-3 p-2 hover:bg-[rgba(255,255,255,0.15)] hover:text-[#FFFFFF] rounded-xl transition text-[#FFFFFF] cursor-pointer text-left"
        >
          <LogOut className="h-4.5 w-4.5 text-[#FFFFFF]" />
          {!collapsed && (
            <span className="text-xs font-black text-[#FFFFFF]">{t('लॉगआउट (Log Out)')}</span>
          )}
        </button>
      </div>
    </aside>
  );
}
