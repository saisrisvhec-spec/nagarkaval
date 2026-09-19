import React, { useState } from 'react';
import {
  Download,
  Calendar,
  BarChart3,
  TrendingUp,
  Clock,
  Filter,
  Layers,
  FileSpreadsheet,
  CheckCircle2
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  LineChart,
  Line,
  BarChart,
  Bar,
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  ZAxis,
  Tooltip as RechartsTooltip,
  CartesianGrid,
  Legend
} from 'recharts';
import { useSimulation } from '../../context/SimulationContext';
import { Tooltip } from '../common/Tooltip';

export const AnalyticsScreen: React.FC = () => {
  const { junctions, vehicles, timeSeriesData } = useSimulation();
  const [timeRange, setTimeRange] = useState<'today' | 'yesterday' | '7days' | 'custom'>('today');
  const [exported, setExported] = useState(false);

  // 1. Hourly Traffic Volume by Junction (Area chart)
  const hourlyData = [
    { hour: '06:00', J1: 18, J2: 24, J3: 15, J4: 12 },
    { hour: '07:00', J1: 34, J2: 45, J3: 28, J4: 25 },
    { hour: '08:00', J1: 52, J2: 78, J3: 46, J4: 42 },
    { hour: '09:00', J1: 65, J2: 95, J3: 58, J4: 50 },
    { hour: '10:00', J1: 42, J2: 60, J3: 38, J4: 35 },
    { hour: '11:00', J1: 35, J2: 48, J3: 32, J4: 28 },
    { hour: '12:00', J1: 48, J2: 68, J3: 45, J4: 39 },
    { hour: '13:00', J1: 40, J2: 55, J3: 36, J4: 32 },
  ];

  // 2. Average Delay by Approach over Time (Multi-line chart)
  const delayByApproachData = [
    { time: '08:00', North: 38, South: 22, East: 42, West: 18 },
    { time: '08:15', North: 45, South: 26, East: 52, West: 20 },
    { time: '08:30', North: 58, South: 30, East: 64, West: 24 },
    { time: '08:45', North: 62, South: 34, East: 70, West: 25 },
    { time: '09:00', North: 54, South: 29, East: 58, West: 22 },
    { time: '09:15', North: 42, South: 24, East: 46, West: 19 },
    { time: '09:30', North: 35, South: 20, East: 38, West: 17 },
  ];

  // 3. Green Time Allocation Split per Junction (100% stacked bar)
  const greenSplitData = [
    { junction: 'J1 (West)', NorthSouth: 45, EastWest: 45, YellowClearance: 10 },
    { junction: 'J2 (Central)', NorthSouth: 35, EastWest: 55, YellowClearance: 10 },
    { junction: 'J3 (Hospital)', NorthSouth: 40, EastWest: 50, YellowClearance: 10 },
    { junction: 'J4 (East)', NorthSouth: 48, EastWest: 42, YellowClearance: 10 },
  ];

  // 4. Scatter Plot: Queue Length (m) vs Waiting Time (s)
  const scatterData = [
    { queue: 45, wait: 22, junction: 'J1', type: 'Car' },
    { queue: 60, wait: 29, junction: 'J1', type: 'Truck' },
    { queue: 85, wait: 42, junction: 'J2', type: 'Car' },
    { queue: 110, wait: 58, junction: 'J2', type: 'Bus' },
    { queue: 95, wait: 51, junction: 'J2', type: 'Car' },
    { queue: 52, wait: 26, junction: 'J3', type: 'Bike' },
    { queue: 74, wait: 37, junction: 'J3', type: 'Car' },
    { queue: 40, wait: 19, junction: 'J4', type: 'Car' },
    { queue: 65, wait: 31, junction: 'J4', type: 'Truck' },
  ];

  // CSV Export handler
  const handleExportCsv = () => {
    const headers = [
      'Timestamp',
      'Junction_ID',
      'Junction_Name',
      'Status',
      'Throughput_Veh_Per_Min',
      'Avg_Wait_Sec',
      'Total_Queue_M',
      'North_Queue_Veh',
      'South_Queue_Veh',
      'East_Queue_Veh',
      'West_Queue_Veh',
    ];

    const rows = Object.values(junctions).map((j) => [
      new Date().toISOString(),
      j.id,
      `"${j.name}"`,
      j.status,
      j.throughputVehPerMin,
      j.avgWaitSeconds,
      j.totalQueueM,
      j.approaches.North.queuedVehicles,
      j.approaches.South.queuedVehicles,
      j.approaches.East.queuedVehicles,
      j.approaches.West.queuedVehicles,
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `nagarkaval_traffic_telemetry_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    setExported(true);
    setTimeout(() => setExported(false), 3000);
  };

  return (
    <div className="space-y-6 animate-fadeIn pb-12">
      {/* Top Filter & Export Bar */}
      <div className="bg-[#111A2E] border border-[#1F2A44] rounded-2xl p-4 flex flex-wrap items-center justify-between gap-4 shadow-md">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-[#182642] border border-[#27385E] rounded-xl text-cyan-400">
            <BarChart3 className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-white tracking-tight">
              Historical Corridor Analytics
            </h2>
            <p className="text-xs text-slate-400">
              Corridor performance logs, green wave allocations, and approach delay distributions
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          {/* Time range selector */}
          <div className="flex items-center bg-[#0B1220] border border-[#1F2A44] p-1 rounded-xl text-xs">
            {(['today', 'yesterday', '7days', 'custom'] as const).map((r) => (
              <button
                key={r}
                onClick={() => setTimeRange(r)}
                className={`px-3 py-1.5 rounded-lg capitalize font-medium transition-all ${
                  timeRange === r
                    ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {r === '7days' ? 'Last 7 Days' : r}
              </button>
            ))}
          </div>

          {/* Export CSV button */}
          <button
            onClick={handleExportCsv}
            className="px-4 py-2 bg-[#182642] hover:bg-[#203254] text-cyan-300 border border-cyan-500/40 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all shadow-sm cursor-pointer"
          >
            {exported ? (
              <>
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>Downloaded CSV</span>
              </>
            ) : (
              <>
                <FileSpreadsheet className="w-4 h-4 text-cyan-400" />
                <span>Export Telemetry CSV</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* CHARTS GRID ROW 1: HOURLY VOLUME & AVERAGE DELAY BY APPROACH */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Hourly Traffic Volume by Junction (Stacked Area) */}
        <div className="lg:col-span-6 bg-[#111A2E] border border-[#1F2A44] rounded-2xl p-5 shadow-lg flex flex-col justify-between">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h3 className="text-sm font-bold text-white tracking-tight">
                Hourly Traffic Volume by Node (Area)
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Vehicles per hour across morning ingress and midday peak
              </p>
            </div>
            <Tooltip content="Sum of vehicles clearing cordon stop lines during designated 60-minute windows." iconOnly />
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={hourlyData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="areaJ1" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#38BDF8" stopOpacity={0.8} />
                    <stop offset="95%" stopColor="#38BDF8" stopOpacity={0.05} />
                  </linearGradient>
                  <linearGradient id="areaJ2" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#8B5CF6" stopOpacity={0.8} />
                    <stop offset="95%" stopColor="#8B5CF6" stopOpacity={0.05} />
                  </linearGradient>
                  <linearGradient id="areaJ3" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#22C55E" stopOpacity={0.8} />
                    <stop offset="95%" stopColor="#22C55E" stopOpacity={0.05} />
                  </linearGradient>
                  <linearGradient id="areaJ4" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#F59E0B" stopOpacity={0.8} />
                    <stop offset="95%" stopColor="#F59E0B" stopOpacity={0.05} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1F2A44" vertical={false} />
                <XAxis dataKey="hour" stroke="#64748B" tick={{ fontSize: 11, fill: '#94A3B8' }} />
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
                <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }} />
                <Area type="monotone" dataKey="J1" stackId="1" stroke="#38BDF8" fill="url(#areaJ1)" />
                <Area type="monotone" dataKey="J2" stackId="1" stroke="#8B5CF6" fill="url(#areaJ2)" />
                <Area type="monotone" dataKey="J3" stackId="1" stroke="#22C55E" fill="url(#areaJ3)" />
                <Area type="monotone" dataKey="J4" stackId="1" stroke="#F59E0B" fill="url(#areaJ4)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Delay by Approach Over Time (Multi-line) */}
        <div className="lg:col-span-6 bg-[#111A2E] border border-[#1F2A44] rounded-2xl p-5 shadow-lg flex flex-col justify-between">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h3 className="text-sm font-bold text-white tracking-tight">
                Average Stop Delay by Approach (Seconds)
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Delay trend across North, South, East, and West approaches
              </p>
            </div>
            <Tooltip content="Tracks queue dissipation effectiveness under adaptive vs fixed signal plans." iconOnly />
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={delayByApproachData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1F2A44" vertical={false} />
                <XAxis dataKey="time" stroke="#64748B" tick={{ fontSize: 11, fill: '#94A3B8' }} />
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
                <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }} />
                <Line type="monotone" dataKey="North" stroke="#EF4444" strokeWidth={2} dot={{ r: 3 }} />
                <Line type="monotone" dataKey="South" stroke="#22C55E" strokeWidth={2} dot={{ r: 3 }} />
                <Line type="monotone" dataKey="East" stroke="#F59E0B" strokeWidth={2} dot={{ r: 3 }} />
                <Line type="monotone" dataKey="West" stroke="#38BDF8" strokeWidth={2} dot={{ r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* CHARTS GRID ROW 2: GREEN SPLIT 100% STACKED & SCATTER PLOT */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Green Time Allocation Split per Junction (100% stacked bar) */}
        <div className="lg:col-span-6 bg-[#111A2E] border border-[#1F2A44] rounded-2xl p-5 shadow-lg flex flex-col justify-between">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h3 className="text-sm font-bold text-white tracking-tight">
                Green Phase Split Allocation (% of Cycle)
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Proportion of active green given to North-South vs East-West arterials
              </p>
            </div>
            <Tooltip content="Reflects adaptive green extension: busier arterials receive up to 55% green allocation." iconOnly />
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={greenSplitData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1F2A44" vertical={false} />
                <XAxis dataKey="junction" stroke="#64748B" tick={{ fontSize: 11, fill: '#94A3B8' }} />
                <YAxis stroke="#64748B" tick={{ fontSize: 11, fill: '#94A3B8' }} unit="%" />
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
                <Bar dataKey="NorthSouth" name="North-South Green (%)" stackId="a" fill="#38BDF8" />
                <Bar dataKey="EastWest" name="East-West Green (%)" stackId="a" fill="#22C55E" />
                <Bar dataKey="YellowClearance" name="Yellow Clearance (%)" stackId="a" fill="#F59E0B" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Scatter Plot: Queue Length vs Waiting Time */}
        <div className="lg:col-span-6 bg-[#111A2E] border border-[#1F2A44] rounded-2xl p-5 shadow-lg flex flex-col justify-between">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h3 className="text-sm font-bold text-white tracking-tight">
                Queue Length vs Waiting Time Scatter
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Correlation between physical queue footprint (m) and user wait delay (s)
              </p>
            </div>
            <Tooltip content="Linear regression correlation confirms queue spillback occurs above 80m of queuing." iconOnly />
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <ScatterChart margin={{ top: 10, right: 20, bottom: 10, left: -20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1F2A44" />
                <XAxis
                  type="number"
                  dataKey="queue"
                  name="Queue Length"
                  unit="m"
                  stroke="#64748B"
                  tick={{ fontSize: 11, fill: '#94A3B8' }}
                />
                <YAxis
                  type="number"
                  dataKey="wait"
                  name="Wait Time"
                  unit="s"
                  stroke="#64748B"
                  tick={{ fontSize: 11, fill: '#94A3B8' }}
                />
                <ZAxis range={[60, 200]} />
                <RechartsTooltip
                  cursor={{ strokeDasharray: '3 3' }}
                  contentStyle={{
                    backgroundColor: '#152238',
                    borderColor: '#1F2A44',
                    borderRadius: '0.75rem',
                    color: '#E2E8F0',
                    fontSize: '12px',
                  }}
                />
                <Scatter name="Intersection Observations" data={scatterData} fill="#22D3EE" />
              </ScatterChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};
