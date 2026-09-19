/// <reference types="@types/google.maps" />
import React, { useEffect, useRef, useState } from 'react';
import { setOptions, importLibrary } from '@googlemaps/js-api-loader';
import {
  Compass,
  AlertTriangle,
  Siren,
  MapPin,
  Sparkles
} from 'lucide-react';
import { useSimulation } from '../../context/SimulationContext';
import { JunctionId } from '../../../shared/types';

interface GoogleMapViewProps {
  onSelectJunction: (id: JunctionId) => void;
  showDensity: boolean;
  showAccidents: boolean;
  showEmergencyRoute: boolean;
  showBuses: boolean;
  onSwitchToSchematic?: () => void;
}

// Tactical dark theme map styles for high contrast traffic operations
const DARK_MAP_STYLES: google.maps.MapTypeStyle[] = [
  { elementType: 'geometry', stylers: [{ color: '#090f1d' }] },
  { elementType: 'labels.text.stroke', stylers: [{ color: '#070c17' }] },
  { elementType: 'labels.text.fill', stylers: [{ color: '#7e93b0' }] },
  {
    featureType: 'administrative.locality',
    elementType: 'labels.text.fill',
    stylers: [{ color: '#38bdf8' }],
  },
  {
    featureType: 'poi',
    elementType: 'labels.text.fill',
    stylers: [{ color: '#64748b' }],
  },
  {
    featureType: 'poi.park',
    elementType: 'geometry',
    stylers: [{ color: '#0b1b2b' }],
  },
  {
    featureType: 'poi.park',
    elementType: 'labels.text.fill',
    stylers: [{ color: '#10b981' }],
  },
  {
    featureType: 'road',
    elementType: 'geometry',
    stylers: [{ color: '#14223d' }],
  },
  {
    featureType: 'road',
    elementType: 'geometry.stroke',
    stylers: [{ color: '#1f2a44' }],
  },
  {
    featureType: 'road',
    elementType: 'labels.text.fill',
    stylers: [{ color: '#94a3b8' }],
  },
  {
    featureType: 'road.highway',
    elementType: 'geometry',
    stylers: [{ color: '#1e3a63' }],
  },
  {
    featureType: 'road.highway',
    elementType: 'geometry.stroke',
    stylers: [{ color: '#0284c7' }],
  },
  {
    featureType: 'road.highway',
    elementType: 'labels.text.fill',
    stylers: [{ color: '#e0f2fe' }],
  },
  {
    featureType: 'transit',
    elementType: 'geometry',
    stylers: [{ color: '#111d33' }],
  },
  {
    featureType: 'transit.station',
    elementType: 'labels.text.fill',
    stylers: [{ color: '#38bdf8' }],
  },
  {
    featureType: 'water',
    elementType: 'geometry',
    stylers: [{ color: '#060a12' }],
  },
  {
    featureType: 'water',
    elementType: 'labels.text.fill',
    stylers: [{ color: '#0284c7' }],
  },
  {
    featureType: 'water',
    elementType: 'labels.text.stroke',
    stylers: [{ color: '#04070d' }],
  },
];

export const GoogleMapView: React.FC<GoogleMapViewProps> = ({
  onSelectJunction,
  showDensity,
  showAccidents,
  showEmergencyRoute,
  showBuses,
  onSwitchToSchematic,
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<google.maps.Map | null>(null);
  const trafficLayerRef = useRef<google.maps.TrafficLayer | null>(null);
  const markersRef = useRef<google.maps.Marker[]>([]);
  const accidentMarkersRef = useRef<google.maps.Marker[]>([]);
  const vehicleMarkersRef = useRef<google.maps.Marker[]>([]);
  const corridorLineRef = useRef<google.maps.Polyline | null>(null);
  const ambulanceMarkerRef = useRef<google.maps.Marker | null>(null);
  const infoWindowRef = useRef<google.maps.InfoWindow | null>(null);

  const [mapLoaded, setMapLoaded] = useState<boolean>(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [mapType, setMapType] = useState<'roadmap' | 'satellite'>('roadmap');
  const [showLiveTraffic, setShowLiveTraffic] = useState<boolean>(true);

  const {
    junctions,
    vehicles,
    ambulanceActive,
    ambulanceProgress,
    accidentZones,
    settings,
    currentCityData,
    jurisdiction,
  } = useSimulation();

  const apiKey =
    settings.googleMapsApiKey ||
    (import.meta as any).env?.VITE_GOOGLE_MAPS_API_KEY || '';

  // Handle Google Maps Auth Failures globally
  useEffect(() => {
    (window as any).gm_authFailure = () => {
      setLoadError('Auth Failure: Missing/Invalid Key or Billing issue. Please use Schematic View or configure a valid key.');
    };
    return () => {
      delete (window as any).gm_authFailure;
    };
  }, []);

  // 1. Initialize Google Map using modern importLibrary API
  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (!apiKey) {
      setLoadError('Google Maps API key is not configured.');
      return;
    }

    let isMounted = true;

    async function initMap() {
      try {
        setOptions({
          key: apiKey,
          v: 'weekly',
        });

        const { Map } = await importLibrary('maps');
        await importLibrary('marker');

        if (!isMounted || !mapContainerRef.current) return;

        const cityCenter = {
          lat: currentCityData.center.lat,
          lng: currentCityData.center.lng,
        };

        const map = new Map(mapContainerRef.current, {
          center: cityCenter,
          zoom: 14,
          mapTypeId:
            mapType === 'satellite' ? google.maps.MapTypeId.HYBRID : google.maps.MapTypeId.ROADMAP,
          styles: mapType === 'satellite' ? [] : DARK_MAP_STYLES,
          disableDefaultUI: true,
          zoomControl: true,
          zoomControlOptions: {
            position: google.maps.ControlPosition.RIGHT_BOTTOM,
          },
          mapTypeControl: false,
          streetViewControl: false,
          fullscreenControl: false,
          backgroundColor: '#070D18',
        });

        // Add Traffic Layer
        const trafficLayer = new google.maps.TrafficLayer();
        if (showLiveTraffic) {
          trafficLayer.setMap(map);
        }
        trafficLayerRef.current = trafficLayer;

        mapInstanceRef.current = map;
        infoWindowRef.current = new google.maps.InfoWindow();

        setMapLoaded(true);
        setLoadError(null);
      } catch (err: any) {
        console.error('Failed to load Google Maps:', err);
        if (isMounted) {
          setLoadError(err?.message || 'Unable to connect to Google Maps Platform API.');
        }
      }
    }

    initMap();

    return () => {
      isMounted = false;
      markersRef.current.forEach((m) => m.setMap(null));
      accidentMarkersRef.current.forEach((m) => m.setMap(null));
      vehicleMarkersRef.current.forEach((m) => m.setMap(null));
      if (corridorLineRef.current) corridorLineRef.current.setMap(null);
      if (ambulanceMarkerRef.current) ambulanceMarkerRef.current.setMap(null);
      if (trafficLayerRef.current) trafficLayerRef.current.setMap(null);
    };
  }, [apiKey]);

  // 2. Respond to Jurisdiction City changes (smooth pan & center)
  useEffect(() => {
    if (!mapInstanceRef.current || !mapLoaded) return;

    if (jurisdiction.junctionId !== 'ALL') {
      const activeJuncConfig = currentCityData.junctions.find((j) => j.id === jurisdiction.junctionId);
      if (activeJuncConfig) {
        mapInstanceRef.current.panTo({
          lat: activeJuncConfig.latitude,
          lng: activeJuncConfig.longitude,
        });
        mapInstanceRef.current.setZoom(16);
        return;
      }
    }

    mapInstanceRef.current.panTo({
      lat: currentCityData.center.lat,
      lng: currentCityData.center.lng,
    });
    mapInstanceRef.current.setZoom(14);
  }, [currentCityData, jurisdiction.junctionId, mapLoaded]);

  // 3. Toggle Map Type (Roadmap vs Satellite)
  useEffect(() => {
    if (!mapInstanceRef.current || typeof google === 'undefined') return;
    if (mapType === 'satellite') {
      mapInstanceRef.current.setMapTypeId(google.maps.MapTypeId.HYBRID);
      mapInstanceRef.current.setOptions({ styles: [] });
    } else {
      mapInstanceRef.current.setMapTypeId(google.maps.MapTypeId.ROADMAP);
      mapInstanceRef.current.setOptions({ styles: DARK_MAP_STYLES });
    }
  }, [mapType]);

  // 4. Toggle Live Traffic Layer
  useEffect(() => {
    if (!trafficLayerRef.current || !mapInstanceRef.current) return;
    if (showLiveTraffic) {
      trafficLayerRef.current.setMap(mapInstanceRef.current);
    } else {
      trafficLayerRef.current.setMap(null);
    }
  }, [showLiveTraffic]);

  // 5. Render Junction Markers
  useEffect(() => {
    if (!mapInstanceRef.current || !mapLoaded || typeof google === 'undefined') return;

    markersRef.current.forEach((m) => m.setMap(null));
    markersRef.current = [];

    const juncKeys: JunctionId[] = ['J1', 'J2', 'J3', 'J4'];

    juncKeys.forEach((jid) => {
      const jData = junctions[jid];
      const jConfig = currentCityData.junctions.find((j) => j.id === jid);
      if (!jData || !jConfig) return;

      const position = { lat: jConfig.latitude, lng: jConfig.longitude };

      let statusBg = '#22C55E';
      if (jData.status === 'Heavy') statusBg = '#F59E0B';
      if (jData.status === 'Congested' || jData.status === 'Emergency') statusBg = '#EF4444';

      const isEmergency = ambulanceActive && (jid === 'J1' || jid === 'J2' || jid === 'J3');
      const isSelected = jurisdiction.junctionId === jid;

      // Custom SVG Marker Icon
      const markerSvg = `
        <svg xmlns="http://www.w3.org/2000/svg" width="48" height="54" viewBox="0 0 48 54">
          <defs>
            <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="0" dy="3" stdDeviation="3" flood-color="#000" flood-opacity="0.6"/>
            </filter>
          </defs>
          <g filter="url(#shadow)">
            ${isEmergency ? `<circle cx="24" cy="22" r="20" fill="#ef4444" opacity="0.3"/>` : ''}
            ${isSelected ? `<circle cx="24" cy="22" r="22" fill="none" stroke="#38bdf8" stroke-width="2" stroke-dasharray="4,2"/>` : ''}
            <path d="M 24 4 C 14 4 6 12 6 22 C 6 34 24 50 24 50 C 24 50 42 34 42 22 C 42 12 34 4 24 4 Z" 
                  fill="#0B1220" stroke="${isEmergency ? '#ef4444' : isSelected ? '#38bdf8' : statusBg}" stroke-width="2.5"/>
            <circle cx="24" cy="22" r="13" fill="${statusBg}"/>
            <text x="24" y="26" text-anchor="middle" font-family="monospace" font-size="11" font-weight="900" fill="#0B1220">${jid}</text>
          </g>
        </svg>
      `;

      const marker = new google.maps.Marker({
        position,
        map: mapInstanceRef.current,
        title: `${jid}: ${jData.name}`,
        icon: {
          url: `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(markerSvg)}`,
          scaledSize: new google.maps.Size(48, 54),
          anchor: new google.maps.Point(24, 50),
        },
      });

      marker.addListener('click', () => {
        onSelectJunction(jid);

        if (infoWindowRef.current && mapInstanceRef.current) {
          const contentString = `
            <div style="background-color:#0B1220; color:#fff; padding:12px; border-radius:12px; font-family:system-ui, sans-serif; min-width:210px; border:1px solid #1F2A44;">
              <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:6px;">
                <span style="font-family:monospace; font-weight:bold; font-size:12px; color:#38bdf8;">${jid} INTERSECTION</span>
                <span style="background-color:${statusBg}30; color:${statusBg}; font-size:10px; font-weight:bold; padding:2px 6px; border-radius:4px;">${jData.status}</span>
              </div>
              <div style="font-weight:bold; font-size:14px; margin-bottom:8px; color:#ffffff;">${jData.name}</div>
              <div style="display:grid; grid-template-columns:1fr 1fr; gap:6px; font-size:11px; font-family:monospace; margin-bottom:8px;">
                <div style="background:#111A2E; padding:6px; border-radius:6px; border:1px solid #1F2A44;">
                  <div style="color:#64748b; font-size:9px;">AVG WAIT</div>
                  <div style="font-weight:bold; font-size:13px; color:#fff;">${jData.avgWaitSeconds}s</div>
                </div>
                <div style="background:#111A2E; padding:6px; border-radius:6px; border:1px solid #1F2A44;">
                  <div style="color:#64748b; font-size:9px;">QUEUE</div>
                  <div style="font-weight:bold; font-size:13px; color:#38bdf8;">${jData.totalQueueM}m</div>
                </div>
              </div>
              <div style="font-size:11px; color:#94a3b8; margin-bottom:4px;">
                Phase: <strong style="color:#38bdf8;">${jData.currentPhase.replace('_', ' ')}</strong> (${jData.phaseCountdown}s)
              </div>
              <div style="font-size:10px; color:#64748b;">
                Throughput: ${jData.throughputVehPerMin} veh/min · Mode: Adaptive
              </div>
            </div>
          `;
          infoWindowRef.current.setContent(contentString);
          infoWindowRef.current.open(mapInstanceRef.current, marker);
        }
      });

      markersRef.current.push(marker);
    });
  }, [junctions, currentCityData, mapLoaded, ambulanceActive, jurisdiction.junctionId]);

  // 6. Render Accident Hotspot Markers
  useEffect(() => {
    if (!mapInstanceRef.current || !mapLoaded || typeof google === 'undefined') return;

    accidentMarkersRef.current.forEach((m) => m.setMap(null));
    accidentMarkersRef.current = [];

    if (!showAccidents) return;

    accidentZones.forEach((az) => {
      const parentJunc = currentCityData.junctions.find((j) => j.id === az.junctionId);
      if (!parentJunc) return;

      const offsetLat = (az.yPercent - 50) * 0.00015;
      const offsetLng = (az.xPercent - 50) * 0.00015;

      const pos = {
        lat: parentJunc.latitude + offsetLat,
        lng: parentJunc.longitude + offsetLng,
      };

      const accidentSvg = `
        <svg xmlns="http://www.w3.org/2000/svg" width="36" height="36" viewBox="0 0 36 36">
          <circle cx="18" cy="18" r="16" fill="#78350f" fill-opacity="0.3" stroke="#f59e0b" stroke-width="2" stroke-dasharray="3,2"/>
          <circle cx="18" cy="18" r="11" fill="#f59e0b"/>
          <path d="M 18 11 L 18 18 M 18 22 L 18.01 22" stroke="#000" stroke-width="2.5" stroke-linecap="round"/>
        </svg>
      `;

      const marker = new google.maps.Marker({
        position: pos,
        map: mapInstanceRef.current,
        title: `Accident Risk: ${az.name}`,
        icon: {
          url: `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(accidentSvg)}`,
          scaledSize: new google.maps.Size(36, 36),
          anchor: new google.maps.Point(18, 18),
        },
      });

      marker.addListener('click', () => {
        if (infoWindowRef.current && mapInstanceRef.current) {
          const content = `
            <div style="background-color:#0B1220; color:#fff; padding:10px; border-radius:10px; font-family:sans-serif; min-width:180px; border:1px solid #78350f;">
              <div style="color:#f59e0b; font-weight:bold; font-size:12px; margin-bottom:4px;">⚠️ ACCIDENT HOTSPOT</div>
              <div style="font-weight:bold; font-size:13px; color:#fff;">${az.name}</div>
              <div style="font-size:11px; color:#94a3b8; margin:4px 0;">${az.description}</div>
              <div style="display:flex; justify-content:space-between; font-size:10px; font-family:monospace; margin-top:6px; border-top:1px solid #1F2A44; padding-top:4px;">
                <span style="color:#f87171;">Risk Index: <strong>${az.riskScore}/100</strong></span>
                <span style="color:#e2e8f0;">Incidents: <strong>${az.historicalIncidents}</strong></span>
              </div>
            </div>
          `;
          infoWindowRef.current.setContent(content);
          infoWindowRef.current.open(mapInstanceRef.current, marker);
        }
      });

      accidentMarkersRef.current.push(marker);
    });
  }, [accidentZones, showAccidents, currentCityData, mapLoaded]);

  // 7. Render Emergency Corridor Route (Polyline)
  useEffect(() => {
    if (!mapInstanceRef.current || !mapLoaded || typeof google === 'undefined') return;

    if (corridorLineRef.current) {
      corridorLineRef.current.setMap(null);
      corridorLineRef.current = null;
    }

    if (!showEmergencyRoute) return;

    const j1 = currentCityData.junctions.find((j) => j.id === 'J1');
    const j2 = currentCityData.junctions.find((j) => j.id === 'J2');
    const j3 = currentCityData.junctions.find((j) => j.id === 'J3');

    if (!j1 || !j2 || !j3) return;

    // Route points: Origin -> J1 -> J2 -> J3 -> Hospital
    const startPoint = { lat: j1.latitude + 0.005, lng: j1.longitude - 0.002 };
    const hospitalPoint = { lat: j3.latitude - 0.004, lng: j3.longitude + 0.003 };

    const path = [
      startPoint,
      { lat: j1.latitude, lng: j1.longitude },
      { lat: j2.latitude, lng: j2.longitude },
      { lat: j3.latitude, lng: j3.longitude },
      hospitalPoint,
    ];

    const polyline = new google.maps.Polyline({
      path,
      geodesic: true,
      strokeColor: ambulanceActive ? '#EF4444' : '#0284C7',
      strokeOpacity: 0.9,
      strokeWeight: ambulanceActive ? 5 : 3.5,
      map: mapInstanceRef.current,
    });

    corridorLineRef.current = polyline;
  }, [currentCityData, ambulanceActive, showEmergencyRoute, mapLoaded]);

  // 8. Render Moving Ambulance Marker
  useEffect(() => {
    if (!mapInstanceRef.current || !mapLoaded || typeof google === 'undefined') return;

    if (!ambulanceActive) {
      if (ambulanceMarkerRef.current) {
        ambulanceMarkerRef.current.setMap(null);
        ambulanceMarkerRef.current = null;
      }
      return;
    }

    const j1 = currentCityData.junctions.find((j) => j.id === 'J1');
    const j2 = currentCityData.junctions.find((j) => j.id === 'J2');
    const j3 = currentCityData.junctions.find((j) => j.id === 'J3');
    if (!j1 || !j2 || !j3) return;

    const start = { lat: j1.latitude + 0.005, lng: j1.longitude - 0.002 };
    const p1 = { lat: j1.latitude, lng: j1.longitude };
    const p2 = { lat: j2.latitude, lng: j2.longitude };
    const p3 = { lat: j3.latitude, lng: j3.longitude };
    const hospital = { lat: j3.latitude - 0.004, lng: j3.longitude + 0.003 };

    const p = Math.min(100, Math.max(0, ambulanceProgress));

    let currentLat = start.lat;
    let currentLng = start.lng;

    if (p <= 25) {
      const ratio = p / 25;
      currentLat = start.lat + (p1.lat - start.lat) * ratio;
      currentLng = start.lng + (p1.lng - start.lng) * ratio;
    } else if (p <= 55) {
      const ratio = (p - 25) / 30;
      currentLat = p1.lat + (p2.lat - p1.lat) * ratio;
      currentLng = p1.lng + (p2.lng - p1.lng) * ratio;
    } else if (p <= 85) {
      const ratio = (p - 55) / 30;
      currentLat = p2.lat + (p3.lat - p2.lat) * ratio;
      currentLng = p2.lng + (p3.lng - p2.lng) * ratio;
    } else {
      const ratio = (p - 85) / 15;
      currentLat = p3.lat + (hospital.lat - p3.lat) * ratio;
      currentLng = p3.lng + (hospital.lng - p3.lng) * ratio;
    }

    const ambulanceSvg = `
      <svg xmlns="http://www.w3.org/2000/svg" width="44" height="44" viewBox="0 0 44 44">
        <circle cx="22" cy="22" r="20" fill="#ef4444" opacity="0.4">
          <animate attributeName="r" values="14;21;14" dur="1s" repeatCount="indefinite"/>
          <animate attributeName="opacity" values="0.6;0.1;0.6" dur="1s" repeatCount="indefinite"/>
        </circle>
        <circle cx="22" cy="22" r="14" fill="#ef4444" stroke="#ffffff" stroke-width="2"/>
        <path d="M 22 15 L 22 29 M 15 22 L 29 22" stroke="#ffffff" stroke-width="3" stroke-linecap="round"/>
      </svg>
    `;

    if (!ambulanceMarkerRef.current) {
      ambulanceMarkerRef.current = new google.maps.Marker({
        position: { lat: currentLat, lng: currentLng },
        map: mapInstanceRef.current,
        title: 'Ambulance #51 - Emergency Green Corridor',
        zIndex: 999,
        icon: {
          url: `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(ambulanceSvg)}`,
          scaledSize: new google.maps.Size(44, 44),
          anchor: new google.maps.Point(22, 22),
        },
      });
    } else {
      ambulanceMarkerRef.current.setPosition({ lat: currentLat, lng: currentLng });
    }
  }, [ambulanceActive, ambulanceProgress, currentCityData, mapLoaded]);

  // 9. Moving background vehicle dots (Throttled)
  const lastVehicleUpdateRef = useRef<number>(0);

  useEffect(() => {
    if (!mapInstanceRef.current || !mapLoaded || typeof google === 'undefined') return;

    const now = Date.now();
    if (now - lastVehicleUpdateRef.current < 1000) return; // Throttle to 1 per second
    lastVehicleUpdateRef.current = now;

    vehicleMarkersRef.current.forEach((m) => m.setMap(null));
    vehicleMarkersRef.current = [];

    const sampledVehicles = vehicles
      .filter((v) => (v.type === 'bus' ? showBuses : true))
      .slice(0, 24);

    sampledVehicles.forEach((veh) => {
      const parentJunc = currentCityData.junctions.find((j) => j.id === veh.junctionId);
      if (!parentJunc) return;

      const distOffset = veh.positionRatio * 0.0012;
      let vLat = parentJunc.latitude;
      let vLng = parentJunc.longitude;

      if (veh.approach === 'North') vLat += distOffset;
      else if (veh.approach === 'South') vLat -= distOffset;
      else if (veh.approach === 'East') vLng += distOffset;
      else if (veh.approach === 'West') vLng -= distOffset;

      let color = '#38bdf8'; // car
      let size = 8;
      if (veh.type === 'bus') {
        color = veh.busSubtype === 'school' ? '#facc15' : '#fb923c';
        size = 12;
      } else if (veh.type === 'bike') {
        color = '#10b981';
        size = 6;
      } else if (veh.type === 'truck') {
        color = '#a855f7';
        size = 10;
      }

      const vehicleSvg = `
        <svg xmlns="http://www.w3.org/2000/svg" width="${size * 2}" height="${size * 2}" viewBox="0 0 ${size * 2} ${size * 2}">
          <circle cx="${size}" cy="${size}" r="${size - 1}" fill="${color}" stroke="#0b1220" stroke-width="1.5"/>
        </svg>
      `;

      const vMarker = new google.maps.Marker({
        position: { lat: vLat, lng: vLng },
        map: mapInstanceRef.current,
        title: `${veh.type.toUpperCase()}: ${veh.id}`,
        zIndex: veh.type === 'bus' ? 50 : 20,
        icon: {
          url: `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(vehicleSvg)}`,
          scaledSize: new google.maps.Size(size * 2, size * 2),
          anchor: new google.maps.Point(size, size),
        },
      });

      vehicleMarkersRef.current.push(vMarker);
    });
  }, [vehicles, showBuses, currentCityData, mapLoaded]);

  return (
    <div className="relative w-full h-[580px] bg-[#070D18] rounded-2xl overflow-hidden border border-[#1F2A44] shadow-2xl">
      {/* Map Container */}
      <div ref={mapContainerRef} className="w-full h-full" />

      {/* Floating Control Overlay: Top Left */}
      <div className="absolute top-3.5 left-3.5 z-10 flex items-center gap-2 flex-wrap">
        <div className="bg-[#111A2E]/90 backdrop-blur-md border border-[#1F2A44] px-3 py-1.5 rounded-xl shadow-lg flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-xs font-mono font-bold text-white tracking-wide">
            GOOGLE MAPS LIVE GIS
          </span>
          <span className="text-[10px] font-mono text-cyan-300 px-2 py-0.5 rounded bg-cyan-950/80 border border-cyan-800/60">
            {currentCityData.name}, {jurisdiction.state}
          </span>
        </div>

        {/* View Mode: Tactical vs Satellite */}
        <div className="bg-[#111A2E]/90 backdrop-blur-md border border-[#1F2A44] p-1 rounded-xl shadow-lg flex items-center gap-1 text-xs">
          <button
            onClick={() => setMapType('roadmap')}
            className={`px-2.5 py-1 rounded-lg font-medium transition-colors cursor-pointer ${
              mapType === 'roadmap'
                ? 'bg-cyan-500 text-slate-950 font-bold'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Dark Vector
          </button>
          <button
            onClick={() => setMapType('satellite')}
            className={`px-2.5 py-1 rounded-lg font-medium transition-colors cursor-pointer ${
              mapType === 'satellite'
                ? 'bg-cyan-500 text-slate-950 font-bold'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Satellite
          </button>
        </div>

        {/* Live Traffic Toggle */}
        <button
          onClick={() => setShowLiveTraffic(!showLiveTraffic)}
          className={`px-3 py-1.5 rounded-xl text-xs font-medium border backdrop-blur-md transition-all cursor-pointer flex items-center gap-1.5 ${
            showLiveTraffic
              ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/50 shadow-sm'
              : 'bg-[#111A2E]/90 text-slate-400 border-[#1F2A44]'
          }`}
        >
          <span className={`w-2 h-2 rounded-full ${showLiveTraffic ? 'bg-emerald-400' : 'bg-slate-600'}`} />
          Google Traffic Layer
        </button>

        {/* Switch to Schematic fallback button */}
        {onSwitchToSchematic && (
          <button
            onClick={onSwitchToSchematic}
            className="px-3 py-1.5 rounded-xl text-xs font-medium bg-[#111A2E]/90 hover:bg-[#182642] text-slate-300 border border-[#1F2A44] backdrop-blur-md transition-all cursor-pointer"
          >
            Switch to Vector Schematic
          </button>
        )}
      </div>

      {/* Floating Center / Reset Location Control: Top Right */}
      <div className="absolute top-3.5 right-3.5 z-10 flex items-center gap-2">
        <button
          onClick={() => {
            if (mapInstanceRef.current) {
              mapInstanceRef.current.panTo({
                lat: currentCityData.center.lat,
                lng: currentCityData.center.lng,
              });
              mapInstanceRef.current.setZoom(14);
            }
          }}
          className="bg-[#111A2E]/90 hover:bg-[#182642] backdrop-blur-md border border-[#1F2A44] p-2 rounded-xl text-slate-300 hover:text-white shadow-lg transition-colors cursor-pointer flex items-center gap-1.5 text-xs font-mono"
          title="Reset Corridor Center"
        >
          <Compass className="w-4 h-4 text-cyan-400" />
          Center Corridor
        </button>
      </div>

      {/* Emergency Active Banner inside Map */}
      {ambulanceActive && (
        <div className="absolute bottom-4 right-4 z-10 bg-rose-950/90 backdrop-blur-md border border-rose-500 rounded-xl p-3 shadow-2xl flex items-center gap-3 animate-pulse">
          <div className="p-2 bg-rose-600 rounded-lg text-white">
            <Siren className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs font-bold text-white uppercase tracking-wider">
              Green Corridor Preempted
            </div>
            <div className="text-[11px] text-rose-200 font-mono">
              Ambulance #51 Moving: {Math.round(ambulanceProgress)}% Complete
            </div>
          </div>
        </div>
      )}

      {/* Map Legend Overlay: Bottom Left */}
      <div className="absolute bottom-4 left-4 z-10 bg-[#111A2E]/90 backdrop-blur-md border border-[#1F2A44] rounded-xl p-3 text-[11px] shadow-lg flex flex-col gap-1.5 max-w-xs">
        <span className="text-[10px] font-mono text-slate-400 uppercase font-semibold flex items-center justify-between">
          <span>Map Telemetry Legend</span>
          <span className="text-cyan-400 font-bold">4 Nodes</span>
        </span>
        <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-[10px]">
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-[#22C55E]" />
            Normal (&lt;30s wait)
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-[#F59E0B]" />
            Heavy (30-60s wait)
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-[#EF4444]" />
            Congested / Priority
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-[#38BDF8]" />
            Active Vehicles
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-[#FACC15]" />
            School / Transit Bus
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-[#EF4444] animate-pulse" />
            Ambulance Route
          </span>
        </div>
      </div>

      {/* Loading / Error States */}
      {!mapLoaded && !loadError && (
        <div className="absolute inset-0 bg-[#070D18] flex flex-col items-center justify-center gap-3 z-30">
          <div className="w-8 h-8 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin" />
          <span className="text-xs font-mono text-cyan-300">
            Connecting to Google Maps Platform GIS Engine...
          </span>
        </div>
      )}

      {loadError && (
        <div className="absolute inset-0 bg-[#070D18]/95 flex flex-col items-center justify-center gap-3 p-6 z-30 text-center">
          <AlertTriangle className="w-8 h-8 text-amber-400" />
          <div className="text-sm font-bold text-white">Google Maps Loading Alert</div>
          <p className="text-xs text-slate-400 max-w-md">{loadError}</p>
          {onSwitchToSchematic && (
            <button
              onClick={onSwitchToSchematic}
              className="mt-2 px-4 py-2 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold rounded-xl text-xs transition-colors cursor-pointer"
            >
              Switch to Vector Schematic View
            </button>
          )}
        </div>
      )}
    </div>
  );
};
