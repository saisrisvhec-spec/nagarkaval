export type ControlMode = 'fixed' | 'classical' | 'quantum';

export type JunctionId = 'J1' | 'J2' | 'J3' | 'J4';

export type ApproachDirection = 'North' | 'South' | 'East' | 'West';

export type JunctionStatus = 'Normal' | 'Heavy' | 'Congested' | 'Emergency';

export type SignalColor = 'green' | 'yellow' | 'red';

export type VehicleType = 'car' | 'bike' | 'bus' | 'truck' | 'ambulance' | 'police' | 'fire';

export type BusSubtype = 'college' | 'school' | 'standard';

export interface Vehicle {
  id: string;
  type: VehicleType;
  busSubtype?: BusSubtype;
  junctionId: JunctionId;
  approach: ApproachDirection;
  queued: boolean;
  speedKmH: number;
  positionRatio: number; // 0 (far) to 1 (at stop line)
  waitingTimeSeconds: number;
  fuelRateLPerHr: number;
}

export interface ApproachData {
  direction: ApproachDirection;
  vehicleCount: number;
  queuedVehicles: number;
  queueLengthM: number;
  avgWaitSeconds: number;
  avgSpeedKmH: number;
  densityVehPerKm: number;
  greenAllottedSeconds: number;
  currentSignal: SignalColor;
  capacityMax: number;
}

export interface JurisdictionSelection {
  state: string;
  district: string;
  city: string;
  junctionId: JunctionId | 'ALL';
}

export interface CyclePhaseRecord {
  cycleNumber: number;
  phaseName: string; // e.g., "North-South Green", "East-West Green"
  durationSeconds: number;
  timestamp: string;
  color: string;
}

export interface JunctionData {
  id: JunctionId;
  name: string;
  latitude?: number;
  longitude?: number;
  status: JunctionStatus;
  currentPhase: 'NS_Green' | 'NS_Yellow' | 'EW_Green' | 'EW_Yellow' | 'All_Red';
  phaseCountdown: number;
  totalCycleTime: number;
  approaches: Record<ApproachDirection, ApproachData>;
  avgWaitSeconds: number;
  totalVehicles: number;
  totalQueueM: number;
  throughputVehPerMin: number;
  preemptionActive: boolean;
  busPriorityActive: boolean;
  lastCycles: CyclePhaseRecord[];
  timingExplanation: string;
}

export interface LogEvent {
  id: string;
  timestamp: string;
  type: 'info' | 'signal' | 'emergency' | 'priority' | 'optimizer';
  message: string;
  junctionId?: JunctionId;
}

export interface EmergencyRouteStep {
  stepIndex: number;
  label: string;
  description: string;
  status: 'pending' | 'active' | 'completed';
}

export interface EmergencyJunctionProgress {
  junctionId: JunctionId;
  name: string;
  etaSeconds: number;
  state: 'Preparing' | 'Preempted green' | 'Cleared' | 'Restored';
  distanceMeters: number;
}

export interface BusPriorityEvent {
  id: string;
  busName: string;
  type: 'school' | 'college';
  junctionId: JunctionId;
  approach: ApproachDirection;
  scheduledArrival: string;
  status: 'Approaching' | 'Green Extended' | 'Passed' | 'Cleared';
  timeBonusGrantedSeconds: number;
}

export interface ComparisonScenarioResult {
  mode: ControlMode;
  modeLabel: string;
  avgWaitSeconds: number;
  avgQueueLengthM: number;
  throughputVehPerMin: number;
  emergencyTravelTimeSec: number;
  fuelWastedLiters: number;
  co2EmissionsKg: number;
  improvementVsFixedPct: number;
}

export interface AccidentZone {
  id: string;
  name: string;
  junctionId: JunctionId;
  lat: number;
  lng: number;
  xPercent: number;
  yPercent: number;
  riskScore: number; // 0-100
  historicalIncidents: number;
  description: string;
}

export interface SystemSettings {
  normalWaitThreshold: number; // default 30
  heavyWaitThreshold: number; // default 60
  queueCongestionRatio: number; // default 0.8
  weightQueue: number; // default 0.4
  weightDensity: number; // default 0.3
  weightWait: number; // default 0.3
  minGreenSeconds: number; // default 15
  maxGreenSeconds: number; // default 60
  yellowSeconds: number; // default 3
  allRedSeconds: number; // default 2
  pedestrianClearanceSeconds: number; // default 12
  busPriorityEnabled: boolean; // default true
  emergencyPreemptionEnabled: boolean; // default true
  accidentZoneAlertsEnabled: boolean; // default true
  soundEffectsEnabled: boolean; // default true
  vehicleDistribution: {
    cars: number;
    bikes: number;
    buses: number;
    trucks: number;
    emergency: number;
  };
  googleMapsApiKey: string;
  darkMode: boolean;
}

export type SimulationSettings = SystemSettings;


export interface TimeSeriesPoint {
  time: string;
  simSeconds: number;
  flowVehPerMin: number;
  avgWaitSeconds: number;
  avgQueueM: number;
  throughput: number;
  fuelLitersTotal: number;
  co2KgTotal: number;
}
