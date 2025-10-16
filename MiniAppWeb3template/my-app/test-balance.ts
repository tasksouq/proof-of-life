import { config } from 'dotenv';

// Load environment variables FIRST
config({ path: '.env.local' });

// Import after environment variables are loaded
import { LifeTokenContract, CONTRACT_ADDRESSES } from './src/lib/contract-utils';

// Test balance fetching with a sample address
async function testBalanceFetch() {
  console.log('🧪 Testing LIFE Balance Fetch...');
  
  // Check if contract address is loaded
  console.log('Contract addresses:', CONTRACT_ADDRESSES);
  console.log('LIFE_TOKEN address:', CONTRACT_ADDRESSES.LIFE_TOKEN);
  
  if (!CONTRACT_ADDRESSES.LIFE_TOKEN) {
    console.error('❌ LIFE_TOKEN address is not loaded from environment variables!');
    return;
  }
  
  // Use a sample address (the deployer address from the contracts.md)
  const testAddress = '0xA13A18ccD767B83543212B0424426A374f565Fb8' as `0x${string}`;
  
  console.log('Testing with address:', testAddress);
  
  try {
    const balance = await LifeTokenContract.getBalance(testAddress);
    console.log('✅ Balance fetch successful:', balance.toString());
  } catch (error) {
    console.error('❌ Balance fetch failed:', error);
  }
}

// Run the test
testBalanceFetch().catch(console.error);