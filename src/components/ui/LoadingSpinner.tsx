import React from 'react';


interface LoadingSpinnerProps {
  fullPage?: boolean;
  message?: string;
  hindiMessage?: string;
  id?: string;
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  fullPage = false,
  message = 'Please wait...',
  hindiMessage = 'लोड हो रहा है...',
  id
}) => {
  const spinnerId = id || 'global-loading';

  const spinnerContent = (
    <div id={`${spinnerId}-container`} className="flex flex-col items-center justify-center gap-4 text-center p-6">
      <div className="relative flex items-center justify-center">
        {/* Outer glowing halo */}
        <div className="absolute w-12 h-12 rounded-full border border-amber-500/10 animate-ping" />
        {/* Rolling spinner ring */}
        <div className="w-10 h-10 rounded-full border-3 border-slate-100 dark:border-slate-800 border-t-amber-500 animate-spin" />
      </div>

      <div className="flex flex-col gap-0.5 mt-2">
        <p className="text-sm font-bold text-slate-800 dark:text-slate-100 font-sans tracking-tight">
          {message}
        </p>
        <p className="text-xs text-amber-600 font-semibold font-sans">
          {hindiMessage}
        </p>
      </div>
    </div>
  );

  if (fullPage) {
    return (
      <div
        id={spinnerId}
        className="fixed inset-0 bg-white/70 dark:bg-slate-950/70 backdrop-blur-xs z-50 flex items-center justify-center"
      >
        {spinnerContent}
      </div>
    );
  }

  return (
    <div id={spinnerId} className="w-full flex justify-center py-12">
      {spinnerContent}
    </div>
  );
};

export default LoadingSpinner;
