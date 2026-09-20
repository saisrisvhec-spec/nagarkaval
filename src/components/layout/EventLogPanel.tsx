import React, { useState } from 'react';
import {
  ListFilter,
  Trash2,
  X,
  Radio,
  Siren,
  Cpu,
  Bus,
  Activity,
  CheckCircle2
} from 'lucide-react';
import { useSimulation } from '../../context/SimulationContext';
import { LogEvent } from '../../../shared/types';

interface EventLogPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

export const EventLogPanel: React.FC<EventLogPanelProps> = ({ isOpen, onClose }) => {
  const { eventLogs, clearLogs } = useSimulation();
  const [filter, setFilter] = useState<'all' | 'signal' | 'emergency' | 'priority' | 'optimizer'>('all');

  if (!isOpen) return null;

  const filteredLogs = eventLogs.filter((log) => {
    if (filter === 'all') return true;
    return log.type === filter;
  });

  const getLogBadge = (type: LogEvent['type']) => {
    switch (type) {
      case 'emergency':
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-mono px-1.5 py-0.5 rounded bg-rose-950 text-rose-400 border border-rose-500/50 animate-pulse">
            <Siren className="w-2.5 h-2.5" />
            EMERGENCY
          </span>
        );
      case 'priority':
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-mono px-1.5 py-0.5 rounded bg-amber-950 text-amber-400 border border-amber-500/50">
            <Bus className="w-2.5 h-2.5" />
            BUS PRIORITY
          </span>
        );
      case 'optimizer':
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-mono px-1.5 py-0.5 rounded bg-violet-950 text-violet-300 border border-violet-500/50">
            <Cpu className="w-2.5 h-2.5" />
            OPTIMIZER
          </span>
        );
      case 'signal':
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-mono px-1.5 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-500/50">
            <Activity className="w-2.5 h-2.5" />
            SIGNAL
          </span>
        );
      case 'info':
      default:
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-mono px-1.5 py-0.5 rounded bg-cyan-950 text-cyan-400 border border-cyan-500/50">
            <Radio className="w-2.5 h-2.5" />
            SYSTEM
          </span>
        );
    }
  };

  return (
    <aside className="w-80 lg:w-96 bg-[#0B1220] border-l border-[#1F2A44] flex flex-col shrink-0 z-30 transition-all duration-200">
      {/* Header */}
      <div className="p-3.5 border-b border-[#1F2A44] flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
          <h2 className="text-sm font-bold text-white tracking-tight flex items-center gap-1.5">
            Live Telemetry Log
            <span className="text-[10px] font-mono text-slate-400 font-normal">
              ({eventLogs.length})
            </span>
          </h2>
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={clearLogs}
            className="p-1.5 text-slate-400 hover:text-rose-400 rounded-lg hover:bg-slate-800 transition-colors"
            title="Clear all logs"
          >
            <Trash2 className="w-4 h-4" />
          </button>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
            title="Close event log"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="p-2 border-b border-[#1F2A44] flex items-center gap-1 overflow-x-auto text-[11px]">
        {(['all', 'emergency', 'priority', 'signal', 'optimizer'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setFilter(tab)}
            className={`px-2 py-1 rounded-lg font-medium capitalize shrink-0 transition-colors ${
              filter === tab
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                : 'text-slate-400 hover:text-slate-200 hover:bg-[#111A2E]'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Log Feed */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2.5">
        {filteredLogs.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 text-center p-4">
            <CheckCircle2 className="w-8 h-8 text-slate-600 mb-2" />
            <span className="text-xs text-slate-400">No events logged under this filter.</span>
          </div>
        ) : (
          filteredLogs.map((log) => (
            <div
              key={log.id}
              className="bg-[#111A2E] border border-[#1F2A44] hover:border-slate-700 rounded-xl p-2.5 transition-all text-xs"
            >
              <div className="flex items-center justify-between mb-1.5">
                <span className="font-mono text-[10px] text-slate-400">{log.timestamp}</span>
                {getLogBadge(log.type)}
              </div>
              <p className="text-slate-200 leading-relaxed font-sans">{log.message}</p>
              {log.junctionId && (
                <div className="mt-1.5 flex items-center gap-1 text-[10px] font-mono text-cyan-400">
                  <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
                  Target Node: {log.junctionId}
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Footer status */}
      <div className="p-2.5 border-t border-[#1F2A44] bg-[#0E1626] flex items-center justify-between text-[11px] text-slate-400">
        <span className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-emerald-400" />
          Sensor Streaming Active
        </span>
        <span className="font-mono text-slate-400">Buffer 80/80</span>
      </div>
    </aside>
  );
};
