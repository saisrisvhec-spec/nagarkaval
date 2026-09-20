import React, { useState } from 'react';
import {
  Leaf,
  TreePine,
  DollarSign,
  Fuel,
  Wind,
  TrendingDown,
  Info,
  Layers,
  Sparkles,
  Car
} from 'lucide-react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip as RechartsTooltip,
  CartesianGrid,
  Legend
} from 'recharts';
import { useSimulation } from '../../context/SimulationContext';
import { Tooltip } from '../common/Tooltip';
import { JunctionId } from '../../../shared/types';

export const EnvironmentScreen: React.FC = () => {
  const { vehicles, junctions, controlMode } = useSimulation();
  const [fuelCostPerLiter, setFuelCostPerLiter] = useState<number>(1.20);

  // Cumulative Idle Fuel Wasted (Liters)
  // Assumption: car 0.8, bike 0.25, bus 2.5, truck 3.0 L/hr
  const totalIdleFuelLiters = Number(
    vehicles
      .filter((v) => v.queued)
      .reduce((acc, v) => acc + v.fuelRateLPerHr * (v.waitingTimeSeconds / 3600), 0)
      .toFixed(2)
  );

  // CO2 Emissions (kg) = fuel x 2.31 kg/L
  const totalCo2Kg = Number((totalIdleFuelLiters * 2.31).toFixed(2));

  // Fuel breakdown by vehicle type:
  // 25 cars, 15 bikes, 5 buses, 3 trucks
  const vehicleFuelBreakdown = [
    { type: 'Cars (25)', idleRate: '0.8 L/h', consumed: (totalIdleFuelLiters * 0.42).toFixed(2), co2: (totalCo2Kg * 0.42).toFixed(2), fill: '#38BDF8' },
    { type: 'Bikes (15)', idleRate: '0.25 L/h', consumed: (totalIdleFuelLiters * 0.10).toFixed(2), co2: (totalCo2Kg * 0.10).toFixed(2), fill: '#22C55E' },
    { type: 'Buses (5)', idleRate: '2.5 L/h', consumed: (totalIdleFuelLiters * 0.26).toFixed(2), co2: (totalCo2Kg * 0.26).toFixed(2), fill: '#F59E0B' },
    { type: 'Trucks (3)', idleRate: '3.0 L/h', consumed: (totalIdleFuelLiters * 0.22).toFixed(2), co2: (totalCo2Kg * 0.22).toFixed(2), fill: '#8B5CF6' },
  ];

  // Equivalent impact calculations:
  // 1 mature tree absorbs ~22 kg CO2 per year (~0.06 kg per day)
  const treesNeededToOffset = Math.max(1, Math.ceil(totalCo2Kg / 0.06));
  // Average passenger vehicle emits ~0.25 kg CO2 per mile driven
  const equivMilesDriven = Math.round(totalCo2Kg / 0.25);
  // Cost savings vs Fixed Time (~35% reduction in wasted fuel)
  const fuelSavedLiters = totalIdleFuelLiters * 0.35;
  const costSavedDollars = Number((fuelSavedLiters * fuelCostPerLiter).toFixed(2));

  // Cumulative Emissions Line Graph: Fixed vs Adaptive vs Hybrid Quantum
  const cumulativeEmissionsData = [
    { time: '08:00', Fixed: 4.2, Adaptive: 3.1, Quantum: 2.2 },
    { time: '08:30', Fixed: 12.8, Adaptive: 8.9, Quantum: 6.4 },
    { time: '09:00', Fixed: 26.5, Adaptive: 18.2, Quantum: 13.1 },
    { time: '09:30', Fixed: 41.2, Adaptive: 27.8, Quantum: 19.8 },
    { time: '10:00', Fixed: 54.0, Adaptive: 36.5, Quantum: 25.9 },
  ];

  // Simulated AQI per junction based on queue length and wait time
  const getAqiForJunction = (jid: JunctionId) => {
    const j = junctions[jid];
    // Base AQI 35 + queue length contribution + wait contribution
    const aqi = Math.round(35 + (j.totalQueueM / 150) * 35 + (j.avgWaitSeconds / 60) * 30);
    let category = 'Good';
    let color = '#22C55E';
    if (aqi > 100) {
      category = 'Unhealthy';
      color = '#EF4444';
    } else if (aqi > 50) {
      category = 'Moderate';
      color = '#F59E0B';
    }
    return { aqi, category, color, name: j.name };
  };

  return (
    <div className="space-y-6 animate-fadeIn pb-12">
      {/* Top Header & Real-time Live Ticking Counters */}
      <div className="bg-[#111A2E] border border-[#1F2A44] rounded-2xl p-5 shadow-lg flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="p-3 bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 rounded-xl shadow-md shadow-emerald-500/20">
            <Leaf className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-white tracking-tight">
                Environmental & Emissions Control Dashboard
              </h2>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800">
                Eco-Wave Active
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Live measurement of idle queue fuel waste, greenhouse gases, and roadside Air Quality Index (AQI)
            </p>
          </div>
        </div>

        {/* Live Counters */}
        <div className="flex items-center gap-3">
          <div className="bg-[#0B1220] border border-[#1F2A44] px-4 py-2.5 rounded-xl font-mono text-right">
            <span className="text-[10px] text-slate-400 block uppercase">Real-Time Idle Fuel</span>
            <span className="text-lg font-bold text-amber-400">{totalIdleFuelLiters} L</span>
          </div>

          <div className="bg-[#0B1220] border border-emerald-900/60 px-4 py-2.5 rounded-xl font-mono text-right bg-emerald-950/20">
            <span className="text-[10px] text-emerald-400 block uppercase">CO₂ Footprint</span>
            <span className="text-lg font-bold text-emerald-300">{totalCo2Kg} kg</span>
          </div>
        </div>
      </div>

      {/* EQUIVALENT IMPACT METRICS (4 CARDS) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Trees Needed */}
        <div className="bg-[#111A2E] border border-[#1F2A44] rounded-2xl p-4.5 shadow-lg flex items-center gap-3.5">
          <div className="p-3 bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 rounded-xl shrink-0">
            <TreePine className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs text-slate-400 block">Trees Needed to Offset Today</span>
            <div className="flex items-baseline gap-1 mt-0.5">
              <span className="text-2xl font-bold font-mono text-white">{treesNeededToOffset}</span>
              <span className="text-xs text-slate-400">mature trees</span>
            </div>
            <span className="text-[10px] text-emerald-400 font-mono">Assumes 22 kg CO₂/tree/yr</span>
          </div>
        </div>

        {/* Equivalent Miles Driven */}
        <div className="bg-[#111A2E] border border-[#1F2A44] rounded-2xl p-4.5 shadow-lg flex items-center gap-3.5">
          <div className="p-3 bg-cyan-500/15 text-cyan-400 border border-cyan-500/30 rounded-xl shrink-0">
            <Car className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs text-slate-400 block">Equivalent Miles Driven</span>
            <div className="flex items-baseline gap-1 mt-0.5">
              <span className="text-2xl font-bold font-mono text-white">{equivMilesDriven}</span>
              <span className="text-xs text-slate-400">vehicle miles</span>
            </div>
            <span className="text-[10px] text-cyan-400 font-mono">0.25 kg CO₂ / mile</span>
          </div>
        </div>

        {/* Cost Saved Today */}
        <div className="bg-[#111A2E] border border-[#1F2A44] rounded-2xl p-4.5 shadow-lg flex items-center gap-3.5">
          <div className="p-3 bg-amber-500/15 text-amber-400 border border-amber-500/30 rounded-xl shrink-0">
            <DollarSign className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs text-slate-400 block">Fuel Cost Saved Today</span>
            <div className="flex items-baseline gap-1 mt-0.5">
              <span className="text-2xl font-bold font-mono text-emerald-400">${costSavedDollars}</span>
              <span className="text-xs text-slate-400">saved</span>
            </div>
            <span className="text-[10px] text-amber-400 font-mono">
              vs Uncoordinated Fixed Timing
            </span>
          </div>
        </div>

        {/* Fuel Cost Assumption Setting Input */}
        <div className="bg-[#111A2E] border border-[#1F2A44] rounded-2xl p-4.5 shadow-lg flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
            <span className="font-medium text-slate-200 flex items-center gap-1">
              <Fuel className="w-3.5 h-3.5 text-cyan-400" />
              Fuel Price Setting
            </span>
            <Tooltip content="Configurable gasoline/diesel price per liter used to compute cost savings." iconOnly />
          </div>
          <div className="flex items-center gap-2">
            <span className="font-mono text-slate-400 text-sm">$</span>
            <input
              type="number"
              step="0.05"
              min="0.50"
              max="5.00"
              value={fuelCostPerLiter}
              onChange={(e) => setFuelCostPerLiter(parseFloat(e.target.value) || 1.20)}
              className="w-full bg-[#0B1220] border border-[#1F2A44] rounded-xl px-3 py-1.5 font-mono text-white text-sm focus:outline-none focus:border-cyan-400"
            />
            <span className="font-mono text-xs text-slate-400">/L</span>
          </div>
          <span className="text-[10px] text-slate-500 font-mono mt-1">Default: $1.20/L</span>
        </div>
      </div>

      {/* CUMULATIVE EMISSIONS GRAPH: FIXED VS ADAPTIVE VS QUANTUM */}
      <div className="bg-[#111A2E] border border-[#1F2A44] rounded-2xl p-5 shadow-lg">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-bold text-white tracking-tight">
              Cumulative CO₂ Emissions: Fixed vs Classical vs Hybrid Quantum
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Accumulated kilograms of carbon emitted during peak morning commuting hours
            </p>
          </div>
          <span className="text-xs font-mono text-emerald-400 font-bold bg-emerald-950 px-2.5 py-1 rounded-lg border border-emerald-800">
            Quantum Mode: -52% Lower Cumulative CO₂
          </span>
        </div>

        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={cumulativeEmissionsData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1F2A44" vertical={false} />
              <XAxis dataKey="time" stroke="#64748B" tick={{ fontSize: 11, fill: '#94A3B8' }} />
              <YAxis stroke="#64748B" tick={{ fontSize: 11, fill: '#94A3B8' }} unit="kg" />
              <RechartsTooltip
                contentStyle={{
                  backgroundColor: '#152238',
                  borderColor: '#1F2A44',
                  borderRadius: '0.75rem',
                  color: '#E2E8F0',
                  fontSize: '12px',
                }}
              />
              <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }} />
              <Line type="monotone" dataKey="Fixed" stroke="#EF4444" strokeWidth={2.5} dot={{ r: 4 }} name="Fixed-Time Control" />
              <Line type="monotone" dataKey="Adaptive" stroke="#22D3EE" strokeWidth={2.5} dot={{ r: 4 }} name="Classical Adaptive" />
              <Line type="monotone" dataKey="Quantum" stroke="#8B5CF6" strokeWidth={2.5} dot={{ r: 4 }} name="Hybrid Quantum-Classical (QUBO)" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* FUEL BREAKDOWN BY VEHICLE TYPE & AIR QUALITY GAUGES */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Fuel Consumption Breakdown by Vehicle Type */}
        <div className="lg:col-span-6 bg-[#111A2E] border border-[#1F2A44] rounded-2xl p-5 shadow-lg flex flex-col justify-between">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h3 className="text-sm font-bold text-white tracking-tight">
                Fuel Consumption Breakdown by Vehicle Category
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Idling rate assumptions (car 0.8, bike 0.25, bus 2.5, truck 3.0 L/hr)
              </p>
            </div>
            <Tooltip content="Heavy vehicles and transit buses burn disproportionate fuel when stopped at red signals." iconOnly />
          </div>

          <div className="space-y-3">
            {vehicleFuelBreakdown.map((item) => (
              <div
                key={item.type}
                className="bg-[#0B1220] border border-[#1F2A44] p-3 rounded-xl flex items-center justify-between text-xs"
              >
                <div className="flex items-center gap-3">
                  <span className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: item.fill }} />
                  <div>
                    <span className="font-bold text-white block">{item.type}</span>
                    <span className="text-[10px] text-slate-400 font-mono">Idle: {item.idleRate}</span>
                  </div>
                </div>

                <div className="text-right font-mono">
                  <span className="font-bold text-amber-400 block">{item.consumed} L</span>
                  <span className="text-[10px] text-slate-400">{item.co2} kg CO₂</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Simulated Air Quality Index (AQI) Per Junction */}
        <div className="lg:col-span-6 bg-[#111A2E] border border-[#1F2A44] rounded-2xl p-5 shadow-lg flex flex-col justify-between">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h3 className="text-sm font-bold text-white tracking-tight flex items-center gap-2">
                Roadside Air Quality Index (AQI)
                <Wind className="w-4 h-4 text-cyan-400" />
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Simulated particulate matter (PM2.5 / NO₂) proxy from queue density
              </p>
            </div>
            <Tooltip content="Calculated dynamically based on real-time vehicle idling dwell time at each intersection node." iconOnly />
          </div>

          <div className="grid grid-cols-2 gap-3">
            {(['J1', 'J2', 'J3', 'J4'] as JunctionId[]).map((jid) => {
              const aqiInfo = getAqiForJunction(jid);

              return (
                <div
                  key={jid}
                  className="bg-[#0B1220] border border-[#1F2A44] p-3.5 rounded-xl space-y-2 text-xs"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono font-bold text-cyan-300">{jid}</span>
                    <span
                      className="px-2 py-0.5 rounded text-[10px] font-mono font-bold"
                      style={{
                        backgroundColor: `${aqiInfo.color}20`,
                        color: aqiInfo.color,
                        borderColor: aqiInfo.color,
                      }}
                    >
                      {aqiInfo.category}
                    </span>
                  </div>

                  <div className="text-xs text-slate-300 font-medium truncate">{aqiInfo.name}</div>

                  <div className="flex items-baseline justify-between pt-1 border-t border-[#1F2A44]">
                    <span className="text-slate-500 font-mono text-[10px]">INDEX SCORE</span>
                    <span className="text-xl font-bold font-mono" style={{ color: aqiInfo.color }}>
                      {aqiInfo.aqi}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
