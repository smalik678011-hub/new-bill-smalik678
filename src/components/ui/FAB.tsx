import React from 'react';
import { motion } from 'motion/react';
import { Plus } from 'lucide-react';

interface FABProps {
  onClick: () => void;
  icon?: React.ReactNode;
  label?: string;
  hindiLabel?: string;
  className?: string;
  id?: string;
}

export const FAB: React.FC<FABProps> = ({
  onClick,
  icon = <Plus className="w-5 h-5 text-slate-950 font-bold" />,
  label,
  hindiLabel,
  className = '',
  id
}) => {
  const fabId = id || 'fab-action-btn';

  return (
    <motion.button
      id={fabId}
      onClick={onClick}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      className={`
        fixed bottom-6 right-6 z-40
        flex items-center gap-2 px-3.5 py-3.5 sm:px-4 sm:py-3.5
        bg-amber-400 hover:bg-amber-500 text-slate-950 
        font-black rounded-full shadow-lg hover:shadow-xl
        transition-shadow duration-250 cursor-pointer
        border border-amber-300
        ${className}
      `}
    >
      {icon}
      
      {(label || hindiLabel) && (
        <span className="max-w-0 overflow-hidden group-hover:max-w-xs sm:max-w-xs transition-all duration-300 flex items-center gap-1 text-xs">
          {label && <span className="font-bold font-sans tracking-tight">{label}</span>}
          {hindiLabel && <span className="text-[10.5px] font-semibold text-slate-900 font-sans">({hindiLabel})</span>}
        </span>
      )}
    </motion.button>
  );
};

export default FAB;
