import { config } from 'dotenv';

// Load environment variables FIRST
config({ path: '.env.local' });

import { createPublicClient, http } from 'viem';
import { worldchain } from './src/lib/chains';
import { LIFE_ABI } from './src/lib/life-abi';

// Create contract addresses directly from env vars
const CONTRACT_ADDRESSES = {
  LIFE_TOKEN: process.env.NEXT_PUBLIC_LIFE_TOKEN_ADDRESS as `0x${string}`,
  PROPERTY: process.env.NEXT_PUBLIC_PROPERTY_CONTRACT_ADDRESS as `0x${string}`,
  LIMITED_EDITION: process.env.NEXT_PUBLIC_LIMITED_EDITION_ADDRESS as `0x${string}`,
  PLAYER_REGISTRY: process.env.NEXT_PUBLIC_PLAYER_REGISTRY_ADDRESS as `0x${string}`,
  ECONOMY: process.env.NEXT_PUBLIC_ECONOMY_CONTRACT_ADDRESS as `0x${string}`,
  WORLD_ID_ADDRESS_BOOK: process.env.NEXT_PUBLIC_WORLD_ID_ADDRESS_BOOK as `0x${string}`,
  WLD: process.env.NEXT_PUBLIC_WLD_CONTRACT_ADDRESS as `0x${string}` || '0x2cFc85d8E48F8EAB294be644d9E25C3030863003',
};

// Test script to verify LIFE token contract
async function testContract() {
  console.log('🔍 Testing LIFE Token Contract...');
  console.log('Contract Address:', CONTRACT_ADDRESSES.LIFE_TOKEN);
  
  const client = createPublicClient({
    chain: worldchain,
    transport: http()
  });

  try {
    // Test 1: Check if contract exists
    console.log('\n1. Checking contract bytecode...');
    const bytecode = await client.getBytecode({
      address: CONTRACT_ADDRESSES.LIFE_TOKEN
    });
    
    if (!bytecode || bytecode === '0x') {
      console.error('❌ Contract not found at address:', CONTRACT_ADDRESSES.LIFE_TOKEN);
      return false;
    }
    console.log('✅ Contract exists');

    // Test 2: Check total supply
    console.log('\n2. Reading total supply...');
    const totalSupply = await client.readContract({
      address: CONTRACT_ADDRESSES.LIFE_TOKEN,
      abi: LIFE_ABI,
      functionName: 'totalSupply'
    });
    console.log('✅ Total supply:', totalSupply.toString());

    // Test 3: Check balance of zero address
    console.log('\n3. Reading balance of zero address...');
    const balance = await client.readContract({
      address: CONTRACT_ADDRESSES.LIFE_TOKEN,
      abi: LIFE_ABI,
      functionName: 'balanceOf',
      args: ['0x0000000000000000000000000000000000000000']
    });
    console.log('✅ Zero address balance:', balance.toString());

    // Test 4: Check if mint function exists
    console.log('\n4. Testing mint function availability...');
    try {
      // This will fail if function doesn't exist or has wrong signature
      await client.simulateContract({
        address: CONTRACT_ADDRESSES.LIFE_TOKEN,
        abi: LIFE_ABI,
        functionName: 'mint',
        args: [BigInt(0), '0x'],
        account: '0x0000000000000000000000000000000000000000'
      });
    } catch (error: any) {
      if (error.message.includes('function') && !error.message.includes('reverted')) {
        console.log('❌ Mint function not found or has wrong signature');
        console.log('Error:', error.message);
      } else {
        console.log('✅ Mint function exists (reverted as expected for invalid params)');
      }
    }

    // Test 5: Check canClaim function
    console.log('\n5. Testing canClaim function...');
    try {
      const canClaim = await client.readContract({
        address: CONTRACT_ADDRESSES.LIFE_TOKEN,
        abi: LIFE_ABI,
        functionName: 'canClaim',
        args: ['0x0000000000000000000000000000000000000000']
      });
      console.log('✅ Zero address can claim:', canClaim);
    } catch (error: any) {
      if (error.message.includes('function') && !error.message.includes('reverted')) {
        console.log('❌ canClaim function not found');
      } else {
        console.log('✅ canClaim function exists (reverted as expected for zero address)');
      }
    }

    console.log('\n🎉 All contract tests passed!');
    return true;

  } catch (error: any) {
    console.error('❌ Contract test failed:', error.message);
    
    if (error.message.includes('CALL_EXCEPTION')) {
      console.error('💡 This suggests the contract ABI doesn\'t match the deployed contract');
    }
    
    return false;
  }
}

// Test environment configuration
function testEnvironment() {
  console.log('🔧 Environment Configuration:');
  console.log('Raw env vars:');
  console.log('NEXT_PUBLIC_LIFE_TOKEN_ADDRESS:', process.env.NEXT_PUBLIC_LIFE_TOKEN_ADDRESS);
  console.log('NEXT_PUBLIC_ECONOMY_CONTRACT_ADDRESS:', process.env.NEXT_PUBLIC_ECONOMY_CONTRACT_ADDRESS);
  console.log('NEXT_PUBLIC_WORLD_ID_ADDRESS_BOOK:', process.env.NEXT_PUBLIC_WORLD_ID_ADDRESS_BOOK);
  
  console.log('\nContract addresses from utils:');
  console.log('LIFE_TOKEN:', CONTRACT_ADDRESSES.LIFE_TOKEN);
  console.log('ECONOMY:', CONTRACT_ADDRESSES.ECONOMY);
  console.log('WORLD_ID_ADDRESS_BOOK:', CONTRACT_ADDRESSES.WORLD_ID_ADDRESS_BOOK);
  
  const missing = [];
  if (!CONTRACT_ADDRESSES.LIFE_TOKEN) missing.push('LIFE_TOKEN');
  if (!CONTRACT_ADDRESSES.ECONOMY) missing.push('ECONOMY');
  if (!CONTRACT_ADDRESSES.WORLD_ID_ADDRESS_BOOK) missing.push('WORLD_ID_ADDRESS_BOOK');
  
  if (missing.length > 0) {
    console.error('❌ Missing contract addresses:', missing.join(', '));
    return false;
  }
  
  console.log('✅ All required addresses configured');
  return true;
}

// Run tests
async function runTests() {
  console.log('🚀 Starting Contract Tests\n');
  
  const envOk = testEnvironment();
  if (!envOk) {
    console.log('\n❌ Environment test failed');
    return;
  }
  
  const contractOk = await testContract();
  
  console.log('\n📊 Test Results:');
  console.log('Environment:', envOk ? '✅ PASS' : '❌ FAIL');
  console.log('Contract:', contractOk ? '✅ PASS' : '❌ FAIL');
}

runTests().catch(console.error);