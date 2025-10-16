const { createPublicClient, http } = require('viem');

// Worldchain configuration
const worldchain = {
  id: 480,
  name: 'World Chain (Mainnet)',
  nativeCurrency: {
    decimals: 18,
    name: 'Ether',
    symbol: 'ETH',
  },
  rpcUrls: {
    default: {
      http: ['https://worldchain-mainnet.g.alchemy.com/public'],
    },
  },
};

// Contract addresses from .env.production
const PROPERTY_CONTRACT_ADDRESS = '0xc31851a3f3A8fe340f0520222e46fA42cFB2ed58';
const ECONOMY_CONTRACT_ADDRESS = '0xC49e59216Ae053586F416fEde49b1A9d2B290a29';

// Minimal ABI for checking authorized minters
const PROPERTY_ABI = [
  {
    "inputs": [{"internalType": "address", "name": "", "type": "address"}],
    "name": "authorizedMinters",
    "outputs": [{"internalType": "bool", "name": "", "type": "bool"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "owner",
    "outputs": [{"internalType": "address", "name": "", "type": "address"}],
    "stateMutability": "view",
    "type": "function"
  }
];

async function checkMinterAuthorization() {
  console.log('=== Minter Authorization Check ===');
  console.log('Property Contract Address:', PROPERTY_CONTRACT_ADDRESS);
  console.log('Economy Contract Address:', ECONOMY_CONTRACT_ADDRESS);
  console.log('');

  const client = createPublicClient({
    chain: worldchain,
    transport: http(),
  });

  try {
    console.log('1. Getting Property contract owner...');
    const owner = await client.readContract({
      address: PROPERTY_CONTRACT_ADDRESS,
      abi: PROPERTY_ABI,
      functionName: 'owner',
    });
    console.log('✅ Property contract owner:', owner);

    console.log('\n2. Checking if Economy contract is authorized minter...');
    const isAuthorizedMinter = await client.readContract({
      address: PROPERTY_CONTRACT_ADDRESS,
      abi: PROPERTY_ABI,
      functionName: 'authorizedMinters',
      args: [ECONOMY_CONTRACT_ADDRESS],
    });
    
    if (isAuthorizedMinter) {
      console.log('✅ Economy contract IS authorized to mint - authorization is correct');
      console.log('   The simulation_failed error must be caused by something else.');
    } else {
      console.log('❌ Economy contract is NOT authorized to mint - this is the problem!');
      console.log('   The Economy contract needs to be added as an authorized minter.');
      console.log('   The owner needs to call addAuthorizedMinter(' + ECONOMY_CONTRACT_ADDRESS + ')');
    }

    console.log('\n3. Diagnosis:');
    if (!isAuthorizedMinter) {
      console.log('   - Root cause: Economy contract lacks minting permission');
      console.log('   - Solution: Property owner must authorize Economy contract');
      console.log('   - Command: property.addAuthorizedMinter("' + ECONOMY_CONTRACT_ADDRESS + '")');
    } else {
      console.log('   - Authorization is correct, issue may be elsewhere');
      console.log('   - Check: Economy contract logic, gas limits, or other requirements');
    }
    
  } catch (error) {
    console.error('❌ Error checking minter authorization:', error.message);
    if (error.message.includes('reverted')) {
      console.log('   This suggests the Property contract may not implement AccessControl properly.');
    }
  }
}

checkMinterAuthorization().catch(console.error);