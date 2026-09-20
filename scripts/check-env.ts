import dotenv from 'dotenv';
import path from 'path';

// Load from both root and server
dotenv.config({ path: path.join(process.cwd(), '.env') });
dotenv.config({ path: path.join(process.cwd(), 'server', '.env') });

const variables = [
  'VITE_GOOGLE_MAPS_API_KEY',
  'GOOGLE_ROUTES_API_KEY',
  'FEATHERLESS_API_KEY',
  'LLM_PROVIDER',
  'ROUTES_PROVIDER',
  'ADMIN_TOKEN'
];

console.log('\n--- Environment Check ---');
for (const v of variables) {
  const val = process.env[v];
  const status = (val && val.trim() !== '') ? 'SET' : 'MISSING';
  
  let color = status === 'SET' ? '\x1b[32m' : '\x1b[31m';
  if (v === 'LLM_PROVIDER' || v === 'ROUTES_PROVIDER') {
    // These have defaults, so missing is technically okay but worth noting
    color = status === 'SET' ? '\x1b[32m' : '\x1b[33m';
  }
  
  console.log(`${v.padEnd(30)} [ ${color}${status}\x1b[0m ]`);
}
console.log('-------------------------\n');
