import React from 'react';
import { PackageOpen } from 'lucide-react';
import Button from './Button';


interface EmptyStateProps {
  title?: string;
  hindiTitle?: string;
  description?: string;
  hindiDescription?: string;
  actionLabel?: string;
  hindiActionLabel?: string;
  onActionClick?: () => void;
  icon?: React.ReactNode;
  id?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  title = 'No records found',
  hindiTitle = 'कोई विवरण नहीं मिला',
  description = 'Add your first item helper records to see details here.',
  hindiDescription = 'नया विवरण जोड़ने के लिए नीचे दिए गए बटन का उपयोग करें।',
  actionLabel,
  hindiActionLabel,
  onActionClick,
  icon = <PackageOpen className="w-12 h-12 text-slate-300 dark:text-slate-700" />,
  id
}) => {
  const compId = id || 'empty-state';

  return (
    <div
      id={compId}
      className="flex flex-col items-center justify-center text-center p-8 sm:p-12 border border-slate-100 dark:border-slate-800/65 rounded-2xl bg-slate-50/50 dark:bg-slate-900/10"
    >
      <div className="p-3 bg-white dark:bg-slate-900 rounded-full border border-slate-200/50 dark:border-slate-850 shadow-xs mb-4">
        {icon}
      </div>

      <h3 className="text-[14.5px] font-black text-slate-800 dark:text-slate-100 flex items-baseline justify-center gap-1.5 flex-wrap">
        <span>{title}</span>
        <span className="text-xs text-amber-600 font-bold font-sans flex items-center">({hindiTitle})</span>
      </h3>

      <div className="flex flex-col gap-0.5 mt-2 max-w-md mx-auto">
        <p className="text-xs text-slate-500 dark:text-slate-400 font-sans leading-relaxed">
          {description}
        </p>
        <p className="text-[11px] text-slate-400 dark:text-slate-500 font-sans leading-relaxed">
          {hindiDescription}
        </p>
      </div>

      {onActionClick && (actionLabel || hindiActionLabel) && (
        <Button
          id={`${compId}-action-btn`}
          onClick={onActionClick}
          variant="primary"
          size="sm"
          className="mt-6 font-bold"
        >
          {actionLabel && <span className="font-sans mr-1">{actionLabel}</span>}
          {hindiActionLabel && <span className="text-xs">({hindiActionLabel})</span>}
        </Button>
      )}
    </div>
  );
};

export default EmptyState;
