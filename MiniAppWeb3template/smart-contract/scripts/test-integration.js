const { ethers } = require("hardhat");

async function testIntegration() {
  console.log("🧪 Testing Smart Contract Integration...\n");
  
  const [deployer, user1] = await ethers.getSigners();
  console.log("Deployer:", deployer.address);
  console.log("Test User:", user1.address);
  
  // Deploy MockWorldIDAddressBook
  console.log("\n1. Deploying MockWorldIDAddressBook...");
  const MockWorldIDAddressBook = await ethers.getContractFactory("MockWorldIDAddressBook");
  const mockWorldIDAddressBook = await MockWorldIDAddressBook.deploy();
  await mockWorldIDAddressBook.waitForDeployment();
  
  // Set user as verified
  await mockWorldIDAddressBook.setAddressVerifiedUntil(user1.address, Math.floor(Date.now() / 1000) + 86400);
  console.log("✅ MockWorldIDAddressBook deployed and user verified");
  
  // Deploy LIFE token
  console.log("\n2. Deploying LIFE token...");
  const LIFE = await ethers.getContractFactory("LIFE");
  const life = await upgrades.deployProxy(LIFE, [await mockWorldIDAddressBook.getAddress(), deployer.address], {
    initializer: "initialize",
    kind: "uups"
  });
  await life.waitForDeployment();
  console.log("✅ LIFE token deployed");
  
  // Deploy Property contract
  console.log("\n3. Deploying Property contract...");
  const Property = await ethers.getContractFactory("Property");
  const property = await upgrades.deployProxy(Property, [deployer.address], {
    initializer: "initialize",
    kind: "uups"
  });
  await property.waitForDeployment();
  console.log("✅ Property contract deployed");
  
  // Deploy LimitedEdition contract
  console.log("\n4. Deploying LimitedEdition contract...");
  const LimitedEdition = await ethers.getContractFactory("LimitedEdition");
  const limitedEdition = await upgrades.deployProxy(LimitedEdition, [deployer.address], {
    initializer: "initialize",
    kind: "uups"
  });
  await limitedEdition.waitForDeployment();
  console.log("✅ LimitedEdition contract deployed");
  
  // Deploy PlayerRegistry contract
  console.log("\n5. Deploying PlayerRegistry contract...");
  const PlayerRegistry = await ethers.getContractFactory("PlayerRegistry");
  const playerRegistry = await upgrades.deployProxy(PlayerRegistry, [
    deployer.address, 
    await life.getAddress(), 
    await property.getAddress(), 
    await limitedEdition.getAddress()
  ], {
    initializer: "initialize",
    kind: "uups"
  });
  await playerRegistry.waitForDeployment();
  console.log("✅ PlayerRegistry contract deployed");
  
  // Deploy Economy contract
  console.log("\n6. Deploying Economy contract...");
  const Economy = await ethers.getContractFactory("Economy");
  const economy = await upgrades.deployProxy(Economy, [
    deployer.address, // owner
    await life.getAddress(), // lifeToken
    ethers.ZeroAddress, // wldToken (using zero address for testing)
    await property.getAddress(), // propertyContract
    await limitedEdition.getAddress(), // limitedEditionContract
    await playerRegistry.getAddress(), // playerRegistry
    deployer.address, // treasury
    deployer.address // devWallet
  ], {
    initializer: "initialize",
    kind: "uups"
  });
  await economy.waitForDeployment();
  console.log("✅ Economy contract deployed");
  
  // Set up permissions
  console.log("\n7. Setting up permissions...");
  await life.addAuthorizedMinter(await economy.getAddress());
  await property.addAuthorizedMinter(await economy.getAddress());
  await limitedEdition.addAuthorizedMinter(await economy.getAddress());
  await playerRegistry.addAuthorizedUpdater(await economy.getAddress());
  console.log("✅ Permissions configured");
  
  // Test LIFE token claiming
  console.log("\n8. Testing LIFE token claiming...");
  try {
    await life.connect(user1).claim("TestRegion");
    const balance = await life.balanceOf(user1.address);
    console.log(`✅ User claimed LIFE tokens. Balance: ${ethers.formatEther(balance)} LIFE`);
  } catch (error) {
    console.log(`❌ LIFE claiming failed: ${error.message}`);
  }
  
  // Test Property purchase
  console.log("\n9. Testing Property purchase...");
  try {
    // First approve the economy contract to spend LIFE tokens
    await life.connect(user1).approve(await economy.getAddress(), ethers.parseEther("1000"));
    
    await economy.connect(user1).purchaseProperty(
      "house",
      "Test House",
      "Test Location",
      1,
      false, // use LIFE, not WLD
      "test-uri"
    );
    
    const propertyBalance = await property.balanceOf(user1.address);
    console.log(`✅ Property purchased successfully. User owns ${propertyBalance} properties`);
  } catch (error) {
    console.log(`❌ Property purchase failed: ${error.message}`);
  }
  
  // Test Limited Edition setup and purchase
  console.log("\n10. Testing Limited Edition functionality...");
  try {
    // Create a limited edition template
    await limitedEdition.createTemplate(
      "CyberPunk2077",
      "Gaming",
      "Legendary",
      500,
      100,
      ethers.parseEther("50"),
      "Season1"
    );
    
    // Set price in Economy
    await economy.setLimitedEditionPrice(
      "CyberPunk2077",
      ethers.parseEther("50"), // 50 LIFE
      0, // 0 WLD
      true
    );
    
    // Purchase limited edition
    await economy.connect(user1).purchaseLimitedEdition(
      "CyberPunk2077",
      false, // use LIFE
      "test-uri"
    );
    
    const leBalance = await limitedEdition.balanceOf(user1.address);
    console.log(`✅ Limited Edition purchased successfully. User owns ${leBalance} limited editions`);
  } catch (error) {
    console.log(`❌ Limited Edition purchase failed: ${error.message}`);
  }
  
  // Test PlayerRegistry functionality
  console.log("\n11. Testing PlayerRegistry functionality...");
  try {
    await playerRegistry.registerPlayer(user1.address);
    await playerRegistry.updatePlayerData(user1.address);
    
    const playerData = await playerRegistry.getPlayerData(user1.address);
    console.log(`✅ Player registered and updated. Status Score: ${playerData.totalStatusScore}`);
  } catch (error) {
    console.log(`❌ PlayerRegistry test failed: ${error.message}`);
  }
  
  console.log("\n🎉 Integration test completed!");
  
  return {
    success: true,
    contracts: {
      life: await life.getAddress(),
      property: await property.getAddress(),
      limitedEdition: await limitedEdition.getAddress(),
      playerRegistry: await playerRegistry.getAddress(),
      economy: await economy.getAddress(),
      mockWorldIDAddressBook: await mockWorldIDAddressBook.getAddress()
    }
  };
}

// Run test if called directly
if (require.main === module) {
  testIntegration()
    .then((result) => {
      console.log("\n📋 Test Results:");
      console.log(JSON.stringify(result, null, 2));
      process.exit(0);
    })
    .catch((error) => {
      console.error("❌ Integration test failed:", error);
      process.exit(1);
    });
}

module.exports = { testIntegration };
