import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X } from 'lucide-react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  hindiTitle?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  id?: string;
}

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  hindiTitle,
  children,
  footer,
  size = 'md',
  id
}) => {
  // Prevent body scrolling when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  const sizeClasses = {
    sm: 'sm:max-w-sm',
    md: 'sm:max-w-md',
    lg: 'sm:max-w-lg',
    xl: 'sm:max-w-xl'
  };

  const modalId = id || 'custom-modal';

  return (
    <AnimatePresence>
      {isOpen && (
        <div id={modalId} className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
          {/* Backdrop Blur Overlay */}
          <motion.div
            id={`${modalId}-backdrop`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity"
          />

          {/* Modal / Bottom Sheet Box */}
          <motion.div
            id={`${modalId}-content`}
            aria-modal="true"
            role="dialog"
            initial={{ 
              opacity: 0, 
              y: window.innerWidth < 640 ? '100%' : 20, 
              scale: window.innerWidth < 640 ? 1 : 0.95 
            }}
            animate={{ 
              opacity: 1, 
              y: 0, 
              scale: 1 
            }}
            exit={{ 
              opacity: 0, 
              y: window.innerWidth < 640 ? '100%' : 20, 
              scale: window.innerWidth < 640 ? 1 : 0.95 
            }}
            transition={{ type: 'spring', damping: 25, stiffness: 350 }}
            className={`
              relative w-full bg-white dark:bg-slate-900 
              rounded-t-2xl sm:rounded-2xl shadow-xl z-50
              flex flex-col max-h-[90vh] sm:max-h-[85vh]
              border border-slate-100 dark:border-slate-800
              ${sizeClasses[size]}
            `}
          >
            {/* Horizontal handle bar on mobile view */}
            <div className="flex sm:hidden justify-center py-2">
              <div className="w-10 h-1 bg-slate-300 dark:bg-slate-700 rounded-full" />
            </div>

            {/* Header section */}
            <div className="flex items-center justify-between px-4 pb-3 pt-2 sm:pt-4 border-b border-slate-100 dark:border-slate-800">
              <div className="flex flex-col">
                <h3 className="text-sm font-black text-slate-900 dark:text-slate-50 flex flex-wrap items-baseline gap-1.5">
                  {title && <span className="font-sans font-bold text-[15px]">{title}</span>}
                  {hindiTitle && <span className="text-xs text-amber-600 font-bold font-sans">({hindiTitle})</span>}
                </h3>
              </div>
              <button
                id={`${modalId}-close-btn`}
                onClick={onClose}
                className="p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Body contents scrollable */}
            <div className="flex-1 overflow-y-auto p-4 text-slate-800 dark:text-slate-200 text-sm">
              {children}
            </div>

            {/* Footer section if provided */}
            {footer && (
              <div className="px-4 py-3 bg-slate-55 dark:bg-slate-950 rounded-b-2xl border-t border-slate-100 dark:border-slate-800 flex justify-end gap-2 items-center">
                {footer}
              </div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default Modal;
