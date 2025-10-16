// Simple test to verify contract calls are working
const { EconomyContract } = require('./src/lib/contract-utils.ts');

async function testContractCall() {
  try {
    console.log('Testing EconomyContract.getPropertyPrice...');
    const result = await EconomyContract.getPropertyPrice('data_fortress');
    console.log('Contract call result:', {
      lifePrice: result.lifePrice.toString(),
      wldPrice: result.wldPrice.toString(),
      isActive: result.isActive
    });
    
    if (result.lifePrice === 0n && result.wldPrice === 0n && !result.isActive) {
      console.log('❌ Contract call returned default values - likely not configured in contract');
    } else {
      console.log('✅ Contract call successful with real data');
    }
  } catch (error) {
    console.error('❌ Contract call failed:', error.message);
  }
}

testContractCall();