import React, { useState, useEffect } from 'react';
import {
  GitMerge,
  Clock,
  Car,
  Lightbulb,
  ArrowUp,
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  ShieldAlert,
  Sliders,
  CheckCircle2,
  Cpu,
  RefreshCw
} from 'lucide-react';
import { useSimulation } from '../../context/SimulationContext';
import { JunctionId, ApproachDirection } from '../../../shared/types';
import { Tooltip } from '../common/Tooltip';

export const JunctionsScreen: React.FC = () => {
  const {
    junctions,
    selectedJunctionId,
    setSelectedJunctionId,
    controlMode,
    currentCityData
  } = useSimulation();

  const currentJunction = junctions[selectedJunctionId];
  
  const [aiExplain, setAiExplain] = useState<string>('');
  const [aiLabel, setAiLabel] = useState<string>('');
  const [aiLoading, setAiLoading] = useState<boolean>(false);

  const fetchExplanation = async () => {
    if (!currentJunction) return;
    setAiLoading(true);
    try {
      const res = await fetch('/api/ai/explain-timing', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_ADMIN_TOKEN}`
        },
        body: JSON.stringify({
          city: currentCityData.name,
          junctionId: currentJunction.id,
          metrics: { 
            avgWait: currentJunction.avgWaitSeconds, 
            queue: currentJunction.totalQueueM, 
            status: currentJunction.status,
            throughput: currentJunction.throughputVehPerMin
          }
        })
      });
      const data = await res.json();
      setAiExplain(data.text);
      if (data.providerUsed === 'featherless') {
        const statRes = await fetch('/api/ai/status');
        const stat = await statRes.json();
        setAiLabel(`AI-generated (Featherless, ${stat.model})`);
      } else {
        setAiLabel('Auto-generated (template)');
      }
    } catch (err) {
      console.error(err);
      setAiExplain('Failed to fetch explanation.');
      setAiLabel('Error');
    }
    setAiLoading(false);
  };

  useEffect(() => {
    fetchExplanation();
  }, [currentJunction?.id, currentCityData.name]);
  const approaches = currentJunction.approaches;
  const approachesList: ApproachDirection[] = ['North', 'South', 'East', 'West'];

  const getSignalColorClass = (color: 'green' | 'yellow' | 'red') => {
    switch (color) {
      case 'green':
        return 'bg-emerald-500 shadow-[0_0_12px_rgba(34,197,94,0.9)] text-emerald-100';
      case 'yellow':
        return 'bg-amber-500 shadow-[0_0_12px_rgba(245,158,11,0.9)] text-amber-100';
      case 'red':
      default:
        return 'bg-rose-500 shadow-[0_0_12px_rgba(239,68,68,0.9)] text-rose-100';
    }
  };

  return (
    <div className="space-y-5 animate-fadeIn pb-12">
      {/* Junction Selector Tabs J1 - J4 */}
      <div className="bg-[#111A2E] border border-[#1F2A44] rounded-2xl p-2.5 flex items-center justify-between flex-wrap gap-2 shadow-md">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-[#182642] border border-[#27385E] rounded-xl text-cyan-400">
            <GitMerge className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-white tracking-tight">
              Intersection Controller Studio
            </h2>
            <p className="text-xs text-slate-400">
              Select junction to inspect micro-simulation, signal heads, and approach queue metrics
            </p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-1.5 bg-[#0B1220] p-1 rounded-xl border border-[#1F2A44]">
          {(['J1', 'J2', 'J3', 'J4'] as JunctionId[]).map((jid) => {
            const isSelected = selectedJunctionId === jid;
            const junc = junctions[jid];
            return (
              <button
                key={jid}
                onClick={() => setSelectedJunctionId(jid)}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-mono font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                  isSelected
                    ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/50 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-[#111A2E]'
                }`}
              >
                <span>{jid}</span>
                <span
                  className={`w-2 h-2 rounded-full ${
                    junc.status === 'Emergency'
                      ? 'bg-rose-500 animate-ping'
                      : junc.status === 'Congested'
                      ? 'bg-rose-500'
                      : junc.status === 'Heavy'
                      ? 'bg-amber-500'
                      : 'bg-emerald-500'
                  }`}
                />
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Studio View: Large Intersection + "Why this timing?" */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Left Column: Top-Down Animated 4-way Intersection */}
        <div className="lg:col-span-7 bg-[#111A2E] border border-[#1F2A44] rounded-2xl p-5 shadow-lg flex flex-col justify-between">
          <div className="flex items-center justify-between mb-3">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-white tracking-tight">
                  {currentJunction.name}
                </h3>
                <span className="text-xs font-mono px-2 py-0.5 rounded bg-[#182642] text-cyan-300 border border-[#27385E]">
                  Phase: {currentJunction.currentPhase.replace('_', ' ')}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Countdown: <strong className="text-emerald-400 font-mono text-sm">{currentJunction.phaseCountdown}s</strong> remaining in active cycle
              </p>
            </div>

            <Tooltip content="Physical 4-way intersection layout with live queue buffers and signal heads." iconOnly />
          </div>

          {/* Large Intersection Graphic */}
          <div className="relative w-full h-[380px] bg-[#0A111F] border border-[#1F2A44] rounded-2xl overflow-hidden flex items-center justify-center">
            {/* Asphalt Roads */}
            {/* East-West road */}
            <div className="absolute inset-x-0 h-28 bg-[#141E34] border-y-2 border-[#2A3E66] flex items-center justify-between px-4">
              <div className="w-full h-[1px] border-b-2 border-dashed border-yellow-500/60" />
            </div>
            {/* North-South road */}
            <div className="absolute inset-y-0 w-28 bg-[#141E34] border-x-2 border-[#2A3E66] flex flex-col items-center justify-between py-4">
              <div className="h-full w-[1px] border-r-2 border-dashed border-yellow-500/60" />
            </div>

            {/* Crosswalk Zebra Markings */}
            {/* North Crosswalk */}
            <div className="absolute top-[108px] w-24 h-4 flex justify-between z-10 opacity-70">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="w-2.5 h-full bg-slate-300" />
              ))}
            </div>
            {/* South Crosswalk */}
            <div className="absolute bottom-[108px] w-24 h-4 flex justify-between z-10 opacity-70">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="w-2.5 h-full bg-slate-300" />
              ))}
            </div>
            {/* West Crosswalk */}
            <div className="absolute left-[134px] h-24 w-4 flex flex-col justify-between z-10 opacity-70">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="h-2.5 w-full bg-slate-300" />
              ))}
            </div>
            {/* East Crosswalk */}
            <div className="absolute right-[134px] h-24 w-4 flex flex-col justify-between z-10 opacity-70">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="h-2.5 w-full bg-slate-300" />
              ))}
            </div>

            {/* Center Intersection Box */}
            <div
              className={`relative z-20 w-24 h-24 rounded-xl flex flex-col items-center justify-center border-2 transition-all duration-300 ${
                currentJunction.preemptionActive
                  ? 'bg-rose-950/80 border-rose-500 animate-pulse-emergency'
                  : 'bg-[#182642] border-cyan-500/60 shadow-xl'
              }`}
            >
              <span className="text-xs font-mono font-bold text-cyan-300">
                {currentJunction.id}
              </span>
              <span className="text-sm font-mono font-bold text-white">
                {currentJunction.phaseCountdown}s
              </span>
              <span className="text-[9px] font-mono text-slate-400">
                {currentJunction.status}
              </span>
            </div>

            {/* NORTH APPROACH: Signal head, queued vehicles & label */}
            <div className="absolute top-3 left-1/2 -translate-x-1/2 z-30 flex flex-col items-center">
              <div className="bg-[#111A2E] border border-[#1F2A44] px-2.5 py-1 rounded-lg text-center mb-1 shadow-md">
                <span className="text-[10px] font-bold text-slate-300 flex items-center gap-1">
                  <ArrowDown className="w-3 h-3 text-cyan-400" />
                  NORTH APPROACH
                </span>
                <span className="text-[9px] font-mono text-cyan-300">
                  {approaches.North.queuedVehicles} veh ({approaches.North.queueLengthM}m)
                </span>
              </div>
              {/* Traffic Light Signal Head */}
              <div className="bg-black/90 p-1.5 rounded-lg border border-slate-700 flex items-center gap-1 shadow-xl">
                <div
                  className={`w-4 h-4 rounded-full transition-all duration-200 ${getSignalColorClass(
                    approaches.North.currentSignal
                  )}`}
                />
                <span className="text-[10px] font-mono font-bold text-white uppercase px-1">
                  {approaches.North.currentSignal}
                </span>
              </div>
            </div>

            {/* SOUTH APPROACH */}
            <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-30 flex flex-col items-center">
              <div className="bg-black/90 p-1.5 rounded-lg border border-slate-700 flex items-center gap-1 shadow-xl mb-1">
                <div
                  className={`w-4 h-4 rounded-full transition-all duration-200 ${getSignalColorClass(
                    approaches.South.currentSignal
                  )}`}
                />
                <span className="text-[10px] font-mono font-bold text-white uppercase px-1">
                  {approaches.South.currentSignal}
                </span>
              </div>
              <div className="bg-[#111A2E] border border-[#1F2A44] px-2.5 py-1 rounded-lg text-center shadow-md">
                <span className="text-[10px] font-bold text-slate-300 flex items-center gap-1">
                  <ArrowUp className="w-3 h-3 text-cyan-400" />
                  SOUTH APPROACH
                </span>
                <span className="text-[9px] font-mono text-cyan-300">
                  {approaches.South.queuedVehicles} veh ({approaches.South.queueLengthM}m)
                </span>
              </div>
            </div>

            {/* WEST APPROACH */}
            <div className="absolute left-3 top-1/2 -translate-y-1/2 z-30 flex items-center gap-2">
              <div className="bg-[#111A2E] border border-[#1F2A44] px-2.5 py-1.5 rounded-lg text-center shadow-md">
                <span className="text-[10px] font-bold text-slate-300 flex items-center gap-1">
                  <ArrowRight className="w-3 h-3 text-cyan-400" />
                  WEST
                </span>
                <span className="text-[9px] font-mono text-cyan-300 block">
                  {approaches.West.queuedVehicles} veh ({approaches.West.queueLengthM}m)
                </span>
              </div>
              <div className="bg-black/90 p-1.5 rounded-lg border border-slate-700 flex flex-col items-center gap-1 shadow-xl">
                <div
                  className={`w-4 h-4 rounded-full transition-all duration-200 ${getSignalColorClass(
                    approaches.West.currentSignal
                  )}`}
                />
              </div>
            </div>

            {/* EAST APPROACH */}
            <div className="absolute right-3 top-1/2 -translate-y-1/2 z-30 flex items-center gap-2">
              <div className="bg-black/90 p-1.5 rounded-lg border border-slate-700 flex flex-col items-center gap-1 shadow-xl">
                <div
                  className={`w-4 h-4 rounded-full transition-all duration-200 ${getSignalColorClass(
                    approaches.East.currentSignal
                  )}`}
                />
              </div>
              <div className="bg-[#111A2E] border border-[#1F2A44] px-2.5 py-1.5 rounded-lg text-center shadow-md">
                <span className="text-[10px] font-bold text-slate-300 flex items-center gap-1">
                  EAST
                  <ArrowLeft className="w-3 h-3 text-cyan-400" />
                </span>
                <span className="text-[9px] font-mono text-cyan-300 block">
                  {approaches.East.queuedVehicles} veh ({approaches.East.queueLengthM}m)
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: "Why this timing?" card + Control Mode summary */}
        <div className="lg:col-span-5 space-y-4 flex flex-col justify-between">
          {/* "Why this timing?" card */}
          <div className="bg-[#111A2E] border border-[#1F2A44] rounded-2xl p-5 shadow-lg relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-500/5 rounded-full blur-2xl pointer-events-none" />
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-amber-500/20 text-amber-300 border border-amber-500/40 rounded-xl">
                  <Lightbulb className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white tracking-tight">
                    Why this timing?
                  </h3>
                  <span className="text-[10px] font-mono text-cyan-400">
                    {aiLabel}
                  </span>
                </div>
              </div>
              <button
                onClick={fetchExplanation}
                disabled={aiLoading}
                className="p-1.5 text-slate-400 hover:text-cyan-400 bg-[#141E34] rounded-lg border border-[#1F2A44] transition-colors disabled:opacity-50"
              >
                <RefreshCw className={`w-4 h-4 ${aiLoading ? 'animate-spin' : ''}`} />
              </button>
            </div>

            <p className="text-sm text-slate-200 leading-relaxed bg-[#0B1220] p-4 rounded-xl border border-[#1F2A44] mb-3 font-sans relative min-h-[80px]">
              {aiLoading ? (
                <span className="flex items-center gap-2 text-slate-400">
                  <RefreshCw className="w-4 h-4 animate-spin text-cyan-500" />
                  Generating AI insight...
                </span>
              ) : (
                aiExplain
              )}
            </p>

            <div className="space-y-2 text-xs">
              <div className="flex items-center justify-between p-2 rounded-lg bg-[#141E34] border border-[#1F2A44]">
                <span className="text-slate-400">Control Mode</span>
                <span className="font-mono font-bold text-cyan-300 uppercase">
                  {controlMode === 'quantum'
                    ? 'Hybrid QUBO/QAOA'
                    : controlMode === 'classical'
                    ? 'Classical Adaptive'
                    : 'Fixed-Time Standard'}
                </span>
              </div>

              <div className="flex items-center justify-between p-2 rounded-lg bg-[#141E34] border border-[#1F2A44]">
                <span className="text-slate-400">Adaptive Formula Weight</span>
                <span className="font-mono text-slate-300 text-[11px]">
                  0.4·Queue + 0.3·Density + 0.3·Wait
                </span>
              </div>

              <div className="flex items-center justify-between p-2 rounded-lg bg-[#141E34] border border-[#1F2A44]">
                <span className="text-slate-400">Preemption Status</span>
                <span
                  className={`font-mono text-[11px] font-bold ${
                    currentJunction.preemptionActive ? 'text-rose-400 animate-pulse' : 'text-emerald-400'
                  }`}
                >
                  {currentJunction.preemptionActive ? 'Active (Ambulance #51)' : 'Standby / None'}
                </span>
              </div>
            </div>
          </div>

          {/* Quick Node Specs */}
          <div className="bg-[#111A2E] border border-[#1F2A44] rounded-2xl p-4 shadow-lg grid grid-cols-3 gap-2 text-center text-xs font-mono">
            <div className="bg-[#0B1220] p-3 rounded-xl border border-[#1F2A44]">
              <span className="text-slate-500 text-[10px] block uppercase">Throughput</span>
              <span className="text-white font-bold text-base mt-0.5 block">
                {currentJunction.throughputVehPerMin}
              </span>
              <span className="text-[10px] text-slate-400">veh/min</span>
            </div>

            <div className="bg-[#0B1220] p-3 rounded-xl border border-[#1F2A44]">
              <span className="text-slate-500 text-[10px] block uppercase">Total Queue</span>
              <span className="text-cyan-300 font-bold text-base mt-0.5 block">
                {currentJunction.totalQueueM}
              </span>
              <span className="text-[10px] text-slate-400">meters</span>
            </div>

            <div className="bg-[#0B1220] p-3 rounded-xl border border-[#1F2A44]">
              <span className="text-slate-500 text-[10px] block uppercase">Cycle Time</span>
              <span className="text-emerald-400 font-bold text-base mt-0.5 block">
                {currentJunction.totalCycleTime}s
              </span>
              <span className="text-[10px] text-slate-400">full split</span>
            </div>
          </div>
        </div>
      </div>

      {/* DETAILED APPROACH METRICS TABLE */}
      <div className="bg-[#111A2E] border border-[#1F2A44] rounded-2xl p-5 shadow-lg">
        <div className="flex items-center justify-between mb-3.5">
          <h3 className="text-sm font-bold text-white tracking-tight">
            Approach Telemetry Table ({currentJunction.id})
          </h3>
          <span className="text-xs text-slate-400 font-mono">
            Updated every simulated tick
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-[#1F2A44] text-slate-400 font-mono uppercase tracking-wider text-[11px]">
                <th className="py-2.5 px-3">Approach</th>
                <th className="py-2.5 px-3">Active Signal</th>
                <th className="py-2.5 px-3">Vehicles (Total/Queued)</th>
                <th className="py-2.5 px-3">Queue Length</th>
                <th className="py-2.5 px-3">Avg Wait Time</th>
                <th className="py-2.5 px-3">Density</th>
                <th className="py-2.5 px-3">Green Allotted</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1F2A44]/60 font-sans">
              {approachesList.map((dir) => {
                const app = approaches[dir];
                return (
                  <tr key={dir} className="hover:bg-slate-800/30 transition-colors">
                    <td className="py-3 px-3 font-semibold text-white flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-cyan-400" />
                      {dir}
                    </td>
                    <td className="py-3 px-3">
                      <span
                        className={`inline-flex items-center gap-1 text-[10px] font-mono px-2 py-0.5 rounded font-bold uppercase ${
                          app.currentSignal === 'green'
                            ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                            : app.currentSignal === 'yellow'
                            ? 'bg-amber-950 text-amber-400 border border-amber-800'
                            : 'bg-rose-950 text-rose-400 border border-rose-800'
                        }`}
                      >
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${
                            app.currentSignal === 'green'
                              ? 'bg-emerald-400'
                              : app.currentSignal === 'yellow'
                              ? 'bg-amber-400'
                              : 'bg-rose-400'
                          }`}
                        />
                        {app.currentSignal}
                      </span>
                    </td>
                    <td className="py-3 px-3 font-mono text-slate-300">
                      {app.vehicleCount} total · <strong className="text-white">{app.queuedVehicles} queued</strong>
                    </td>
                    <td className="py-3 px-3 font-mono font-medium text-white">
                      {app.queueLengthM.toFixed(1)} m
                    </td>
                    <td className="py-3 px-3 font-mono text-slate-300">
                      {app.avgWaitSeconds} s
                    </td>
                    <td className="py-3 px-3 font-mono text-slate-300">
                      {app.densityVehPerKm} veh/km
                    </td>
                    <td className="py-3 px-3 font-mono font-bold text-cyan-300">
                      +{app.greenAllottedSeconds} s
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* PHASE TIMELINE (GANTT-STYLE) OF LAST 10 CYCLES */}
      <div className="bg-[#111A2E] border border-[#1F2A44] rounded-2xl p-5 shadow-lg">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h3 className="text-sm font-bold text-white tracking-tight">
              Signal Phase Timeline (Last 10 Cycles Gantt)
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Historical record of phase durations and transitions for {currentJunction.id}
            </p>
          </div>
          <span className="text-xs text-slate-400 font-mono">
            Cycle time: ~65s
          </span>
        </div>

        {/* Gantt Bar Strip */}
        <div className="w-full bg-[#0B1220] border border-[#1F2A44] rounded-xl p-3">
          <div className="flex items-center gap-1 w-full h-8 rounded-lg overflow-hidden">
            {currentJunction.lastCycles.map((cyc, idx) => (
              <div
                key={idx}
                className="h-full flex items-center justify-center text-[10px] font-mono font-bold text-slate-900 transition-all hover:brightness-125 cursor-pointer relative group"
                style={{
                  width: `${(cyc.durationSeconds / currentJunction.totalCycleTime) * 100}%`,
                  backgroundColor: cyc.color,
                }}
              >
                <span className="truncate px-1 text-[9px]">{cyc.durationSeconds}s</span>

                {/* Tooltip on hover */}
                <div className="absolute bottom-full mb-2 hidden group-hover:block z-30 bg-[#152238] border border-[#1F2A44] p-2 rounded-lg text-slate-200 text-xs shadow-xl w-max pointer-events-none">
                  <div className="font-bold">{cyc.phaseName}</div>
                  <div className="font-mono text-[10px] text-slate-400">
                    Duration: {cyc.durationSeconds}s · Recorded at {cyc.timestamp}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Timeline labels below bar */}
          <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono mt-2 px-1">
            <span>Cycle Start (10:00:20)</span>
            <span>Current Cycle Running</span>
          </div>
        </div>
      </div>
    </div>
  );
};
