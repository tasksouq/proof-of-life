const { ethers } = require("hardhat");
const deploymentInfo = require("../deployment-info.json");

async function main() {
  const [owner] = await ethers.getSigners();
  const network = await ethers.provider.getNetwork();
  const networkName = network.name === "unknown" ? "worldchain" : network.name;
  
  console.log("🔍 Checking Contract and Token Balances");
  console.log("======================================");
  console.log(`Network: ${networkName} (Chain ID: ${network.chainId})`);
  console.log(`Owner: ${owner.address}`);
  
  // Get contract addresses
  const economyAddress = deploymentInfo.contracts.economy;
  const lifeTokenAddress = deploymentInfo.contracts.lifeToken;
  const wldTokenAddress = deploymentInfo.contracts.wldToken;
  
  console.log("\nContract addresses:");
  console.log(`Economy: ${economyAddress}`);
  console.log(`LIFE Token: ${lifeTokenAddress}`);
  console.log(`WLD Token: ${wldTokenAddress}`);
  
  // Get contract instances
  const economy = await ethers.getContractAt("Economy", economyAddress);
  const lifeToken = await ethers.getContractAt("IERC20", lifeTokenAddress);
  const wldToken = await ethers.getContractAt("IERC20", wldTokenAddress);
  
  // Check ownership
  const contractOwner = await economy.owner();
  console.log(`\n👤 Contract Owner: ${contractOwner}`);
  console.log(`👤 Your Address: ${owner.address}`);
  console.log(`✅ You are owner: ${contractOwner.toLowerCase() === owner.address.toLowerCase()}`);
  
  // Check token balances
  console.log(`\n📊 Token Balances:`);
  
  // Economy contract balances
  const economyLifeBalance = await lifeToken.balanceOf(economyAddress);
  const economyWldBalance = await wldToken.balanceOf(economyAddress);
  console.log(`   Economy Contract LIFE: ${ethers.formatEther(economyLifeBalance)} LIFE`);
  console.log(`   Economy Contract WLD: ${ethers.formatEther(economyWldBalance)} WLD`);
  
  // Owner balances
  const ownerLifeBalance = await lifeToken.balanceOf(owner.address);
  const ownerWldBalance = await wldToken.balanceOf(owner.address);
  console.log(`   Owner LIFE: ${ethers.formatEther(ownerLifeBalance)} LIFE`);
  console.log(`   Owner WLD: ${ethers.formatEther(ownerWldBalance)} WLD`);
  
  // Check ETH balance
  const ethBalance = await ethers.provider.getBalance(owner.address);
  console.log(`   Owner ETH: ${ethers.formatEther(ethBalance)} ETH`);
  
  // Try to get more info about the WLD token
  try {
    const wldName = await wldToken.name();
    const wldSymbol = await wldToken.symbol();
    const wldDecimals = await wldToken.decimals();
    console.log(`\n🪙 WLD Token Info:`);
    console.log(`   Name: ${wldName}`);
    console.log(`   Symbol: ${wldSymbol}`);
    console.log(`   Decimals: ${wldDecimals}`);
  } catch (error) {
    console.log(`\n⚠️  Could not get WLD token info: ${error.message}`);
  }
  
  // Check if we can call the withdrawal function (dry run)
  if (economyWldBalance > 0n) {
    console.log(`\n🧪 Testing WLD withdrawal (dry run)...`);
    try {
      // This will simulate the transaction without actually executing it
      await economy.emergencyWithdrawWld.staticCall(economyWldBalance);
      console.log(`✅ WLD withdrawal simulation successful`);
    } catch (error) {
      console.log(`❌ WLD withdrawal simulation failed: ${error.message}`);
      
      // Try to get more specific error info
      if (error.message.includes("revert")) {
        console.log(`💡 This suggests the contract function is reverting`);
      }
    }
  }
  
  console.log(`\n✅ Balance check completed!`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Balance check failed:", error);
    process.exit(1);
  });