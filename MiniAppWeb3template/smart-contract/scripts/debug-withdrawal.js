const { ethers } = require("hardhat");
const deploymentInfo = require("../deployment-info.json");

async function main() {
  const [owner] = await ethers.getSigners();
  
  console.log("🔧 Debugging WLD Withdrawal Issue");
  console.log("================================");
  
  // Get contract addresses
  const economyAddress = deploymentInfo.contracts.economy;
  const wldTokenAddress = deploymentInfo.contracts.wldToken;
  
  console.log(`Economy: ${economyAddress}`);
  console.log(`WLD Token: ${wldTokenAddress}`);
  console.log(`Owner: ${owner.address}`);
  
  // Get contract instances
  const economy = await ethers.getContractAt("Economy", economyAddress);
  
  // Try different ways to interact with WLD token
  console.log("\n🧪 Testing WLD Token Interface...");
  
  // Test with minimal ERC20 interface
  const minimalERC20ABI = [
    "function balanceOf(address) view returns (uint256)",
    "function transfer(address, uint256) returns (bool)",
    "function allowance(address, address) view returns (uint256)"
  ];
  
  const wldToken = new ethers.Contract(wldTokenAddress, minimalERC20ABI, owner);
  
  try {
    const balance = await wldToken.balanceOf(economyAddress);
    console.log(`✅ WLD balance check: ${ethers.formatEther(balance)} WLD`);
    
    // Check if the contract has any allowance to itself
    const allowance = await wldToken.allowance(economyAddress, economyAddress);
    console.log(`📋 Self-allowance: ${ethers.formatEther(allowance)} WLD`);
    
    // Check allowance from contract to owner
    const allowanceToOwner = await wldToken.allowance(economyAddress, owner.address);
    console.log(`📋 Allowance to owner: ${ethers.formatEther(allowanceToOwner)} WLD`);
    
  } catch (error) {
    console.log(`❌ WLD token interaction failed: ${error.message}`);
  }
  
  // Test direct transfer from contract (this should fail but let's see the error)
  console.log("\n🧪 Testing Direct Transfer...");
  try {
    const tx = await wldToken.transfer(owner.address, ethers.parseEther("1"));
    console.log(`✅ Direct transfer successful: ${tx.hash}`);
  } catch (error) {
    console.log(`❌ Direct transfer failed (expected): ${error.message}`);
  }
  
  // Let's try to understand what's in the Economy contract's emergencyWithdrawWld function
  console.log("\n🧪 Testing Economy Contract Functions...");
  
  try {
    // Check if we can call other functions on the economy contract
    const owner_addr = await economy.owner();
    console.log(`✅ Economy owner check: ${owner_addr}`);
    
    // Try to get the wldToken address from the contract
    const contractWldToken = await economy.wldToken();
    console.log(`✅ Economy wldToken address: ${contractWldToken}`);
    console.log(`🔍 Addresses match: ${contractWldToken.toLowerCase() === wldTokenAddress.toLowerCase()}`);
    
  } catch (error) {
    console.log(`❌ Economy contract interaction failed: ${error.message}`);
  }
  
  // Try a very small withdrawal amount
  console.log("\n🧪 Testing Small Withdrawal Amount...");
  try {
    const smallAmount = ethers.parseEther("0.1");
    await economy.emergencyWithdrawWld.staticCall(smallAmount);
    console.log(`✅ Small withdrawal simulation successful`);
  } catch (error) {
    console.log(`❌ Small withdrawal simulation failed: ${error.message}`);
    
    // Try to decode the error
    if (error.data) {
      console.log(`🔍 Error data: ${error.data}`);
    }
  }
  
  // Check if there are any events or logs we can examine
  console.log("\n🧪 Checking Recent Contract Events...");
  try {
    const filter = economy.filters.Transfer?.() || null;
    if (filter) {
      const events = await economy.queryFilter(filter, -100); // Last 100 blocks
      console.log(`📋 Found ${events.length} Transfer events in last 100 blocks`);
    } else {
      console.log(`📋 No Transfer filter available`);
    }
  } catch (error) {
    console.log(`❌ Event query failed: ${error.message}`);
  }
  
  console.log(`\n✅ Debug analysis completed!`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Debug script failed:", error);
    process.exit(1);
  });