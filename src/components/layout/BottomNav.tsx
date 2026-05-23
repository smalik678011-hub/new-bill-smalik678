import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import useTranslation from '../../hooks/useTranslation';
import { 


  LayoutDashboard, 
  Users, 
  FileText, 
  UserCheck, 
  Menu 
} from 'lucide-react';

interface BottomNavProps {
  onMoreClick: () => void;
}

export default function BottomNav({ onMoreClick }: BottomNavProps) {

  const navigate = useNavigate();
  const location = useLocation();
  const currentPath = location.pathname;
  const { t } = useTranslation();

  const menuItems = [
    { id: 'dashboard', path: '/', label: 'Dashboard', sub: 'Home', icon: LayoutDashboard },
    { id: 'clients', path: '/clients', label: 'Clients', sub: 'Clients', icon: Users },
    { id: 'invoices', path: '/invoices', label: 'Invoices', sub: 'Invoices', icon: FileText },
    { id: 'labour', path: '/labour', label: 'Labour', sub: 'Labour', icon: UserCheck },
  ];

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-gray-950/95 border-t border-gray-800/80 backdrop-blur-md pb-safe">
      <div className="grid grid-cols-5 h-16 max-w-lg mx-auto">
        {menuItems.map((item) => {
          const isActive = currentPath === item.path;
          return (
            <button
              key={item.id}
              onClick={() => navigate(item.path)}
              className={`flex flex-col items-center justify-center transition-all cursor-pointer ${
                isActive 
                  ? 'text-amber-500 font-extrabold scale-105' 
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              <item.icon className={`h-5 w-5 mb-1 ${isActive ? 'stroke-[2.5px]' : 'stroke-[2px]'}`} />
              <span className="text-[9.5px] leading-tight block font-black truncate max-w-full">
                {item.label}
              </span>
            </button>
          );
        })}

        {/* 'More' Actions Button */}
        <button
          onClick={onMoreClick}
          className="flex flex-col items-center justify-center text-gray-400 hover:text-white cursor-pointer"
        >
          <Menu className="h-5 w-5 mb-1 text-amber-500" />
          <span className="text-[9.5px] font-black leading-tight block">
            More
          </span>
        </button>
      </div>
    </div>
  );
}
