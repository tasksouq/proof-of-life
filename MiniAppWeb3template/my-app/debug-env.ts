import { config } from 'dotenv';
import * as path from 'path';

console.log('🔍 Debugging Environment Variables...');
console.log('Current working directory:', process.cwd());
console.log('__dirname:', __dirname);

// Try loading from different paths
const envPaths = [
  '.env.local',
  path.join(process.cwd(), '.env.local'),
  path.join(__dirname, '.env.local')
];

for (const envPath of envPaths) {
  console.log(`\nTrying to load from: ${envPath}`);
  const result = config({ path: envPath });
  if (result.error) {
    console.log('❌ Failed:', result.error.message);
  } else {
    console.log('✅ Loaded successfully');
    console.log('NEXT_PUBLIC_LIFE_TOKEN_ADDRESS:', process.env.NEXT_PUBLIC_LIFE_TOKEN_ADDRESS);
    console.log('NEXT_PUBLIC_RPC_URL:', process.env.NEXT_PUBLIC_RPC_URL);
    break;
  }
}

console.log('\n📋 Final Environment Variables:');
console.log('NEXT_PUBLIC_LIFE_TOKEN_ADDRESS:', process.env.NEXT_PUBLIC_LIFE_TOKEN_ADDRESS);
console.log('NEXT_PUBLIC_RPC_URL:', process.env.NEXT_PUBLIC_RPC_URL);
console.log('NEXT_PUBLIC_ECONOMY_CONTRACT_ADDRESS:', process.env.NEXT_PUBLIC_ECONOMY_CONTRACT_ADDRESS);