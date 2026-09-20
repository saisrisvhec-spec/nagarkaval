-- Phase 1: Data Layer SQLite Schema

-- Cities
CREATE TABLE IF NOT EXISTS cities (
    id TEXT PRIMARY KEY, -- Using name as id for simplicity, e.g. "Coimbatore"
    state TEXT NOT NULL,
    district TEXT NOT NULL,
    name TEXT NOT NULL,
    latitude REAL NOT NULL,
    longitude REAL NOT NULL,
    seed INTEGER NOT NULL,
    trafficMultiplier REAL NOT NULL,
    description TEXT NOT NULL
);

-- Junctions
CREATE TABLE IF NOT EXISTS junctions (
    id TEXT PRIMARY KEY, -- Format: city:J1
    city_id TEXT NOT NULL,
    local_id TEXT NOT NULL, -- J1, J2, J3, J4
    name TEXT NOT NULL,
    latitude REAL NOT NULL,
    longitude REAL NOT NULL,
    hospitalRoute INTEGER NOT NULL, -- 0 or 1
    baseWaitSeconds INTEGER NOT NULL,
    baseThroughput INTEGER NOT NULL,
    FOREIGN KEY(city_id) REFERENCES cities(id)
);

-- Approaches
CREATE TABLE IF NOT EXISTS approaches (
    id TEXT PRIMARY KEY,
    junction_id TEXT NOT NULL,
    direction TEXT NOT NULL, -- North, South, East, West
    lengthM INTEGER NOT NULL,
    lanes INTEGER NOT NULL,
    baselineVeh INTEGER NOT NULL,
    queuedVeh INTEGER NOT NULL,
    speedKmH INTEGER NOT NULL,
    greenSeconds INTEGER NOT NULL,
    FOREIGN KEY(junction_id) REFERENCES junctions(id)
);

-- Settings (Single row JSON)
CREATE TABLE IF NOT EXISTS settings (
    id INTEGER PRIMARY KEY CHECK (id = 1),
    config JSON NOT NULL
);

-- Simulation Runs
CREATE TABLE IF NOT EXISTS sim_runs (
    id TEXT PRIMARY KEY,
    city_id TEXT NOT NULL,
    mode TEXT NOT NULL,
    scenario TEXT NOT NULL,
    seed INTEGER NOT NULL,
    start_time DATETIME DEFAULT CURRENT_TIMESTAMP,
    end_time DATETIME,
    status TEXT NOT NULL
);

-- Timeseries
CREATE TABLE IF NOT EXISTS timeseries (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    run_id TEXT,
    city_id TEXT NOT NULL,
    mode TEXT NOT NULL,
    sim_seconds INTEGER NOT NULL,
    metrics JSON NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Events (Logs)
CREATE TABLE IF NOT EXISTS events (
    id TEXT PRIMARY KEY,
    city_id TEXT NOT NULL,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
    type TEXT NOT NULL,
    message TEXT NOT NULL,
    junction_id TEXT
);

-- Notifications
CREATE TABLE IF NOT EXISTS notifications (
    id TEXT PRIMARY KEY,
    city_id TEXT NOT NULL,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    type TEXT NOT NULL,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
    read INTEGER DEFAULT 0
);

-- Accident Records
CREATE TABLE IF NOT EXISTS accident_records (
    id TEXT PRIMARY KEY,
    city_id TEXT NOT NULL,
    junction_id TEXT,
    lat REAL NOT NULL,
    lng REAL NOT NULL,
    timestamp DATETIME NOT NULL,
    severity TEXT NOT NULL,
    source TEXT NOT NULL -- "synthetic" or "real"
);

-- Emergency Runs
CREATE TABLE IF NOT EXISTS emergency_runs (
    id TEXT PRIMARY KEY,
    city_id TEXT NOT NULL,
    vehicle_type TEXT NOT NULL,
    start_time DATETIME DEFAULT CURRENT_TIMESTAMP,
    end_time DATETIME,
    travel_time_sec INTEGER,
    saved_time_sec INTEGER,
    route JSON NOT NULL
);

-- Optimizer Runs
CREATE TABLE IF NOT EXISTS optimizer_runs (
    id TEXT PRIMARY KEY,
    city_id TEXT NOT NULL,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
    params JSON NOT NULL,
    metrics JSON NOT NULL,
    qubo_details JSON NOT NULL
);

-- Bus Schedules
CREATE TABLE IF NOT EXISTS bus_schedules (
    id TEXT PRIMARY KEY,
    city_id TEXT NOT NULL,
    bus_name TEXT NOT NULL,
    subtype TEXT NOT NULL,
    route JSON NOT NULL,
    scheduled_times JSON NOT NULL
);
