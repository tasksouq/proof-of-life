// Debug script to test property contract functionality
const { createPublicClient, http } = require('viem');

// Worldchain configuration
const worldchain = {
  id: 480,
  name: "Worldchain",
  network: "worldchain",
  nativeCurrency: {
    decimals: 18,
    name: "Worldchain Ether",
    symbol: "ETH",
  },
  rpcUrls: {
    default: {
      http: ["https://worldchain-mainnet.g.alchemy.com/public"],
    },
    public: {
      http: ["https://worldchain-mainnet.g.alchemy.com/public"],
    },
  },
  blockExplorers: {
    default: {
      name: "WorldcoinExplorer",
      url: "https://explorer.worldcoin.org",
    },
  },
};

// Contract addresses from production environment
const CONTRACT_ADDRESSES = {
  PROPERTY: '0xc31851a3f3A8fe340f0520222e46fA42cFB2ed58',
  ECONOMY: '0xC49e59216Ae053586F416fEde49b1A9d2B290a29'
};

// Test user address - we need to use the actual user's wallet address
// Since we don't have the user's address, let's make this configurable
const TEST_USER_ADDRESS = process.argv[2] || '0x0000000000000000000000000000000000000000'; // Pass address as argument

// Minimal ABI for testing
const PROPERTY_ABI = [
  {
    "inputs": [],
    "name": "_tokenIdCounter",
    "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [{"internalType": "address", "name": "", "type": "address"}],
    "name": "authorizedMinters",
    "outputs": [{"internalType": "bool", "name": "", "type": "bool"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [{"internalType": "address", "name": "owner", "type": "address"}],
    "name": "balanceOf",
    "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [{"internalType": "address", "name": "owner", "type": "address"}],
    "name": "getPropertiesByOwner",
    "outputs": [{"internalType": "uint256[]", "name": "", "type": "uint256[]"}],
    "stateMutability": "view",
    "type": "function"
  }
];

async function debugPropertyContract() {
  console.log('=== Property Contract Debug ===');
  console.log('Property Contract Address:', CONTRACT_ADDRESSES.PROPERTY);
  console.log('Economy Contract Address:', CONTRACT_ADDRESSES.ECONOMY);
  console.log('Test User Address:', TEST_USER_ADDRESS);
  console.log('');

  // Initialize Viem client
  const client = createPublicClient({
    chain: worldchain,
    transport: http("https://worldchain-mainnet.g.alchemy.com/public"),
  });

  try {
    // 1. Check if Property contract exists
    console.log('1. Checking if Property contract exists at address...');
    const bytecode = await client.getBytecode({
      address: CONTRACT_ADDRESSES.PROPERTY,
    });
    
    if (!bytecode || bytecode === '0x') {
      console.log('❌ CRITICAL ISSUE: No contract found at Property address!');
      console.log('This means the contract is not deployed at this address.');
      return;
    } else {
      console.log('✅ Contract exists at Property address');
      console.log('Bytecode length:', bytecode.length, 'characters');
    }
    console.log('');
    
    // 2. Check if Economy contract exists
    console.log('2. Checking if Economy contract exists at address...');
    const economyBytecode = await client.getBytecode({
      address: CONTRACT_ADDRESSES.ECONOMY,
    });
    
    if (!economyBytecode || economyBytecode === '0x') {
      console.log('❌ CRITICAL ISSUE: No contract found at Economy address!');
      console.log('This means the contract is not deployed at this address.');
    } else {
      console.log('✅ Contract exists at Economy address');
      console.log('Bytecode length:', economyBytecode.length, 'characters');
    }
    console.log('');

    // 3. Try to call basic ERC721 functions
    console.log('3. Testing basic contract functions...');
    try {
      const balance = await client.readContract({
        address: CONTRACT_ADDRESSES.PROPERTY,
        abi: PROPERTY_ABI,
        functionName: 'balanceOf',
        args: [TEST_USER_ADDRESS],
      });
      console.log('✅ balanceOf function works. User property balance:', balance.toString());
      
      // If balanceOf works, try getPropertiesByOwner
      const tokenIds = await client.readContract({
        address: CONTRACT_ADDRESSES.PROPERTY,
        abi: PROPERTY_ABI,
        functionName: 'getPropertiesByOwner',
        args: [TEST_USER_ADDRESS],
      });
      console.log('✅ getPropertiesByOwner function works. Token IDs:', tokenIds.map(id => id.toString()));
      
      if (tokenIds.length === 0) {
        console.log('❌ No properties found for user');
        console.log('This could mean:');
        console.log('  - User has not purchased any properties');
        console.log('  - Properties were not minted successfully');
        console.log('  - Wrong user address being checked');
        console.log('  - Contract functions work but no data exists');
      } else {
        console.log('✅ Found', tokenIds.length, 'properties for user');
      }
      
    } catch (error) {
      console.log('❌ Contract function calls failed:');
      console.log('Error:', error.shortMessage || error.message);
      console.log('This suggests the contract ABI might be incorrect or the contract is not the expected type.');
    }
    console.log('');

  } catch (error) {
    console.error('❌ Error during debug:', error);
  }
}

// Run the debug function
debugPropertyContract().catch(console.error);