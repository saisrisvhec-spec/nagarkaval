import React from 'react';
import { JunctionData, ApproachDirection } from '../../../shared/types';

interface IntersectionMiniGraphicProps {
  junction: JunctionData;
  size?: 'sm' | 'md' | 'lg';
}

export const IntersectionMiniGraphic: React.FC<IntersectionMiniGraphicProps> = ({
  junction,
  size = 'md',
}) => {
  const approaches = junction.approaches;

  const getSignalBg = (signal: 'green' | 'yellow' | 'red') => {
    switch (signal) {
      case 'green':
        return 'bg-emerald-500 shadow-[0_0_8px_rgba(34,197,94,0.8)] text-emerald-100';
      case 'yellow':
        return 'bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.8)] text-amber-100';
      case 'red':
      default:
        return 'bg-rose-500 shadow-[0_0_8px_rgba(239,68,68,0.8)] text-rose-100';
    }
  };

  const isPreemption = junction.preemptionActive;

  return (
    <div className="relative w-full aspect-square max-w-[240px] mx-auto bg-[#0E1626] border border-[#1F2A44] rounded-xl p-2 flex items-center justify-center overflow-hidden">
      {/* Asphalt road crosses */}
      <div className="absolute inset-x-0 h-14 bg-[#141E34] border-y border-[#223354] z-0 flex items-center justify-between px-2">
        <div className="w-full h-[1px] border-b border-dashed border-yellow-500/50" />
      </div>
      <div className="absolute inset-y-0 w-14 bg-[#141E34] border-x border-[#223354] z-0 flex flex-col items-center justify-between py-2">
        <div className="h-full w-[1px] border-r border-dashed border-yellow-500/50" />
      </div>

      {/* Center box */}
      <div
        className={`relative z-10 w-14 h-14 rounded-md flex flex-col items-center justify-center transition-colors duration-300 ${
          isPreemption
            ? 'bg-rose-950/80 border-2 border-rose-500 animate-pulse-emergency'
            : 'bg-[#182642] border border-[#2A3E66]'
        }`}
      >
        <span className="text-[11px] font-bold font-mono text-cyan-300">{junction.id}</span>
        <span className="text-[9px] font-mono text-slate-400">
          {junction.phaseCountdown}s
        </span>
      </div>

      {/* NORTH approach signal and queue */}
      <div className="absolute top-1 left-1/2 -translate-x-1/2 z-20 flex flex-col items-center">
        <span className="text-[9px] font-bold text-slate-400">N</span>
        <div
          className={`w-3.5 h-3.5 rounded-full transition-all duration-300 ${getSignalBg(
            approaches.North.currentSignal
          )}`}
        />
        {/* Queue bar */}
        <div className="w-10 bg-slate-900/80 h-1.5 rounded-full mt-1 overflow-hidden border border-slate-700">
          <div
            className="bg-cyan-400 h-full transition-all duration-300"
            style={{ width: `${Math.min(100, (approaches.North.queuedVehicles / 10) * 100)}%` }}
          />
        </div>
        <span className="text-[8px] font-mono text-slate-400 mt-0.5">
          {approaches.North.queuedVehicles}q · {approaches.North.queueLengthM}m
        </span>
      </div>

      {/* SOUTH approach signal and queue */}
      <div className="absolute bottom-1 left-1/2 -translate-x-1/2 z-20 flex flex-col items-center">
        <span className="text-[8px] font-mono text-slate-400 mb-0.5">
          {approaches.South.queuedVehicles}q · {approaches.South.queueLengthM}m
        </span>
        <div className="w-10 bg-slate-900/80 h-1.5 rounded-full mb-1 overflow-hidden border border-slate-700">
          <div
            className="bg-cyan-400 h-full transition-all duration-300"
            style={{ width: `${Math.min(100, (approaches.South.queuedVehicles / 10) * 100)}%` }}
          />
        </div>
        <div
          className={`w-3.5 h-3.5 rounded-full transition-all duration-300 ${getSignalBg(
            approaches.South.currentSignal
          )}`}
        />
        <span className="text-[9px] font-bold text-slate-400">S</span>
      </div>

      {/* WEST approach signal and queue */}
      <div className="absolute left-1 top-1/2 -translate-y-1/2 z-20 flex items-center gap-1">
        <span className="text-[9px] font-bold text-slate-400">W</span>
        <div
          className={`w-3.5 h-3.5 rounded-full transition-all duration-300 ${getSignalBg(
            approaches.West.currentSignal
          )}`}
        />
        <div className="flex flex-col items-start">
          <div className="w-8 bg-slate-900/80 h-1.5 rounded-full overflow-hidden border border-slate-700">
            <div
              className="bg-cyan-400 h-full transition-all duration-300"
              style={{ width: `${Math.min(100, (approaches.West.queuedVehicles / 10) * 100)}%` }}
            />
          </div>
          <span className="text-[7px] font-mono text-slate-400 mt-0.5">
            {approaches.West.queuedVehicles}q
          </span>
        </div>
      </div>

      {/* EAST approach signal and queue */}
      <div className="absolute right-1 top-1/2 -translate-y-1/2 z-20 flex items-center gap-1">
        <div className="flex flex-col items-end">
          <div className="w-8 bg-slate-900/80 h-1.5 rounded-full overflow-hidden border border-slate-700">
            <div
              className="bg-cyan-400 h-full transition-all duration-300"
              style={{ width: `${Math.min(100, (approaches.East.queuedVehicles / 10) * 100)}%` }}
            />
          </div>
          <span className="text-[7px] font-mono text-slate-400 mt-0.5">
            {approaches.East.queuedVehicles}q
          </span>
        </div>
        <div
          className={`w-3.5 h-3.5 rounded-full transition-all duration-300 ${getSignalBg(
            approaches.East.currentSignal
          )}`}
        />
        <span className="text-[9px] font-bold text-slate-400">E</span>
      </div>
    </div>
  );
};
