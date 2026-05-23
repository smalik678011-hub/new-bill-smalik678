import React, { forwardRef } from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  hindiLabel?: string;
  error?: string;
  helperText?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, hindiLabel, error, helperText, className = '', id, ...props }, ref) => {
    const inputId = id || `input-${Math.random().toString(36).substr(2, 9)}`;

    return (
      <div className="w-full flex flex-col gap-1">
        {label || hindiLabel ? (
          <label htmlFor={inputId} className="flex gap-1.5 items-baseline text-xs font-bold text-slate-700 dark:text-slate-200">
            {label && <span className="font-sans">{label}</span>}
            {hindiLabel && <span className="text-[11px] text-amber-600 font-medium">({hindiLabel})</span>}
          </label>
        ) : null}
        
        <input
          id={inputId}
          ref={ref}
          className={`
            w-full px-3 py-2 text-sm bg-white dark:bg-slate-900 
            text-slate-950 dark:text-slate-50
            border rounded-xl transition-all duration-200 outline-none
            placeholder:text-slate-400 dark:placeholder:text-slate-500
            ${error 
              ? 'border-rose-500 focus:border-rose-500 focus:ring-1 focus:ring-rose-500' 
              : 'border-slate-250 dark:border-slate-800 focus:border-amber-500 focus:ring-1 focus:ring-amber-500'
            }
            disabled:bg-slate-50 disabled:text-slate-500 disabled:border-slate-200
            ${className}
          `}
          {...props}
        />

        {error ? (
          <span id={`${inputId}-error`} className="text-[11px] font-bold text-rose-500 font-sans mt-0.5">
            {error}
          </span>
        ) : helperText ? (
          <span id={`${inputId}-helper`} className="text-[10.5px] text-slate-500 dark:text-slate-400 font-sans mt-0.5">
            {helperText}
          </span>
        ) : null}
      </div>
    );
  }
);

Input.displayName = 'Input';

export default Input;
