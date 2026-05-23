import React from 'react';
import { BrowserRouter, Routes, Route, useNavigate } from 'react-router-dom';
import Header from './components/Header';
import Dashboard from './components/Dashboard';
import Clients from './pages/Clients';
import ClientDetail from './pages/ClientDetail';
import NewQuotation from './pages/NewQuotation';
import Invoices from './pages/Invoices';
import ProfitCalculator from './components/profit/ProfitCalculator';
import BusinessCard from './pages/BusinessCard';
import Labour from './pages/Labour';
import Expenses from './pages/Expenses';
import StockInventory from './components/StockInventory';
import Login from './pages/Auth/Login';
import Register from './pages/Auth/Register';
import Settings from './pages/Settings';
import Pricing from './pages/Pricing';
import AppLayout from './components/layout/AppLayout';
import { Toaster } from 'react-hot-toast';
import PWAInstallPrompt from './components/ui/PWAInstallPrompt';
import { LanguageProvider } from './context/LanguageContext';
import { SyncProvider } from './components/SyncProvider';
import { useGlobalDOMTranslator } from './hooks/useTranslation';

function MainAppContent() {
  const navigate = useNavigate();
  useGlobalDOMTranslator();
  
  return (
    <AppLayout>
      <div className="min-h-screen bg-[#0B0F1A] text-gray-100 flex flex-col selection:bg-amber-500 selection:text-white">
        {/* Toast notifications */}
        <Toaster position="top-center" reverseOrder={false} />

        {/* PWA Install Alert Prompter */}
        <PWAInstallPrompt />

        {/* Global Header (Only displayed if not on auth pages) */}
        {window.location.pathname !== '/signin' && window.location.pathname !== '/signup' && (
          <Header />
        )}

        {/* Active router views */}
        <div id="active-viewport" className="animate-fadeIn mt-2">
          <Routes>
            <Route path="/signin" element={<Login />} />
            <Route path="/signup" element={<Register />} />
            
            <Route path="/" element={<Dashboard onNavigate={(tab) => {
              const tabPathMap: Record<string, string> = {
                dashboard: '/',
                clients: '/clients',
                quotations: '/quotations',
                invoices: '/invoices',
                profit: '/profit',
                labour: '/labour',
                expenses: '/expenses',
                'digital-card': '/digital-card',
                stock: '/stock',
                profile: '/settings'
              };
              navigate(tabPathMap[tab] || '/');
            }} />} />
            
            <Route path="/clients" element={<Clients />} />
            <Route path="/clients/:id" element={<ClientDetail />} />
            <Route path="/quotations" element={<NewQuotation />} />
            <Route path="/invoices" element={<Invoices />} />
            <Route path="/profit" element={<ProfitCalculator />} />
            <Route path="/labour" element={<Labour />} />
            <Route path="/expenses" element={<Expenses />} />
            <Route path="/digital-card" element={<BusinessCard />} />
            <Route path="/stock" element={<StockInventory />} />
            <Route path="/profile" element={<Settings />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="/pricing" element={<Pricing />} />
          </Routes>
        </div>
      </div>
    </AppLayout>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <LanguageProvider>
        <SyncProvider>
          <MainAppContent />
        </SyncProvider>
      </LanguageProvider>
    </BrowserRouter>
  );
}
