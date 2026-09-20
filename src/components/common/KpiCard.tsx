import React from 'react';
import { ArrowUpRight, ArrowDownRight, Minus } from 'lucide-react';
import { Tooltip } from './Tooltip';

interface KpiCardProps {
  id?: string;
  title: string;
  value: string | number;
  unit?: string;
  delta?: {
    value: number | string;
    isPositiveGood?: boolean;
    trend: 'up' | 'down' | 'neutral';
    label?: string;
  };
  tooltipText: string;
  sparklineData?: number[];
  accentColor?: string;
  subtext?: string;
}

export const KpiCard: React.FC<KpiCardProps> = ({
  id,
  title,
  value,
  unit,
  delta,
  tooltipText,
  sparklineData = [20, 24, 22, 28, 25, 30, 27, 32],
  accentColor = '#22D3EE',
  subtext,
}) => {
  // Sparkline path generator
  const width = 80;
  const height = 28;
  const min = Math.min(...sparklineData);
  const max = Math.max(...sparklineData);
  const range = max - min || 1;

  const points = sparklineData
    .map((val, idx) => {
      const x = (idx / (sparklineData.length - 1)) * width;
      const y = height - ((val - min) / range) * (height - 6) - 3;
      return `${x},${y}`;
    })
    .join(' ');

  const isGood = delta ? (delta.trend === 'up' ? delta.isPositiveGood : !delta.isPositiveGood) : true;

  return (
    <div
      id={id}
      className="bg-[#111A2E] border border-[#1F2A44] hover:border-slate-700/80 rounded-2xl p-4.5 flex flex-col justify-between transition-all duration-200 hover:shadow-lg hover:shadow-cyan-950/20 group relative overflow-hidden"
    >
      {/* Subtle top edge accent glow */}
      <div
        className="absolute top-0 left-0 right-0 h-0.5 opacity-60 transition-opacity group-hover:opacity-100"
        style={{ background: `linear-gradient(90deg, transparent, ${accentColor}, transparent)` }}
      />

      <div className="flex items-center justify-between gap-2 mb-2">
        <span className="text-xs font-medium text-slate-400 uppercase tracking-wider flex items-center gap-1">
          {title}
          <Tooltip content={tooltipText} iconOnly />
        </span>

        {/* Mini Sparkline */}
        <div className="opacity-70 group-hover:opacity-100 transition-opacity">
          <svg width={width} height={height} className="overflow-visible">
            <polyline
              fill="none"
              stroke={accentColor}
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              points={points}
            />
          </svg>
        </div>
      </div>

      <div className="flex items-baseline gap-2 mb-2">
        <span className="text-2xl lg:text-3xl font-bold font-mono text-white tracking-tight">
          {value}
        </span>
        {unit && <span className="text-xs font-medium text-slate-400 font-mono">{unit}</span>}
      </div>

      <div className="flex items-center justify-between text-xs pt-1 border-t border-[#1F2A44]/60">
        {delta ? (
          <div
            className={`inline-flex items-center gap-1 font-mono font-medium ${
              delta.trend === 'neutral'
                ? 'text-slate-400'
                : isGood
                ? 'text-emerald-400'
                : 'text-rose-400'
            }`}
          >
            {delta.trend === 'up' && <ArrowUpRight className="w-3.5 h-3.5" />}
            {delta.trend === 'down' && <ArrowDownRight className="w-3.5 h-3.5" />}
            {delta.trend === 'neutral' && <Minus className="w-3.5 h-3.5" />}
            <span>{delta.value}</span>
            {delta.label && <span className="text-slate-500 font-sans text-[11px] ml-0.5">{delta.label}</span>}
          </div>
        ) : (
          <span className="text-slate-500 text-[11px]">{subtext || 'Live simulated'}</span>
        )}

        <span className="text-[10px] text-slate-500 font-mono">1s tick</span>
      </div>
    </div>
  );
};
