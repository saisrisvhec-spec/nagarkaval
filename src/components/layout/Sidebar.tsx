import React from 'react';
import {
  LayoutDashboard,
  Map as MapIcon,
  GitMerge,
  Siren,
  Cpu,
  BarChart3,
  Leaf,
  Settings,
  ShieldCheck
} from 'lucide-react';
import { useSimulation } from '../../context/SimulationContext';

export type ScreenId =
  | 'dashboard'
  | 'map'
  | 'junctions'
  | 'emergency'
  | 'optimizer'
  | 'analytics'
  | 'environment'
  | 'settings';

interface SidebarProps {
  activeScreen: ScreenId;
  setActiveScreen: (screen: ScreenId) => void;
}

interface NavItem {
  id: ScreenId;
  label: string;
  icon: React.ReactNode;
  badge?: string;
  badgeType?: 'default' | 'emergency' | 'quantum';
}

export const Sidebar: React.FC<SidebarProps> = ({ activeScreen, setActiveScreen }) => {
  const { ambulanceActive, controlMode } = useSimulation();

  const navItems: NavItem[] = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: <LayoutDashboard className="w-5 h-5" />,
    },
    {
      id: 'map',
      label: 'Live Map',
      icon: <MapIcon className="w-5 h-5" />,
      badge: 'GIS',
    },
    {
      id: 'junctions',
      label: 'Junctions',
      icon: <GitMerge className="w-5 h-5" />,
      badge: '4 Nodes',
    },
    {
      id: 'emergency',
      label: 'Emergency Corridor',
      icon: <Siren className={`w-5 h-5 ${ambulanceActive ? 'text-rose-400 animate-bounce' : ''}`} />,
      badge: ambulanceActive ? 'ACTIVE' : undefined,
      badgeType: 'emergency',
    },
    {
      id: 'optimizer',
      label: 'Optimizer',
      icon: <Cpu className={`w-5 h-5 ${controlMode === 'quantum' ? 'text-violet-400' : ''}`} />,
      badge: controlMode === 'quantum' ? 'QUBO' : 'QAOA',
      badgeType: 'quantum',
    },
    {
      id: 'analytics',
      label: 'Analytics',
      icon: <BarChart3 className="w-5 h-5" />,
    },
    {
      id: 'environment',
      label: 'Environment',
      icon: <Leaf className="w-5 h-5 text-emerald-400/80" />,
      badge: 'CO₂',
    },
    {
      id: 'settings',
      label: 'Settings',
      icon: <Settings className="w-5 h-5" />,
    },
  ];

  return (
    <aside className="w-16 lg:w-60 bg-[#0B1220] border-r border-[#1F2A44] flex flex-col justify-between shrink-0 transition-all duration-200 z-20">
      <div className="p-2 lg:p-3 space-y-1.5">
        <div className="hidden lg:block px-3 py-2 text-[10px] font-mono uppercase tracking-wider text-slate-400">
          Command Screens
        </div>

        {navItems.map((item) => {
          const isActive = activeScreen === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveScreen(item.id)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all group relative cursor-pointer ${
                isActive
                  ? 'bg-gradient-to-r from-cyan-500/15 to-transparent text-cyan-300 border-l-2 border-cyan-400 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-[#111A2E]'
              } ${
                item.id === 'emergency' && ambulanceActive
                  ? 'bg-rose-950/40 text-rose-300 border-l-2 border-rose-500'
                  : ''
              }`}
              title={item.label}
            >
              <span className="shrink-0 transition-transform group-hover:scale-105">
                {item.icon}
              </span>
              <span className="hidden lg:inline truncate">{item.label}</span>

              {item.badge && (
                <span
                  className={`hidden lg:inline-flex ml-auto text-[10px] font-mono px-1.5 py-0.5 rounded ${
                    item.badgeType === 'emergency'
                      ? 'bg-rose-500/20 text-rose-400 border border-rose-500/40 animate-pulse'
                      : item.badgeType === 'quantum'
                      ? 'bg-violet-500/20 text-violet-300 border border-violet-500/40'
                      : 'bg-[#152238] text-slate-400 border border-[#1F2A44]'
                  }`}
                >
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Corridor health summary */}
      <div className="p-3 border-t border-[#1F2A44] hidden lg:block">
        <div className="bg-[#111A2E] border border-[#1F2A44] rounded-xl p-3">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1.5">
            <span className="flex items-center gap-1.5 font-medium text-slate-300">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              Corridor Sync
            </span>
            <span className="font-mono text-emerald-400">99.8%</span>
          </div>
          <div className="w-full bg-[#0B1220] h-1.5 rounded-full overflow-hidden border border-[#1F2A44]">
            <div className="bg-emerald-500 h-full w-[99%]" />
          </div>
          <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono mt-2">
            <span>4 Intersections</span>
            <span>50 Vehicles</span>
          </div>
        </div>
      </div>
    </aside>
  );
};
