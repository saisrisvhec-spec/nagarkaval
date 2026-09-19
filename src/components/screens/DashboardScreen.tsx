import React, { useState, useEffect } from 'react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  Tooltip as RechartsTooltip,
  CartesianGrid,
  Legend
} from 'recharts';
import {
  Car,
  Clock,
  Gauge,
  Activity,
  Flame,
  CloudFog,
  ArrowRight,
  ShieldAlert,
  GitBranch,
  Layers,
  Sparkles,
  RefreshCw
} from 'lucide-react';
import { useSimulation } from '../../context/SimulationContext';
import { KpiCard } from '../common/KpiCard';
import { IntersectionMiniGraphic } from '../common/IntersectionMiniGraphic';
import { Tooltip } from '../common/Tooltip';
import { ApproachDirection, JunctionId } from '../../../shared/types';

export const DashboardScreen: React.FC<{ onNavigateToJunctions: (id: JunctionId) => void }> = ({
  onNavigateToJunctions,
}) => {
  const {
    junctions,
    vehicles,
    timeSeriesData,
    controlMode,
    settings,
    jurisdiction,
    currentCityData,
  } = useSimulation();

  const [aiBriefing, setAiBriefing] = useState<string>('');
  const [aiLabel, setAiLabel] = useState<string>('');
  const [aiLoading, setAiLoading] = useState<boolean>(false);

  const fetchBriefing = async () => {
    setAiLoading(true);
    try {
      const res = await fetch('/api/ai/briefing', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_ADMIN_TOKEN}`
        },
        body: JSON.stringify({
          city: currentCityData.name,
          windowMinutes: 60,
          metrics: {
            avgWait: Object.values(junctions).reduce((a, b) => a + b.avgWaitSeconds, 0) / 4,
            queue: Object.values(junctions).reduce((a, b) => a + b.totalQueueM, 0)
          }
        })
      });
      const data = await res.json();
      setAiBriefing(data.text);
      if (data.providerUsed === 'featherless') {
        const statRes = await fetch('/api/ai/status');
        const stat = await statRes.json();
        setAiLabel(`AI-generated (Featherless, ${stat.model})`);
      } else {
        setAiLabel('Auto-generated (template)');
      }
    } catch (err) {
      console.error(err);
      setAiBriefing('Failed to fetch briefing.');
      setAiLabel('Error');
    }
    setAiLoading(false);
  };

  useEffect(() => {
    fetchBriefing();
  }, [currentCityData.name]);

  const isSpecificNode = jurisdiction.junctionId !== 'ALL';
  const activeNode = isSpecificNode ? junctions[jurisdiction.junctionId as JunctionId] : null;

  // Aggregate metrics across network or node
  const totalVehicles = isSpecificNode && activeNode
    ? activeNode.totalVehicles
    : vehicles.length;

  const avgWaitTimeSec = isSpecificNode && activeNode
    ? activeNode.avgWaitSeconds
    : Math.round(
        Object.values(junctions).reduce((acc, j) => acc + j.avgWaitSeconds, 0) / 4
      );

  const avgQueueM = isSpecificNode && activeNode
    ? activeNode.totalQueueM
    : Math.round(
        Object.values(junctions).reduce((acc, j) => acc + j.totalQueueM, 0) / 4
      );

  const avgSpeed = Number(
    (
      vehicles.reduce((acc, v) => acc + v.speedKmH, 0) / (vehicles.length || 1)
    ).toFixed(1)
  );

  const throughput = isSpecificNode && activeNode
    ? activeNode.throughputVehPerMin
    : Math.round(
        Object.values(junctions).reduce((acc, j) => acc + j.throughputVehPerMin, 0) / 4
      );

  // Fuel & CO2 calculations:
  const idleFuelLitersTotal = Number(
    vehicles
      .filter((v) => (isSpecificNode ? v.junctionId === jurisdiction.junctionId && v.queued : v.queued))
      .reduce((acc, v) => acc + v.fuelRateLPerHr * (v.waitingTimeSeconds / 3600), 0)
      .toFixed(2)
  );

  const co2KgTotal = Number((idleFuelLitersTotal * 2.31).toFixed(2));

  // Waiting time per junction chart data with dynamic city junction names
  const junctionWaitData = [
    { name: junctions.J1?.name || 'J1', short: 'J1', wait: junctions.J1?.avgWaitSeconds || 0, status: junctions.J1?.status || 'Normal' },
    { name: junctions.J2?.name || 'J2', short: 'J2', wait: junctions.J2?.avgWaitSeconds || 0, status: junctions.J2?.status || 'Normal' },
    { name: junctions.J3?.name || 'J3', short: 'J3', wait: junctions.J3?.avgWaitSeconds || 0, status: junctions.J3?.status || 'Normal' },
    { name: junctions.J4?.name || 'J4', short: 'J4', wait: junctions.J4?.avgWaitSeconds || 0, status: junctions.J4?.status || 'Normal' },
  ];

  // Queue length by approach across the network or selected node
  const approachesList: ApproachDirection[] = ['North', 'South', 'East', 'West'];
  const approachQueueSummary = approachesList.map((app) => {
    const totalWaiting = isSpecificNode && activeNode
      ? activeNode.approaches[app].queuedVehicles
      : Object.values(junctions).reduce(
          (acc, j) => acc + j.approaches[app].queuedVehicles,
          0
        );
    const queueM = isSpecificNode && activeNode
      ? activeNode.approaches[app].queueLengthM
      : totalWaiting * 7.5;
    const maxQueuePossible = isSpecificNode ? 120 : 200;
    return {
      approach: app,
      vehiclesWaiting: totalWaiting,
      queueLengthM: queueM,
      percentageOfMax: Math.min(100, Math.round((queueM / maxQueuePossible) * 100)),
    };
  });

  // Vehicle type distribution for Donut chart:
  // 25 cars, 15 bikes, 5 buses, 3 trucks, 2 emergency (1 fire, 1 police)
  const vehicleTypeCounts = [
    { name: 'Cars', value: 25, color: '#38BDF8', pct: '50%' },
    { name: 'Bikes', value: 15, color: '#22C55E', pct: '30%' },
    { name: 'Buses', value: 5, color: '#F59E0B', pct: '10%' },
    { name: 'Trucks', value: 3, color: '#8B5CF6', pct: '6%' },
    { name: 'Emergency (Fire/Police)', value: 2, color: '#EF4444', pct: '4%' },
  ];

  return (
    <div className="space-y-6 pb-12 animate-fadeIn">
      {/* ROW 1: KPI CARDS */}
      <div className="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-7 gap-3.5">
        <KpiCard
          id="kpi-total-vehicles"
          title="Total Monitored"
          value={totalVehicles}
          unit="veh"
          tooltipText="Active tracked vehicles in the 4-junction corridor (25 cars, 15 bikes, 5 buses, 3 trucks, 2 emergency)."
          sparklineData={[48, 50, 49, 50, 50, 50, 51, 50]}
          accentColor="#38BDF8"
          subtext="Corridor Baseline: 50"
        />

        <KpiCard
          id="kpi-avg-wait"
          title="Avg Waiting Time"
          value={avgWaitTimeSec}
          unit="sec"
          delta={{
            value: controlMode === 'quantum' ? '-26%' : controlMode === 'classical' ? '-14%' : '0%',
            trend: controlMode === 'fixed' ? 'neutral' : 'down',
            isPositiveGood: true,
            label: 'vs Fixed',
          }}
          tooltipText="Network-wide average queue waiting time. Normal <30s, Heavy 30-60s, Congested >60s."
          sparklineData={[38, 35, 33, 31, 30, 28, 27, avgWaitTimeSec]}
          accentColor={avgWaitTimeSec < 30 ? '#22C55E' : avgWaitTimeSec < 60 ? '#F59E0B' : '#EF4444'}
        />

        <KpiCard
          id="kpi-avg-queue"
          title="Avg Queue Length"
          value={avgQueueM}
          unit="meters"
          delta={{
            value: '-18%',
            trend: 'down',
            isPositiveGood: true,
            label: 'flushing',
          }}
          tooltipText="Corridor average queue length in meters (calculated as queued vehicles x 7.5m vehicle spacing)."
          sparklineData={[98, 92, 85, 80, 76, 72, 70, avgQueueM]}
          accentColor="#22D3EE"
        />

        <KpiCard
          id="kpi-avg-speed"
          title="Corridor Speed"
          value={avgSpeed}
          unit="km/h"
          delta={{
            value: '+3.2',
            trend: 'up',
            isPositiveGood: true,
            label: 'flow',
          }}
          tooltipText="Real-time mean travel speed across all approaching and cleared road segments."
          sparklineData={[28, 30, 31, 33, 34, 33, 35, avgSpeed]}
          accentColor="#22C55E"
        />

        <KpiCard
          id="kpi-throughput"
          title="Throughput"
          value={throughput}
          unit="veh/min"
          delta={{
            value: '+8.4%',
            trend: 'up',
            isPositiveGood: true,
            label: 'capacity',
          }}
          tooltipText="Rate of vehicles successfully clearing stop lines per simulated minute."
          sparklineData={[42, 44, 45, 47, 49, 48, 51, throughput]}
          accentColor="#8B5CF6"
        />

        <KpiCard
          id="kpi-fuel-wasted"
          title="Idle Fuel Wasted"
          value={idleFuelLitersTotal}
          unit="L"
          delta={{
            value: '-28%',
            trend: 'down',
            isPositiveGood: true,
            label: 'saved',
          }}
          tooltipText="Simulated idling fuel burned in queues. Assumptions (L/hr): car 0.8, bike 0.25, bus 2.5, truck 3.0."
          sparklineData={[18.5, 17.2, 16.0, 15.2, 14.8, 14.2, 13.9, idleFuelLitersTotal]}
          accentColor="#F59E0B"
        />

        <KpiCard
          id="kpi-co2-estimate"
          title="CO₂ Emissions"
          value={co2KgTotal}
          unit="kg"
          delta={{
            value: '-22%',
            trend: 'down',
            isPositiveGood: true,
            label: 'green opt',
          }}
          tooltipText="Estimated emissions derived from idle fuel: CO2 = fuel x 2.31 kg/L."
          sparklineData={[42.0, 39.5, 37.0, 35.2, 34.0, 33.1, 32.5, co2KgTotal]}
          accentColor="#10B981"
        />
      </div>

      {/* ROW 2: FLOW OVER TIME & AVERAGE WAITING TIME PER JUNCTION */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Vehicle Flow Over Time (Line Chart) */}
        <div className="lg:col-span-7 bg-[#111A2E] border border-[#1F2A44] rounded-2xl p-5 shadow-lg flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-white tracking-tight">
                  Vehicle Flow Over Time
                </h3>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-950 text-cyan-400 border border-cyan-800/40">
                  Live Sim + Trend
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Hourly progression (8 AM 45, 9 AM 80, 10 AM 55) & real-time telemetry stream
              </p>
            </div>
            <Tooltip
              content="Real-time vehicle volumes passing through corridor cordon per minute. Peaks represent morning commuting shift."
              iconOnly
            />
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={timeSeriesData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1F2A44" vertical={false} />
                <XAxis dataKey="time" stroke="#64748B" tick={{ fontSize: 11, fill: '#94A3B8' }} />
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
                <Line
                  type="monotone"
                  dataKey="flowVehPerMin"
                  name="Flow (veh/min)"
                  stroke="#22D3EE"
                  strokeWidth={2.5}
                  dot={{ r: 3, fill: '#22D3EE' }}
                  activeDot={{ r: 6, fill: '#38BDF8' }}
                />
                <Line
                  type="monotone"
                  dataKey="throughput"
                  name="Throughput"
                  stroke="#8B5CF6"
                  strokeWidth={2}
                  strokeDasharray="4 4"
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Average Waiting Time per Junction (Bar Chart) */}
        <div className="lg:col-span-5 bg-[#111A2E] border border-[#1F2A44] rounded-2xl p-5 shadow-lg flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-white tracking-tight">
                  Average Waiting Time per Junction
                </h3>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Current stop delay per junction node
              </p>
            </div>
            <Tooltip
              content="Thresholds: Normal <30s (Green), Heavy 30-60s (Amber), Congested >60s (Red)."
              iconOnly
            />
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={junctionWaitData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1F2A44" vertical={false} />
                <XAxis dataKey="name" stroke="#64748B" tick={{ fontSize: 11, fill: '#94A3B8' }} />
                <YAxis stroke="#64748B" tick={{ fontSize: 11, fill: '#94A3B8' }} unit="s" />
                <RechartsTooltip
                  contentStyle={{
                    backgroundColor: '#152238',
                    borderColor: '#1F2A44',
                    borderRadius: '0.75rem',
                    color: '#E2E8F0',
                    fontSize: '12px',
                  }}
                />
                <Bar dataKey="wait" name="Wait (sec)" radius={[6, 6, 0, 0]}>
                  {junctionWaitData.map((entry, index) => {
                    const color =
                      entry.wait < 30 ? '#22C55E' : entry.wait < 60 ? '#F59E0B' : '#EF4444';
                    return <Cell key={`cell-${index}`} fill={color} />;
                  })}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* ROW 3: QUEUE LENGTH BY APPROACH & VEHICLE TYPE DISTRIBUTION */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Queue Length by Approach Table */}
        <div className="lg:col-span-7 bg-[#111A2E] border border-[#1F2A44] rounded-2xl p-5 shadow-lg">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-white tracking-tight">
                Queue Length by Approach
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Initial network split: North 18 (12 queued), South 10 (6 queued), East 15 (10 queued), West 7 (4 queued)
              </p>
            </div>
            <Tooltip
              content="Queue length is computed as queued vehicles x 7.5m effective spacing per vehicle."
              iconOnly
            />
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-[#1F2A44] text-slate-400 font-mono uppercase tracking-wider text-[11px]">
                  <th className="py-2.5 px-3">Approach</th>
                  <th className="py-2.5 px-3">Vehicles Waiting</th>
                  <th className="py-2.5 px-3">Queue Length</th>
                  <th className="py-2.5 px-3 w-48">Queue Fill (% of 200m)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1F2A44]/60 font-sans">
                {approachQueueSummary.map((item) => (
                  <tr key={item.approach} className="hover:bg-slate-800/30 transition-colors">
                    <td className="py-3 px-3 font-semibold text-slate-200 flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-cyan-400" />
                      {item.approach} Approach
                    </td>
                    <td className="py-3 px-3 font-mono text-slate-300">
                      {item.vehiclesWaiting} queued
                    </td>
                    <td className="py-3 px-3 font-mono font-medium text-white">
                      {item.queueLengthM.toFixed(1)} m
                    </td>
                    <td className="py-3 px-3">
                      <div className="flex items-center gap-2">
                        <div className="flex-1 bg-[#0B1220] h-2 rounded-full overflow-hidden border border-[#1F2A44]">
                          <div
                            className={`h-full rounded-full transition-all duration-300 ${
                              item.percentageOfMax > 75
                                ? 'bg-rose-500'
                                : item.percentageOfMax > 40
                                ? 'bg-amber-500'
                                : 'bg-cyan-400'
                            }`}
                            style={{ width: `${item.percentageOfMax}%` }}
                          />
                        </div>
                        <span className="font-mono text-[11px] text-slate-400 w-9 text-right">
                          {item.percentageOfMax}%
                        </span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Vehicle Type Distribution Donut Chart */}
        <div className="lg:col-span-5 bg-[#111A2E] border border-[#1F2A44] rounded-2xl p-5 shadow-lg flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <div>
              <h3 className="text-sm font-bold text-white tracking-tight">
                Vehicle Type Distribution
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                50 Total Vehicles (Cars, Bikes, Buses, Trucks, Emergency)
              </p>
            </div>
            <Tooltip
              content="Breakdown of the 50 simulated background vehicles including 1 college transit bus, 1 school bus, fire engine & police patrol."
              iconOnly
            />
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-4">
            <div className="w-44 h-44 shrink-0">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={vehicleTypeCounts}
                    innerRadius={45}
                    outerRadius={68}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {vehicleTypeCounts.map((entry, index) => (
                      <Cell key={`donut-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <RechartsTooltip
                    contentStyle={{
                      backgroundColor: '#152238',
                      borderColor: '#1F2A44',
                      borderRadius: '0.75rem',
                      color: '#E2E8F0',
                      fontSize: '12px',
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>

            {/* Legend with counts and percentages */}
            <div className="flex-1 space-y-1.5 w-full text-xs">
              {vehicleTypeCounts.map((item) => (
                <div
                  key={item.name}
                  className="flex items-center justify-between p-1.5 rounded-lg hover:bg-slate-800/40 transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                    <span className="text-slate-300 font-medium text-xs">{item.name}</span>
                  </div>
                  <div className="flex items-center gap-2 font-mono">
                    <span className="text-slate-400">{item.value}</span>
                    <span className="text-[11px] text-slate-500">({item.pct})</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ROW 4: FOUR JUNCTION STATUS CARDS (J1 - J4) */}
      <div>
        <div className="flex items-center justify-between mb-3.5">
          <div className="flex items-center gap-2">
            <GitBranch className="w-4 h-4 text-cyan-400" />
            <h3 className="text-sm font-bold text-white tracking-tight uppercase tracking-wider">
              Corridor Nodes (J1 - J4 Status)
            </h3>
          </div>
          <span className="text-xs text-slate-400 font-mono">
            Click any node to view detailed cycle Gantt & approach telemetry
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
          {(['J1', 'J2', 'J3', 'J4'] as JunctionId[]).map((jid) => {
            const junc = junctions[jid];
            const isEmergency = junc.status === 'Emergency';

            const statusBadge = () => {
              switch (junc.status) {
                case 'Emergency':
                  return (
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-rose-500/20 text-rose-300 border border-rose-500/60 animate-pulse">
                      EMERGENCY PREEMPTION
                    </span>
                  );
                case 'Congested':
                  return (
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-rose-950 text-rose-400 border border-rose-800">
                      CONGESTED
                    </span>
                  );
                case 'Heavy':
                  return (
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-amber-950 text-amber-400 border border-amber-800">
                      HEAVY
                    </span>
                  );
                case 'Normal':
                default:
                  return (
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-950 text-emerald-400 border border-emerald-800">
                      NORMAL
                    </span>
                  );
              }
            };

            const isSelectedNode = jurisdiction.junctionId === jid;
            return (
              <div
                key={jid}
                onClick={() => onNavigateToJunctions(jid)}
                className={`bg-[#111A2E] border rounded-2xl p-4.5 cursor-pointer transition-all duration-200 hover:scale-[1.01] flex flex-col justify-between ${
                  isEmergency
                    ? 'border-rose-500/80 shadow-lg shadow-rose-950/40 animate-pulse-emergency'
                    : isSelectedNode
                    ? 'border-2 border-cyan-400 shadow-[0_0_20px_rgba(34,211,238,0.25)] ring-1 ring-cyan-400/50'
                    : 'border-[#1F2A44] hover:border-cyan-500/40 hover:shadow-xl'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <span className="text-xs font-mono font-bold text-cyan-400">{junc.id}</span>
                      <h4 className="text-sm font-bold text-white tracking-tight">{junc.name}</h4>
                    </div>
                    <div className="flex items-center gap-1.5 flex-wrap justify-end">
                      {isSelectedNode && (
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-mono font-bold bg-cyan-950 text-cyan-300 border border-cyan-500">
                          ACTIVE NODE
                        </span>
                      )}
                      {statusBadge()}
                    </div>
                  </div>

                  {/* Mini intersection graphic */}
                  <div className="my-2">
                    <IntersectionMiniGraphic junction={junc} size="md" />
                  </div>

                  {/* Approach queue bars */}
                  <div className="grid grid-cols-2 gap-2 my-3 text-[11px] font-mono">
                    <div className="bg-[#0E1626] border border-[#1F2A44] p-2 rounded-xl">
                      <div className="flex justify-between text-slate-400 mb-1">
                        <span>North Queue</span>
                        <span className="text-white">{junc.approaches.North.queueLengthM}m</span>
                      </div>
                      <div className="bg-slate-800 h-1.5 rounded-full overflow-hidden">
                        <div
                          className="bg-cyan-400 h-full"
                          style={{
                            width: `${Math.min(100, (junc.approaches.North.queuedVehicles / 8) * 100)}%`,
                          }}
                        />
                      </div>
                    </div>

                    <div className="bg-[#0E1626] border border-[#1F2A44] p-2 rounded-xl">
                      <div className="flex justify-between text-slate-400 mb-1">
                        <span>East Queue</span>
                        <span className="text-white">{junc.approaches.East.queueLengthM}m</span>
                      </div>
                      <div className="bg-slate-800 h-1.5 rounded-full overflow-hidden">
                        <div
                          className="bg-cyan-400 h-full"
                          style={{
                            width: `${Math.min(100, (junc.approaches.East.queuedVehicles / 8) * 100)}%`,
                          }}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="pt-2 border-t border-[#1F2A44] flex items-center justify-between text-xs">
                  <div className="flex items-center gap-1.5 text-slate-400 font-mono">
                    <Clock className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Cycle: {junc.phaseCountdown}s</span>
                  </div>
                  <span className="text-cyan-400 font-medium hover:underline inline-flex items-center gap-1 text-[11px]">
                    Inspect Node
                    <ArrowRight className="w-3 h-3" />
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
