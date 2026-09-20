import Database from 'better-sqlite3';
import fs from 'fs';
import path from 'path';

const dbPath = path.join(__dirname, '..', '..', 'nagarkaval.db');
const schemaPath = path.join(__dirname, 'schema.sql');

export const db = new Database(dbPath, { verbose: console.log });
db.pragma('journal_mode = WAL');

// Initialize database with schema
const schema = fs.readFileSync(schemaPath, 'utf8');
db.exec(schema);

export default db;
