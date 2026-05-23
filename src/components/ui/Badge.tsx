import React from 'react';

type BadgeVariant = 'success' | 'warning' | 'danger' | 'info' | 'neutral' | 'amber' | 'slate';

interface BadgeProps {
  children: React.ReactNode;
  variant?: BadgeVariant;
  status?: 'Paid' | 'Unpaid' | 'Partial' | 'Draft' | 'Sent' | 'Active' | 'Inactive' | 'Income' | 'Expense' | string;
  className?: string;
  showDot?: boolean;
  id?: string;
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant,
  status,
  className = '',
  showDot = false,
  id
}) => {
  // Resolve variant based on status string automatically if not passed
  let resolvedVariant: BadgeVariant = variant || 'neutral';

  if (status) {
    const s = status.toLowerCase();
    if (s === 'paid' || s === 'active' || s === 'income' || s === 'success') {
      resolvedVariant = 'success';
    } else if (s === 'partial' || s === 'sent' || s === 'warning') {
      resolvedVariant = 'warning';
    } else if (s === 'unpaid' || s === 'inactive' || s === 'expense' || s === 'danger') {
      resolvedVariant = 'danger';
    } else if (s === 'draft' || s === 'info') {
      resolvedVariant = 'info';
    } else if (s === 'amber') {
      resolvedVariant = 'amber';
    } else {
      resolvedVariant = 'neutral';
    }
  }

  const styles = {
    success: 'bg-emerald-50 text-emerald-700 border-emerald-200/50 dark:bg-emerald-950/20 dark:text-emerald-400 dark:border-emerald-800/30',
    warning: 'bg-amber-50 text-amber-700 border-amber-200/50 dark:bg-amber-950/20 dark:text-amber-400 dark:border-amber-800/30',
    danger: 'bg-rose-50 text-rose-700 border-rose-200/50 dark:bg-rose-950/20 dark:text-rose-400 dark:border-rose-800/30',
    info: 'bg-sky-50 text-sky-700 border-sky-200/50 dark:bg-sky-950/20 dark:text-sky-400 dark:border-sky-800/30',
    amber: 'bg-amber-100 text-amber-900 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-900',
    neutral: 'bg-slate-50 text-slate-700 border-slate-200 dark:bg-slate-800/50 dark:text-slate-300 dark:border-slate-800',
    slate: 'bg-slate-100 text-slate-800 border-slate-300 dark:bg-slate-800 dark:text-slate-100 dark:border-slate-700'
  };

  const dotColors = {
    success: 'bg-emerald-500',
    warning: 'bg-amber-500',
    danger: 'bg-rose-500',
    info: 'bg-sky-500',
    amber: 'bg-amber-600',
    neutral: 'bg-slate-400',
    slate: 'bg-slate-500'
  };

  return (
    <span
      id={id}
      className={`
        inline-flex items-center gap-1.5 px-2.5 py-0.75 
        text-xs font-bold font-sans rounded-full border
        ${styles[resolvedVariant]}
        ${className}
      `}
    >
      {(showDot || status) && (
        <span className={`w-1.5 h-1.5 rounded-full ${dotColors[resolvedVariant]}`} />
      )}
      {children || status}
    </span>
  );
};

export default Badge;
