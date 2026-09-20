import React, { useState, useEffect, useRef } from 'react';
import {
  Layers,
  Siren,
  AlertTriangle,
  Bus,
  Shield,
  Activity,
  Maximize2,
  Minimize2,
  Info,
  Navigation,
  Sparkles,
  Car,
  Map as MapIcon,
  Cpu,
} from 'lucide-react';
import { useSimulation } from '../../context/SimulationContext';
import { JunctionId, JunctionData } from '../../../shared/types';
import { Tooltip } from '../common/Tooltip';
import { GoogleMapView } from '../common/GoogleMapView';

export const LiveMapScreen: React.FC<{ onSelectJunction: (id: JunctionId) => void }> = ({
  onSelectJunction,
}) => {
  const {
    junctions,
    vehicles,
    ambulanceActive,
    ambulanceProgress,
    dispatchAmbulance,
    cancelAmbulance,
    accidentZones,
    settings,
    simTimeString,
  } = useSimulation();

  // Layer toggles
  const [showDensity, setShowDensity] = useState<boolean>(true);
  const [showAccidents, setShowAccidents] = useState<boolean>(true);
  const [showEmergencyRoute, setShowEmergencyRoute] = useState<boolean>(true);
  const [showBuses, setShowBuses] = useState<boolean>(true);

  // Selected junction popover
  const [activePopoverJunction, setActivePopoverJunction] = useState<JunctionId | null>('J2');
  const [hoveredAccidentZone, setHoveredAccidentZone] = useState<string | null>(null);

  // Google Maps check - default to gmap
  const [mapMode, setMapMode] = useState<'svg' | 'gmap'>('gmap');
  const googleApiKey = settings.googleMapsApiKey || (import.meta as any).env?.VITE_GOOGLE_MAPS_API_KEY || '';

  // Junction coordinate anchors for the schematic map (in percentage: 0 to 100)
  const junctionCoords: Record<JunctionId, { x: number; y: number }> = {
    J1: { x: 22, y: 50 },
    J2: { x: 44, y: 50 },
    J3: { x: 66, y: 50 },
    J4: { x: 88, y: 50 },
  };

  // Ambulance path nodes: Start (North of J1) -> J1 -> J2 -> J3 -> Hospital (South-East of J3)
  const ambulanceRoutePoints = [
    { x: 22, y: 15, label: 'Start (North Base)' },
    { x: 22, y: 50, label: 'J1 (West)' },
    { x: 44, y: 50, label: 'J2 (Central)' },
    { x: 66, y: 50, label: 'J3 (Corridor)' },
    { x: 76, y: 80, label: 'Central Hospital' },
  ];

  // Calculate ambulance position on SVG route
  const getAmbulanceCoordinates = () => {
    const p = Math.min(100, Math.max(0, ambulanceProgress));
    if (p <= 25) {
      // From Start to J1 (y from 15 to 50)
      const ratio = p / 25;
      return { x: 22, y: 15 + ratio * 35 };
    } else if (p <= 55) {
      // From J1 to J2 (x from 22 to 44)
      const ratio = (p - 25) / 30;
      return { x: 22 + ratio * 22, y: 50 };
    } else if (p <= 85) {
      // From J2 to J3 (x from 44 to 66)
      const ratio = (p - 55) / 30;
      return { x: 44 + ratio * 22, y: 50 };
    } else {
      // From J3 to Hospital (x from 66 to 76, y from 50 to 80)
      const ratio = (p - 85) / 15;
      return { x: 66 + ratio * 10, y: 50 + ratio * 30 };
    }
  };

  const ambulancePos = getAmbulanceCoordinates();

  const getStatusColor = (status: JunctionData['status']) => {
    switch (status) {
      case 'Emergency':
        return '#EF4444';
      case 'Congested':
        return '#EF4444';
      case 'Heavy':
        return '#F59E0B';
      case 'Normal':
      default:
        return '#22C55E';
    }
  };

  const getVehicleColor = (type: string, isBus: boolean, busSubtype?: string) => {
    if (type === 'ambulance') return '#EF4444';
    if (type === 'police') return '#3B82F6';
    if (type === 'fire') return '#F97316';
    if (isBus) {
      if (busSubtype === 'school') return '#FACC15';
      if (busSubtype === 'college') return '#FB923C';
      return '#F59E0B';
    }
    if (type === 'truck') return '#A855F7';
    if (type === 'bike') return '#10B981';
    return '#38BDF8'; // car
  };

  return (
    <div className="space-y-4 animate-fadeIn pb-12">
      {/* Top Map Control Bar */}
      <div className="bg-[#111A2E] border border-[#1F2A44] rounded-2xl p-4 flex flex-wrap items-center justify-between gap-4 shadow-md">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-[#182642] border border-[#27385E] rounded-xl text-cyan-400">
            <Layers className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
              Corridor Digital Twin & GIS Map
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-800/60">
                {googleApiKey ? 'Google Maps Mode' : 'Vector Schematic Fallback'}
              </span>
            </h2>
            <p className="text-xs text-slate-400">
              Active tracking of 4 nodes, 50 moving background vehicles, and emergency route
            </p>
          </div>
        </div>

        {/* Layers Toggle Pills */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => setShowDensity(!showDensity)}
            className={`px-3 py-1.5 rounded-xl text-xs font-medium border transition-all cursor-pointer flex items-center gap-1.5 ${
              showDensity
                ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/50 shadow-sm'
                : 'bg-[#0B1220] text-slate-400 border-[#1F2A44]'
            }`}
          >
            <Activity className="w-3.5 h-3.5" />
            Density Heatmap
          </button>

          <button
            onClick={() => setShowAccidents(!showAccidents)}
            className={`px-3 py-1.5 rounded-xl text-xs font-medium border transition-all cursor-pointer flex items-center gap-1.5 ${
              showAccidents
                ? 'bg-amber-500/20 text-amber-300 border-amber-500/50 shadow-sm'
                : 'bg-[#0B1220] text-slate-400 border-[#1F2A44]'
            }`}
          >
            <AlertTriangle className="w-3.5 h-3.5" />
            Accident Hotspots ({accidentZones.length})
          </button>

          <button
            onClick={() => setShowEmergencyRoute(!showEmergencyRoute)}
            className={`px-3 py-1.5 rounded-xl text-xs font-medium border transition-all cursor-pointer flex items-center gap-1.5 ${
              showEmergencyRoute
                ? 'bg-rose-500/20 text-rose-300 border-rose-500/50 shadow-sm'
                : 'bg-[#0B1220] text-slate-400 border-[#1F2A44]'
            }`}
          >
            <Siren className="w-3.5 h-3.5" />
            Emergency Route
          </button>

          <button
            onClick={() => setShowBuses(!showBuses)}
            className={`px-3 py-1.5 rounded-xl text-xs font-medium border transition-all cursor-pointer flex items-center gap-1.5 ${
              showBuses
                ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/50 shadow-sm'
                : 'bg-[#0B1220] text-slate-400 border-[#1F2A44]'
            }`}
          >
            <Bus className="w-3.5 h-3.5" />
            Transit & School Buses
          </button>

          {/* Engine Switcher (Google Maps GIS vs Vector Schematic) */}
          <div className="flex items-center bg-[#0B1220] p-1 rounded-xl border border-[#1F2A44] text-xs">
            <button
              onClick={() => setMapMode('gmap')}
              className={`px-3 py-1.5 rounded-lg font-medium transition-all cursor-pointer flex items-center gap-1.5 ${
                mapMode === 'gmap'
                  ? 'bg-cyan-500 text-slate-950 font-bold shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <MapIcon className="w-3.5 h-3.5" />
              Google Maps (GIS)
            </button>
            <button
              onClick={() => setMapMode('svg')}
              className={`px-3 py-1.5 rounded-lg font-medium transition-all cursor-pointer flex items-center gap-1.5 ${
                mapMode === 'svg'
                  ? 'bg-cyan-500 text-slate-950 font-bold shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Cpu className="w-3.5 h-3.5" />
              Vector Schematic
            </button>
          </div>

          {/* Quick Dispatch button */}
          {ambulanceActive ? (
            <button
              onClick={cancelAmbulance}
              className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-rose-600 hover:bg-rose-500 text-white shadow-md shadow-rose-600/30 flex items-center gap-1.5 cursor-pointer animate-pulse"
            >
              <Siren className="w-3.5 h-3.5" />
              Cancel Ambulance #51
            </button>
          ) : (
            <button
              onClick={dispatchAmbulance}
              className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-cyan-500 hover:bg-cyan-400 text-slate-950 shadow-md shadow-cyan-500/20 flex items-center gap-1.5 cursor-pointer"
            >
              <Siren className="w-3.5 h-3.5 text-rose-900" />
              Dispatch Ambulance #51
            </button>
          )}
        </div>
      </div>

      {/* Main Map Viewport Area (Google Maps GIS vs SVG Digital Twin) */}
      {mapMode === 'gmap' ? (
        <GoogleMapView
          onSelectJunction={onSelectJunction}
          showDensity={showDensity}
          showAccidents={showAccidents}
          showEmergencyRoute={showEmergencyRoute}
          showBuses={showBuses}
          onSwitchToSchematic={() => setMapMode('svg')}
        />
      ) : (
        <div className="relative bg-[#070D18] border border-[#1F2A44] rounded-2xl overflow-hidden shadow-2xl h-[560px] flex items-center justify-center">
        {/* Subtle grid background */}
        <div
          className="absolute inset-0 opacity-15 pointer-events-none"
          style={{
            backgroundImage:
              'radial-gradient(#22D3EE 1px, transparent 1px), radial-gradient(#1E293B 1px, transparent 1px)',
            backgroundSize: '40px 40px',
            backgroundPosition: '0 0, 20px 20px',
          }}
        />

        {/* SVG Schematic Canvas */}
        <svg viewBox="0 0 1000 560" className="w-full h-full select-none">
          <defs>
            {/* Glow filters */}
            <filter id="glow-cyan" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="6" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
            <filter id="glow-red" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="8" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
            <filter id="hotspot-glow" x="-30%" y="-30%" width="160%" height="160%">
              <feGaussianBlur stdDeviation="12" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
            <linearGradient id="roadGrad" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#141E34" />
              <stop offset="50%" stopColor="#1A2846" />
              <stop offset="100%" stopColor="#141E34" />
            </linearGradient>
          </defs>

          {/* MAIN EAST-WEST ARTERIAL HIGHWAY (Corridor) */}
          <rect x="0" y="250" width="1000" height="60" fill="url(#roadGrad)" stroke="#1F2A44" strokeWidth="1.5" />
          {/* Dashed center lane divider */}
          <line
            x1="0"
            y1="280"
            x2="1000"
            y2="280"
            stroke="#EAB308"
            strokeWidth="1.5"
            strokeDasharray="14 10"
            opacity="0.6"
          />

          {/* FOUR CROSS STREETS (North-South approaches) */}
          {(['J1', 'J2', 'J3', 'J4'] as JunctionId[]).map((jid) => {
            const cx = (junctionCoords[jid].x / 100) * 1000;
            return (
              <g key={`road-${jid}`}>
                <rect
                  x={cx - 30}
                  y="0"
                  width="60"
                  height="560"
                  fill="url(#roadGrad)"
                  stroke="#1F2A44"
                  strokeWidth="1.5"
                />
                <line
                  x1={cx}
                  y1="0"
                  x2={cx}
                  y2="560"
                  stroke="#64748B"
                  strokeWidth="1"
                  strokeDasharray="8 8"
                  opacity="0.4"
                />
              </g>
            );
          })}

          {/* Hospital Branch Road from J3 (660, 280) to Hospital (760, 450) */}
          <path
            d="M 660 280 L 660 450 L 780 450"
            fill="none"
            stroke="#1E293B"
            strokeWidth="44"
            strokeLinejoin="round"
            strokeLinecap="round"
          />
          <path
            d="M 660 280 L 660 450 L 780 450"
            fill="none"
            stroke="#2E3E64"
            strokeWidth="2"
            strokeDasharray="6 6"
          />

          {/* Hospital Landmark Building Graphic */}
          <g transform="translate(760, 420)">
            <rect
              x="0"
              y="0"
              width="90"
              height="60"
              rx="10"
              fill="#111E36"
              stroke="#38BDF8"
              strokeWidth="2"
            />
            {/* Red Cross Hospital Badge */}
            <circle cx="24" cy="30" r="14" fill="#EF4444" />
            <rect x="22" y="21" width="4" height="18" fill="#FFFFFF" />
            <rect x="15" y="28" width="18" height="4" fill="#FFFFFF" />
            <text x="44" y="28" fill="#FFFFFF" fontSize="10" fontWeight="bold">
              CENTRAL
            </text>
            <text x="44" y="42" fill="#38BDF8" fontSize="9" fontWeight="600">
              HOSPITAL
            </text>
          </g>

          {/* Ambulance Route Highlight (Glowing red polyline) */}
          {showEmergencyRoute && (
            <g>
              <polyline
                points="220,80 220,280 440,280 660,280 660,450 760,450"
                fill="none"
                stroke="#EF4444"
                strokeWidth="6"
                strokeLinecap="round"
                strokeLinejoin="round"
                opacity="0.85"
                filter="url(#glow-red)"
              />
              <polyline
                points="220,80 220,280 440,280 660,280 660,450 760,450"
                fill="none"
                stroke="#FCA5A5"
                strokeWidth="2"
                strokeDasharray="8 6"
              />
            </g>
          )}

          {/* ACCIDENT-PRONE HOTSPOTS (Heatmap circles with pulse) */}
          {showAccidents &&
            accidentZones.map((zone) => {
              const cx = (zone.xPercent / 100) * 1000;
              const cy = (zone.yPercent / 100) * 560;
              const isHovered = hoveredAccidentZone === zone.id;

              return (
                <g
                  key={zone.id}
                  className="cursor-pointer transition-all"
                  onMouseEnter={() => setHoveredAccidentZone(zone.id)}
                  onMouseLeave={() => setHoveredAccidentZone(null)}
                >
                  {/* Heatmap blur radius */}
                  <circle
                    cx={cx}
                    cy={cy}
                    r={isHovered ? 48 : 34}
                    fill={zone.riskScore > 75 ? '#EF4444' : '#F59E0B'}
                    opacity={isHovered ? 0.35 : 0.2}
                    filter="url(#hotspot-glow)"
                  />
                  <circle
                    cx={cx}
                    cy={cy}
                    r="12"
                    fill="#111A2E"
                    stroke={zone.riskScore > 75 ? '#EF4444' : '#F59E0B'}
                    strokeWidth="2"
                  />
                  <text
                    x={cx}
                    y={cy + 4}
                    textAnchor="middle"
                    fill="#FFFFFF"
                    fontSize="9"
                    fontWeight="bold"
                    fontFamily="monospace"
                  >
                    !
                  </text>

                  {/* Tooltip on hover */}
                  {isHovered && (
                    <g transform={`translate(${cx - 70}, ${cy - 70})`}>
                      <rect
                        width="140"
                        height="55"
                        rx="8"
                        fill="#152238"
                        stroke="#F59E0B"
                        strokeWidth="1.5"
                      />
                      <text x="10" y="18" fill="#F8FAFC" fontSize="10" fontWeight="bold">
                        {zone.name}
                      </text>
                      <text x="10" y="32" fill="#F59E0B" fontSize="9" fontFamily="monospace">
                        Risk Score: {zone.riskScore}/100
                      </text>
                      <text x="10" y="45" fill="#94A3B8" fontSize="8">
                        Historical: {zone.historicalIncidents} collisions
                      </text>
                    </g>
                  )}
                </g>
              );
            })}

          {/* DENSITY CONGESTION OVERLAYS (Per Approach if toggled) */}
          {showDensity &&
            (['J1', 'J2', 'J3', 'J4'] as JunctionId[]).map((jid) => {
              const junc = junctions[jid];
              const cx = (junctionCoords[jid].x / 100) * 1000;
              const cy = 280;

              return (
                <g key={`density-${jid}`} opacity="0.45">
                  {/* North approach density shadow */}
                  {junc.approaches.North.queuedVehicles > 3 && (
                    <rect
                      x={cx - 24}
                      y={cy - 120}
                      width="48"
                      height="90"
                      fill="#EF4444"
                      rx="6"
                      filter="url(#glow-cyan)"
                    />
                  )}
                  {/* East approach density shadow */}
                  {junc.approaches.East.queuedVehicles > 3 && (
                    <rect
                      x={cx + 30}
                      y={cy - 24}
                      width="90"
                      height="48"
                      fill="#F59E0B"
                      rx="6"
                      filter="url(#glow-cyan)"
                    />
                  )}
                </g>
              );
            })}

          {/* 50 BACKGROUND VEHICLE DOTS MOVING ON LANES */}
          {vehicles.map((v, i) => {
            const jCoord = junctionCoords[v.junctionId];
            const jx = (jCoord.x / 100) * 1000;
            const jy = 280;

            let vx = jx;
            let vy = jy;

            const distFromCenter = (1 - v.positionRatio) * 130 + 35;

            if (v.approach === 'North') {
              vx = jx - 8;
              vy = jy - distFromCenter;
            } else if (v.approach === 'South') {
              vx = jx + 8;
              vy = jy + distFromCenter;
            } else if (v.approach === 'East') {
              vx = jx + distFromCenter;
              vy = jy - 8;
            } else {
              vx = jx - distFromCenter;
              vy = jy + 8;
            }

            const isBus = v.type === 'bus';
            if (isBus && !showBuses) return null;

            const color = getVehicleColor(v.type, isBus, v.busSubtype);

            return (
              <g key={v.id}>
                <circle
                  cx={vx}
                  cy={vy}
                  r={isBus ? 5 : v.type === 'truck' ? 5.5 : v.type === 'bike' ? 2.5 : 3.5}
                  fill={color}
                  stroke="#0B1220"
                  strokeWidth="1"
                />
                {isBus && (
                  <circle cx={vx} cy={vy} r="8" fill="none" stroke={color} strokeWidth="1" opacity="0.6" />
                )}
              </g>
            );
          })}

          {/* FLASHING AMBULANCE #51 (Vehicle #51) */}
          {ambulanceActive && (
            <g transform={`translate(${(ambulancePos.x / 100) * 1000}, ${(ambulancePos.y / 100) * 560})`}>
              {/* Radar pulse ripples */}
              <circle cx="0" cy="0" r="24" fill="#EF4444" opacity="0.2" className="animate-ping" />
              <circle cx="0" cy="0" r="14" fill="#111A2E" stroke="#EF4444" strokeWidth="2.5" />
              {/* Flashing blue and red siren lights */}
              <circle cx="-4" cy="-4" r="3" fill="#38BDF8" className="animate-pulse" />
              <circle cx="4" cy="4" r="3" fill="#EF4444" className="animate-pulse" />
              <text
                x="0"
                y="-18"
                textAnchor="middle"
                fill="#EF4444"
                fontSize="10"
                fontWeight="bold"
                fontFamily="monospace"
              >
                AMBULANCE #51
              </text>
            </g>
          )}

          {/* 4 JUNCTION NODES WITH STATUS COLORS & CLICK TRIGGER */}
          {(['J1', 'J2', 'J3', 'J4'] as JunctionId[]).map((jid) => {
            const junc = junctions[jid];
            const cx = (junctionCoords[jid].x / 100) * 1000;
            const cy = 280;
            const color = getStatusColor(junc.status);
            const isEmergency = junc.status === 'Emergency';
            const isSelected = activePopoverJunction === jid;

            return (
              <g
                key={jid}
                onClick={() => setActivePopoverJunction(jid)}
                className="cursor-pointer group"
              >
                {/* Status Glow halo */}
                <circle
                  cx={cx}
                  cy={cy}
                  r={isEmergency ? 38 : isSelected ? 32 : 26}
                  fill={color}
                  opacity={isEmergency ? 0.35 : 0.18}
                  className={isEmergency ? 'animate-pulse' : ''}
                />

                {/* Node Box */}
                <rect
                  x={cx - 20}
                  y={cy - 20}
                  width="40"
                  height="40"
                  rx="10"
                  fill="#0E1729"
                  stroke={color}
                  strokeWidth={isEmergency ? 3 : 2}
                  className="transition-all group-hover:stroke-cyan-300"
                />

                {/* Junction Label & Countdown */}
                <text
                  x={cx}
                  y={cy - 2}
                  textAnchor="middle"
                  fill="#FFFFFF"
                  fontSize="11"
                  fontWeight="bold"
                  fontFamily="monospace"
                >
                  {jid}
                </text>
                <text
                  x={cx}
                  y={cy + 12}
                  textAnchor="middle"
                  fill={color}
                  fontSize="9"
                  fontWeight="600"
                  fontFamily="monospace"
                >
                  {junc.phaseCountdown}s
                </text>

                {/* Status Indicator Tag */}
                <rect
                  x={cx - 28}
                  y={cy + 26}
                  width="56"
                  height="16"
                  rx="4"
                  fill="#111A2E"
                  stroke="#1F2A44"
                />
                <text
                  x={cx}
                  y={cy + 38}
                  textAnchor="middle"
                  fill="#94A3B8"
                  fontSize="8"
                  fontWeight="bold"
                  fontFamily="monospace"
                >
                  {junc.status}
                </text>
              </g>
            );
          })}
        </svg>

        {/* Selected Junction Floating Detail Popover */}
        {activePopoverJunction && (
          <div className="absolute top-4 right-4 z-20 w-72 bg-[#111A2E]/95 backdrop-blur-md border border-[#1F2A44] rounded-2xl p-4 shadow-2xl animate-fadeIn">
            <div className="flex items-center justify-between pb-2 mb-2 border-b border-[#1F2A44]">
              <div>
                <span className="text-[10px] font-mono text-cyan-400 font-bold">
                  {activePopoverJunction} TELEMETRY
                </span>
                <h4 className="text-sm font-bold text-white tracking-tight">
                  {junctions[activePopoverJunction].name}
                </h4>
              </div>
              <button
                onClick={() => setActivePopoverJunction(null)}
                className="text-slate-400 hover:text-white text-xs px-1.5 py-0.5 rounded hover:bg-slate-800"
              >
                ✕
              </button>
            </div>

            <div className="space-y-2 text-xs">
              <div className="flex justify-between items-center bg-[#0B1220] p-2 rounded-xl border border-[#1F2A44]">
                <span className="text-slate-400">Node Status</span>
                <span
                  className="font-mono font-bold px-2 py-0.5 rounded text-[10px]"
                  style={{
                    backgroundColor: `${getStatusColor(junctions[activePopoverJunction].status)}20`,
                    color: getStatusColor(junctions[activePopoverJunction].status),
                  }}
                >
                  {junctions[activePopoverJunction].status}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2 text-[11px] font-mono">
                <div className="bg-[#0B1220] p-2 rounded-xl border border-[#1F2A44]">
                  <span className="text-slate-500 block text-[9px] uppercase">Avg Wait</span>
                  <span className="text-white font-bold text-sm">
                    {junctions[activePopoverJunction].avgWaitSeconds}s
                  </span>
                </div>
                <div className="bg-[#0B1220] p-2 rounded-xl border border-[#1F2A44]">
                  <span className="text-slate-500 block text-[9px] uppercase">Total Queue</span>
                  <span className="text-white font-bold text-sm">
                    {junctions[activePopoverJunction].totalQueueM}m
                  </span>
                </div>
              </div>

              <div className="bg-[#0B1220] p-2 rounded-xl border border-[#1F2A44] space-y-1">
                <div className="flex justify-between text-[11px]">
                  <span className="text-slate-400">Phase State</span>
                  <span className="text-cyan-300 font-mono">
                    {junctions[activePopoverJunction].currentPhase.replace('_', ' ')}
                  </span>
                </div>
                <div className="flex justify-between text-[11px]">
                  <span className="text-slate-400">Phase Countdown</span>
                  <span className="text-emerald-400 font-mono font-bold">
                    {junctions[activePopoverJunction].phaseCountdown}s remaining
                  </span>
                </div>
              </div>

              <button
                onClick={() => onSelectJunction(activePopoverJunction)}
                className="w-full mt-2 py-2 text-xs font-semibold text-cyan-300 bg-cyan-950/80 hover:bg-cyan-900 border border-cyan-700/60 rounded-xl transition-all flex items-center justify-center gap-1 cursor-pointer"
              >
                Open Node In Junctions Studio
                <Navigation className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}

        {/* Map Legend Overlay (Bottom-left) */}
        <div className="absolute bottom-4 left-4 z-10 bg-[#111A2E]/90 backdrop-blur-md border border-[#1F2A44] rounded-xl p-3 text-[11px] shadow-lg flex flex-col gap-1.5 max-w-xs">
          <span className="text-[10px] font-mono text-slate-400 uppercase font-semibold">
            Corridor Legend
          </span>
          <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-[10px]">
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-[#22C55E]" />
              Normal Node (&lt;30s)
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-[#F59E0B]" />
              Heavy Node (30-60s)
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-[#EF4444]" />
              Congested Node (&gt;60s)
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-[#38BDF8]" />
              Cars / Bikes / Trucks
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-[#FACC15]" />
              School / Transit Bus
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-[#EF4444] animate-pulse" />
              Ambulance #51
            </span>
          </div>
        </div>
      </div>
      )}

      {/* Mini Timeline at bottom */}
      <div className="bg-[#111A2E] border border-[#1F2A44] rounded-2xl p-3.5 flex items-center justify-between text-xs">
        <div className="flex items-center gap-3">
          <span className="text-slate-400 font-mono text-xs flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
            Corridor Wave Sync:
          </span>
          <span className="font-mono text-white font-medium">J1 (0s) → J2 (+12s) → J3 (+24s) → J4 (+36s)</span>
        </div>
        <div className="flex items-center gap-4 text-slate-400 text-xs">
          <span>Clock: <strong className="text-cyan-300 font-mono">{simTimeString}</strong></span>
          <span>Simulation Mode: <strong className="text-emerald-400 font-mono">Continuous 1s Loop</strong></span>
        </div>
      </div>
    </div>
  );
};
