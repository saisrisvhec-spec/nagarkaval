import rawData from './jurisdictions.json';
import { ApproachDirection, JunctionId, JunctionStatus, Vehicle } from '../../shared/types';

export interface ApproachConfig {
  lengthM: number;
  lanes: number;
  baselineVeh: number;
  queuedVeh: number;
  speedKmH: number;
  greenSeconds: number;
}

export interface JunctionConfig {
  id: JunctionId;
  name: string;
  latitude: number;
  longitude: number;
  hospitalRoute: boolean;
  baseWaitSeconds: number;
  baseThroughput: number;
  approaches: Record<ApproachDirection, ApproachConfig>;
}

export interface CityData {
  name: string;
  center: { lat: number; lng: number };
  seed: number;
  trafficMultiplier: number;
  description: string;
  junctions: JunctionConfig[];
}

export interface DistrictData {
  name: string;
  cities: CityData[];
}

export interface StateData {
  name: string;
  districts: DistrictData[];
}

export const JURISDICTIONS_DATA: StateData[] = rawData.states as unknown as StateData[];

export const DEFAULT_JURISDICTION = {
  state: 'Tamil Nadu',
  district: 'Coimbatore',
  city: 'Coimbatore',
  junctionId: 'J1' as JunctionId | 'ALL',
};

export function getStates(): string[] {
  return JURISDICTIONS_DATA.map((s) => s.name);
}

export function getDistricts(stateName: string): string[] {
  const state = JURISDICTIONS_DATA.find((s) => s.name === stateName);
  return state ? state.districts.map((d) => d.name) : [];
}

export function getCities(stateName: string, districtName: string): string[] {
  const state = JURISDICTIONS_DATA.find((s) => s.name === stateName);
  if (!state) return [];
  const district = state.districts.find((d) => d.name === districtName);
  return district ? district.cities.map((c) => c.name) : [];
}

export function getCityData(stateName: string, districtName: string, cityName: string): CityData {
  const state = JURISDICTIONS_DATA.find((s) => s.name === stateName) || JURISDICTIONS_DATA[0];
  const district = state.districts.find((d) => d.name === districtName) || state.districts[0];
  const city = district.cities.find((c) => c.name === cityName) || district.cities[0];
  return city;
}

export function getJunctionConfigs(stateName: string, districtName: string, cityName: string): JunctionConfig[] {
  const city = getCityData(stateName, districtName, cityName);
  return city.junctions;
}

export function getJunctionConfigById(
  stateName: string,
  districtName: string,
  cityName: string,
  junctionId: JunctionId
): JunctionConfig | undefined {
  const junctions = getJunctionConfigs(stateName, districtName, cityName);
  return junctions.find((j) => j.id === junctionId);
}
