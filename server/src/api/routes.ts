import { Router } from 'express';
import { db } from '../db';
import { z } from 'zod';
import { validateRequest } from '../server';
import { getAiStatus, generate } from '../ai/provider';

const router = Router();

// GET /api/jurisdictions (state > district > city tree)
router.get('/jurisdictions', (req, res) => {
  const cities = db.prepare('SELECT * FROM cities').all() as any[];
  
  const statesMap: Record<string, any> = {};
  
  for (const city of cities) {
    if (!statesMap[city.state]) {
      statesMap[city.state] = {
        name: city.state,
        districts: [],
      };
    }
    
    let district = statesMap[city.state].districts.find((d: any) => d.name === city.district);
    if (!district) {
      district = { name: city.district, cities: [] };
      statesMap[city.state].districts.push(district);
    }
    
    district.cities.push({
      name: city.name,
      center: { lat: city.latitude, lng: city.longitude },
      seed: city.seed,
      trafficMultiplier: city.trafficMultiplier,
      description: city.description,
    });
  }
  
  const states = Object.values(statesMap);
  res.json({ states });
});

// GET /api/cities/:city/junctions
router.get('/cities/:city/junctions', (req, res) => {
  const cityName = req.params.city;
  const junctions = db.prepare('SELECT * FROM junctions WHERE city_id = ?').all(cityName) as any[];
  
  if (!junctions.length) {
    return res.status(404).json({ error: 'City not found or has no junctions' });
  }

  const result = junctions.map((j) => {
    const approachesList = db.prepare('SELECT * FROM approaches WHERE junction_id = ?').all(j.id) as any[];
    const approaches = approachesList.reduce((acc, curr) => {
      acc[curr.direction] = {
        lengthM: curr.lengthM,
        lanes: curr.lanes,
        baselineVeh: curr.baselineVeh,
        queuedVeh: curr.queuedVeh,
        speedKmH: curr.speedKmH,
        greenSeconds: curr.greenSeconds,
      };
      return acc;
    }, {} as Record<string, any>);
    
    return {
      id: j.local_id,
      name: j.name,
      latitude: j.latitude,
      longitude: j.longitude,
      hospitalRoute: j.hospitalRoute === 1,
      baseWaitSeconds: j.baseWaitSeconds,
      baseThroughput: j.baseThroughput,
      approaches,
    };
  });
  
  res.json(result);
});

// GET /api/ai/status
router.get('/ai/status', (req, res) => {
  res.json(getAiStatus());
});

// POST /api/ai/explain-timing
const ExplainTimingSchema = z.object({
  city: z.string(),
  junctionId: z.string(),
  metrics: z.any()
});
router.post('/ai/explain-timing', validateRequest(ExplainTimingSchema), async (req, res) => {
  const { city, junctionId, metrics } = req.body;
  const system = 'You are an AI traffic assistant for NAGARKAVAL. Use ONLY the JSON metrics provided. Invent nothing. Never claim quantum advantage. Keep it brief.';
  const user = `Explain the signal timings for junction ${junctionId} in ${city}. Metrics: ${JSON.stringify(metrics)}`;
  const result = await generate({ system, user, maxTokens: 200 });
  res.json(result);
});

// POST /api/ai/briefing
const BriefingSchema = z.object({
  city: z.string(),
  windowMinutes: z.number(),
  metrics: z.any()
});
router.post('/ai/briefing', validateRequest(BriefingSchema), async (req, res) => {
  const { city, windowMinutes, metrics } = req.body;
  const system = 'You are an AI traffic analyst for NAGARKAVAL. Use ONLY the JSON metrics provided to summarize the last ' + windowMinutes + ' minutes. Invent nothing.';
  const user = `Provide a traffic briefing for ${city}. Metrics: ${JSON.stringify(metrics)}`;
  const result = await generate({ system, user, maxTokens: 400 });
  res.json(result);
});

export default router;
