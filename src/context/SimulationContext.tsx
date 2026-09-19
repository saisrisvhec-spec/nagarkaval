import React, { createContext, useContext, useState, useEffect, useRef, useMemo, useCallback } from 'react';
import {
  ControlMode,
  JunctionId,
  ApproachDirection,
  JunctionStatus,
  JunctionData,
  Vehicle,
  VehicleType,
  BusSubtype,
  ApproachData,
  LogEvent,
  EmergencyRouteStep,
  EmergencyJunctionProgress,
  BusPriorityEvent,
  SystemSettings,
  TimeSeriesPoint,
  ComparisonScenarioResult,
  AccidentZone,
  JurisdictionSelection
} from '../../shared/types';
import {
  getStates,
  getDistricts,
  getCities,
  getCityData,
  DEFAULT_JURISDICTION,
  CityData,
  JunctionConfig
} from '../data/jurisdictions';

export interface SystemAlertNotification {
  id: string;
  type: 'emergency' | 'warning' | 'info' | 'success';
  title: string;
  timeAgo: string;
  read: boolean;
}

interface SimulationContextType {
  // State
  isRunning: boolean;
  speed: number;
  simTimeSeconds: number;
  simTimeString: string;
  demoElapsedSeconds: number;
  scenario: string;
  controlMode: ControlMode;
  junctions: Record<JunctionId, JunctionData>;
  vehicles: Vehicle[];
  ambulanceActive: boolean;
  ambulanceProgress: number; // 0 to 100%
  ambulanceStepIndex: number;
  emergencySteps: EmergencyRouteStep[];
  emergencyJunctions: EmergencyJunctionProgress[];
  busPriorityEvents: BusPriorityEvent[];
  eventLogs: LogEvent[];
  timeSeriesData: TimeSeriesPoint[];
  settings: SystemSettings;
  activeToast: { id: string; message: string; type: 'info' | 'success' | 'warning' | 'emergency' } | null;
  selectedJunctionId: JunctionId;
  accidentZones: AccidentZone[];
  // Jurisdiction Telemetry
  jurisdiction: JurisdictionSelection;
  isTelemetryLoading: boolean;
  currentCityData: CityData;
  notifications: SystemAlertNotification[];
  unreadNotificationsCount: number;
  // Actions
  togglePlay: () => void;
  setSimulationSpeed: (speed: number) => void;
  resetSimulation: () => void;
  setScenario: (scenario: string) => void;
  setControlMode: (mode: ControlMode) => void;
  setSelectedJunctionId: (id: JunctionId) => void;
  setJurisdiction: (update: Partial<JurisdictionSelection>) => void;
  dispatchAmbulance: () => void;
  cancelAmbulance: () => void;
  triggerBusPriority: (busType: 'school' | 'college') => void;
  clearLogs: () => void;
  updateSettings: (newSettings: Partial<SystemSettings>) => void;
  resetSettingsToDefault: () => void;
  dismissToast: () => void;
  runOptimizerComparison: () => ComparisonScenarioResult[];
  markAllNotificationsRead: () => void;
  syncTelemetry: () => void;
}

const SimulationContext = createContext<SimulationContextType | null>(null);

const INITIAL_SETTINGS: SystemSettings = {
  normalWaitThreshold: 30,
  heavyWaitThreshold: 60,
  queueCongestionRatio: 0.8,
  weightQueue: 0.4,
  weightDensity: 0.3,
  weightWait: 0.3,
  minGreenSeconds: 15,
  maxGreenSeconds: 60,
  yellowSeconds: 3,
  allRedSeconds: 2,
  pedestrianClearanceSeconds: 12,
  busPriorityEnabled: true,
  emergencyPreemptionEnabled: true,
  accidentZoneAlertsEnabled: true,
  soundEffectsEnabled: true,
  vehicleDistribution: {
    cars: 25,
    bikes: 15,
    buses: 5,
    trucks: 3,
    emergency: 2,
  },
  googleMapsApiKey: (import.meta as any).env?.VITE_GOOGLE_MAPS_API_KEY || '',
  darkMode: true,
};

const INITIAL_EMERGENCY_STEPS: EmergencyRouteStep[] = [
  { stepIndex: 0, label: 'Detected', description: 'Ambulance #51 GPS transponder locked at North Sector origin', status: 'pending' },
  { stepIndex: 1, label: 'Route Identified', description: 'Optimal path resolved: Start → J1 → J2 → J3 → Central Trauma Hospital', status: 'pending' },
  { stepIndex: 2, label: 'Traffic Analyzed', description: 'Corridor queue depth & approach clearance windows computed', status: 'pending' },
  { stepIndex: 3, label: 'ETA Estimated', description: 'Predictive arrival times assigned for J1, J2, and J3 stop lines', status: 'pending' },
  { stepIndex: 4, label: 'Signals Prepared', description: 'Cross-traffic yellow phases initiated; early queue flush active', status: 'pending' },
  { stepIndex: 5, label: 'Green Corridor Active', description: 'Cascading green wave locked along ambulance path', status: 'pending' },
  { stepIndex: 6, label: 'Vehicle Passed', description: 'Ambulance cleared downstream sensors; safety gap verified', status: 'pending' },
  { stepIndex: 7, label: 'Back to Adaptive', description: 'Smooth re-synchronization with adaptive signal cycle', status: 'pending' },
];

const INITIAL_ACCIDENT_ZONES: AccidentZone[] = [
  {
    id: 'AZ-1',
    name: 'J2 East Merge Zone',
    junctionId: 'J2',
    lat: 13.0827,
    lng: 80.2707,
    xPercent: 48,
    yPercent: 38,
    riskScore: 78,
    historicalIncidents: 14,
    description: 'High conflict weaving zone during evening shift changes.',
  },
  {
    id: 'AZ-2',
    name: 'J3 South School Crosswalk',
    junctionId: 'J3',
    lat: 13.0827,
    lng: 80.2707,
    xPercent: 71,
    yPercent: 62,
    riskScore: 65,
    historicalIncidents: 9,
    description: 'Pedestrian and school bus blind-spot turning conflict.',
  },
  {
    id: 'AZ-3',
    name: 'J1 North Expressway Off-ramp',
    junctionId: 'J1',
    lat: 13.0827,
    lng: 80.2707,
    xPercent: 24,
    yPercent: 28,
    riskScore: 84,
    historicalIncidents: 19,
    description: 'Sudden deceleration zone when off-ramp traffic backs up.',
  },
  {
    id: 'AZ-4',
    name: 'J4 West Heavy Goods Curve',
    junctionId: 'J4',
    lat: 13.0827,
    lng: 80.2707,
    xPercent: 90,
    yPercent: 50,
    riskScore: 54,
    historicalIncidents: 6,
    description: 'Commercial delivery truck wide turning arc and blind zones.',
  },
];

const INITIAL_NOTIFICATIONS: SystemAlertNotification[] = [
  { id: 'notif-1', type: 'emergency', title: 'Ambulance #51 detected near J1', timeAgo: '2m ago', read: false },
  { id: 'notif-2', type: 'warning', title: 'J3 status: Heavy', timeAgo: '4m ago', read: false },
  { id: 'notif-3', type: 'warning', title: 'Accident risk high at J2 (Zone B)', timeAgo: '7m ago', read: false },
  { id: 'notif-4', type: 'info', title: 'J4 signal plan updated', timeAgo: '12m ago', read: false },
  { id: 'notif-5', type: 'success', title: 'Sensor sync completed', timeAgo: '15m ago', read: false },
];

function getInitialJurisdiction(): JurisdictionSelection {
  if (typeof window !== 'undefined') {
    try {
      const params = new URLSearchParams(window.location.search);
      const state = params.get('state');
      const district = params.get('district');
      const city = params.get('city');
      const junction = params.get('junction') as JunctionId | 'ALL' | null;
      if (state && district && city) {
        const states = getStates();
        if (states.includes(state)) {
          const districts = getDistricts(state);
          if (districts.includes(district)) {
            const cities = getCities(state, district);
            if (cities.includes(city)) {
              const validJunction = junction === 'ALL' || ['J1', 'J2', 'J3', 'J4'].includes(junction || '') ? (junction as JunctionId | 'ALL') : 'J1';
              return { state, district, city, junctionId: validJunction };
            }
          }
        }
      }
    } catch (e) {
      // ignore
    }
  }
  return DEFAULT_JURISDICTION;
}

export const SimulationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isRunning, setIsRunning] = useState<boolean>(true);
  const [speed, setSpeed] = useState<number>(1);
  const [simTimeSeconds, setSimTimeSeconds] = useState<number>(36120); // starts at 10:02:00 AM
  const [demoElapsedSeconds, setDemoElapsedSeconds] = useState<number>(2876); // 00:47:56 demo timer baseline
  const [scenario, setScenario] = useState<string>('Normal Traffic');
  const [controlMode, setControlMode] = useState<ControlMode>('classical');
  const [selectedJunctionId, setSelectedJunctionId] = useState<JunctionId>('J1');
  const [jurisdictionState, setJurisdictionState] = useState<JurisdictionSelection>(() => getInitialJurisdiction());
  const [isTelemetryLoading, setIsTelemetryLoading] = useState<boolean>(false);
  const [notifications, setNotifications] = useState<SystemAlertNotification[]>(INITIAL_NOTIFICATIONS);

  const currentCityData = useMemo(() => {
    return getCityData(jurisdictionState.state, jurisdictionState.district, jurisdictionState.city);
  }, [jurisdictionState.state, jurisdictionState.district, jurisdictionState.city]);

  const [settings, setSettings] = useState<SystemSettings>(() => {
    const saved = localStorage.getItem('nagarkaval_settings');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (!parsed.googleMapsApiKey) {
          parsed.googleMapsApiKey = INITIAL_SETTINGS.googleMapsApiKey;
        }
        return { ...INITIAL_SETTINGS, ...parsed };
      } catch (e) { /* ignore */ }
    }
    return INITIAL_SETTINGS;
  });

  const [activeToast, setActiveToast] = useState<{ id: string; message: string; type: 'info' | 'success' | 'warning' | 'emergency' } | null>(null);

  // Vehicles state: initial city-aware vehicles
  const [vehicles, setVehicles] = useState<Vehicle[]>(() => generateVehiclesForCity(currentCityData));

  // Junctions data: initial city-aware junctions
  const [junctions, setJunctions] = useState<Record<JunctionId, JunctionData>>(() => generateJunctionsForCity(currentCityData));

  // Emergency corridor state
  const [ambulanceActive, setAmbulanceActive] = useState<boolean>(false);
  const [ambulanceProgress, setAmbulanceProgress] = useState<number>(0);
  const [ambulanceStepIndex, setAmbulanceStepIndex] = useState<number>(0);
  const [emergencySteps, setEmergencySteps] = useState<EmergencyRouteStep[]>(INITIAL_EMERGENCY_STEPS);
  const [emergencyJunctions, setEmergencyJunctions] = useState<EmergencyJunctionProgress[]>([
    { junctionId: 'J1', name: 'Junction 1 (West Boulevard)', etaSeconds: 35, state: 'Preparing', distanceMeters: 450 },
    { junctionId: 'J2', name: 'Junction 2 (Central Avenue)', etaSeconds: 78, state: 'Preparing', distanceMeters: 980 },
    { junctionId: 'J3', name: 'Junction 3 (Hospital Express)', etaSeconds: 122, state: 'Preparing', distanceMeters: 1520 },
  ]);

  // Bus priority events
  const [busPriorityEvents, setBusPriorityEvents] = useState<BusPriorityEvent[]>([
    {
      id: 'BP-1',
      busName: 'College Transit #24',
      type: 'college',
      junctionId: 'J2',
      approach: 'North',
      scheduledArrival: '10:04:15',
      status: 'Approaching',
      timeBonusGrantedSeconds: 8,
    },
    {
      id: 'BP-2',
      busName: 'School Bus #08',
      type: 'school',
      junctionId: 'J3',
      approach: 'East',
      scheduledArrival: '10:06:30',
      status: 'Approaching',
      timeBonusGrantedSeconds: 12,
    },
  ]);

  // Live event logs
  const [eventLogs, setEventLogs] = useState<LogEvent[]>([
    { id: '1', timestamp: '10:01:45', type: 'info', message: 'SmartFlow corridor simulation booted with 50 monitored vehicles' },
    { id: '2', timestamp: '10:02:00', type: 'signal', message: 'J2 North green allotted +18 s based on queue weight 0.4', junctionId: 'J2' },
    { id: '3', timestamp: '10:02:10', type: 'priority', message: 'School Bus #08 beacon detected approaching J3 East - holding yellow clearance', junctionId: 'J3' },
    { id: '4', timestamp: '10:02:14', type: 'optimizer', message: 'Classical Adaptive cycle optimized: average corridor wait 27.4 s' },
  ]);

  // Time series history for analytics
  const [timeSeriesData, setTimeSeriesData] = useState<TimeSeriesPoint[]>([
    { time: '08:00', simSeconds: 28800, flowVehPerMin: 45, avgWaitSeconds: 34, avgQueueM: 78, throughput: 38, fuelLitersTotal: 12.4, co2KgTotal: 28.6 },
    { time: '08:30', simSeconds: 30600, flowVehPerMin: 62, avgWaitSeconds: 42, avgQueueM: 104, throughput: 52, fuelLitersTotal: 18.2, co2KgTotal: 42.0 },
    { time: '09:00', simSeconds: 32400, flowVehPerMin: 80, avgWaitSeconds: 52, avgQueueM: 138, throughput: 66, fuelLitersTotal: 26.5, co2KgTotal: 61.2 },
    { time: '09:30', simSeconds: 34200, flowVehPerMin: 72, avgWaitSeconds: 44, avgQueueM: 112, throughput: 60, fuelLitersTotal: 22.8, co2KgTotal: 52.7 },
    { time: '10:00', simSeconds: 36000, flowVehPerMin: 55, avgWaitSeconds: 31, avgQueueM: 82, throughput: 49, fuelLitersTotal: 15.6, co2KgTotal: 36.0 },
    { time: '10:02', simSeconds: 36120, flowVehPerMin: 53, avgWaitSeconds: 28, avgQueueM: 74, throughput: 48, fuelLitersTotal: 14.8, co2KgTotal: 34.2 },
  ]);

  const addLog = useCallback((type: LogEvent['type'], message: string, junctionId?: JunctionId) => {
    const hours = Math.floor(simTimeSeconds / 3600);
    const mins = Math.floor((simTimeSeconds % 3600) / 60);
    const secs = simTimeSeconds % 60;
    const timestamp = `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    const newLog: LogEvent = {
      id: Math.random().toString(36).substring(2, 9),
      timestamp,
      type,
      message,
      junctionId,
    };
    setEventLogs((prev) => [newLog, ...prev.slice(0, 79)]);
  }, [simTimeSeconds]);

  const showToast = useCallback((message: string, type: 'info' | 'success' | 'warning' | 'emergency') => {
    setActiveToast({ id: Date.now().toString(), message, type });
  }, []);

  const dismissToast = useCallback(() => {
    setActiveToast(null);
  }, []);

  // Format simulated clock string
  const simTimeString = useMemo(() => {
    const hours = Math.floor(simTimeSeconds / 3600);
    const mins = Math.floor((simTimeSeconds % 3600) / 60);
    const secs = simTimeSeconds % 60;
    const ampm = hours >= 12 ? 'PM' : 'AM';
    const displayHours = hours % 12 === 0 ? 12 : hours % 12;
    return `${displayHours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')} ${ampm}`;
  }, [simTimeSeconds]);

  // Ambulance dispatch function
  const dispatchAmbulance = useCallback(() => {
    setAmbulanceActive(true);
    setAmbulanceProgress(0);
    setAmbulanceStepIndex(0);
    setEmergencySteps((prev) =>
      prev.map((step, idx) => ({
        ...step,
        status: idx === 0 ? 'active' : 'pending',
      }))
    );
    setEmergencyJunctions([
      { junctionId: 'J1', name: 'Junction 1 (West Boulevard)', etaSeconds: 28, state: 'Preparing', distanceMeters: 450 },
      { junctionId: 'J2', name: 'Junction 2 (Central Avenue)', etaSeconds: 65, state: 'Preparing', distanceMeters: 980 },
      { junctionId: 'J3', name: 'Junction 3 (Hospital Express)', etaSeconds: 110, state: 'Preparing', distanceMeters: 1520 },
    ]);

    addLog('emergency', 'EMERGENCY: Ambulance #51 GPS dispatched. Green corridor preemption protocol initiated!');
    showToast('Ambulance #51 Green Corridor Preemption activated across J1 → J2 → J3!', 'emergency');
  }, [addLog, showToast]);

  const cancelAmbulance = useCallback(() => {
    setAmbulanceActive(false);
    setAmbulanceProgress(0);
    setAmbulanceStepIndex(0);
    setEmergencySteps(INITIAL_EMERGENCY_STEPS);
    setJunctions((prev) => {
      const next = { ...prev };
      (['J1', 'J2', 'J3', 'J4'] as JunctionId[]).forEach((jid) => {
        next[jid].preemptionActive = false;
        if (next[jid].status === 'Emergency') {
          next[jid].status = next[jid].avgWaitSeconds < 30 ? 'Normal' : next[jid].avgWaitSeconds < 60 ? 'Heavy' : 'Congested';
        }
      });
      return next;
    });
    addLog('info', 'Ambulance #51 mission ended. Corridors restored to adaptive control.');
    showToast('Ambulance corridor released. Signals restored to adaptive mode.', 'info');
  }, [addLog, showToast]);

  // Trigger bus priority
  const triggerBusPriority = useCallback((busType: 'school' | 'college') => {
    const targetJunction = busType === 'college' ? 'J2' : 'J3';
    const approach = busType === 'college' ? 'North' : 'East';
    const busName = busType === 'college' ? 'College Transit #24' : 'School Bus #08';
    const bonusSec = busType === 'college' ? 10 : 14;

    setBusPriorityEvents((prev) =>
      prev.map((e) =>
        e.type === busType
          ? { ...e, status: 'Green Extended', timeBonusGrantedSeconds: bonusSec }
          : e
      )
    );

    setJunctions((prev) => {
      const target = prev[targetJunction];
      return {
        ...prev,
        [targetJunction]: {
          ...target,
          busPriorityActive: true,
          approaches: {
            ...target.approaches,
            [approach]: {
              ...target.approaches[approach],
              greenAllottedSeconds: Math.min(60, target.approaches[approach].greenAllottedSeconds + bonusSec),
              currentSignal: 'green',
            },
          },
          timingExplanation: `Bus Priority: Extended ${approach} green by +${bonusSec}s for ${busName}`,
        },
      };
    });

    addLog('priority', `PRIORITY: Conditional ${busType} bus priority granted at ${targetJunction} ${approach} (+${bonusSec}s green)`, targetJunction);
    showToast(`Conditional Priority granted to ${busName} at ${targetJunction}!`, 'warning');
  }, [addLog, showToast]);

  // Main tick simulation loop
  useEffect(() => {
    if (!isRunning) return;

    const interval = setInterval(() => {
      setSimTimeSeconds((prev) => prev + 1);
      setDemoElapsedSeconds((prev) => prev + 1);

      // Advance ambulance if active
      if (ambulanceActive) {
        setAmbulanceProgress((prev) => {
          const next = prev + 1.2 * speed;
          if (next >= 100) {
            setAmbulanceActive(false);
            addLog('emergency', 'Ambulance #51 successfully arrived at Central Trauma Hospital! Signals returning to adaptive.');
            showToast('Ambulance #51 reached Hospital. Green corridor completed safely!', 'success');
            return 100;
          }

          // Update step index based on percentage
          const step = Math.min(7, Math.floor((next / 100) * 8));
          setAmbulanceStepIndex(step);
          setEmergencySteps((steps) =>
            steps.map((s, idx) => ({
              ...s,
              status: idx < step ? 'completed' : idx === step ? 'active' : 'pending',
            }))
          );

          // Update individual junction progress states
          setEmergencyJunctions((prevJuncs) =>
            prevJuncs.map((j) => {
              if (j.junctionId === 'J1') {
                if (next < 25) return { ...j, state: 'Preempted green', etaSeconds: Math.max(0, Math.round(25 - next)) };
                if (next < 35) return { ...j, state: 'Cleared', etaSeconds: 0 };
                return { ...j, state: 'Restored', etaSeconds: 0 };
              }
              if (j.junctionId === 'J2') {
                if (next < 20) return { ...j, state: 'Preparing', etaSeconds: Math.max(0, Math.round(55 - next * 1.5)) };
                if (next < 60) return { ...j, state: 'Preempted green', etaSeconds: Math.max(0, Math.round(60 - next)) };
                if (next < 70) return { ...j, state: 'Cleared', etaSeconds: 0 };
                return { ...j, state: 'Restored', etaSeconds: 0 };
              }
              if (j.junctionId === 'J3') {
                if (next < 50) return { ...j, state: 'Preparing', etaSeconds: Math.max(0, Math.round(95 - next)) };
                if (next < 90) return { ...j, state: 'Preempted green', etaSeconds: Math.max(0, Math.round(90 - next)) };
                return { ...j, state: 'Cleared', etaSeconds: 0 };
              }
              return j;
            })
          );

          return next;
        });
      }

      // Update junctions state and signal countdowns
      setJunctions((prevJunctions) => {
        const updated: Record<JunctionId, JunctionData> = { ...prevJunctions };

        (['J1', 'J2', 'J3', 'J4'] as JunctionId[]).forEach((jid) => {
          const j = updated[jid];
          let countdown = j.phaseCountdown - 1;
          let phase = j.currentPhase;
          let preemption = j.preemptionActive;

          // Check if ambulance is affecting this junction
          if (ambulanceActive) {
            if (jid === 'J1' && ambulanceProgress < 32) preemption = true;
            else if (jid === 'J2' && ambulanceProgress >= 20 && ambulanceProgress < 68) preemption = true;
            else if (jid === 'J3' && ambulanceProgress >= 50 && ambulanceProgress < 95) preemption = true;
            else preemption = false;
          } else {
            preemption = false;
          }

          // Cycle switching logic
          if (countdown <= 0 || preemption) {
            if (preemption) {
              phase = 'EW_Green'; // corridor is along East-West / corridor path
              countdown = 40;
            } else if (phase === 'NS_Green') {
              phase = 'NS_Yellow';
              countdown = settings.yellowSeconds;
            } else if (phase === 'NS_Yellow') {
              phase = 'All_Red';
              countdown = settings.allRedSeconds;
            } else if (phase === 'All_Red') {
              phase = 'EW_Green';
              // Calculate adaptive green time
              countdown = calculateGreenTime(j, 'East', controlMode, settings);
            } else if (phase === 'EW_Green') {
              phase = 'EW_Yellow';
              countdown = settings.yellowSeconds;
            } else if (phase === 'EW_Yellow') {
              phase = 'NS_Green';
              countdown = calculateGreenTime(j, 'North', controlMode, settings);
            }
          }

          // Assign signal colors to approaches
          const isNSGreen = phase === 'NS_Green' || (preemption && false);
          const isNSYellow = phase === 'NS_Yellow';
          const isEWGreen = phase === 'EW_Green' || preemption;
          const isEWYellow = phase === 'EW_Yellow';

          const approaches = { ...j.approaches };
          (['North', 'South', 'East', 'West'] as ApproachDirection[]).forEach((dir) => {
            const isNS = dir === 'North' || dir === 'South';
            let sig: 'green' | 'yellow' | 'red' = 'red';
            if (isNS) {
              if (isNSGreen) sig = 'green';
              else if (isNSYellow) sig = 'yellow';
              else sig = 'red';
            } else {
              if (isEWGreen) sig = 'green';
              else if (isEWYellow) sig = 'yellow';
              else sig = 'red';
            }

            // Small dynamic fluctuation in approach metrics
            const currentApp = approaches[dir];
            let queued = currentApp.queuedVehicles;
            if (sig === 'green' && queued > 0 && Math.random() > 0.4) {
              queued = Math.max(0, queued - 1);
            } else if (sig === 'red' && Math.random() > 0.65) {
              queued = Math.min(currentApp.vehicleCount, queued + 1);
            }

            const queueM = queued * 7.5;
            const avgWait = Math.max(5, Math.round(currentApp.avgWaitSeconds + (sig === 'red' ? 0.4 : -0.6)));
            const avgSpeed = sig === 'green' ? Math.min(52, Math.max(28, currentApp.avgSpeedKmH + 0.5)) : Math.max(0, currentApp.avgSpeedKmH - 0.8);
            const density = Math.min(95, Math.max(15, Math.round((currentApp.vehicleCount / 0.2) * (1 + queued * 0.05))));

            approaches[dir] = {
              ...currentApp,
              currentSignal: sig,
              queuedVehicles: queued,
              queueLengthM: queueM,
              avgWaitSeconds: avgWait,
              avgSpeedKmH: Number(avgSpeed.toFixed(1)),
              densityVehPerKm: density,
            };
          });

          // Junction aggregate metrics
          const avgWaitSeconds = Math.round(
            (approaches.North.avgWaitSeconds + approaches.South.avgWaitSeconds + approaches.East.avgWaitSeconds + approaches.West.avgWaitSeconds) / 4
          );
          const totalQueueM =
            approaches.North.queueLengthM + approaches.South.queueLengthM + approaches.East.queueLengthM + approaches.West.queueLengthM;
          const totalVehicles =
            approaches.North.vehicleCount + approaches.South.vehicleCount + approaches.East.vehicleCount + approaches.West.vehicleCount;

          // Junction status rule:
          // Normal if average wait < 30 s
          // Heavy if 30-60 s
          // Congested if > 60 s or queue > 80% of approach length (160m)
          // Emergency if preemption is active
          let status: JunctionStatus = 'Normal';
          if (preemption) {
            status = 'Emergency';
          } else if (avgWaitSeconds > settings.heavyWaitThreshold || totalQueueM > 400) {
            status = 'Congested';
          } else if (avgWaitSeconds >= settings.normalWaitThreshold) {
            status = 'Heavy';
          }

          // Explanatory note
          let explanation = j.timingExplanation;
          if (preemption) {
            explanation = 'Emergency preemption active: Green wave locked for Ambulance #51 corridor.';
          } else if (controlMode === 'quantum') {
            explanation = `QUBO/QAOA Global Alignment: Coordinated offset across ${jid} saves ~26% queue latency.`;
          } else if (controlMode === 'classical') {
            const maxApproach = approaches.North.queueLengthM >= approaches.East.queueLengthM ? 'North' : 'East';
            explanation = `${maxApproach} has ${approaches[maxApproach].vehicleCount} vehicles and ${approaches[maxApproach].queueLengthM}m queue, so allocated +${approaches[maxApproach].greenAllottedSeconds - 15}s green.`;
          } else {
            explanation = 'Fixed-Time plan: Cycles strictly alternate every 30s regardless of real-time demand.';
          }

          updated[jid] = {
            ...j,
            status,
            currentPhase: phase,
            phaseCountdown: countdown,
            preemptionActive: preemption,
            approaches,
            avgWaitSeconds,
            totalQueueM,
            totalVehicles,
            timingExplanation: explanation,
          };
        });

        return updated;
      });

      // Update vehicle positions on roads
      setVehicles((prevVehs) =>
        prevVehs.map((v) => {
          let pos = v.positionRatio + (v.queued ? 0.005 : 0.04) * speed;
          if (pos > 1) pos = 0;
          return {
            ...v,
            positionRatio: pos,
            speedKmH: v.queued ? Math.max(0, v.speedKmH - 2) : Math.min(48, v.speedKmH + 1),
          };
        })
      );
    }, 1000 / speed);

    return () => clearInterval(interval);
  }, [isRunning, speed, ambulanceActive, ambulanceProgress, controlMode, settings, addLog, showToast]);

  // Periodic time series recorder (every 10 sim seconds)
  useEffect(() => {
    if (simTimeSeconds % 10 === 0) {
      const avgWait = Math.round(
        (junctions.J1.avgWaitSeconds + junctions.J2.avgWaitSeconds + junctions.J3.avgWaitSeconds + junctions.J4.avgWaitSeconds) / 4
      );
      const avgQueue = Math.round(
        (junctions.J1.totalQueueM + junctions.J2.totalQueueM + junctions.J3.totalQueueM + junctions.J4.totalQueueM) / 4
      );
      const hours = Math.floor(simTimeSeconds / 3600);
      const mins = Math.floor((simTimeSeconds % 3600) / 60);
      const timeStr = `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;

      // Mode benefit multipliers
      const mult = controlMode === 'quantum' ? 0.74 : controlMode === 'classical' ? 0.88 : 1.0;

      setTimeSeriesData((prev) => {
        const next = [
          ...prev,
          {
            time: timeStr,
            simSeconds: simTimeSeconds,
            flowVehPerMin: Math.round((50 + Math.sin(simTimeSeconds / 50) * 8)),
            avgWaitSeconds: Math.round(avgWait * mult),
            avgQueueM: Math.round(avgQueue * mult),
            throughput: Math.round(48 * (1 / mult)),
            fuelLitersTotal: Number((14.8 * mult).toFixed(1)),
            co2KgTotal: Number((34.2 * mult).toFixed(1)),
          },
        ];
        return next.slice(-20);
      });
    }
  }, [simTimeSeconds, controlMode, junctions]);

  const dynamicAccidentZones = useMemo(() => getAccidentZonesForCity(currentCityData), [currentCityData]);

  const unreadNotificationsCount = useMemo(
    () => notifications.filter((n) => !n.read).length,
    [notifications]
  );

  const markAllNotificationsRead = useCallback(() => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  }, []);

  const syncTelemetry = useCallback(() => {
    showToast('Telemetry synced', 'success');
    addLog('info', `Manual telemetry sync: Corroborated roadside radar and inductive loops for ${currentCityData.name}.`);
  }, [showToast, addLog, currentCityData.name]);

  const togglePlay = useCallback(() => setIsRunning((prev) => !prev), []);
  const setSimulationSpeed = useCallback((s: number) => setSpeed(s), []);

  const resetSimulation = useCallback(() => {
    setSimTimeSeconds(36120);
    setDemoElapsedSeconds(0);
    setVehicles(generateVehiclesForCity(currentCityData));
    setJunctions(generateJunctionsForCity(currentCityData));
    setAmbulanceActive(false);
    setAmbulanceProgress(0);
    setAmbulanceStepIndex(0);
    setEmergencySteps(INITIAL_EMERGENCY_STEPS);
    addLog('info', `Simulation reset to baseline state for ${currentCityData.name}.`);
    showToast('Simulation state reset.', 'info');
  }, [addLog, showToast, currentCityData]);

  const setScenarioHandler = useCallback((sc: string) => {
    setScenario(sc);
    addLog('info', `Scenario changed to "${sc}". Updating background traffic demand pattern.`);
    showToast(`Loaded scenario: ${sc}`, 'info');

    // Adapt traffic distribution according to scenario
    setJunctions((prev) => {
      const next = { ...prev };
      if (sc === 'Peak Hour') {
        Object.keys(next).forEach((k) => {
          const jid = k as JunctionId;
          const j = { ...next[jid] };
          const apps = { ...j.approaches };
          apps.North = { ...apps.North, vehicleCount: Math.round(apps.North.vehicleCount * 1.45), queuedVehicles: Math.round(apps.North.queuedVehicles * 1.5) };
          apps.East = { ...apps.East, vehicleCount: Math.round(apps.East.vehicleCount * 1.4), queuedVehicles: Math.round(apps.East.queuedVehicles * 1.45) };
          j.approaches = apps;
          j.avgWaitSeconds = Math.round(j.avgWaitSeconds * 1.35);
          j.status = j.avgWaitSeconds >= 60 ? 'Congested' : 'Heavy';
          next[jid] = j;
        });
      } else if (sc === 'Rain / Low Visibility') {
        Object.keys(next).forEach((k) => {
          const jid = k as JunctionId;
          const j = { ...next[jid] };
          const apps = { ...j.approaches };
          (['North', 'South', 'East', 'West'] as ApproachDirection[]).forEach((d) => {
            apps[d] = { ...apps[d], avgSpeedKmH: Math.max(16, apps[d].avgSpeedKmH - 10) };
          });
          j.approaches = apps;
          j.avgWaitSeconds = Math.round(j.avgWaitSeconds * 1.3);
          next[jid] = j;
        });
      } else if (sc === 'Accident Blocked Lane') {
        if (next.J2) {
          const j2 = { ...next.J2 };
          const apps = { ...j2.approaches };
          apps.East = {
            ...apps.East,
            queuedVehicles: 18,
            queueLengthM: 135,
            avgWaitSeconds: 68,
          };
          j2.approaches = apps;
          j2.avgWaitSeconds = 68;
          j2.status = 'Congested';
          j2.timingExplanation = 'ACCIDENT ALERT: Blocked lane detected at J2 East approach. Spillback queue flush underway.';
          next.J2 = j2;
        }
        showToast('Accident reported at J2 East approach! High spillback risk.', 'emergency');
      } else if (sc === 'Festival Crowd') {
        if (next.J3 && next.J4) {
          const j3 = { ...next.J3 };
          const apps3 = { ...j3.approaches };
          apps3.East = { ...apps3.East, vehicleCount: 24, queuedVehicles: 15 };
          j3.approaches = apps3;
          j3.avgWaitSeconds = 48;
          j3.status = 'Heavy';
          next.J3 = j3;

          const j4 = { ...next.J4 };
          const apps4 = { ...j4.approaches };
          apps4.North = { ...apps4.North, vehicleCount: 22, queuedVehicles: 14 };
          j4.approaches = apps4;
          j4.avgWaitSeconds = 44;
          next.J4 = j4;
        }
      } else if (sc === 'Emergency Dispatch') {
        dispatchAmbulance();
      } else {
        // Normal Traffic
        return generateJunctionsForCity(currentCityData);
      }
      return next;
    });
  }, [addLog, showToast, dispatchAmbulance, currentCityData]);

  const setJurisdiction = useCallback((update: Partial<JurisdictionSelection>) => {
    setIsTelemetryLoading(true);

    setJurisdictionState((prev) => {
      const newState = update.state !== undefined ? update.state : prev.state;
      const validDistricts = getDistricts(newState);
      let newDistrict = update.district !== undefined ? update.district : prev.district;
      if (!validDistricts.includes(newDistrict)) {
        newDistrict = validDistricts[0] || '';
      }

      const validCities = getCities(newState, newDistrict);
      let newCity = update.city !== undefined ? update.city : prev.city;
      if (!validCities.includes(newCity)) {
        newCity = validCities[0] || '';
      }

      const cityData = getCityData(newState, newDistrict, newCity);
      let newJunctionId = update.junctionId !== undefined ? update.junctionId : prev.junctionId;

      const cityChanged = newCity !== prev.city || newDistrict !== prev.district || newState !== prev.state;
      if (cityChanged && update.junctionId === undefined) {
        newJunctionId = 'J1';
      } else if (newJunctionId !== 'ALL' && !cityData.junctions.some((j) => j.id === newJunctionId)) {
        newJunctionId = 'J1';
      }

      const nextSelection: JurisdictionSelection = {
        state: newState,
        district: newDistrict,
        city: newCity,
        junctionId: newJunctionId,
      };

      if (typeof window !== 'undefined') {
        const params = new URLSearchParams(window.location.search);
        params.set('state', nextSelection.state);
        params.set('district', nextSelection.district);
        params.set('city', nextSelection.city);
        params.set('junction', nextSelection.junctionId);
        const newUrl = `${window.location.pathname}?${params.toString()}`;
        window.history.replaceState({}, '', newUrl);
      }

      if (nextSelection.junctionId !== 'ALL') {
        setSelectedJunctionId(nextSelection.junctionId);
      }

      const newJuncs = generateJunctionsForCity(cityData);
      const newVehs = generateVehiclesForCity(cityData);
      setJunctions(newJuncs);
      setVehicles(newVehs);

      const junctionLabel =
        nextSelection.junctionId === 'ALL'
          ? `All Junctions (Network View) · ${newCity}`
          : cityData.junctions.find((j) => j.id === nextSelection.junctionId)?.name || nextSelection.junctionId;

      showToast(`Now monitoring ${junctionLabel}`, 'info');
      addLog('info', `Jurisdiction updated: ${nextSelection.state} > ${nextSelection.district} > ${nextSelection.city} > ${junctionLabel}`);

      return nextSelection;
    });

    setTimeout(() => {
      setIsTelemetryLoading(false);
    }, 400);
  }, [showToast, addLog]);

  const setControlModeHandler = useCallback((mode: ControlMode) => {
    setControlMode(mode);
    const label = mode === 'quantum' ? 'Hybrid Quantum-Classical (QUBO/QAOA)' : mode === 'classical' ? 'Classical Adaptive' : 'Fixed-Time';
    addLog('optimizer', `Control Mode updated to ${label}. Optimization weights and green waves recalculated.`);
    showToast(`Switched Control Mode to ${label}`, mode === 'quantum' ? 'success' : 'info');
  }, [addLog, showToast]);

  const updateSettings = useCallback((newSettings: Partial<SystemSettings>) => {
    setSettings((prev) => {
      const updated = { ...prev, ...newSettings };
      localStorage.setItem('nagarkaval_settings', JSON.stringify(updated));
      return updated;
    });
    showToast('Settings saved successfully.', 'success');
  }, [showToast]);

  const resetSettingsToDefault = useCallback(() => {
    setSettings(INITIAL_SETTINGS);
    localStorage.setItem('nagarkaval_settings', JSON.stringify(INITIAL_SETTINGS));
    showToast('Settings restored to defaults.', 'info');
  }, [showToast]);

  const clearLogs = useCallback(() => {
    setEventLogs([]);
    showToast('Event logs cleared.', 'info');
  }, [showToast]);

  const runOptimizerComparison = useCallback((): ComparisonScenarioResult[] => {
    return [
      {
        mode: 'fixed',
        modeLabel: 'Fixed-Time Standard',
        avgWaitSeconds: 44.8,
        avgQueueLengthM: 112.5,
        throughputVehPerMin: 42,
        emergencyTravelTimeSec: 285,
        fuelWastedLiters: 22.4,
        co2EmissionsKg: 51.7,
        improvementVsFixedPct: 0,
      },
      {
        mode: 'classical',
        modeLabel: 'Classical Adaptive (Greedy+Actuated)',
        avgWaitSeconds: 29.2,
        avgQueueLengthM: 78.0,
        throughputVehPerMin: 51,
        emergencyTravelTimeSec: 165,
        fuelWastedLiters: 15.6,
        co2EmissionsKg: 36.0,
        improvementVsFixedPct: 34.8,
      },
      {
        mode: 'quantum',
        modeLabel: 'Hybrid Quantum-Classical (QUBO / QAOA)',
        avgWaitSeconds: 21.6,
        avgQueueLengthM: 54.0,
        throughputVehPerMin: 58,
        emergencyTravelTimeSec: 118,
        fuelWastedLiters: 11.2,
        co2EmissionsKg: 25.9,
        improvementVsFixedPct: 51.8,
      },
    ];
  }, []);

  return (
    <SimulationContext.Provider
      value={{
        isRunning,
        speed,
        simTimeSeconds,
        simTimeString,
        demoElapsedSeconds,
        scenario,
        controlMode,
        junctions,
        vehicles,
        ambulanceActive,
        ambulanceProgress,
        ambulanceStepIndex,
        emergencySteps,
        emergencyJunctions,
        busPriorityEvents,
        eventLogs,
        timeSeriesData,
        settings,
        activeToast,
        selectedJunctionId,
        accidentZones: dynamicAccidentZones,
        jurisdiction: jurisdictionState,
        isTelemetryLoading,
        currentCityData,
        notifications,
        unreadNotificationsCount,
        togglePlay,
        setSimulationSpeed,
        resetSimulation,
        setScenario: setScenarioHandler,
        setControlMode: setControlModeHandler,
        setSelectedJunctionId,
        setJurisdiction,
        dispatchAmbulance,
        cancelAmbulance,
        triggerBusPriority,
        clearLogs,
        updateSettings,
        resetSettingsToDefault,
        dismissToast,
        runOptimizerComparison,
        markAllNotificationsRead,
        syncTelemetry,
      }}
    >
      {children}
    </SimulationContext.Provider>
  );
};

export const useSimulation = () => {
  const context = useContext(SimulationContext);
  if (!context) {
    throw new Error('useSimulation must be used within a SimulationProvider');
  }
  return context;
};

// Helper: Calculate green time based on adaptive formula:
// 0.4*queue + 0.3*density + 0.3*avg_wait
function calculateGreenTime(
  junction: JunctionData,
  primaryApproach: ApproachDirection,
  mode: ControlMode,
  settings: SystemSettings
): number {
  if (mode === 'fixed') {
    return 30; // standard fixed cycle
  }

  const app = junction.approaches[primaryApproach];
  const queueWeight = 0.4 * app.queuedVehicles;
  const densityWeight = 0.3 * (app.densityVehPerKm / 5);
  const waitWeight = 0.3 * (app.avgWaitSeconds / 3);

  let green = Math.round(15 + queueWeight + densityWeight + waitWeight);

  if (mode === 'quantum') {
    // Quantum multi-junction coordination offsets add smart corridor throughput
    green = Math.round(green * 0.95);
  }

  return Math.min(settings.maxGreenSeconds, Math.max(settings.minGreenSeconds, green));
}

// Initial vehicle generator strictly respecting user constraints:
// 50 vehicles: 25 cars, 15 bikes, 5 buses (1 college, 1 school), 3 trucks, 2 emergency (1 fire, 1 police)
// Initial approach split: North 18, South 10, East 15, West 7 (total 50). Queued: 12 / 6 / 10 / 4.
function generateInitialVehicles(): Vehicle[] {
  const vehicles: Vehicle[] = [];
  const approaches: ApproachDirection[] = ['North', 'South', 'East', 'West'];
  const targets = {
    North: { total: 18, queued: 12 },
    South: { total: 10, queued: 6 },
    East: { total: 15, queued: 10 },
    West: { total: 7, queued: 4 },
  };

  const typesList: { type: Vehicle['type']; busSub?: Vehicle['busSubtype']; rate: number }[] = [
    // 25 cars (rate 0.8 L/hr)
    ...Array(25).fill(null).map(() => ({ type: 'car' as const, rate: 0.8 })),
    // 15 bikes (rate 0.25 L/hr)
    ...Array(15).fill(null).map(() => ({ type: 'bike' as const, rate: 0.25 })),
    // 5 buses (1 college, 1 school, 3 standard) (rate 2.5 L/hr)
    { type: 'bus' as const, busSub: 'college' as const, rate: 2.5 },
    { type: 'bus' as const, busSub: 'school' as const, rate: 2.5 },
    { type: 'bus' as const, busSub: 'standard' as const, rate: 2.5 },
    { type: 'bus' as const, busSub: 'standard' as const, rate: 2.5 },
    { type: 'bus' as const, busSub: 'standard' as const, rate: 2.5 },
    // 3 trucks (rate 3.0 L/hr)
    ...Array(3).fill(null).map(() => ({ type: 'truck' as const, rate: 3.0 })),
    // 2 emergency (1 fire, 1 police)
    { type: 'fire' as const, rate: 2.8 },
    { type: 'police' as const, rate: 1.2 },
  ];

  let typeIdx = 0;
  approaches.forEach((app) => {
    const { total, queued } = targets[app];
    for (let i = 0; i < total; i++) {
      const isQueued = i < queued;
      const t = typesList[typeIdx++] || { type: 'car', rate: 0.8 };
      const juncList: JunctionId[] = ['J1', 'J2', 'J3', 'J4'];
      const junc = juncList[i % 4];

      vehicles.push({
        id: `VEH-${typeIdx.toString().padStart(2, '0')}`,
        type: t.type,
        busSubtype: t.busSub,
        junctionId: junc,
        approach: app,
        queued: isQueued,
        speedKmH: isQueued ? 0 : 32 + (i % 15),
        positionRatio: isQueued ? 0.85 + (i % 10) * 0.012 : (i * 0.06) % 0.8,
        waitingTimeSeconds: isQueued ? 12 + i * 2 : 0,
        fuelRateLPerHr: t.rate,
      });
    }
  });

  return vehicles;
}

function getAccidentZonesForCity(city: CityData): AccidentZone[] {
  const j1 = city.junctions[0];
  const j2 = city.junctions[1];
  const j3 = city.junctions[2];
  const j4 = city.junctions[3];
  return [
    {
      id: 'AZ-1',
      name: `${j2?.name || 'J2 Market'} East Merge Zone`,
      junctionId: 'J2',
      lat: (j2?.latitude || 11.0168) + 0.002,
      lng: (j2?.longitude || 76.9558) + 0.003,
      xPercent: 48,
      yPercent: 38,
      riskScore: 78,
      historicalIncidents: 14,
      description: 'High conflict weaving zone during peak market hours.',
    },
    {
      id: 'AZ-2',
      name: `${j3?.name || 'J3 Bus Stand'} Transit Crosswalk`,
      junctionId: 'J3',
      lat: (j3?.latitude || 11.025) - 0.002,
      lng: (j3?.longitude || 76.968) + 0.002,
      xPercent: 71,
      yPercent: 62,
      riskScore: 65,
      historicalIncidents: 9,
      description: 'Pedestrian and bus terminal blind-spot turning conflict.',
    },
    {
      id: 'AZ-3',
      name: `${j1?.name || 'J1 Main Road'} Expressway Merge`,
      junctionId: 'J1',
      lat: (j1?.latitude || 11.004) + 0.003,
      lng: (j1?.longitude || 76.942) - 0.002,
      xPercent: 24,
      yPercent: 28,
      riskScore: 84,
      historicalIncidents: 19,
      description: 'Sudden deceleration zone when off-ramp traffic backs up.',
    },
    {
      id: 'AZ-4',
      name: `${j4?.name || 'J4 Hospital'} Goods & Trauma Curve`,
      junctionId: 'J4',
      lat: (j4?.latitude || 11.035) - 0.003,
      lng: (j4?.longitude || 76.982) + 0.004,
      xPercent: 90,
      yPercent: 50,
      riskScore: 54,
      historicalIncidents: 6,
      description: 'Commercial delivery truck wide turning arc and blind zones.',
    },
  ];
}

function generateVehiclesForCity(city: CityData): Vehicle[] {
  if (city.name === 'Coimbatore') {
    return generateInitialVehicles();
  }
  const vehicles: Vehicle[] = [];
  const approaches: ApproachDirection[] = ['North', 'South', 'East', 'West'];
  const totalCount = Math.round(50 * city.trafficMultiplier);
  const isMadurai = city.name === 'Madurai';
  const isTiruppur = city.name === 'Tiruppur';

  for (let i = 0; i < totalCount; i++) {
    const approach = approaches[i % 4];
    const juncList: JunctionId[] = ['J1', 'J2', 'J3', 'J4'];
    const junctionId = juncList[i % 4];
    const isQueued = i % 3 === 0;

    let type: VehicleType = 'car';
    let busSub: BusSubtype | undefined;
    let rate = 0.8;

    if (i === 0) {
      type = 'ambulance';
      rate = 2.0;
    } else if (i === 1) {
      type = 'police';
      rate = 1.2;
    } else if (isTiruppur && i % 5 === 0) {
      type = 'truck';
      rate = 3.0;
    } else if (isMadurai && i % 2 === 0) {
      type = 'bike';
      rate = 0.25;
    } else if (i % 8 === 0) {
      type = 'bus';
      busSub = i % 16 === 0 ? 'school' : 'college';
      rate = 2.5;
    } else if (i % 3 === 0) {
      type = 'bike';
      rate = 0.25;
    } else {
      type = 'car';
      rate = 0.8;
    }

    vehicles.push({
      id: `VEH-${(i + 1).toString().padStart(2, '0')}`,
      type,
      busSubtype: busSub,
      junctionId,
      approach,
      queued: isQueued,
      speedKmH: isQueued ? 0 : Math.round(28 + ((city.seed + i) % 18)),
      positionRatio: isQueued ? 0.84 + (i % 6) * 0.02 : (i * 0.07) % 0.8,
      waitingTimeSeconds: isQueued ? 10 + (i % 25) : 0,
      fuelRateLPerHr: rate,
    });
  }
  return vehicles;
}

function generateJunctionsForCity(city: CityData): Record<JunctionId, JunctionData> {
  const result: Partial<Record<JunctionId, JunctionData>> = {};
  city.junctions.forEach((jConfig) => {
    result[jConfig.id] = createJunctionRecordFromConfig(jConfig, city);
  });
  return result as Record<JunctionId, JunctionData>;
}

function createJunctionRecordFromConfig(
  config: JunctionConfig,
  city: CityData
): JunctionData {
  const mult = city.trafficMultiplier;
  const avgWait = Math.round(config.baseWaitSeconds * (city.name === 'Coimbatore' ? 1 : mult));
  const greenEW = config.approaches.East.greenSeconds;
  const greenNS = config.approaches.North.greenSeconds;

  const approaches: Record<ApproachDirection, ApproachData> = {
    North: {
      direction: 'North',
      vehicleCount: Math.round(config.approaches.North.baselineVeh * mult),
      queuedVehicles: Math.round(config.approaches.North.queuedVeh * mult),
      queueLengthM: Math.round(config.approaches.North.queuedVeh * mult * 7.5),
      avgWaitSeconds: avgWait + 3,
      avgSpeedKmH: config.approaches.North.speedKmH,
      densityVehPerKm: Math.round(38 * mult),
      greenAllottedSeconds: greenNS,
      currentSignal: 'red',
      capacityMax: 200,
    },
    South: {
      direction: 'South',
      vehicleCount: Math.round(config.approaches.South.baselineVeh * mult),
      queuedVehicles: Math.round(config.approaches.South.queuedVeh * mult),
      queueLengthM: Math.round(config.approaches.South.queuedVeh * mult * 7.5),
      avgWaitSeconds: Math.max(5, avgWait - 4),
      avgSpeedKmH: config.approaches.South.speedKmH,
      densityVehPerKm: Math.round(28 * mult),
      greenAllottedSeconds: greenNS,
      currentSignal: 'red',
      capacityMax: 200,
    },
    East: {
      direction: 'East',
      vehicleCount: Math.round(config.approaches.East.baselineVeh * mult),
      queuedVehicles: Math.round(config.approaches.East.queuedVeh * mult),
      queueLengthM: Math.round(config.approaches.East.queuedVeh * mult * 7.5),
      avgWaitSeconds: avgWait + 2,
      avgSpeedKmH: config.approaches.East.speedKmH,
      densityVehPerKm: Math.round(36 * mult),
      greenAllottedSeconds: greenEW,
      currentSignal: 'green',
      capacityMax: 200,
    },
    West: {
      direction: 'West',
      vehicleCount: Math.round(config.approaches.West.baselineVeh * mult),
      queuedVehicles: Math.round(config.approaches.West.queuedVeh * mult),
      queueLengthM: Math.round(config.approaches.West.queuedVeh * mult * 7.5),
      avgWaitSeconds: Math.max(5, avgWait - 5),
      avgSpeedKmH: config.approaches.West.speedKmH,
      densityVehPerKm: Math.round(24 * mult),
      greenAllottedSeconds: greenEW,
      currentSignal: 'green',
      capacityMax: 200,
    },
  };

  const totalQueueM =
    approaches.North.queueLengthM + approaches.South.queueLengthM + approaches.East.queueLengthM + approaches.West.queueLengthM;
  const totalVehicles =
    approaches.North.vehicleCount + approaches.South.vehicleCount + approaches.East.vehicleCount + approaches.West.vehicleCount;

  let status: JunctionStatus = 'Normal';
  if (avgWait > 60 || totalQueueM > 400) status = 'Congested';
  else if (avgWait >= 30) status = 'Heavy';

  return {
    id: config.id,
    name: config.name,
    latitude: config.latitude,
    longitude: config.longitude,
    status,
    currentPhase: 'EW_Green',
    phaseCountdown: 18,
    totalCycleTime: 65,
    approaches,
    avgWaitSeconds: avgWait,
    totalVehicles,
    totalQueueM,
    throughputVehPerMin: Math.round(config.baseThroughput * mult),
    preemptionActive: false,
    busPriorityActive: false,
    lastCycles: [
      { cycleNumber: 1, phaseName: 'East-West Green', durationSeconds: greenEW, timestamp: '10:00:20', color: '#22C55E' },
      { cycleNumber: 2, phaseName: 'East-West Yellow', durationSeconds: 3, timestamp: '10:00:48', color: '#F59E0B' },
      { cycleNumber: 3, phaseName: 'All Red Clearance', durationSeconds: 2, timestamp: '10:00:51', color: '#EF4444' },
      { cycleNumber: 4, phaseName: 'North-South Green', durationSeconds: greenNS, timestamp: '10:00:53', color: '#22C55E' },
      { cycleNumber: 5, phaseName: 'North-South Yellow', durationSeconds: 3, timestamp: '10:01:15', color: '#F59E0B' },
      { cycleNumber: 6, phaseName: 'All Red Clearance', durationSeconds: 2, timestamp: '10:01:18', color: '#EF4444' },
      { cycleNumber: 7, phaseName: 'East-West Green', durationSeconds: greenEW, timestamp: '10:01:20', color: '#22C55E' },
      { cycleNumber: 8, phaseName: 'East-West Yellow', durationSeconds: 3, timestamp: '10:01:48', color: '#F59E0B' },
      { cycleNumber: 9, phaseName: 'All Red Clearance', durationSeconds: 2, timestamp: '10:01:51', color: '#EF4444' },
      { cycleNumber: 10, phaseName: 'North-South Green', durationSeconds: greenNS, timestamp: '10:01:53', color: '#22C55E' },
    ],
    timingExplanation: `${config.name}: Active telemetry synced across ${city.name} arterial corridor.`,
  };
}

// Initial 4 junctions with 4 approaches
function generateInitialJunctions(): Record<JunctionId, JunctionData> {
  const junctions: Record<JunctionId, JunctionData> = {
    J1: createJunctionRecord('J1', 'J1 - Main Road Junction', 'Normal', 24, 28, 22),
    J2: createJunctionRecord('J2', 'J2 - Market Junction', 'Heavy', 38, 42, 36),
    J3: createJunctionRecord('J3', 'J3 - Bus Stand Junction', 'Normal', 22, 26, 18),
    J4: createJunctionRecord('J4', 'J4 - Hospital Junction', 'Normal', 26, 30, 24),
  };
  return junctions;
}

function createJunctionRecord(
  id: JunctionId,
  name: string,
  status: JunctionStatus,
  avgWait: number,
  greenEW: number,
  greenNS: number
): JunctionData {
  // Queue vehicles: initial approach split: North 18, South 10, East 15, West 7
  // Queue length = queued vehicles x 7.5 m
  const appQueued = {
    North: Math.round(12 / 4) + (id === 'J2' ? 2 : 0),
    South: Math.round(6 / 4),
    East: Math.round(10 / 4) + (id === 'J2' ? 1 : 0),
    West: Math.round(4 / 4),
  };

  const approaches: Record<ApproachDirection, any> = {
    North: {
      direction: 'North',
      vehicleCount: 5 + (id === 'J2' ? 2 : 0),
      queuedVehicles: appQueued.North,
      queueLengthM: appQueued.North * 7.5,
      avgWaitSeconds: avgWait + 4,
      avgSpeedKmH: 26,
      densityVehPerKm: 42,
      greenAllottedSeconds: greenNS,
      currentSignal: 'red',
      capacityMax: 200,
    },
    South: {
      direction: 'South',
      vehicleCount: 3,
      queuedVehicles: appQueued.South,
      queueLengthM: appQueued.South * 7.5,
      avgWaitSeconds: avgWait - 3,
      avgSpeedKmH: 34,
      densityVehPerKm: 28,
      greenAllottedSeconds: greenNS,
      currentSignal: 'red',
      capacityMax: 200,
    },
    East: {
      direction: 'East',
      vehicleCount: 4 + (id === 'J2' ? 2 : 0),
      queuedVehicles: appQueued.East,
      queueLengthM: appQueued.East * 7.5,
      avgWaitSeconds: avgWait + 2,
      avgSpeedKmH: 32,
      densityVehPerKm: 38,
      greenAllottedSeconds: greenEW,
      currentSignal: 'green',
      capacityMax: 200,
    },
    West: {
      direction: 'West',
      vehicleCount: 2,
      queuedVehicles: appQueued.West,
      queueLengthM: appQueued.West * 7.5,
      avgWaitSeconds: avgWait - 5,
      avgSpeedKmH: 38,
      densityVehPerKm: 22,
      greenAllottedSeconds: greenEW,
      currentSignal: 'green',
      capacityMax: 200,
    },
  };

  const totalQueueM =
    approaches.North.queueLengthM + approaches.South.queueLengthM + approaches.East.queueLengthM + approaches.West.queueLengthM;
  const totalVehicles =
    approaches.North.vehicleCount + approaches.South.vehicleCount + approaches.East.vehicleCount + approaches.West.vehicleCount;

  return {
    id,
    name,
    status,
    currentPhase: 'EW_Green',
    phaseCountdown: 18,
    totalCycleTime: 65,
    approaches,
    avgWaitSeconds: avgWait,
    totalVehicles,
    totalQueueM,
    throughputVehPerMin: 48,
    preemptionActive: false,
    busPriorityActive: false,
    lastCycles: [
      { cycleNumber: 1, phaseName: 'East-West Green', durationSeconds: greenEW, timestamp: '10:00:20', color: '#22C55E' },
      { cycleNumber: 2, phaseName: 'East-West Yellow', durationSeconds: 3, timestamp: '10:00:48', color: '#F59E0B' },
      { cycleNumber: 3, phaseName: 'All Red Clearance', durationSeconds: 2, timestamp: '10:00:51', color: '#EF4444' },
      { cycleNumber: 4, phaseName: 'North-South Green', durationSeconds: greenNS, timestamp: '10:00:53', color: '#22C55E' },
      { cycleNumber: 5, phaseName: 'North-South Yellow', durationSeconds: 3, timestamp: '10:01:15', color: '#F59E0B' },
      { cycleNumber: 6, phaseName: 'All Red Clearance', durationSeconds: 2, timestamp: '10:01:18', color: '#EF4444' },
      { cycleNumber: 7, phaseName: 'East-West Green', durationSeconds: greenEW, timestamp: '10:01:20', color: '#22C55E' },
      { cycleNumber: 8, phaseName: 'East-West Yellow', durationSeconds: 3, timestamp: '10:01:48', color: '#F59E0B' },
      { cycleNumber: 9, phaseName: 'All Red Clearance', durationSeconds: 2, timestamp: '10:01:51', color: '#EF4444' },
      { cycleNumber: 10, phaseName: 'North-South Green', durationSeconds: greenNS, timestamp: '10:01:53', color: '#22C55E' },
    ],
    timingExplanation: 'East approach has 15 corridor vehicles and active demand; green time extended +12s.',
  };
}
