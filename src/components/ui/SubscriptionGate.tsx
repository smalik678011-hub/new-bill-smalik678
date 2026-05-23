import React, { useState } from 'react';
import useAppStore from '../../store';
import { useNavigate } from 'react-router-dom';
import { Sparkles, Check, ShieldAlert, Award } from 'lucide-react';
import Modal from './Modal';
import Button from './Button';
import toast from 'react-hot-toast';

interface SubscriptionGateProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  featureName?: string;
  mode?: 'block' | 'modal';
  id?: string;
}

export const SubscriptionGate: React.FC<SubscriptionGateProps> = ({
  children,
  fallback,
  featureName = 'Premium Feature',
  mode = 'block',
  id
}) => {
  const { subscription, setSubscription } = useAppStore();
  const navigate = useNavigate();
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const isPremium = subscription === 'PRO' || subscription === 'YEARLY';

  const handleUpgradeClick = async () => {
    setIsLoading(true);
    const loadScript = (): Promise<boolean> => {
      return new Promise((resolve) => {
        if ((window as any).Razorpay) {
          resolve(true);
          return;
        }
        const script = document.createElement('script');
        script.src = 'https://checkout.razorpay.com/v1/checkout.js';
        script.async = true;
        script.onload = () => resolve(true);
        script.onerror = () => resolve(false);
        document.body.appendChild(script);
      });
    };

    await loadScript();
    
    setTimeout(() => {
      setSubscription('PRO');
      setIsLoading(false);
      setShowUpgradeModal(false);
      toast.success('Payment successful! You are now a PRO member.');
      navigate('/settings');
    }, 1200);
  };

  const gateId = id || 'premium-gate';

  const benefits = [
    { en: 'Create Unlimited Invoices & Estimates' },
    { en: 'Add Unlimited Clients & Suppliers' },
    { en: 'Full Stock Inventory & Warehouse Manager' },
    { en: 'Workers Attendance & Dynamic Wage Ledger' },
    { en: 'Digital QR Payment Link & WhatsApp Sharing' }
  ];

  if (isPremium) {
    return <>{children}</>;
  }

  if (fallback) {
    return <>{fallback}</>;
  }

  if (mode === 'block') {
    return (
      <div 
        id={gateId}
        className="border border-amber-500/30 bg-amber-500/5 dark:bg-amber-950/10 rounded-2xl p-6 text-center flex flex-col items-center justify-center max-w-xl mx-auto my-6"
      >
        <div className="p-3 bg-amber-400 text-slate-950 rounded-full shadow-md mb-4 animate-bounce">
          <Sparkles className="w-6 h-6" />
        </div>

        <h3 className="text-base font-black text-slate-800 dark:text-slate-100 flex items-baseline gap-1.5 flex-wrap justify-center">
          <span>👑 Upgrade to Unlock {featureName}</span>
        </h3>

        <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 font-sans max-w-sm">
          This feature is exclusive to BillKaro PRO members. Upgrade now to unlock advanced business ledgers.
        </p>

        <div className="mt-5 flex gap-2.5">
          <Button 
            id={`${gateId}-upgrade-btn`} 
            variant="primary" 
            size="sm" 
            onClick={() => setShowUpgradeModal(true)}
            className="font-bold flex items-center gap-1"
          >
            <Sparkles className="w-4 h-4" />
            <span>Upgrade to PRO</span>
          </Button>

          <Button 
            id={`${gateId}-cancel-btn`}
            variant="ghost" 
            size="sm" 
            onClick={() => navigate('/settings')}
            className="text-xs font-bold"
          >
            Settings
          </Button>
        </div>

        <Modal
          id={`${gateId}-modal`}
          isOpen={showUpgradeModal}
          onClose={() => setShowUpgradeModal(false)}
          title="Become BillKaro PRO"
          size="md"
          footer={
            <div className="flex justify-end gap-2 w-full">
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => setShowUpgradeModal(false)}
                className="font-bold"
              >
                Later
              </Button>
              <Button
                variant="primary"
                size="sm"
                isLoading={isLoading}
                onClick={handleUpgradeClick}
                className="font-black"
              >
                Activate PRO for ₹399/mo
              </Button>
            </div>
          }
        >
          <div className="p-1 space-y-4">
            <div className="flex gap-3 bg-slate-50 dark:bg-slate-950 p-3.5 rounded-xl border border-slate-200/50 dark:border-slate-800 items-start">
              <div className="p-2 bg-amber-100 dark:bg-amber-950 text-amber-600 rounded-lg">
                <Award className="w-5 h-5" />
              </div>
              <div className="flex-1">
                <h4 className="text-xs font-bold text-slate-900 dark:text-slate-50">PRO Membership</h4>
                <p className="text-[10.5px] text-slate-500 font-sans mt-0.5">
                  Unlock premium bahi-khata templates, unlimited accounts, and professional reports.
                </p>
              </div>
            </div>

            <div className="space-y-2.5 pt-2">
              <h5 className="text-xs font-bold text-slate-700 dark:text-slate-300">Included Benefits:</h5>
              <div className="space-y-2">
                {benefits.map((benefit, index) => (
                  <div key={index} className="flex gap-2 items-start text-xs text-slate-600 dark:text-slate-400">
                    <Check className="w-4 h-4 text-emerald-500 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-medium text-slate-800 dark:text-slate-200 font-sans">{benefit.en}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-2 text-[10px] text-slate-400 text-center font-sans tracking-tight">
              Secure online checkout powered by Razorpay. Safe sandbox transaction emulation.
            </div>
          </div>
        </Modal>
      </div>
    );
  }

  return (
    <>
      <div 
        onClick={() => setShowUpgradeModal(true)} 
        className="cursor-pointer hover:opacity-90 relative"
      >
        <div className="absolute top-2 right-2 bg-amber-500 text-slate-950 p-1 rounded-full shadow-md z-12 animate-pulse">
          <Sparkles className="w-3.5 h-3.5" />
        </div>
        <div className="pointer-events-none filter blur-[1.5px] select-none">
          {children}
        </div>
      </div>

      <Modal
        id={`${gateId}-modal-only`}
        isOpen={showUpgradeModal}
        onClose={() => setShowUpgradeModal(false)}
        title="Become BillKaro PRO"
        size="md"
        footer={
          <div className="flex justify-end gap-2 w-full">
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => setShowUpgradeModal(false)}
              className="font-bold"
            >
              Later
            </Button>
            <Button
              variant="primary"
              size="sm"
              isLoading={isLoading}
              onClick={handleUpgradeClick}
              className="font-black"
            >
              Activate PRO (₹399/mo)
            </Button>
          </div>
        }
      >
        <div className="p-1 space-y-4">
          <div className="flex gap-3 bg-slate-50 dark:bg-slate-950 p-3.5 rounded-xl border border-slate-200/50 dark:border-slate-800 items-start">
            <div className="p-2 bg-amber-100 dark:bg-amber-950 text-amber-600 rounded-lg">
              <Award className="w-5 h-5" />
            </div>
            <div className="flex-1">
              <h4 className="text-xs font-bold text-slate-900 dark:text-slate-50">Locked Feature: {featureName}</h4>
              <p className="text-[10.5px] text-slate-500 font-sans mt-0.5">
                Upgrade to unlock this and many other premium utilities.
              </p>
            </div>
          </div>

          <div className="space-y-2.5 pt-2">
            <h5 className="text-xs font-bold text-slate-700 dark:text-slate-300">Included Benefits:</h5>
            <div className="space-y-2">
              {benefits.map((benefit, index) => (
                <div key={index} className="flex gap-2 items-start text-xs text-slate-600 dark:text-slate-400">
                  <Check className="w-4 h-4 text-emerald-500 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium text-slate-800 dark:text-slate-200 font-sans">{benefit.en}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </Modal>
    </>
  );
};

export default SubscriptionGate;
