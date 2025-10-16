const { ethers } = require("hardhat");

async function testNetwork() {
  try {
    console.log("Testing Worldchain connection...");
    
    const network = await ethers.provider.getNetwork();
    const [deployer] = await ethers.getSigners();
    const balance = await ethers.provider.getBalance(deployer.address);
    const blockNumber = await ethers.provider.getBlockNumber();
    
    console.log("Network Name:", network.name);
    console.log("Chain ID:", Number(network.chainId));
    console.log("Deployer:", deployer.address);
    console.log("Balance:", ethers.formatEther(balance), "ETH");
    console.log("Latest Block:", blockNumber);
    
    // Check if we're on the right network
    if (Number(network.chainId) === 480) {
      console.log("✅ Connected to Worldchain correctly!");
      return true;
    } else {
      console.log("❌ Wrong network! Expected Chain ID 480 (Worldchain)");
      return false;
    }
    
  } catch (error) {
    console.error("❌ Network test failed:", error.message);
    return false;
  }
}

testNetwork();
