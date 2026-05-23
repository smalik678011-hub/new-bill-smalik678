import React, { useState, useEffect } from 'react';
import { ArrowDownToLine, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import Button from './Button';



export const PWAInstallPrompt: React.FC = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const handler = (e: Event) => {
      // Prevent Chrome 67 and earlier from automatically showing the prompt
      e.preventDefault();
      // Stash the event so it can be triggered later
      setDeferredPrompt(e);
      // Show the install button/banner
      setIsVisible(true);
    };

    window.addEventListener('beforeinstallprompt', handler);

    // If the app is already installed, or in standalone mode, hide
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsVisible(false);
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handler);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    
    // Show the install prompt
    deferredPrompt.prompt();
    
    // Wait for the user to respond to the prompt
    const { outcome } = await deferredPrompt.userChoice;
    console.log(`User response to install response: ${outcome}`);
    
    // Clear the deferred prompt variable
    setDeferredPrompt(null);
    setIsVisible(false);
  };

  const handleClose = () => {
    setIsVisible(false);
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, y: 50, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 50, scale: 0.95 }}
          className="fixed bottom-24 left-4 right-4 md:left-auto md:right-6 md:max-w-xs bg-slate-900 border border-amber-500/30 text-white p-4 rounded-2xl shadow-2xl z-40 flex items-center gap-4"
        >
          <div className="p-2.5 bg-amber-500 text-slate-950 rounded-xl">
            <ArrowDownToLine className="w-5 h-5 animate-bounce" />
          </div>

          <div className="flex-1 min-w-0">
            <h4 className="text-xs font-black text-white flex items-center gap-1.5 flex-wrap">
              <span>Install BillKaro App</span>
            </h4>
            <p className="text-[10px] text-slate-400 font-sans mt-0.5 leading-snug">
              Fast, modern invoice creator ledger directly on your home screen!
            </p>
          </div>

          <div className="flex flex-col gap-1 shrink-0">
            <Button
              variant="primary"
              size="sm"
              onClick={handleInstallClick}
              className="text-[11px] font-black px-2.5 py-1.5"
            >
              Install
            </Button>
            <button
              onClick={handleClose}
              className="text-[10px] text-slate-500 hover:text-white font-bold cursor-pointer text-center mt-1"
            >
              Later
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default PWAInstallPrompt;
