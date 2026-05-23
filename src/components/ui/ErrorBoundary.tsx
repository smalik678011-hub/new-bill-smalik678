import React, { ErrorInfo, ReactNode } from 'react';
import { ShieldAlert, RefreshCw, Download } from 'lucide-react';
import Button from './Button';



interface Props {
  children?: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null
    };
  }

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error bound by BillKaro ErrorBoundary:', error, errorInfo);
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null });
    window.location.href = '/';
  };

  private handleExportBackup = () => {
    try {
      // Safely let the user download current localStorage state as emergency backup JSON
      const backupData: Record<string, string> = {};
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && (key.startsWith('billkaro') || key.includes('profile') || key.includes('client'))) {
          backupData[key] = localStorage.getItem(key) || '';
        }
      }
      
      const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `billkaro-bahi-khata-emergency-backup-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (e) {
      alert('Backup failed structure retrieval.');
    }
  };

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-screen bg-[#0E1322] flex items-center justify-center p-6 text-slate-100 font-sans">
          <div className="w-full max-w-md bg-slate-900 border border-amber-500/20 rounded-2xl p-6 shadow-2xl text-center space-y-6">
            <div className="mx-auto w-16 h-16 bg-rose-500/10 text-rose-500 rounded-2xl flex items-center justify-center animate-pulse">
              <ShieldAlert className="w-9 h-9" />
            </div>

            <div className="space-y-2">
              <h2 className="text-lg font-black tracking-tight text-white flex items-baseline justify-center gap-1.5 flex-wrap">
                <span>Oops! Something went wrong</span>
              </h2>
              <p className="text-xs text-slate-400 font-sans">
                An unexpected error occurred in saving or loading your business ledger dashboard. Don't worry, your offline records are protected!
              </p>
            </div>

            {this.state.error && (
              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 text-left font-mono text-[10px] text-rose-400 overflow-x-auto max-h-24">
                {this.state.error.toString()}
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-2">
              <Button
                variant="primary"
                size="sm"
                onClick={this.handleReset}
                className="w-full h-11 text-xs font-black flex items-center justify-center gap-1.5"
              >
                <RefreshCw className="w-4 h-4" />
                <span>Reload App</span>
              </Button>

              <Button
                variant="outline"
                size="sm"
                onClick={this.handleExportBackup}
                className="w-full h-11 text-xs font-bold border-slate-800 hover:bg-slate-800 text-slate-300 flex items-center justify-center gap-1.5"
              >
                <Download className="w-4 h-4" />
                <span>Backup JSON</span>
              </Button>
            </div>

            <div className="text-[10px] text-slate-500 font-sans">
              Contact support at smalik314@gmail.com if trouble persists.
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
