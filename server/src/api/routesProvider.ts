import crypto from 'crypto';

interface RouteRequest {
  origin: { lat: number; lng: number };
  destination: { lat: number; lng: number };
}

interface RouteResponse {
  provider: 'internal' | 'google';
  durationSeconds: number;
  distanceMeters: number;
  polyline?: string;
}

// Simple in-memory cache: hash -> { response, timestamp }
const cache = new Map<string, { response: RouteResponse; timestamp: number }>();
const CACHE_TTL_MS = 60 * 1000;

function hashRequest(req: RouteRequest): string {
  const str = JSON.stringify(req);
  return crypto.createHash('md5').update(str).digest('hex');
}

export async function getAmbulanceRoute(req: RouteRequest): Promise<RouteResponse> {
  const providerConfig = process.env.ROUTES_PROVIDER || 'internal';
  const apiKey = process.env.GOOGLE_ROUTES_API_KEY;

  // 1. Check Cache
  const hash = hashRequest(req);
  const cached = cache.get(hash);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
    return cached.response;
  }

  // 2. Try Google Routes if configured
  if (providerConfig === 'google' && apiKey) {
    try {
      const response = await fetch('https://routes.googleapis.com/directions/v2:computeRoutes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Goog-Api-Key': apiKey,
          'X-Goog-FieldMask': 'routes.duration,routes.distanceMeters,routes.polyline.encodedPolyline'
        },
        body: JSON.stringify({
          origin: { location: { latLng: { latitude: req.origin.lat, longitude: req.origin.lng } } },
          destination: { location: { latLng: { latitude: req.destination.lat, longitude: req.destination.lng } } },
          travelMode: 'DRIVE',
          routingPreference: 'TRAFFIC_AWARE',
        })
      });

      if (!response.ok) {
        throw new Error(`Google Routes API error: ${response.status} ${response.statusText}`);
      }

      const data: any = await response.json();
      
      if (data.routes && data.routes.length > 0) {
        const route = data.routes[0];
        const durationStr = route.duration || '0s';
        const durationSeconds = parseInt(durationStr.replace('s', ''), 10);
        
        const result: RouteResponse = {
          provider: 'google',
          durationSeconds,
          distanceMeters: route.distanceMeters,
          polyline: route.polyline?.encodedPolyline,
        };
        
        cache.set(hash, { response: result, timestamp: Date.now() });
        return result;
      }
    } catch (err) {
      console.error('Google Routes API failed, falling back to internal routing.', err);
      // Fall through to internal routing
    }
  }

  // 3. Fallback: Internal Routing (mocked for now, will be built in Phase 5)
  // Distance using Haversine, speed ~ 40 km/h
  const R = 6371e3; // metres
  const phi1 = (req.origin.lat * Math.PI) / 180;
  const phi2 = (req.destination.lat * Math.PI) / 180;
  const deltaPhi = ((req.destination.lat - req.origin.lat) * Math.PI) / 180;
  const deltaLambda = ((req.destination.lng - req.origin.lng) * Math.PI) / 180;

  const a =
    Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) +
    Math.cos(phi1) * Math.cos(phi2) * Math.sin(deltaLambda / 2) * Math.sin(deltaLambda / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  const distanceMeters = R * c;
  const durationSeconds = Math.round(distanceMeters / (40 / 3.6)); // 40 km/h in m/s

  const result: RouteResponse = {
    provider: 'internal',
    distanceMeters: Math.round(distanceMeters),
    durationSeconds,
  };
  
  cache.set(hash, { response: result, timestamp: Date.now() });
  return result;
}
