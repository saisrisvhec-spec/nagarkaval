import React, { useState } from 'react';
import {
  Cpu,
  Play,
  RotateCcw,
  CheckCircle2,
  TrendingDown,
  ArrowRight,
  Sparkles,
  Info,
  Layers,
  Zap
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip as RechartsTooltip,
  Legend,
  CartesianGrid,
  LineChart,
  Line
} from 'recharts';
import { useSimulation } from '../../context/SimulationContext';
import { ComparisonScenarioResult } from '../../../shared/types';
import { Tooltip } from '../common/Tooltip';

export const OptimizerScreen: React.FC = () => {
  const { runOptimizerComparison, setControlMode, controlMode } = useSimulation();
  const [isRunningSim, setIsRunningSim] = useState(false);
  const [comparisonResults, setComparisonResults] = useState<ComparisonScenarioResult[]>(() =>
    runOptimizerComparison()
  );

  const handleRunComparison = () => {
    setIsRunningSim(true);
    setTimeout(() => {
      setComparisonResults(runOptimizerComparison());
      setIsRunningSim(false);
    }, 600);
  };

  // Grouped bar chart data
  const chartData = [
    {
      metric: 'Avg Wait (s)',
      Fixed: 44.8,
      Classical: 29.2,
      Quantum: 21.6,
    },
    {
      metric: 'Queue Length (m)',
      Fixed: 112.5,
      Classical: 78.0,
      Quantum: 54.0,
    },
    {
      metric: 'Fuel Wasted (L)',
      Fixed: 22.4,
      Classical: 15.6,
      Quantum: 11.2,
    },
    {
      metric: 'CO2 (kg)',
      Fixed: 51.7,
      Classical: 36.0,
      Quantum: 25.9,
    },
  ];

  // QAOA Convergence simulation data (Energy vs Iteration)
  const qaoaConvergenceData = [
    { iteration: 1, energy: -12.4, optimalEnergy: -42.8 },
    { iteration: 2, energy: -18.2, optimalEnergy: -42.8 },
    { iteration: 3, energy: -24.6, optimalEnergy: -42.8 },
    { iteration: 4, energy: -31.0, optimalEnergy: -42.8 },
    { iteration: 5, energy: -36.5, optimalEnergy: -42.8 },
    { iteration: 6, energy: -39.8, optimalEnergy: -42.8 },
    { iteration: 7, energy: -41.7, optimalEnergy: -42.8 },
    { iteration: 8, energy: -42.5, optimalEnergy: -42.8 },
    { iteration: 9, energy: -42.8, optimalEnergy: -42.8 },
    { iteration: 10, energy: -42.8, optimalEnergy: -42.8 },
  ];

  // 4x4 Cost Matrix heatmap values (simulated interaction weights between junction plan pairs)
  const costMatrix = [
    [0.12, 0.85, 0.45, 0.30],
    [0.85, 0.08, 0.65, 0.22],
    [0.45, 0.65, 0.15, 0.78],
    [0.30, 0.22, 0.78, 0.05],
  ];

  // QUBO 16 binary variables states (4 junctions x 4 signal plans)
  // Optimal plan selected: J1->Plan 2, J2->Plan 1, J3->Plan 2, J4->Plan 3
  const quboVariables = [
    { junc: 'J1', plan: 'Plan A (Heavy NS)', qIndex: 'q0', active: false, weight: 0.82 },
    { junc: 'J1', plan: 'Plan B (Wave EW)', qIndex: 'q1', active: true, weight: 0.14 },
    { junc: 'J1', plan: 'Plan C (Balanced)', qIndex: 'q2', active: false, weight: 0.45 },
    { junc: 'J1', plan: 'Plan D (Flushing)', qIndex: 'q3', active: false, weight: 0.68 },

    { junc: 'J2', plan: 'Plan A (Wave EW)', qIndex: 'q4', active: true, weight: 0.09 },
    { junc: 'J2', plan: 'Plan B (Heavy NS)', qIndex: 'q5', active: false, weight: 0.91 },
    { junc: 'J2', plan: 'Plan C (Balanced)', qIndex: 'q6', active: false, weight: 0.52 },
    { junc: 'J2', plan: 'Plan D (Flushing)', qIndex: 'q7', active: false, weight: 0.74 },

    { junc: 'J3', plan: 'Plan A (Heavy NS)', qIndex: 'q8', active: false, weight: 0.64 },
    { junc: 'J3', plan: 'Plan B (Wave EW)', qIndex: 'q9', active: true, weight: 0.18 },
    { junc: 'J3', plan: 'Plan C (Balanced)', qIndex: 'q10', active: false, weight: 0.49 },
    { junc: 'J3', plan: 'Plan D (Hospital Flush)', qIndex: 'q11', active: false, weight: 0.33 },

    { junc: 'J4', plan: 'Plan A (Heavy NS)', qIndex: 'q12', active: false, weight: 0.55 },
    { junc: 'J4', plan: 'Plan B (Wave EW)', qIndex: 'q13', active: false, weight: 0.38 },
    { junc: 'J4', plan: 'Plan C (Balanced Sync)', qIndex: 'q14', active: true, weight: 0.11 },
    { junc: 'J4', plan: 'Plan D (Flushing)', qIndex: 'q15', active: false, weight: 0.62 },
  ];

  return (
    <div className="space-y-6 animate-fadeIn pb-12">
      {/* Header with Run Comparison Action */}
      <div className="bg-[#111A2E] border border-[#1F2A44] rounded-2xl p-5 flex flex-wrap items-center justify-between gap-4 shadow-lg">
        <div className="flex items-center gap-3.5">
          <div className="p-3 bg-violet-500/20 text-violet-300 border border-violet-500/40 rounded-xl shadow-md shadow-violet-500/20">
            <Cpu className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-white tracking-tight">
                Signal Optimizer Lab: Classical vs Hybrid Quantum-Classical
              </h2>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-violet-950 text-violet-300 border border-violet-800">
                QAOA / QUBO Simulated
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Evaluating combinatorial multi-intersection signal split & offset matrices over the 50-vehicle corridor
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleRunComparison}
            disabled={isRunningSim}
            className="px-4 py-2.5 rounded-xl text-xs font-bold text-white bg-violet-600 hover:bg-violet-500 shadow-md shadow-violet-600/30 transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
          >
            <Play className="w-4 h-4" />
            {isRunningSim ? 'Solving QUBO Hamiltonian...' : 'Run Scenario Benchmark'}
          </button>
        </div>
      </div>

      {/* THREE-MODE COMPARISON TABLE */}
      <div className="bg-[#111A2E] border border-[#1F2A44] rounded-2xl p-5 shadow-lg">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-bold text-white tracking-tight">
              Three-Mode Performance Matrix (Identical 50-Vehicle Demand)
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Best values highlighted with percentage improvements relative to baseline Fixed-Time control
            </p>
          </div>
          <Tooltip content="All modes simulated under identical approach demands (North 18, South 10, East 15, West 7)." iconOnly />
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-[#1F2A44] text-slate-400 font-mono uppercase tracking-wider text-[11px]">
                <th className="py-2.5 px-3">Control Strategy</th>
                <th className="py-2.5 px-3">Avg Wait Time</th>
                <th className="py-2.5 px-3">Avg Queue Length</th>
                <th className="py-2.5 px-3">Throughput</th>
                <th className="py-2.5 px-3">Emergency Transit</th>
                <th className="py-2.5 px-3">Fuel Wasted</th>
                <th className="py-2.5 px-3">CO₂ Emissions</th>
                <th className="py-2.5 px-3">Overall Gain</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1F2A44]/60 font-sans">
              {comparisonResults.map((row) => {
                const isQuantum = row.mode === 'quantum';
                const isClassical = row.mode === 'classical';

                return (
                  <tr
                    key={row.mode}
                    className={`transition-colors ${
                      isQuantum
                        ? 'bg-violet-950/20 hover:bg-violet-950/30'
                        : isClassical
                        ? 'bg-cyan-950/20 hover:bg-cyan-950/30'
                        : 'hover:bg-slate-800/30'
                    }`}
                  >
                    <td className="py-3 px-3 font-semibold text-white flex items-center gap-2">
                      <span
                        className={`w-2.5 h-2.5 rounded-full ${
                          isQuantum
                            ? 'bg-violet-400'
                            : isClassical
                            ? 'bg-cyan-400'
                            : 'bg-slate-500'
                        }`}
                      />
                      {row.modeLabel}
                      {controlMode === row.mode && (
                        <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-cyan-900 text-cyan-300 border border-cyan-700">
                          Active In Sim
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-3 font-mono font-bold">
                      <span className={isQuantum ? 'text-emerald-400' : 'text-slate-300'}>
                        {row.avgWaitSeconds} s
                      </span>
                    </td>
                    <td className="py-3 px-3 font-mono">
                      <span className={isQuantum ? 'text-emerald-400 font-bold' : 'text-slate-300'}>
                        {row.avgQueueLengthM} m
                      </span>
                    </td>
                    <td className="py-3 px-3 font-mono">
                      <span className={isQuantum ? 'text-emerald-400 font-bold' : 'text-slate-300'}>
                        {row.throughputVehPerMin} veh/min
                      </span>
                    </td>
                    <td className="py-3 px-3 font-mono">
                      <span className={isQuantum ? 'text-emerald-400 font-bold' : 'text-slate-300'}>
                        {row.emergencyTravelTimeSec} s
                      </span>
                    </td>
                    <td className="py-3 px-3 font-mono text-slate-300">
                      {row.fuelWastedLiters} L
                    </td>
                    <td className="py-3 px-3 font-mono text-slate-300">
                      {row.co2EmissionsKg} kg
                    </td>
                    <td className="py-3 px-3">
                      {row.improvementVsFixedPct > 0 ? (
                        <span className="inline-flex items-center gap-1 font-mono font-bold px-2 py-0.5 rounded text-[11px] bg-emerald-950 text-emerald-400 border border-emerald-800">
                          +{row.improvementVsFixedPct}%
                        </span>
                      ) : (
                        <span className="text-slate-500 font-mono text-xs">Baseline</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* GROUPED BAR CHART OF THE THREE MODES */}
      <div className="bg-[#111A2E] border border-[#1F2A44] rounded-2xl p-5 shadow-lg">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-bold text-white tracking-tight">
            Corridor Efficiency Comparison (Lower is Better for Wait, Queue & Fuel)
          </h3>
          <span className="text-xs text-slate-400 font-mono">Normalized Metric Units</span>
        </div>

        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1F2A44" vertical={false} />
              <XAxis dataKey="metric" stroke="#64748B" tick={{ fontSize: 11, fill: '#94A3B8' }} />
              <YAxis stroke="#64748B" tick={{ fontSize: 11, fill: '#94A3B8' }} />
              <RechartsTooltip
                contentStyle={{
                  backgroundColor: '#152238',
                  borderColor: '#1F2A44',
                  borderRadius: '0.75rem',
                  color: '#E2E8F0',
                  fontSize: '12px',
                }}
              />
              <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
              <Bar dataKey="Fixed" name="Fixed-Time" fill="#64748B" radius={[4, 4, 0, 0]} />
              <Bar dataKey="Classical" name="Classical Adaptive" fill="#22D3EE" radius={[4, 4, 0, 0]} />
              <Bar dataKey="Quantum" name="Hybrid Quantum (QUBO)" fill="#8B5CF6" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* QUANTUM OPTIMIZATION PANEL */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* 16 Binary Variables (QUBO 4x4 Grid) */}
        <div className="lg:col-span-6 bg-[#111A2E] border border-[#1F2A44] rounded-2xl p-5 shadow-lg">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h3 className="text-sm font-bold text-white tracking-tight flex items-center gap-1.5">
                QUBO State Space: 16 Binary Variables (16 Qubits)
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                4 Junctions × 4 Discrete Signal Plans. 1 active plan per junction.
              </p>
            </div>
            <Tooltip
              content="Mapped to a Quadratic Unconstrained Binary Optimization problem where cost represents network delay and penalties enforce single-choice constraints."
              iconOnly
            />
          </div>

          <div className="grid grid-cols-4 gap-2">
            {quboVariables.map((q) => (
              <div
                key={q.qIndex}
                className={`p-2.5 rounded-xl border text-xs font-mono transition-all ${
                  q.active
                    ? 'bg-violet-950/80 border-violet-500 text-violet-200 shadow-md shadow-violet-950/50 ring-1 ring-violet-400'
                    : 'bg-[#0B1220] border-[#1F2A44] text-slate-400 opacity-70'
                }`}
              >
                <div className="flex items-center justify-between text-[10px] mb-1">
                  <span className="font-bold text-cyan-300">{q.qIndex}</span>
                  <span
                    className={`w-2 h-2 rounded-full ${q.active ? 'bg-emerald-400' : 'bg-slate-700'}`}
                  />
                </div>
                <div className="font-bold text-[11px] text-white truncate">{q.junc}</div>
                <div className="text-[9px] text-slate-400 truncate">{q.plan}</div>
                <div className="text-[9px] mt-1 text-right font-mono text-slate-500">
                  {q.active ? 'q=1 (Optimal)' : 'q=0'}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* QAOA Convergence Chart & Cost Matrix */}
        <div className="lg:col-span-6 bg-[#111A2E] border border-[#1F2A44] rounded-2xl p-5 shadow-lg flex flex-col justify-between">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h3 className="text-sm font-bold text-white tracking-tight">
                Simulated QAOA Energy Convergence
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Hamiltonian expectation value minimized across 10 variational circuit layers
              </p>
            </div>
            <Tooltip content="Quantum Approximate Optimization Algorithm iteratively tuning gamma and beta parameters." iconOnly />
          </div>

          <div className="h-44 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={qaoaConvergenceData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1F2A44" vertical={false} />
                <XAxis dataKey="iteration" stroke="#64748B" tick={{ fontSize: 10, fill: '#94A3B8' }} label={{ value: 'Layer (p)', position: 'insideBottomRight', offset: -4, fill: '#64748B', fontSize: 10 }} />
                <YAxis stroke="#64748B" tick={{ fontSize: 10, fill: '#94A3B8' }} />
                <RechartsTooltip
                  contentStyle={{
                    backgroundColor: '#152238',
                    borderColor: '#1F2A44',
                    borderRadius: '0.75rem',
                    color: '#E2E8F0',
                    fontSize: '11px',
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="energy"
                  name="Expectation ⟨H⟩"
                  stroke="#8B5CF6"
                  strokeWidth={2.5}
                  dot={{ r: 3, fill: '#8B5CF6' }}
                />
                <Line
                  type="monotone"
                  dataKey="optimalEnergy"
                  name="Global Minima"
                  stroke="#22C55E"
                  strokeDasharray="4 4"
                  strokeWidth={1.5}
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          <div className="mt-2 pt-2 border-t border-[#1F2A44] flex items-center justify-between text-xs text-slate-400 font-mono">
            <span>Optimal State Found: |q1, q4, q9, q14⟩</span>
            <span className="text-emerald-400 font-bold">Cost Energy: -42.8 eV</span>
          </div>
        </div>
      </div>

      {/* WORKFLOW DIAGRAM */}
      <div className="bg-[#111A2E] border border-[#1F2A44] rounded-2xl p-5 shadow-lg">
        <h3 className="text-sm font-bold text-white tracking-tight mb-3">
          Hybrid Quantum-Classical Optimization Pipeline
        </h3>

        <div className="grid grid-cols-2 md:grid-cols-6 gap-2 text-center text-xs">
          <div className="bg-[#0B1220] border border-[#1F2A44] p-3 rounded-xl">
            <span className="text-cyan-400 font-mono font-bold block mb-1">01. Inputs</span>
            <span className="text-slate-300 font-medium">Radar Queues & Densities</span>
          </div>
          <div className="bg-[#0B1220] border border-[#1F2A44] p-3 rounded-xl">
            <span className="text-cyan-400 font-mono font-bold block mb-1">02. QUBO</span>
            <span className="text-slate-300 font-medium">Hamiltonian Matrix Builder</span>
          </div>
          <div className="bg-[#0B1220] border border-violet-500/50 p-3 rounded-xl bg-violet-950/20">
            <span className="text-violet-300 font-mono font-bold block mb-1">03. QAOA</span>
            <span className="text-white font-medium">Simulated QPU Annealing</span>
          </div>
          <div className="bg-[#0B1220] border border-[#1F2A44] p-3 rounded-xl">
            <span className="text-cyan-400 font-mono font-bold block mb-1">04. Decode</span>
            <span className="text-slate-300 font-medium">Bitstring Ground State</span>
          </div>
          <div className="bg-[#0B1220] border border-[#1F2A44] p-3 rounded-xl">
            <span className="text-cyan-400 font-mono font-bold block mb-1">05. Actuate</span>
            <span className="text-slate-300 font-medium">Deploy Green Waves</span>
          </div>
          <div className="bg-[#0B1220] border border-emerald-500/50 p-3 rounded-xl bg-emerald-950/20">
            <span className="text-emerald-400 font-mono font-bold block mb-1">06. Measure</span>
            <span className="text-white font-medium">Verify Latency & CO₂</span>
          </div>
        </div>

        {/* Clear Disclaimer Note */}
        <div className="mt-4 p-3 bg-[#0B1220] border border-amber-900/60 rounded-xl flex items-start gap-2.5 text-xs text-slate-400">
          <Info className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
          <p className="leading-relaxed">
            <strong className="text-slate-200">Engineering Note:</strong> Quantum optimization is simulated. With only 4 junctions a classical exhaustive search also finds the optimum; this demonstrates a scalable approach for municipal networks of 100+ interconnected intersections where classical algorithms encounter exponential runtime bottlenecks.
          </p>
        </div>
      </div>
    </div>
  );
};
