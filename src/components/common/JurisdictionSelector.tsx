/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useId } from 'react';
import { Compass, Navigation, Layers, MapPin, ChevronDown, Radio, Activity } from 'lucide-react';
import { useSimulation } from '../../context/SimulationContext';
import { getStates, getDistricts, getCities, getJunctionConfigs } from '../../data/jurisdictions';
import { JunctionId } from '../../../shared/types';

export const JurisdictionSelector: React.FC = () => {
  const { jurisdiction, setJurisdiction, isTelemetryLoading, currentCityData } = useSimulation();

  const stateSelectId = useId();
  const districtSelectId = useId();
  const citySelectId = useId();
  const junctionSelectId = useId();

  const availableStates = getStates();
  const availableDistricts = getDistricts(jurisdiction.state);
  const availableCities = getCities(jurisdiction.state, jurisdiction.district);
  const availableJunctions = getJunctionConfigs(jurisdiction.state, jurisdiction.district, jurisdiction.city);

  const activeNodeLabel =
    jurisdiction.junctionId === 'ALL'
      ? 'ALL JUNCTIONS (NETWORK)'
      : jurisdiction.junctionId;

  return (
    <section
      id="jurisdiction-telemetry-selector"
      aria-label="Jurisdiction & Junction Telemetry Selector"
      className="bg-[#111A2E] border border-[#1F2A44] rounded-2xl p-4 sm:p-5 mb-5 shadow-xl transition-all relative overflow-hidden"
    >
      {/* Subtle loading scan line when switching telemetry */}
      {isTelemetryLoading && (
        <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-cyan-400 to-transparent animate-pulse" />
      )}

      {/* Header Row */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3.5 border-b border-[#1F2A44]">
        <div className="flex items-center gap-2.5">
          <div className="p-1.5 rounded-lg bg-cyan-500/10 border border-cyan-500/30 text-cyan-400">
            <MapPin className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-xs font-mono font-bold tracking-widest text-slate-200 uppercase">
              JURISDICTION & JUNCTION TELEMETRY SELECTOR
            </h2>
            <p className="text-[11px] font-mono text-slate-400">
              Corridor Area: <span className="text-cyan-300 font-semibold">{jurisdiction.city}</span> · {jurisdiction.district}, {jurisdiction.state}
            </p>
          </div>
        </div>

        {/* Live Active Node Badge */}
        <div
          id="monitoring-node-indicator"
          className="flex items-center gap-2 px-3 py-1 rounded-xl bg-[#0B1220] border border-cyan-500/40 text-cyan-300 font-mono text-xs shadow-[0_0_12px_rgba(34,211,238,0.15)]"
        >
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-500" />
          </span>
          <span className="text-slate-400 text-[10px] tracking-wider uppercase">MONITORING NODE:</span>
          <span className="font-bold tracking-wide text-cyan-200">{activeNodeLabel}</span>
          {isTelemetryLoading && (
            <Activity className="w-3.5 h-3.5 text-cyan-400 animate-spin ml-1" />
          )}
        </div>
      </div>

      {/* Dropdowns Row: 4 cols on desktop, 2x2 on tablet, stacked on mobile */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 pt-4">
        {/* 1. STATE */}
        <div className="flex flex-col gap-1.5">
          <label
            htmlFor={stateSelectId}
            className="flex items-center gap-1.5 text-[11px] font-mono font-semibold uppercase tracking-wider text-slate-400"
          >
            <Compass className="w-3.5 h-3.5 text-cyan-400" />
            <span>STATE</span>
          </label>
          <div className="relative">
            <select
              id={stateSelectId}
              value={jurisdiction.state}
              onChange={(e) => setJurisdiction({ state: e.target.value })}
              className="w-full appearance-none bg-[#0F1729] border border-[#1F2A44] hover:border-slate-500 focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400/50 rounded-xl px-3.5 py-2.5 text-xs font-mono text-slate-200 outline-none transition-all cursor-pointer pr-9 shadow-inner"
            >
              {availableStates.map((st) => (
                <option key={st} value={st} className="bg-[#0B1220] text-slate-200">
                  {st}
                </option>
              ))}
            </select>
            <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>
        </div>

        {/* 2. DISTRICT */}
        <div className="flex flex-col gap-1.5">
          <label
            htmlFor={districtSelectId}
            className="flex items-center gap-1.5 text-[11px] font-mono font-semibold uppercase tracking-wider text-slate-400"
          >
            <Navigation className="w-3.5 h-3.5 text-cyan-400" />
            <span>DISTRICT</span>
          </label>
          <div className="relative">
            <select
              id={districtSelectId}
              value={jurisdiction.district}
              onChange={(e) => setJurisdiction({ district: e.target.value })}
              className="w-full appearance-none bg-[#0F1729] border border-[#1F2A44] hover:border-slate-500 focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400/50 rounded-xl px-3.5 py-2.5 text-xs font-mono text-slate-200 outline-none transition-all cursor-pointer pr-9 shadow-inner"
            >
              {availableDistricts.map((dst) => (
                <option key={dst} value={dst} className="bg-[#0B1220] text-slate-200">
                  {dst}
                </option>
              ))}
            </select>
            <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>
        </div>

        {/* 3. CITY / AREA */}
        <div className="flex flex-col gap-1.5">
          <label
            htmlFor={citySelectId}
            className="flex items-center gap-1.5 text-[11px] font-mono font-semibold uppercase tracking-wider text-slate-400"
          >
            <Layers className="w-3.5 h-3.5 text-cyan-400" />
            <span>CITY / AREA</span>
          </label>
          <div className="relative">
            <select
              id={citySelectId}
              value={jurisdiction.city}
              onChange={(e) => setJurisdiction({ city: e.target.value })}
              className="w-full appearance-none bg-[#0F1729] border border-[#1F2A44] hover:border-slate-500 focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400/50 rounded-xl px-3.5 py-2.5 text-xs font-mono text-slate-200 outline-none transition-all cursor-pointer pr-9 shadow-inner"
            >
              {availableCities.map((cty) => (
                <option key={cty} value={cty} className="bg-[#0B1220] text-slate-200">
                  {cty}
                </option>
              ))}
            </select>
            <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>
        </div>

        {/* 4. JUNCTION NODE (with glowing active cyan border) */}
        <div className="flex flex-col gap-1.5">
          <label
            htmlFor={junctionSelectId}
            className="flex items-center justify-between text-[11px] font-mono font-semibold uppercase tracking-wider text-cyan-300"
          >
            <span className="flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
              <span>JUNCTION NODE</span>
            </span>
            <span className="text-[10px] text-cyan-400/80 lowercase">active target</span>
          </label>
          <div className="relative">
            <select
              id={junctionSelectId}
              value={jurisdiction.junctionId}
              onChange={(e) => setJurisdiction({ junctionId: e.target.value as JunctionId | 'ALL' })}
              className="w-full appearance-none bg-[#0F1729] border-2 border-cyan-500/70 hover:border-cyan-400 focus:border-cyan-300 focus:ring-2 focus:ring-cyan-400/40 rounded-xl px-3.5 py-2.5 text-xs font-mono text-cyan-200 font-medium outline-none transition-all cursor-pointer pr-9 shadow-[0_0_15px_rgba(34,211,238,0.2)]"
            >
              <option value="ALL" className="bg-[#0B1220] text-amber-300 font-semibold">
                ★ All Junctions (Network View)
              </option>
              {availableJunctions.map((j) => (
                <option key={j.id} value={j.id} className="bg-[#0B1220] text-slate-200">
                  {j.name}
                </option>
              ))}
            </select>
            <ChevronDown className="w-4 h-4 text-cyan-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>
        </div>
      </div>
    </section>
  );
};
