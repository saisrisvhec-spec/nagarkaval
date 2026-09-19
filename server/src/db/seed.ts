import fs from 'fs';
import path from 'path';
import { db } from './index';

const dataPath = path.join(__dirname, '..', '..', '..', 'src', 'data', 'jurisdictions.json');
const rawData = fs.readFileSync(dataPath, 'utf8');
const jurisdictions = JSON.parse(rawData);

// Insert settings
const INITIAL_SETTINGS = {
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
  googleMapsApiKey: '',
  darkMode: true,
};

const insertSettings = db.prepare('INSERT OR IGNORE INTO settings (id, config) VALUES (1, ?)');
insertSettings.run(JSON.stringify(INITIAL_SETTINGS));

const insertCity = db.prepare(`
  INSERT OR IGNORE INTO cities (id, state, district, name, latitude, longitude, seed, trafficMultiplier, description)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
`);

const insertJunction = db.prepare(`
  INSERT OR IGNORE INTO junctions (id, city_id, local_id, name, latitude, longitude, hospitalRoute, baseWaitSeconds, baseThroughput)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
`);

const insertApproach = db.prepare(`
  INSERT OR IGNORE INTO approaches (id, junction_id, direction, lengthM, lanes, baselineVeh, queuedVeh, speedKmH, greenSeconds)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
`);

const insertAccidentRecord = db.prepare(`
  INSERT OR IGNORE INTO accident_records (id, city_id, junction_id, lat, lng, timestamp, severity, source)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?)
`);

db.transaction(() => {
  for (const state of jurisdictions.states) {
    for (const district of state.districts) {
      for (const city of district.cities) {
        const cityId = city.name;
        insertCity.run(
          cityId,
          state.name,
          district.name,
          city.name,
          city.center.lat,
          city.center.lng,
          city.seed,
          city.trafficMultiplier,
          city.description
        );

        for (const j of city.junctions) {
          const junctionId = `${cityId}:${j.id}`;
          insertJunction.run(
            junctionId,
            cityId,
            j.id,
            j.name,
            j.latitude,
            j.longitude,
            j.hospitalRoute ? 1 : 0,
            j.baseWaitSeconds,
            j.baseThroughput
          );

          for (const [direction, app] of Object.entries(j.approaches)) {
            const appData = app as any;
            const approachId = `${junctionId}:${direction}`;
            insertApproach.run(
              approachId,
              junctionId,
              direction,
              appData.lengthM,
              appData.lanes,
              appData.baselineVeh,
              appData.queuedVeh,
              appData.speedKmH,
              appData.greenSeconds
            );
          }

          // Generate synthetic accident records
          const severities = ['Low', 'Medium', 'High', 'Critical'];
          for (let i = 0; i < 3; i++) {
            const accId = `acc_${junctionId}_${i}`;
            const severity = severities[Math.floor(Math.random() * severities.length)];
            const lat = j.latitude + (Math.random() - 0.5) * 0.005;
            const lng = j.longitude + (Math.random() - 0.5) * 0.005;
            const timestamp = new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString();
            
            insertAccidentRecord.run(
              accId,
              cityId,
              junctionId,
              lat,
              lng,
              timestamp,
              severity,
              'synthetic'
            );
          }
        }
      }
    }
  }
})();

console.log('Database seeded successfully.');
