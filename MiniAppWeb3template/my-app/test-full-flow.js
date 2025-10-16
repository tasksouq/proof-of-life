const { createPublicClient, createWalletClient, http, parseEther, formatEther } = require('viem');
const { worldchain } = require('viem/chains');
const { privateKeyToAccount } = require('viem/accounts');
const path = require('path');

// Load environment variables from both locations
require('dotenv').config({ path: '.env.production' });
require('dotenv').config({ path: path.join('..', 'smart-contract', '.env') });

// Contract ABIs (simplified)
const PLAYER_REGISTRY_ABI = [
  {
    "inputs": [{"internalType": "address", "name": "player", "type": "address"}],
    "name": "registerPlayer",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [{"internalType": "address", "name": "", "type": "address"}],
    "name": "players",
    "outputs": [
      {"internalType": "address", "name": "playerAddress", "type": "address"},
      {"internalType": "string", "name": "region", "type": "string"},
      {"internalType": "uint256", "name": "totalStatusScore", "type": "uint256"},
      {"internalType": "uint256", "name": "lifetimeCheckIns", "type": "uint256"},
      {"internalType": "uint256", "name": "lifeTokenBalance", "type": "uint256"},
      {"internalType": "uint256", "name": "propertiesOwned", "type": "uint256"},
      {"internalType": "uint256", "name": "limitedEditionsOwned", "type": "uint256"},
      {"internalType": "uint256", "name": "lastUpdated", "type": "uint256"},
      {"internalType": "bool", "name": "isRegistered", "type": "bool"}
    ],
    "stateMutability": "view",
    "type": "function"
  }
];

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
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [{"internalType": "string", "name": "propertyType", "type": "string"}],
    "name": "getPropertyPrice",
    "outputs": [{
      "components": [
        {"internalType": "uint256", "name": "lifePrice", "type": "uint256"},
        {"internalType": "uint256", "name": "wldPrice", "type": "uint256"},
        {"internalType": "bool", "name": "isActive", "type": "bool"}
      ],
      "internalType": "struct Economy.PropertyPrice",
      "name": "",
      "type": "tuple"
    }],
    "stateMutability": "view",
    "type": "function"
  }
];

const WLD_ABI = [
  {
    "inputs": [{"internalType": "address", "name": "account", "type": "address"}],
    "name": "balanceOf",
    "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [{"internalType": "address", "name": "spender", "type": "address"}, {"internalType": "uint256", "name": "amount", "type": "uint256"}],
    "name": "approve",
    "outputs": [{"internalType": "bool", "name": "", "type": "bool"}],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [{"internalType": "address", "name": "owner", "type": "address"}, {"internalType": "address", "name": "spender", "type": "address"}],
    "name": "allowance",
    "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
    "stateMutability": "view",
    "type": "function"
  }
];

const PROPERTY_ABI = [
  {
    "inputs": [{"internalType": "address", "name": "owner", "type": "address"}],
    "name": "balanceOf",
    "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
    "stateMutability": "view",
    "type": "function"
  }
];

async function testFullFlow() {
  console.log('🧪 Testing Full Payment and Minting Flow\n');
  
  // Configuration
  const ECONOMY_ADDRESS = process.env.NEXT_PUBLIC_ECONOMY_CONTRACT_ADDRESS;
  const PROPERTY_ADDRESS = process.env.NEXT_PUBLIC_PROPERTY_CONTRACT_ADDRESS;
  const WLD_ADDRESS = process.env.NEXT_PUBLIC_WLD_CONTRACT_ADDRESS;
  const PLAYER_REGISTRY_ADDRESS = process.env.NEXT_PUBLIC_PLAYER_REGISTRY_CONTRACT_ADDRESS;
  let DEPLOYER_PRIVATE_KEY = process.env.PRIVATE_KEY;
  
  if (!DEPLOYER_PRIVATE_KEY) {
    console.error('❌ PRIVATE_KEY not found in smart-contract/.env');
    console.log('Please add your deployer private key to smart-contract/.env file');
    return;
  }
  
  // Ensure private key has 0x prefix
  if (!DEPLOYER_PRIVATE_KEY.startsWith('0x')) {
    DEPLOYER_PRIVATE_KEY = '0x' + DEPLOYER_PRIVATE_KEY;
  }
  
  console.log('📋 Configuration:');
  console.log(`Economy Contract: ${ECONOMY_ADDRESS}`);
  console.log(`Property Contract: ${PROPERTY_ADDRESS}`);
  console.log(`WLD Contract: ${WLD_ADDRESS}`);
  console.log(`Player Registry: ${PLAYER_REGISTRY_ADDRESS}\n`);
  
  if (!PLAYER_REGISTRY_ADDRESS) {
    console.error('❌ Player Registry contract address not found in environment variables');
    console.log('Please check NEXT_PUBLIC_PLAYER_REGISTRY_CONTRACT_ADDRESS in .env.production');
    return;
  }
  
  if (!WLD_ADDRESS) {
    console.error('❌ WLD contract address not found in environment variables');
    console.log('Please check NEXT_PUBLIC_WLD_CONTRACT_ADDRESS in .env.production');
    return;
  }
  
  // Setup clients
  const publicClient = createPublicClient({
    chain: worldchain,
    transport: http(process.env.NEXT_PUBLIC_RPC_URL)
  });
  
  const account = privateKeyToAccount(DEPLOYER_PRIVATE_KEY);
  const walletClient = createWalletClient({
    account,
    chain: worldchain,
    transport: http(process.env.NEXT_PUBLIC_RPC_URL)
  });
  
  console.log(`🔑 Testing with account: ${account.address}\n`);
  
  try {
    // Step 1: Check if player is registered
    console.log('1️⃣ Checking player registration...');
    const playerData = await publicClient.readContract({
      address: PLAYER_REGISTRY_ADDRESS,
      abi: PLAYER_REGISTRY_ABI,
      functionName: 'players',
      args: [account.address]
    });
    
    const isRegistered = playerData[8]; // isRegistered is the 9th field (index 8)
    console.log(`Player registered: ${isRegistered ? '✅ Yes' : '❌ No'}`);
    
    if (!isRegistered) {
      console.log('🔄 Registering player...');
      const registerHash = await walletClient.writeContract({
        address: PLAYER_REGISTRY_ADDRESS,
        abi: PLAYER_REGISTRY_ABI,
        functionName: 'registerPlayer',
        args: [account.address]
      });
      console.log(`Registration transaction: ${registerHash}`);
      
      const registerReceipt = await publicClient.waitForTransactionReceipt({ hash: registerHash });
      console.log(`Registration status: ${registerReceipt.status === 'success' ? '✅ Success' : '❌ Failed'}`);
    }
    console.log();
    
    // Step 2: Check WLD balance
    console.log('2️⃣ Checking WLD balance...');
    const wldBalance = await publicClient.readContract({
      address: WLD_ADDRESS,
      abi: WLD_ABI,
      functionName: 'balanceOf',
      args: [account.address]
    });
    console.log(`WLD Balance: ${formatEther(wldBalance)} WLD\n`);
    
    if (wldBalance === 0n) {
      console.log('⚠️  No WLD balance. Please add some WLD to the deployer wallet first.');
      return;
    }
    
    // Step 3: Check property price
    console.log('3️⃣ Checking neural_pod price...');
    const priceResult = await publicClient.readContract({
      address: ECONOMY_ADDRESS,
      abi: ECONOMY_ABI,
      functionName: 'getPropertyPrice',
      args: ['neural_pod']
    });
    
    // Extract wldPrice from the PropertyPrice struct
  const wldPrice = priceResult.wldPrice;
  
  console.log(`Neural pod price: ${formatEther(wldPrice)} WLD`);
  console.log(`Price struct:`, priceResult);
     
     if (wldBalance < wldPrice) {
      console.log(`❌ Insufficient WLD balance. Need ${formatEther(wldPrice)} WLD but have ${formatEther(wldBalance)} WLD`);
      return;
    }
    
    // Step 4: Check current allowance
    console.log('4️⃣ Checking WLD allowance...');
    const currentAllowance = await publicClient.readContract({
      address: WLD_ADDRESS,
      abi: WLD_ABI,
      functionName: 'allowance',
      args: [account.address, ECONOMY_ADDRESS]
    });
    console.log(`Current Allowance: ${formatEther(currentAllowance)} WLD\n`);
    
    // Step 5: Approve WLD if needed
    if (currentAllowance < wldPrice) {
      console.log('5️⃣ Approving WLD spending...');
      const approveHash = await walletClient.writeContract({
        address: WLD_ADDRESS,
        abi: WLD_ABI,
        functionName: 'approve',
        args: [ECONOMY_ADDRESS, wldPrice]
      });
      console.log(`Approve transaction: ${approveHash}`);
      
      const approveReceipt = await publicClient.waitForTransactionReceipt({ hash: approveHash });
      console.log(`Approve status: ${approveReceipt.status === 'success' ? '✅ Success' : '❌ Failed'}\n`);
      
      if (approveReceipt.status !== 'success') {
        console.log('❌ Approval failed. Cannot proceed.');
        return;
      }
    } else {
      console.log('5️⃣ ✅ Sufficient allowance already exists\n');
    }
    
    // Step 6: Check property balance before purchase
    console.log('6️⃣ Checking property balance before purchase...');
    const propertiesBefore = await publicClient.readContract({
      address: PROPERTY_ADDRESS,
      abi: PROPERTY_ABI,
      functionName: 'balanceOf',
      args: [account.address]
    });
    console.log(`Properties owned before: ${propertiesBefore}\n`);
    
    // Step 7: Purchase property with metadata
    console.log('7️⃣ Purchasing Neural Pod with metadata...');
    const propertyName = 'My Cyberpunk Neural Pod';
    const propertyLocation = 'Neo-Tokyo District 7, Sector 42';
    console.log(`Property Name: ${propertyName}`);
    console.log(`Property Location: ${propertyLocation}`);
    
    const purchaseHash = await walletClient.writeContract({
      address: ECONOMY_ADDRESS,
      abi: ECONOMY_ABI,
      functionName: 'purchaseProperty',
      args: [
        'neural_pod',        // propertyType
        propertyName,        // name
        propertyLocation,    // location
        BigInt(1),          // level
        true,               // useWLD
        ''                  // tokenURI (empty for now)
      ]
    });
    console.log(`Purchase transaction: ${purchaseHash}`);
    
    const purchaseReceipt = await publicClient.waitForTransactionReceipt({ hash: purchaseHash });
    console.log(`Purchase status: ${purchaseReceipt.status === 'success' ? '✅ Success' : '❌ Failed'}`);
    
    if (purchaseReceipt.status === 'success') {
      console.log('📄 Transaction logs:');
      purchaseReceipt.logs.forEach((log, index) => {
        console.log(`  Log ${index + 1}: ${JSON.stringify(log, null, 2)}`);
      });
    }
    console.log();
    
    // Step 8: Check property balance after purchase
    console.log('8️⃣ Checking property balance after purchase...');
    const propertiesAfter = await publicClient.readContract({
      address: PROPERTY_ADDRESS,
      abi: PROPERTY_ABI,
      functionName: 'balanceOf',
      args: [account.address]
    });
    console.log(`Properties owned after: ${propertiesAfter}`);
    
    const newProperties = propertiesAfter - propertiesBefore;
    console.log(`New properties minted: ${newProperties}\n`);
    
    // Step 9: Check WLD balance after purchase
    console.log('9️⃣ Checking WLD balance after purchase...');
    const wldBalanceAfter = await publicClient.readContract({
      address: WLD_ADDRESS,
      abi: WLD_ABI,
      functionName: 'balanceOf',
      args: [account.address]
    });
    console.log(`WLD Balance after: ${formatEther(wldBalanceAfter)} WLD`);
    console.log(`WLD spent: ${formatEther(wldBalance - wldBalanceAfter)} WLD\n`);
    
    // Summary
    console.log('📊 SUMMARY:');
    console.log(`✅ Payment: ${purchaseReceipt.status === 'success' ? 'SUCCESS' : 'FAILED'}`);
    console.log(`✅ Minting: ${newProperties > 0 ? 'SUCCESS' : 'FAILED'}`);
    console.log(`💰 Cost: ${formatEther(wldBalance - wldBalanceAfter)} WLD`);
    console.log(`🏠 Properties minted: ${newProperties}`);
    
    if (purchaseReceipt.status === 'success' && newProperties > 0) {
      console.log('\n🎉 FULL FLOW WORKING! Payment and minting both successful.');
    } else if (purchaseReceipt.status === 'success' && newProperties === 0) {
      console.log('\n⚠️  PAYMENT SUCCESS BUT NO MINTING! Check Economy contract authorization.');
    } else {
      console.log('\n❌ PAYMENT FAILED! Check contract configuration and balances.');
    }
    
  } catch (error) {
    console.error('❌ Error during test:', error.message);
    if (error.cause) {
      console.error('Cause:', error.cause);
    }
  }
}

// Run the test
testFullFlow().catch(console.error);