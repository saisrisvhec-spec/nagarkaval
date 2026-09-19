/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect } from 'react';
import {
  Play,
  Square,
  RotateCcw,
  Clock,
  Radio,
  Bell,
  CheckCircle2,
  AlertTriangle,
  Siren,
  Activity,
  Layers,
  Sparkles,
  ChevronDown,
  User,
  ShieldCheck,
  Clock3,
  SlidersHorizontal,
  LogOut,
  PanelRightClose,
  PanelRightOpen,
  HelpCircle
} from 'lucide-react';
import { useSimulation } from '../../context/SimulationContext';

interface TopBarProps {
  isLogOpen?: boolean;
  setIsLogOpen?: (open: boolean) => void;
  onOpenTour?: () => void;
  onNavigateToEmergency?: () => void;
  onNavigateToSettings?: () => void;
}

export const TopBar: React.FC<TopBarProps> = ({
  isLogOpen,
  setIsLogOpen,
  onOpenTour,
  onNavigateToEmergency,
  onNavigateToSettings,
}) => {
  const {
    isRunning,
    togglePlay,
    demoElapsedSeconds,
    scenario,
    setScenario,
    ambulanceActive,
    notifications,
    unreadNotificationsCount,
    markAllNotificationsRead,
    syncTelemetry,
    simTimeString,
  } = useSimulation();

  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [isNotifOpen, setIsNotifOpen] = useState<boolean>(false);
  const [isProfileOpen, setIsProfileOpen] = useState<boolean>(false);

  const notifRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);

  // Close popovers when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(event.target as Node)) {
        setIsNotifOpen(false);
      }
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setIsProfileOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Format demo timer into HH:MM:SS
  const formatTimer = (totalSeconds: number): string => {
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  const handleRefresh = () => {
    if (isRefreshing) return;
    setIsRefreshing(true);
    syncTelemetry();
    setTimeout(() => {
      setIsRefreshing(false);
    }, 600);
  };

  const scenarioOptions = [
    'Normal Traffic',
    'Peak Hour',
    'Rain / Low Visibility',
    'Accident Blocked Lane',
    'Festival Crowd',
    'Emergency Dispatch',
  ];

  return (
    <header
      id="nagarkaval-global-header"
      className="sticky top-0 z-40 bg-[#0B1220]/95 backdrop-blur-md border-b border-[#1F2A44] px-3 sm:px-5 py-2.5 transition-all shadow-md"
    >
      <div className="flex flex-wrap items-center justify-between gap-2.5 lg:gap-4">
        {/* LEFT SECTION: Brand + Status Chips */}
        <div className="flex items-center gap-2.5 sm:gap-3.5 flex-wrap">
          {/* Brand */}
          <div className="flex items-center gap-2 pr-2">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-cyan-500 shadow-[0_0_10px_#22d3ee]" />
            </span>
            <span className="font-extrabold tracking-[0.2em] text-base sm:text-lg text-slate-100 uppercase select-none">
              NAGARKAVAL
            </span>
          </div>

          {/* System Online / Degraded Chip */}
          <div
            id="system-status-chip"
            className={`flex items-center gap-2 px-2.5 py-1 rounded-xl text-[11px] font-mono font-medium border transition-all ${
              isRunning
                ? 'bg-emerald-950/70 border-emerald-500/60 text-emerald-300'
                : 'bg-amber-950/70 border-amber-500/60 text-amber-300'
            }`}
          >
            <span
              className={`w-2 h-2 rounded-full ${
                isRunning ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'
              }`}
            />
            <span className="font-semibold tracking-wider">
              {isRunning ? 'SYSTEM ONLINE' : 'SYSTEM DEGRADED'}
            </span>
          </div>

          {/* Ambulance Green Corridor Active Chip (Visible only when ambulance corridor is active) */}
          {ambulanceActive && (
            <button
              id="ambulance-corridor-chip"
              onClick={onNavigateToEmergency}
              className="flex items-center gap-2 px-3 py-1 rounded-xl text-[11px] font-mono font-semibold bg-rose-950/80 border border-rose-500 text-rose-300 shadow-[0_0_16px_rgba(244,63,94,0.5)] animate-pulse hover:bg-rose-900/80 transition-all cursor-pointer"
              title="Click to view live Emergency Green Corridor"
            >
              <Radio className="w-3.5 h-3.5 text-rose-400 animate-spin" />
              <span className="tracking-wide">AMBULANCE GREEN CORRIDOR ACTIVE</span>
            </button>
          )}
        </div>

        {/* RIGHT SECTION: Scenario + Demo Controls + Timer + Refresh + Bell + Profile */}
        <div className="flex items-center gap-2 sm:gap-3 flex-wrap ml-auto">
          {/* Scenario Dropdown */}
          <div
            id="scenario-selector-container"
            className="flex items-center gap-1.5 bg-[#111A2E] border border-[#1F2A44] hover:border-slate-500 focus-within:border-cyan-400 rounded-xl px-2.5 py-1 text-xs font-mono transition-all shadow-inner"
          >
            <Layers className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
            <span className="text-[10px] text-slate-400 font-semibold tracking-wider hidden sm:inline uppercase">
              SCENARIO:
            </span>
            <div className="relative flex items-center">
              <select
                id="scenario-selector-select"
                aria-label="Simulation Traffic Scenario"
                value={scenario}
                onChange={(e) => setScenario(e.target.value)}
                className="appearance-none bg-transparent text-cyan-300 font-bold outline-none cursor-pointer pr-5 py-0.5 text-xs font-mono"
              >
                {scenarioOptions.map((sc) => (
                  <option key={sc} value={sc} className="bg-[#0B1220] text-slate-200">
                    {sc}
                  </option>
                ))}
              </select>
              <ChevronDown className="w-3 h-3 text-cyan-400 absolute right-0 pointer-events-none" />
            </div>
          </div>

          {/* START / STOP DEMO Toggle Button */}
          <button
            id="demo-toggle-button"
            onClick={togglePlay}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-mono text-xs font-bold transition-all shadow-md cursor-pointer ${
              isRunning
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/50 hover:bg-amber-500/30'
                : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/50 hover:bg-emerald-500/30'
            }`}
            title={isRunning ? 'Stop simulated traffic demo' : 'Start simulated traffic demo'}
          >
            {isRunning ? (
              <>
                <Square className="w-3 h-3 fill-current" />
                <span>STOP DEMO</span>
              </>
            ) : (
              <>
                <Play className="w-3 h-3 fill-current" />
                <span>START DEMO</span>
              </>
            )}
          </button>

          {/* Monospace Demo Timer (HH:MM:SS) */}
          <div
            id="demo-timer-display"
            className="flex items-center gap-1.5 bg-[#111A2E] border border-[#1F2A44] px-2.5 py-1.5 rounded-xl font-mono text-xs text-cyan-300 shadow-inner"
            title="Active demo runtime duration"
          >
            <Clock className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
            <span className="font-bold tracking-wider">{formatTimer(demoElapsedSeconds)}</span>
          </div>

          {/* Simulated Clock (Subtle Secondary) */}
          <div
            className="hidden xl:flex items-center gap-1 bg-[#111A2E] border border-[#1F2A44] px-2 py-1.5 rounded-xl font-mono text-[11px] text-slate-400"
            title="Simulated Time of Day"
          >
            <span className="text-slate-500 text-[10px]">TOD:</span>
            <span className="text-slate-300 font-medium">{simTimeString}</span>
          </div>

          {/* Refresh Button (600ms spin + Telemetry synced toast) */}
          <button
            id="telemetry-refresh-button"
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="p-2 rounded-xl text-slate-400 hover:text-cyan-300 hover:bg-[#111A2E] border border-[#1F2A44] transition-all cursor-pointer"
            title="Re-sync roadside radar & inductive loop telemetry"
          >
            <RotateCcw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-cyan-400' : ''}`} />
          </button>

          {/* Notification Bell with Badge & Popover Dropdown */}
          <div className="relative" ref={notifRef}>
            <button
              id="notifications-bell-button"
              onClick={() => setIsNotifOpen((prev) => !prev)}
              className="relative p-2 rounded-xl text-slate-400 hover:text-slate-200 hover:bg-[#111A2E] border border-[#1F2A44] transition-all cursor-pointer"
              title="System Alerts & Incident Feed"
            >
              <Bell className="w-4 h-4" />
              {unreadNotificationsCount > 0 && (
                <span
                  id="notifications-count-badge"
                  className="absolute -top-1 -right-1 flex items-center justify-center min-w-4 h-4 px-1 rounded-full bg-rose-500 text-[10px] font-mono font-bold text-white shadow-[0_0_8px_#f43f5e]"
                >
                  {unreadNotificationsCount}
                </span>
              )}
            </button>

            {/* Notifications Popover Dropdown */}
            {isNotifOpen && (
              <div
                id="notifications-dropdown-menu"
                className="absolute right-0 mt-2 w-80 sm:w-96 bg-[#111A2E] border border-[#1F2A44] rounded-2xl shadow-2xl p-3 z-50 text-slate-200 font-sans"
              >
                <div className="flex items-center justify-between pb-2.5 mb-2 border-b border-[#1F2A44]">
                  <div className="flex items-center gap-2">
                    <Bell className="w-4 h-4 text-cyan-400" />
                    <span className="font-mono text-xs font-bold uppercase tracking-wider text-slate-200">
                      SYSTEM ALERTS ({notifications.length})
                    </span>
                  </div>
                  {unreadNotificationsCount > 0 && (
                    <button
                      onClick={markAllNotificationsRead}
                      className="text-[11px] font-mono text-cyan-400 hover:text-cyan-300 transition-colors cursor-pointer"
                    >
                      Mark all read
                    </button>
                  )}
                </div>

                <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                  {notifications.map((n) => {
                    const icon =
                      n.type === 'emergency' ? (
                        <Siren className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                      ) : n.type === 'warning' ? (
                        <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                      ) : n.type === 'success' ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                      ) : (
                        <Activity className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
                      );

                    return (
                      <div
                        key={n.id}
                        className={`flex items-start gap-2.5 p-2.5 rounded-xl border transition-all ${
                          n.read
                            ? 'bg-[#0F1729]/60 border-[#1F2A44]/50 opacity-70'
                            : 'bg-[#0F1729] border-cyan-500/30 shadow-sm'
                        }`}
                      >
                        {icon}
                        <div className="flex-1 min-w-0">
                          <p className="text-xs text-slate-200 font-medium leading-snug">
                            {n.title}
                          </p>
                          <span className="text-[10px] font-mono text-slate-400">
                            {n.timeAgo}
                          </span>
                        </div>
                        {!n.read && (
                          <span className="w-2 h-2 rounded-full bg-cyan-400 shrink-0 mt-1.5" />
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Profile Block: Avatar + Cmdr. K. Ramanathan + Traffic Control HQ */}
          <div className="relative" ref={profileRef}>
            <button
              id="user-profile-button"
              onClick={() => setIsProfileOpen((prev) => !prev)}
              className="flex items-center gap-2 p-1.5 sm:px-3 sm:py-1.5 rounded-xl bg-[#111A2E] border border-[#1F2A44] hover:border-cyan-500/50 transition-all cursor-pointer text-left"
            >
              {/* Avatar Icon */}
              <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-cyan-600 to-blue-500 flex items-center justify-center text-slate-900 font-bold text-xs shadow-[0_0_8px_rgba(34,211,238,0.3)]">
                <User className="w-4 h-4 text-slate-950" />
              </div>

              {/* Collapses to avatar only on mobile */}
              <div className="hidden sm:flex flex-col text-left leading-tight">
                <span className="text-xs font-bold text-slate-200">Cmdr. K. Ramanathan</span>
                <span className="text-[10px] font-mono text-cyan-400">Traffic Control HQ</span>
              </div>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 hidden sm:inline" />
            </button>

            {/* Profile Popover Menu */}
            {isProfileOpen && (
              <div
                id="user-profile-dropdown"
                className="absolute right-0 mt-2 w-72 bg-[#111A2E] border border-[#1F2A44] rounded-2xl shadow-2xl p-3 z-50 text-slate-200 font-sans"
              >
                {/* Officer Summary */}
                <div className="pb-3 mb-2 border-b border-[#1F2A44]">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-xl bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center text-cyan-300">
                      <ShieldCheck className="w-5 h-5 text-cyan-400" />
                    </div>
                    <div>
                      <h3 className="text-xs font-bold text-slate-100">Cmdr. K. Ramanathan</h3>
                      <p className="text-[10px] font-mono text-cyan-400">ID: #NK-9042 · Senior Controller</p>
                      <p className="text-[10px] font-mono text-slate-400">HQ Traffic Directorate</p>
                    </div>
                  </div>
                </div>

                {/* Shift Log Information */}
                <div className="bg-[#0B1220] border border-[#1F2A44] rounded-xl p-2.5 mb-2 text-xs font-mono">
                  <div className="flex items-center justify-between text-slate-400 text-[11px] mb-1">
                    <span className="flex items-center gap-1">
                      <Clock3 className="w-3 h-3 text-cyan-400" />
                      Active Shift
                    </span>
                    <span className="text-emerald-400 font-semibold">ON DUTY</span>
                  </div>
                  <p className="text-[11px] text-slate-300">08:00 - 16:00 IST</p>
                  <p className="text-[10px] text-slate-400">24 Corridor Clearances Completed</p>
                </div>

                {/* Actions */}
                <div className="space-y-1">
                  <button
                    onClick={() => {
                      setIsProfileOpen(false);
                      if (onNavigateToSettings) onNavigateToSettings();
                    }}
                    className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-xs text-slate-300 hover:text-cyan-300 hover:bg-[#0B1220] transition-colors cursor-pointer"
                  >
                    <SlidersHorizontal className="w-3.5 h-3.5 text-cyan-400" />
                    <span>System Settings & Weights</span>
                  </button>

                  <button
                    onClick={() => {
                      setIsProfileOpen(false);
                      if (onOpenTour) onOpenTour();
                    }}
                    className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-xs text-slate-300 hover:text-cyan-300 hover:bg-[#0B1220] transition-colors cursor-pointer"
                  >
                    <HelpCircle className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Control Room Tour</span>
                  </button>

                  <div className="pt-1 border-t border-[#1F2A44]/60">
                    <button
                      onClick={() => {
                        setIsProfileOpen(false);
                      }}
                      className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-xs text-rose-300 hover:bg-rose-950/40 transition-colors cursor-pointer"
                    >
                      <LogOut className="w-3.5 h-3.5 text-rose-400" />
                      <span>Sign Out</span>
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Guided Tour Modal Toggle */}
          {onOpenTour && (
            <button
              onClick={onOpenTour}
              className="p-2 text-slate-400 hover:text-cyan-300 hover:bg-[#111A2E] rounded-xl border border-[#1F2A44] transition-all cursor-pointer"
              title="Open guided tour"
            >
              <HelpCircle className="w-4 h-4" />
            </button>
          )}

          {/* Toggle Live Event Log Panel */}
          {setIsLogOpen && (
            <button
              id="event-log-toggle-button"
              onClick={() => setIsLogOpen(!isLogOpen)}
              className={`p-2 rounded-xl border transition-all cursor-pointer ${
                isLogOpen
                  ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40'
                  : 'text-slate-400 hover:text-slate-200 bg-[#111A2E] border-[#1F2A44]'
              }`}
              title="Toggle live event log"
            >
              {isLogOpen ? <PanelRightClose className="w-4 h-4" /> : <PanelRightOpen className="w-4 h-4" />}
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
