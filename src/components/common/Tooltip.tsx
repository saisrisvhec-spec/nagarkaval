import React, { useState } from 'react';
import { HelpCircle } from 'lucide-react';

interface TooltipProps {
  content: React.ReactNode;
  children?: React.ReactNode;
  iconOnly?: boolean;
}

export const Tooltip: React.FC<TooltipProps> = ({ content, children, iconOnly = false }) => {
  const [isVisible, setIsVisible] = useState(false);

  return (
    <div
      className="relative inline-flex items-center group cursor-pointer"
      onMouseEnter={() => setIsVisible(true)}
      onMouseLeave={() => setIsVisible(false)}
      onFocus={() => setIsVisible(true)}
      onBlur={() => setIsVisible(false)}
    >
      {children}
      {iconOnly && (
        <HelpCircle className="w-3.5 h-3.5 ml-1 text-slate-400 hover:text-cyan-400 transition-colors" />
      )}

      {isVisible && (
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 z-50 px-3 py-2 text-xs font-normal text-slate-200 bg-[#152238] border border-[#1F2A44] rounded-lg shadow-xl shadow-black/60 max-w-xs w-max whitespace-normal pointer-events-none transition-opacity duration-200">
          <div className="leading-relaxed">{content}</div>
          <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-1 border-4 border-transparent border-t-[#152238]" />
        </div>
      )}
    </div>
  );
};
