const { createPublicClient, http } = require('viem');
const { worldchain } = require('viem/chains');
require('dotenv').config({ path: '.env.production' });
require('dotenv').config({ path: '../smart-contract/.env' });

const ECONOMY_ABI = [
  {
    "inputs": [
      { "internalType": "string", "name": "propertyType", "type": "string" }
    ],
    "name": "getPropertyPrice",
    "outputs": [
      {
        "components": [
          { "internalType": "uint256", "name": "lifePrice", "type": "uint256" },
          { "internalType": "uint256", "name": "wldPrice", "type": "uint256" },
          { "internalType": "bool", "name": "isActive", "type": "bool" }
        ],
        "internalType": "struct Economy.PropertyPrice",
        "name": "",
        "type": "tuple"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  }
];

const ECONOMY_ADDRESS = '0xC49e59216Ae053586F416fEde49b1A9d2B290a29';

async function checkPrice() {
  const publicClient = createPublicClient({
    chain: worldchain,
    transport: http(process.env.NEXT_PUBLIC_WLD_RPC_URL || 'https://worldchain-mainnet.g.alchemy.com/v2/demo')
  });

  try {
    const result = await publicClient.readContract({
      address: ECONOMY_ADDRESS,
      abi: ECONOMY_ABI,
      functionName: 'getPropertyPrice',
      args: ['neural_pod']
    });
    
    console.log('Raw contract result:', result);
    console.log('Result type:', typeof result);
    console.log('Is array:', Array.isArray(result));
    
    if (Array.isArray(result)) {
      console.log('Array elements:');
      result.forEach((item, index) => {
        console.log(`  [${index}]:`, item, typeof item);
      });
    } else if (result && typeof result === 'object') {
      console.log('Object properties:');
      Object.keys(result).forEach(key => {
        console.log(`  ${key}:`, result[key], typeof result[key]);
      });
    }
  } catch (error) {
    console.error('Error calling contract:', error);
  }
}

checkPrice();