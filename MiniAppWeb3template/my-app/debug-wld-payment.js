const { createPublicClient, http, parseEther } = require('viem');
const { worldchain } = require('viem/chains');
const fs = require('fs');
const path = require('path');

// Load environment variables
require('dotenv').config({ path: '.env.production' });

// Contract addresses from environment
const CONTRACT_ADDRESSES = {
  ECONOMY: process.env.NEXT_PUBLIC_ECONOMY_CONTRACT_ADDRESS,
  PROPERTY: process.env.NEXT_PUBLIC_PROPERTY_CONTRACT_ADDRESS,
  LIFE_TOKEN: process.env.NEXT_PUBLIC_LIFE_TOKEN_ADDRESS
};

// Create client
const client = createPublicClient({
  chain: worldchain,
  transport: http('https://worldchain-mainnet.g.alchemy.com/public')
});

// Economy contract ABI (minimal for testing)
const ECONOMY_ABI = [
  {
    "inputs": [
      {"internalType": "string", "name": "propertyType", "type": "string"},
      {"internalType": "string", "name": "name", "type": "string"},
      {"internalType": "string", "name": "location", "type": "string"},
      {"internalType": "uint256", "name": "level", "type": "uint256"},
      {"internalType": "bool", "name": "useWLD", "type": "bool"},
      {"internalType": "string", "name": "tokenURI", "type": "string"}
    ],
    "name": "purchaseProperty",
    "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
    "stateMutability": "payable",
    "type": "function"
  },
  {
    "inputs": [{"internalType": "string", "name": "propertyType", "type": "string"}],
    "name": "getPropertyPrice",
    "outputs": [
      {"internalType": "uint256", "name": "lifePrice", "type": "uint256"},
      {"internalType": "uint256", "name": "wldPrice", "type": "uint256"},
      {"internalType": "bool", "name": "isActive", "type": "bool"}
    ],
    "stateMutability": "view",
    "type": "function"
  }
];

async function debugWLDPayment() {
  console.log('🔍 Debugging WLD Payment Flow');
  console.log('================================');
  
  try {
    // 1. Check contract addresses
    console.log('\n1. Contract Configuration:');
    console.log('Economy Contract:', CONTRACT_ADDRESSES.ECONOMY);
    console.log('Property Contract:', CONTRACT_ADDRESSES.PROPERTY);
    console.log('LIFE Token:', CONTRACT_ADDRESSES.LIFE_TOKEN);
    
    // 2. Check if Economy contract exists
    console.log('\n2. Contract Verification:');
    const economyCode = await client.getBytecode({ address: CONTRACT_ADDRESSES.ECONOMY });
    console.log('Economy contract exists:', economyCode ? 'YES' : 'NO');
    
    // 3. Test property price fetching
    console.log('\n3. Property Price Check:');
    const propertyType = 'neural_pod';
    
    try {
      const priceResult = await client.readContract({
        address: CONTRACT_ADDRESSES.ECONOMY,
        abi: ECONOMY_ABI,
        functionName: 'getPropertyPrice',
        args: [propertyType]
      });
      
      console.log(`Price for ${propertyType}:`);
      console.log('- LIFE Price:', priceResult[0].toString(), 'wei');
      console.log('- WLD Price:', priceResult[1].toString(), 'wei');
      console.log('- Is Active:', priceResult[2]);
      console.log('- WLD Price in tokens:', (Number(priceResult[1]) / 1e18).toFixed(4));
      
    } catch (priceError) {
      console.error('❌ Price fetch failed:', priceError.message);
    }
    
    // 4. Check MiniKit Pay configuration
    console.log('\n4. MiniKit Pay Configuration:');
    console.log('APP_ID:', process.env.APP_ID || 'NOT SET');
    console.log('DEV_PORTAL_API_KEY:', process.env.DEV_PORTAL_API_KEY ? 'SET' : 'NOT SET');
    console.log('WLD_APP_ID:', process.env.NEXT_PUBLIC_WLD_APP_ID || 'NOT SET');
    
    // 5. Simulate payment payload
    console.log('\n5. Payment Payload Simulation:');
    const mockPayload = {
      reference: 'test-ref-123',
      to: CONTRACT_ADDRESSES.ECONOMY,
      tokens: [{
        symbol: 'WLD',
        token_amount: parseEther('0.1').toString()
      }],
      description: 'Purchase neural_pod property: Test Property'
    };
    
    console.log('Mock WLD Payment Payload:');
    console.log(JSON.stringify(mockPayload, null, 2));
    
    // 6. Check transaction parameters
    console.log('\n6. Transaction Parameters Check:');
    const mockTxParams = {
      address: CONTRACT_ADDRESSES.ECONOMY,
      abi: ECONOMY_ABI,
      functionName: 'purchaseProperty',
      args: [
        'neural_pod',
        'Test Neural Pod',
        'Test Location',
        BigInt(1),
        true, // useWLD
        ''
      ]
    };
    
    console.log('Mock Transaction Parameters:');
    console.log('- Property Type:', mockTxParams.args[0]);
    console.log('- Name:', mockTxParams.args[1]);
    console.log('- Location:', mockTxParams.args[2]);
    console.log('- Level:', mockTxParams.args[3].toString());
    console.log('- Use WLD:', mockTxParams.args[4]);
    console.log('- Token URI:', mockTxParams.args[5]);
    
    console.log('\n✅ Debug completed successfully!');
    console.log('\n📋 Next Steps:');
    console.log('1. Test the payment flow in World App');
    console.log('2. Check browser console for MiniKit errors');
    console.log('3. Verify wallet has sufficient WLD balance');
    console.log('4. Ensure World App is updated to latest version');
    
  } catch (error) {
    console.error('❌ Debug failed:', error);
  }
}

// Run the debug
debugWLDPayment().catch(console.error);