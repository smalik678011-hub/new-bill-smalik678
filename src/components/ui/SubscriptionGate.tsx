import React, { useState } from 'react';
import useAppStore from '../../store';
import { useNavigate } from 'react-router-dom';
import { Sparkles, Check, ShieldAlert, Award, Chrome } from 'lucide-react';
import { motion } from 'motion/react';
import Modal from './Modal';
import Button from './Button';
import toast from 'react-hot-toast';



interface SubscriptionGateProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  featureName?: string;
  hindiFeatureName?: string;
  mode?: 'block' | 'modal';
  id?: string;
}

export const SubscriptionGate: React.FC<SubscriptionGateProps> = ({
  children,
  fallback,
  featureName = 'Premium Feature',
  hindiFeatureName = 'प्रीमियम सेवा',
  mode = 'block',
  id
}) => {
  const { subscription, setSubscription, profile } = useAppStore();
  const navigate = useNavigate();
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const isPremium = subscription === 'PRO' || subscription === 'YEARLY';

  const handleUpgradeClick = async () => {
    setIsLoading(true);
    // Dynamic Razorpay checkout loader
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

    const scriptLoaded = await loadScript();
    
    // Process upgrade
    setTimeout(() => {
      setSubscription('PRO');
      setIsLoading(false);
      setShowUpgradeModal(false);
      toast.success('भुगतान सफल! आप PRO मेम्बर बन गए हैं।');
      navigate('/settings');
    }, 1200);
  };

  const gateId = id || 'premium-gate';

  const benefits = [
    { en: 'Create Unlimited Invoices & Estimates', hi: 'असीमित पक्के टैक्स बिल बनाएं' },
    { en: 'Add Unlimited Clients & Suppliers', hi: 'असीमित ग्राहक एवं सप्लायर जोड़ें' },
    { en: 'Full Stock Inventory & Warehouse Manager', hi: 'संपूर्ण स्टॉक एवं माल का ब्यौरा' },
    { en: 'Workers Attendance & Dynamic Wage Ledger', hi: 'कर्मचारी हाज़िरी व दिहाड़ी रजिस्टर' },
    { en: 'Digital QR Payment Link & WhatsApp Sharing', hi: 'डिजिटल पेमेंट लिंक और व्हाट्सएप शेयर' }
  ];

  if (isPremium) {
    return <>{children}</>;
  }

  // If fallback is provided, use it directly
  if (fallback) {
    return <>{fallback}</>;
  }

  // Render inline card blocking access to the content
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
          <span className="text-xs text-amber-500 font-bold font-sans">({hindiFeatureName})</span>
        </h3>

        <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 font-sans max-w-sm">
          This feature is exclusive to BillKaro PRO members. Upgrade now to unlock advanced business ledgers.
        </p>
        <p className="text-[11px] text-amber-600 font-medium font-sans mt-1">
          यह पक्का फ़ीचर केवल PRO प्लान ग्राहकों के लिए है। अभी अपग्रेड करें।
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
            <span>Upgrade to PRO / अपग्रेड करें</span>
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
          hindiTitle="प्रो मेम्बर बनें 👑"
          size="md"
          footer={
            <div className="flex justify-end gap-2 w-full">
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => setShowUpgradeModal(false)}
                className="font-bold"
              >
                Later / बाद में
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
                <h4 className="text-xs font-bold text-slate-900 dark:text-slate-50">PRO Membership (प्रो सदस्यता)</h4>
                <p className="text-[10.5px] text-slate-500 font-sans mt-0.5">
                  Unlock premium bahi-khata templates, unlimited accounts, and professional reports.
                </p>
              </div>
            </div>

            <div className="space-y-2.5 pt-2">
              <h5 className="text-xs font-bold text-slate-700 dark:text-slate-300">Included Benefits / विशेष सेवाएं:</h5>
              <div className="space-y-2">
                {benefits.map((benefit, index) => (
                  <div key={index} className="flex gap-2 items-start text-xs text-slate-600 dark:text-slate-400">
                    <Check className="w-4 h-4 text-emerald-500 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-medium text-slate-800 dark:text-slate-200 font-sans">{benefit.en}</p>
                      <p className="text-[10.5px] text-amber-600 font-medium font-sans">({benefit.hi})</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-2 text-[10px] text-slate-400 text-center font-sans tracking-tight">
              Secure online checkout powered by Razorpay. Safe sandbox sandbox transaction emulation.
            </div>
          </div>
        </Modal>
      </div>
    );
  }

  // Modal mode: return children but wrap trigger with a payment warning modal on load/click
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
        hindiTitle="प्रो मेम्बर बनें 👑"
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
                ({hindiFeatureName}) — Upgrade to unlock this and many other premium utilities.
              </p>
            </div>
          </div>

          <div className="space-y-2.5 pt-2">
            <h5 className="text-xs font-bold text-slate-700 dark:text-slate-300">Included Benefits / प्रो सेवाएं:</h5>
            <div className="space-y-2">
              {benefits.map((benefit, index) => (
                <div key={index} className="flex gap-2 items-start text-xs text-slate-600 dark:text-slate-400">
                  <Check className="w-4 h-4 text-emerald-500 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium text-slate-800 dark:text-slate-200 font-sans">{benefit.en}</p>
                    <p className="text-[10.5px] text-amber-600 font-bold font-sans">({benefit.hi})</p>
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
