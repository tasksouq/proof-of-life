const { createPublicClient, http } = require('viem');
const { worldchain } = require('viem/chains');

// Contract addresses and ABI
const ECONOMY_ADDRESS = '0xC49e59216Ae053586F416fEde49b1A9d2B290a29';
const ECONOMY_ABI = [
  {
    "inputs": [
      { "internalType": "string", "name": "propertyType", "type": "string" }
    ],
    "name": "getPropertyPrice",
    "outputs": [
      { "internalType": "uint256", "name": "lifePrice", "type": "uint256" },
      { "internalType": "uint256", "name": "wldPrice", "type": "uint256" },
      { "internalType": "bool", "name": "isActive", "type": "bool" }
    ],
    "stateMutability": "view",
    "type": "function"
  }
];

async function debugNeuralPod() {
  console.log('=== Neural Pod Debug ===');
  
  // Create client
  const client = createPublicClient({
    chain: worldchain,
    transport: http('https://worldchain-mainnet.g.alchemy.com/v2/vUNbs9RWFV9UuJsq1ec5j')
  });
  
  const propertyTypes = ['neural_pod', 'data_fortress', 'cyber_tower', 'neon_palace', 'quantum_spire'];
  
  console.log('\nTesting Economy Contract Property Prices:');
  
  for (const propertyType of propertyTypes) {
    try {
      console.log(`\nTesting ${propertyType}...`);
      const result = await client.readContract({
        address: ECONOMY_ADDRESS,
        abi: ECONOMY_ABI,
        functionName: 'getPropertyPrice',
        args: [propertyType]
      });
      
      console.log(`${propertyType} result:`, {
        lifePrice: result[0].toString(),
        wldPrice: result[1].toString(),
        isActive: result[2]
      });
    } catch (error) {
      console.error(`Error with ${propertyType}:`, error.message);
      
      // Check if it's a revert error
      if (error.message.includes('revert') || error.message.includes('execution reverted')) {
        console.log(`  -> Property type '${propertyType}' likely not configured in Economy contract`);
      }
    }
  }
}

debugNeuralPod().catch(console.error);