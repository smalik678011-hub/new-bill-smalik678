import React from 'react';
import { PackageOpen } from 'lucide-react';
import Button from './Button';

interface EmptyStateProps {
  title?: string;
  description?: string;
  actionLabel?: string;
  onActionClick?: () => void;
  icon?: React.ReactNode;
  id?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  title = 'No records found',
  description = 'Add your first item helper records to see details here.',
  actionLabel,
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
      </h3>

      <div className="flex flex-col gap-0.5 mt-2 max-w-md mx-auto">
        <p className="text-xs text-slate-500 dark:text-slate-400 font-sans leading-relaxed">
          {description}
        </p>
      </div>

      {onActionClick && actionLabel && (
        <Button
          id={`${compId}-action-btn`}
          onClick={onActionClick}
          variant="primary"
          size="sm"
          className="mt-6 font-bold"
        >
          <span className="font-sans mr-1">{actionLabel}</span>
        </Button>
      )}
    </div>
  );
};

export default EmptyState;
