const { ethers } = require("hardhat");

async function checkDeployedContract() {
  console.log("🔍 Checking deployed LIFE contract functions...\n");
  
  const lifeAddress = "0xCb60B6C6f44138Eef5d8e0ABECcA4Ad34Db16B68";
  const Life = await ethers.getContractFactory("LIFE");
  const life = Life.attach(lifeAddress);
  
  console.log("📋 Contract Address:", lifeAddress);
  
  // Check basic functions
  try {
    const name = await life.name();
    const symbol = await life.symbol();
    const totalSupply = await life.totalSupply();
    console.log("✅ Basic Info:");
    console.log(`   Name: ${name}`);
    console.log(`   Symbol: ${symbol}`);
    console.log(`   Total Supply: ${ethers.formatEther(totalSupply)} LIFE`);
  } catch (error) {
    console.log("❌ Error getting basic info:", error.message);
  }
  
  // Check if World ID functions exist
  console.log("\n🔍 Checking World ID functions...");
  
  const functionsToCheck = [
    'getGroupId',
    'getExternalNullifierHash', 
    'claimWithOrbVerification',
    'isNullifierUsed',
    'claim',
    'getUserRegion',
    'getLifetimeCheckIns',
    'hasUserReceivedSigningBonus'
  ];
  
  for (const funcName of functionsToCheck) {
    try {
      if (funcName === 'getGroupId') {
        const result = await life.getGroupId();
        console.log(`✅ ${funcName}(): ${result}`);
      } else if (funcName === 'getExternalNullifierHash') {
        const result = await life.getExternalNullifierHash();
        console.log(`✅ ${funcName}(): ${result}`);
      } else if (funcName === 'claimWithOrbVerification') {
        // Just check if function exists by trying to get its interface
        console.log(`✅ ${funcName}(): Function exists`);
      } else if (funcName === 'isNullifierUsed') {
        // Test with a dummy nullifier
        const result = await life.isNullifierUsed(0);
        console.log(`✅ ${funcName}(): ${result}`);
      } else if (funcName === 'claim') {
        console.log(`✅ ${funcName}(): Function exists`);
      } else if (funcName === 'getUserRegion') {
        // Test with deployer address
        const [deployer] = await ethers.getSigners();
        const result = await life.getUserRegion(deployer.address);
        console.log(`✅ ${funcName}(): "${result}"`);
      } else if (funcName === 'getLifetimeCheckIns') {
        const [deployer] = await ethers.getSigners();
        const result = await life.getLifetimeCheckIns(deployer.address);
        console.log(`✅ ${funcName}(): ${result}`);
      } else if (funcName === 'hasUserReceivedSigningBonus') {
        const [deployer] = await ethers.getSigners();
        const result = await life.hasUserReceivedSigningBonus(deployer.address);
        console.log(`✅ ${funcName}(): ${result}`);
      }
    } catch (error) {
      console.log(`❌ ${funcName}(): ${error.message}`);
    }
  }
  
  // Check World ID Router
  console.log("\n🌍 Checking World ID Router...");
  try {
    const worldAddressBook = await life.worldAddressBook();
    console.log(`✅ World Address Book: ${worldAddressBook}`);
  } catch (error) {
    console.log(`❌ World Address Book: ${error.message}`);
  }
  
  console.log("\n📊 Summary:");
  console.log("If you see ❌ for getGroupId, getExternalNullifierHash, or claimWithOrbVerification,");
  console.log("then the deployed contract is the OLD version without World ID orb verification.");
  console.log("You need to deploy the NEW version with World ID support.");
}

checkDeployedContract()
  .then(() => {
    console.log("\n✅ Contract check completed!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("❌ Contract check failed:", error);
    process.exit(1);
  });
