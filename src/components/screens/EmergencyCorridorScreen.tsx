import React from 'react';
import {
  Siren,
  CheckCircle2,
  Clock,
  ArrowRight,
  Shield,
  Activity,
  Bus,
  AlertOctagon,
  Sparkles,
  Zap,
  Play,
  RotateCcw
} from 'lucide-react';
import { useSimulation } from '../../context/SimulationContext';
import { Tooltip } from '../common/Tooltip';

export const EmergencyCorridorScreen: React.FC = () => {
  const {
    ambulanceActive,
    ambulanceProgress,
    ambulanceStepIndex,
    emergencySteps,
    emergencyJunctions,
    busPriorityEvents,
    dispatchAmbulance,
    cancelAmbulance,
    triggerBusPriority,
  } = useSimulation();

  return (
    <div className="space-y-6 animate-fadeIn pb-12">
      {/* Top Action Header */}
      <div className="bg-[#111A2E] border border-[#1F2A44] rounded-2xl p-5 flex flex-wrap items-center justify-between gap-4 shadow-lg">
        <div className="flex items-center gap-3.5">
          <div
            className={`p-3 rounded-xl border ${
              ambulanceActive
                ? 'bg-rose-950 text-rose-400 border-rose-500 animate-pulse-emergency'
                : 'bg-[#182642] text-cyan-400 border-[#27385E]'
            }`}
          >
            <Siren className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-white tracking-tight">
                Emergency Green Corridor Command
              </h2>
              <span
                className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full ${
                  ambulanceActive
                    ? 'bg-rose-500/20 text-rose-400 border border-rose-500 animate-pulse'
                    : 'bg-slate-800 text-slate-400'
                }`}
              >
                {ambulanceActive ? 'PREEMPTION LOCK ENGAGED' : 'CORRIDOR STANDBY'}
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Automated high-priority signal override connecting Trauma Unit via J1 → J2 → J3
            </p>
          </div>
        </div>

        {/* Dispatch button */}
        <div className="flex items-center gap-2">
          {ambulanceActive ? (
            <button
              onClick={cancelAmbulance}
              className="px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-rose-600 hover:bg-rose-500 shadow-lg shadow-rose-600/30 transition-all flex items-center gap-2 cursor-pointer"
            >
              <RotateCcw className="w-4 h-4" />
              Abort Corridor / Return to Adaptive
            </button>
          ) : (
            <button
              onClick={dispatchAmbulance}
              className="px-5 py-2.5 rounded-xl text-xs font-bold text-[#0B1220] bg-cyan-400 hover:bg-cyan-300 shadow-lg shadow-cyan-400/25 transition-all flex items-center gap-2 cursor-pointer hover:scale-[1.02]"
            >
              <Siren className="w-4 h-4 text-rose-600" />
              Dispatch Ambulance #51
            </button>
          )}
        </div>
      </div>

      {/* 8-STEP HORIZONTAL FLOW STEPPER */}
      <div className="bg-[#111A2E] border border-[#1F2A44] rounded-2xl p-5 shadow-lg">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-bold text-white tracking-tight">
              Preemption Lifecycle Stepper (8 Stages)
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Automated deterministic handshake from radar detection to post-passage signal recovery
            </p>
          </div>
          <span className="text-xs font-mono text-cyan-300">
            Progress: {Math.round(ambulanceProgress)}%
          </span>
        </div>

        {/* Stepper track */}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2">
          {emergencySteps.map((step, idx) => {
            const isCurrent = step.status === 'active';
            const isCompleted = step.status === 'completed';

            return (
              <div
                key={step.stepIndex}
                className={`p-2.5 rounded-xl border transition-all text-xs flex flex-col justify-between ${
                  isCurrent
                    ? 'bg-rose-950/80 border-rose-500 text-rose-100 shadow-md shadow-rose-950/50 animate-pulse'
                    : isCompleted
                    ? 'bg-[#15273F] border-cyan-500/40 text-cyan-200'
                    : 'bg-[#0B1220] border-[#1F2A44] text-slate-400'
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span className="font-mono text-[10px] font-bold">
                    0{step.stepIndex + 1}
                  </span>
                  {isCompleted ? (
                    <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400" />
                  ) : isCurrent ? (
                    <span className="w-2 h-2 rounded-full bg-rose-400 animate-ping" />
                  ) : (
                    <span className="w-2 h-2 rounded-full bg-slate-700" />
                  )}
                </div>

                <div className="font-bold text-xs leading-tight mb-1 truncate">{step.label}</div>
                <div className="text-[10px] text-slate-400 leading-snug line-clamp-2">
                  {step.description}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ROUTE VISUAL: Start -> J1 -> J2 -> J3 -> Hospital TIMELINE */}
      <div className="bg-[#111A2E] border border-[#1F2A44] rounded-2xl p-5 shadow-lg">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-bold text-white tracking-tight">
              Corridor Progression Waypoints & Signal Interlock
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Target arrival times and cascaded signal preemption states
            </p>
          </div>
          <Tooltip
            content="Signals advance from 'Preparing' (cross-traffic yellow/red clearance) to 'Preempted green' 15 seconds before ETA."
            iconOnly
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {emergencyJunctions.map((j) => {
            const stateColor = () => {
              switch (j.state) {
                case 'Preempted green':
                  return 'bg-emerald-950 text-emerald-400 border-emerald-500 animate-pulse';
                case 'Preparing':
                  return 'bg-amber-950 text-amber-400 border-amber-500';
                case 'Cleared':
                  return 'bg-cyan-950 text-cyan-400 border-cyan-500';
                case 'Restored':
                default:
                  return 'bg-slate-900 text-slate-400 border-slate-700';
              }
            };

            return (
              <div
                key={j.junctionId}
                className="bg-[#0B1220] border border-[#1F2A44] p-4 rounded-xl space-y-3"
              >
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs font-bold text-cyan-300">
                    {j.junctionId} INTERLOCK
                  </span>
                  <span
                    className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded border ${stateColor()}`}
                  >
                    {j.state}
                  </span>
                </div>

                <div className="text-sm font-bold text-white">{j.name}</div>

                <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                  <div className="bg-[#111A2E] p-2 rounded-lg border border-[#1F2A44]">
                    <span className="text-slate-500 block text-[9px] uppercase">ETA to Stop Line</span>
                    <span className="text-lg font-bold text-white">
                      {ambulanceActive ? `${j.etaSeconds}s` : '--'}
                    </span>
                  </div>
                  <div className="bg-[#111A2E] p-2 rounded-lg border border-[#1F2A44]">
                    <span className="text-slate-500 block text-[9px] uppercase">Distance</span>
                    <span className="text-lg font-bold text-cyan-300">{j.distanceMeters}m</span>
                  </div>
                </div>

                <div className="w-full bg-[#111A2E] h-1.5 rounded-full overflow-hidden border border-[#1F2A44]">
                  <div
                    className={`h-full transition-all duration-300 ${
                      j.state === 'Preempted green'
                        ? 'bg-emerald-400'
                        : j.state === 'Cleared'
                        ? 'bg-cyan-400'
                        : 'bg-amber-400'
                    }`}
                    style={{
                      width: `${
                        j.state === 'Cleared' || j.state === 'Restored'
                          ? 100
                          : j.state === 'Preempted green'
                          ? 75
                          : 35
                      }%`,
                    }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* SIDE-BY-SIDE COMPARISON: WITHOUT CORRIDOR VS WITH GREEN CORRIDOR */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        <div className="lg:col-span-12 bg-[#111A2E] border border-[#1F2A44] rounded-2xl p-5 shadow-lg">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-white tracking-tight">
                Emergency Corridor Performance Comparison
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Observed response metrics: Unmanaged Corridor vs Automated Green Wave Preemption
              </p>
            </div>
            <span className="text-xs font-mono text-emerald-400 font-bold bg-emerald-950 px-2.5 py-1 rounded-lg border border-emerald-800">
              Time Saved: 235 Seconds (61.8% Faster)
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Without Corridor */}
            <div className="bg-[#0B1220] border border-rose-950/60 rounded-xl p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono font-bold text-rose-400 uppercase">
                  Standard Signal Cycle (No Corridor)
                </span>
                <span className="text-xs text-slate-500 font-mono">Unsynchronized</span>
              </div>

              <div className="grid grid-cols-3 gap-2 text-center font-mono">
                <div className="bg-[#111A2E] p-2.5 rounded-lg border border-[#1F2A44]">
                  <span className="text-slate-500 text-[9px] uppercase block">Travel Time</span>
                  <span className="text-lg font-bold text-rose-400 mt-1 block">380 s</span>
                  <span className="text-[10px] text-slate-500">6.3 mins</span>
                </div>
                <div className="bg-[#111A2E] p-2.5 rounded-lg border border-[#1F2A44]">
                  <span className="text-slate-500 text-[9px] uppercase block">Red Light Stops</span>
                  <span className="text-lg font-bold text-rose-400 mt-1 block">3 stops</span>
                  <span className="text-[10px] text-slate-500">Full halt</span>
                </div>
                <div className="bg-[#111A2E] p-2.5 rounded-lg border border-[#1F2A44]">
                  <span className="text-slate-500 text-[9px] uppercase block">Intersection Risk</span>
                  <span className="text-lg font-bold text-rose-400 mt-1 block">High</span>
                  <span className="text-[10px] text-slate-500">Conflict points</span>
                </div>
              </div>

              <p className="text-xs text-slate-400 leading-relaxed">
                Without preemption, emergency vehicles face cross-traffic queue queues at J1, J2, and J3, forcing hazardous emergency braking and siren hesitation.
              </p>
            </div>

            {/* With Green Corridor */}
            <div className="bg-[#081717] border border-emerald-900/60 rounded-xl p-4 space-y-3 shadow-[0_0_15px_rgba(16,185,129,0.15)]">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono font-bold text-emerald-400 uppercase">
                  SmartFlow Green Wave Preemption
                </span>
                <span className="text-xs font-mono text-emerald-300 font-bold bg-emerald-950 px-2 py-0.5 rounded border border-emerald-800">
                  Optimal Wave
                </span>
              </div>

              <div className="grid grid-cols-3 gap-2 text-center font-mono">
                <div className="bg-[#0B2020] p-2.5 rounded-lg border border-emerald-800/60">
                  <span className="text-emerald-500 text-[9px] uppercase block">Travel Time</span>
                  <span className="text-lg font-bold text-emerald-300 mt-1 block">145 s</span>
                  <span className="text-[10px] text-emerald-400 font-bold">-235s saved</span>
                </div>
                <div className="bg-[#0B2020] p-2.5 rounded-lg border border-emerald-800/60">
                  <span className="text-emerald-500 text-[9px] uppercase block">Red Light Stops</span>
                  <span className="text-lg font-bold text-emerald-300 mt-1 block">0 stops</span>
                  <span className="text-[10px] text-emerald-400 font-bold">Uninterrupted</span>
                </div>
                <div className="bg-[#0B2020] p-2.5 rounded-lg border border-emerald-800/60">
                  <span className="text-emerald-500 text-[9px] uppercase block">Intersection Risk</span>
                  <span className="text-lg font-bold text-emerald-300 mt-1 block">Minimal</span>
                  <span className="text-[10px] text-emerald-400">Flush cleared</span>
                </div>
              </div>

              <p className="text-xs text-emerald-200 leading-relaxed">
                SmartFlow preempts downstream cycles early, flushing the queue ahead of Ambulance #51, ensuring zero stops and a smooth continuous 48 km/h corridor.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* BUS PRIORITY SECTION (Distinct from Emergency Preemption) */}
      <div className="bg-[#111A2E] border border-[#1F2A44] rounded-2xl p-5 shadow-lg">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-amber-500/20 text-amber-300 border border-amber-500/40 rounded-xl">
              <Bus className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-white tracking-tight">
                  Public Transit & School Bus Conditional Priority
                </h3>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-950 text-amber-300 border border-amber-800">
                  Priority vs Preemption
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Conditional green extension granted only if bus is behind schedule, without disrupting main emergency clearance
              </p>
            </div>
          </div>

          <Tooltip
            content="Unlike Emergency Preemption (which abruptly forces all-red cross clearance), Bus Priority merely extends the active green phase by 8-14s to prevent schedule delays."
            iconOnly
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {busPriorityEvents.map((bp) => (
            <div
              key={bp.id}
              className="bg-[#0B1220] border border-[#1F2A44] p-4 rounded-xl flex items-center justify-between"
            >
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-mono font-bold text-amber-400">{bp.busName}</span>
                  <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 uppercase">
                    {bp.type} Bus
                  </span>
                </div>
                <div className="text-xs text-slate-300">
                  Approaching <strong className="text-white">{bp.junctionId} {bp.approach}</strong>
                </div>
                <div className="text-[11px] font-mono text-slate-500 mt-1">
                  Schedule ETA: {bp.scheduledArrival} · Status: <span className="text-emerald-400">{bp.status}</span>
                </div>
              </div>

              <div className="text-right">
                <button
                  onClick={() => triggerBusPriority(bp.type)}
                  className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/50 transition-all cursor-pointer"
                >
                  Trigger +{bp.timeBonusGrantedSeconds}s Green
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
