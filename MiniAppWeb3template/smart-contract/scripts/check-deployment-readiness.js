const { ethers } = require("hardhat");
require("dotenv").config();

/**
 * Pre-deployment readiness check
 * Verifies environment, balance, and network connectivity
 */

async function checkDeploymentReadiness() {
  console.log("🔍 Checking Deployment Readiness...\n");
  
  const checks = {
    environment: false,
    balance: false,
    network: false,
    compilation: false
  };
  
  try {
    // 1. Check environment variables
    console.log("📋 1. Environment Variables:");
    
    if (!process.env.PRIVATE_KEY) {
      console.log("❌ PRIVATE_KEY not set in .env file");
      console.log("   Add your private key (without 0x prefix) to .env:");
      console.log('   PRIVATE_KEY="your-private-key-here"');
      return false;
    } else {
      console.log("✅ PRIVATE_KEY configured");
      checks.environment = true;
    }
    
    const rpcUrl = process.env.WORLDCHAIN_RPC_URL || "https://worldchain-mainnet.g.alchemy.com/public";
    console.log(`✅ RPC URL: ${rpcUrl}`);
    
    // 2. Check network connectivity
    console.log("\n🌐 2. Network Connectivity:");
    
    try {
      const network = await ethers.provider.getNetwork();
      const blockNumber = await ethers.provider.getBlockNumber();
      
      console.log(`✅ Connected to: ${network.name || 'worldchain'}`);
      console.log(`✅ Chain ID: ${network.chainId}`);
      console.log(`✅ Latest block: ${blockNumber}`);
      
      if (Number(network.chainId) !== 480) {
        console.log("⚠️ Warning: Expected Chain ID 480 (Worldchain)");
      } else {
        checks.network = true;
      }
      
    } catch (error) {
      console.log("❌ Network connection failed:", error.message);
      return false;
    }
    
    // 3. Check deployer wallet
    console.log("\n💰 3. Deployer Wallet:");
    
    try {
      const [deployer] = await ethers.getSigners();
      const balance = await ethers.provider.getBalance(deployer.address);
      const balanceETH = parseFloat(ethers.formatEther(balance));
      
      console.log(`📍 Address: ${deployer.address}`);
      console.log(`💵 Balance: ${balanceETH.toFixed(6)} ETH`);
      
      const requiredETH = 0.01; // Minimum required (Worldchain has very low gas costs)
      const recommendedETH = 0.05; // Recommended amount (OP Stack rollup)
      
      if (balanceETH >= recommendedETH) {
        console.log(`✅ Balance sufficient (${balanceETH.toFixed(6)} >= ${recommendedETH} ETH)`);
        checks.balance = true;
      } else if (balanceETH >= requiredETH) {
        console.log(`⚠️ Balance minimum (${balanceETH.toFixed(6)} >= ${requiredETH} ETH) - Consider adding more`);
        checks.balance = true;
      } else {
        console.log(`❌ Insufficient balance (${balanceETH.toFixed(6)} < ${requiredETH} ETH)`);
        console.log("   Please add ETH to your wallet on Worldchain");
        return false;
      }
      
    } catch (error) {
      console.log("❌ Wallet check failed:", error.message);
      return false;
    }
    
    // 4. Check contract compilation
    console.log("\n🔨 4. Contract Compilation:");
    
    try {
      // Try to get contract factories to verify compilation
      await ethers.getContractFactory("LIFE");
      await ethers.getContractFactory("Economy");
      await ethers.getContractFactory("Property");
      await ethers.getContractFactory("LimitedEdition");
      await ethers.getContractFactory("PlayerRegistry");
      
      console.log("✅ All contracts compiled successfully");
      checks.compilation = true;
      
    } catch (error) {
      console.log("❌ Contract compilation issue:", error.message);
      console.log("   Run: npx hardhat compile");
      return false;
    }
    
    // 5. Final readiness assessment
    console.log("\n🎯 5. Deployment Readiness Summary:");
    
    const readyChecks = Object.values(checks).filter(Boolean).length;
    const totalChecks = Object.keys(checks).length;
    
    console.log(`Environment: ${checks.environment ? '✅' : '❌'}`);
    console.log(`Network: ${checks.network ? '✅' : '❌'}`);
    console.log(`Balance: ${checks.balance ? '✅' : '❌'}`);
    console.log(`Compilation: ${checks.compilation ? '✅' : '❌'}`);
    
    console.log(`\nStatus: ${readyChecks}/${totalChecks} checks passed`);
    
    if (readyChecks === totalChecks) {
      console.log("\n🎉 READY FOR PRODUCTION DEPLOYMENT!");
      console.log("\n🚀 Next step: Run deployment command:");
      console.log("   node deploy-production.js");
      console.log("\n📋 What will be deployed:");
      console.log("   • LIFE Token with real World ID Router");
      console.log("   • Property Contract for real estate NFTs");
      console.log("   • LimitedEdition Contract for collectibles");
      console.log("   • PlayerRegistry for user data and leaderboards");
      console.log("   • Economy Contract for all transactions");
      console.log("   • Complete permission setup between contracts");
      return true;
    } else {
      console.log("\n⚠️ NOT READY - Please fix the issues above");
      return false;
    }
    
  } catch (error) {
    console.error("\n❌ Readiness check failed:", error);
    return false;
  }
}

// Run the check
if (require.main === module) {
  checkDeploymentReadiness()
    .then((ready) => {
      process.exit(ready ? 0 : 1);
    })
    .catch((error) => {
      console.error("❌ Check failed:", error);
      process.exit(1);
    });
}

module.exports = { checkDeploymentReadiness };
