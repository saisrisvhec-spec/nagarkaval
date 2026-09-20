import React from 'react';
import { AlertTriangle, CheckCircle, Info, Siren, X } from 'lucide-react';
import { useSimulation } from '../../context/SimulationContext';

export const Toast: React.FC = () => {
  const { activeToast, dismissToast } = useSimulation();

  if (!activeToast) return null;

  const getStyle = () => {
    switch (activeToast.type) {
      case 'emergency':
        return 'bg-rose-950/95 border-rose-500 text-rose-100 animate-pulse-emergency';
      case 'warning':
        return 'bg-amber-950/90 border-amber-500 text-amber-100 shadow-amber-900/30';
      case 'success':
        return 'bg-emerald-950/90 border-emerald-500 text-emerald-100 shadow-emerald-900/30';
      case 'info':
      default:
        return 'bg-[#152238] border-cyan-500/80 text-cyan-100 shadow-cyan-950/40';
    }
  };

  const getIcon = () => {
    switch (activeToast.type) {
      case 'emergency':
        return <Siren className="w-5 h-5 text-rose-400 animate-bounce" />;
      case 'warning':
        return <AlertTriangle className="w-5 h-5 text-amber-400" />;
      case 'success':
        return <CheckCircle className="w-5 h-5 text-emerald-400" />;
      case 'info':
      default:
        return <Info className="w-5 h-5 text-cyan-400" />;
    }
  };

  return (
    <div className="fixed top-20 right-6 z-50 max-w-md w-full">
      <div
        className={`flex items-start gap-3 p-4 rounded-xl border shadow-2xl backdrop-blur-md transition-all duration-300 ${getStyle()}`}
      >
        <div className="shrink-0 mt-0.5">{getIcon()}</div>
        <div className="flex-1 text-sm font-medium leading-snug">{activeToast.message}</div>
        <button
          onClick={dismissToast}
          className="shrink-0 text-slate-400 hover:text-white transition-colors p-1 rounded-md hover:bg-white/10"
          aria-label="Dismiss notification"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

export const ToastContainer = Toast;

