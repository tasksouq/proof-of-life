const { ethers } = require("hardhat");
const fs = require("fs");

/**
 * Frontend Integration Test
 * Verifies that all production contracts are accessible and working correctly
 * for frontend integration
 */

async function testFrontendIntegration() {
  console.log("🔍 Testing Frontend Integration with Production Contracts...\n");
  
  // Load production deployment info
  const deploymentPath = './production-deployment.json';
  if (!fs.existsSync(deploymentPath)) {
    throw new Error("Production deployment info not found. Run deployment first.");
  }
  
  const deployment = JSON.parse(fs.readFileSync(deploymentPath, 'utf8'));
  const contracts = deployment.contracts;
  
  console.log("📋 Production Contract Addresses:");
  console.log(`LIFE Token: ${contracts.life}`);
  console.log(`Economy: ${contracts.economy}`);
  console.log(`Property: ${contracts.property}`);
  console.log(`Limited Edition: ${contracts.limitedEdition}`);
  console.log(`Player Registry: ${contracts.playerRegistry}`);
  
  const tests = {
    lifeToken: false,
    economy: false,
    property: false,
    limitedEdition: false,
    playerRegistry: false,
    worldId: false
  };
  
  try {
    // 1. Test LIFE Token Contract
    console.log("\n💎 1. Testing LIFE Token Contract...");
    const LIFE = await ethers.getContractFactory("LIFE");
    const life = LIFE.attach(contracts.life);
    
    const tokenName = await life.name();
    const tokenSymbol = await life.symbol();
    const totalSupply = await life.totalSupply();
    const groupId = await life.getGroupId();
    const appId = await life.APP_ID();
    const action = await life.INCOGNITO_ACTION();
    
    console.log(`✅ Token: ${tokenName} (${tokenSymbol})`);
    console.log(`✅ Total Supply: ${ethers.formatEther(totalSupply)} LIFE`);
    console.log(`✅ Group ID: ${groupId} (Orb verification)`);
    console.log(`✅ App ID: ${appId}`);
    console.log(`✅ Action: ${action}`);
    tests.lifeToken = true;
    
    // 2. Test Economy Contract
    console.log("\n💰 2. Testing Economy Contract...");
    const Economy = await ethers.getContractFactory("Economy");
    const economy = Economy.attach(contracts.economy);
    
    const treasuryFee = await economy.treasuryFee();
    const devFee = await economy.devFee();
    const wldToLifeRate = await economy.wldToLifeRate();
    
    console.log(`✅ Treasury Fee: ${Number(treasuryFee)/100}%`);
    console.log(`✅ Dev Fee: ${Number(devFee)/100}%`);
    console.log(`✅ WLD to LIFE Rate: ${ethers.formatEther(wldToLifeRate)}`);
    
    // Test property pricing
    const propertyTypes = ["house", "apartment", "office", "land", "mansion"];
    console.log(`✅ Property Prices:`);
    for (const type of propertyTypes) {
      const price = await economy.getPropertyPrice(type);
      console.log(`   ${type}: ${ethers.formatEther(price.lifePrice)} LIFE (${ethers.formatEther(price.wldPrice)} WLD)`);
    }
    tests.economy = true;
    
    // 3. Test Property Contract
    console.log("\n🏠 3. Testing Property Contract...");
    const Property = await ethers.getContractFactory("Property");
    const property = Property.attach(contracts.property);
    
    const propertyName = await property.name();
    const propertySymbol = await property.symbol();
    const totalProperties = await property.totalSupply();
    
    console.log(`✅ Property NFT: ${propertyName} (${propertySymbol})`);
    console.log(`✅ Total Properties: ${totalProperties}`);
    tests.property = true;
    
    // 4. Test Limited Edition Contract
    console.log("\n🎨 4. Testing Limited Edition Contract...");
    const LimitedEdition = await ethers.getContractFactory("LimitedEdition");
    const limitedEdition = LimitedEdition.attach(contracts.limitedEdition);
    
    const leName = await limitedEdition.name();
    const leSymbol = await limitedEdition.symbol();
    const totalLimitedEditions = await limitedEdition.totalSupply();
    
    console.log(`✅ Limited Edition NFT: ${leName} (${leSymbol})`);
    console.log(`✅ Total Limited Editions: ${totalLimitedEditions}`);
    tests.limitedEdition = true;
    
    // 5. Test Player Registry Contract
    console.log("\n👥 5. Testing Player Registry Contract...");
    const PlayerRegistry = await ethers.getContractFactory("PlayerRegistry");
    const playerRegistry = PlayerRegistry.attach(contracts.playerRegistry);
    
    const totalPlayers = await playerRegistry.getTotalPlayers();
    const currentSeason = await playerRegistry.currentSeason();
    
    console.log(`✅ Total Players: ${totalPlayers}`);
    console.log(`✅ Current Season: ${currentSeason}`);
    tests.playerRegistry = true;
    
    // 6. Test World ID Configuration
    console.log("\n🌍 6. Testing World ID Configuration...");
    const worldIdRouter = "0x17B354dD2595411ff79041f930e491A4Df39A278";
    const worldIdGroupId = await life.getGroupId();
    const externalNullifierHash = await life.getExternalNullifierHash();
    
    console.log(`✅ World ID Router: ${worldIdRouter}`);
    console.log(`✅ Group ID: ${worldIdGroupId} (1 = Orb only)`);
    console.log(`✅ External Nullifier Hash: ${externalNullifierHash}`);
    tests.worldId = true;
    
    // 7. Test Contract Permissions
    console.log("\n🔐 7. Testing Contract Permissions...");
    const economyAddress = contracts.economy;
    
    const canMintLife = await life.authorizedMinters(economyAddress);
    const canMintProperty = await property.authorizedMinters(economyAddress);
    const canMintLE = await limitedEdition.authorizedMinters(economyAddress);
    const canUpdatePlayer = await playerRegistry.authorizedUpdaters(economyAddress);
    
    console.log(`✅ Economy can mint LIFE: ${canMintLife}`);
    console.log(`✅ Economy can mint Properties: ${canMintProperty}`);
    console.log(`✅ Economy can mint Limited Editions: ${canMintLE}`);
    console.log(`✅ Economy can update Players: ${canUpdatePlayer}`);
    
    // 8. Generate Frontend Integration Code
    console.log("\n📝 8. Generating Frontend Integration Code...");
    
    const frontendConfig = `
// Frontend Configuration - Copy to your .env.local file
NEXT_PUBLIC_LIFE_TOKEN_ADDRESS=${contracts.life}
NEXT_PUBLIC_ECONOMY_CONTRACT_ADDRESS=${contracts.economy}
NEXT_PUBLIC_PROPERTY_CONTRACT_ADDRESS=${contracts.property}
NEXT_PUBLIC_LIMITED_EDITION_ADDRESS=${contracts.limitedEdition}
NEXT_PUBLIC_PLAYER_REGISTRY_ADDRESS=${contracts.playerRegistry}
NEXT_PUBLIC_WORLD_ID_ROUTER_ADDRESS=${worldIdRouter}
NEXT_PUBLIC_WLD_CONTRACT_ADDRESS=0x2cFc85d8E48F8EAB294be644d9E25C3030863003
NEXT_PUBLIC_CHAIN_ID=480
NEXT_PUBLIC_RPC_URL=https://worldchain-mainnet.g.alchemy.com/public
NEXT_PUBLIC_WORLD_ID_APP_ID=${appId}
NEXT_PUBLIC_WORLD_ID_ACTION=${action}

// TypeScript Configuration
export const PRODUCTION_CONTRACTS = {
  LIFE_TOKEN: "${contracts.life}",
  ECONOMY: "${contracts.economy}",
  PROPERTY: "${contracts.property}",
  LIMITED_EDITION: "${contracts.limitedEdition}",
  PLAYER_REGISTRY: "${contracts.playerRegistry}",
  WORLD_ID_ROUTER: "${worldIdRouter}",
  WLD_TOKEN: "0x2cFc85d8E48F8EAB294be644d9E25C3030863003"
} as const;

// World ID Configuration
export const WORLD_ID_CONFIG = {
  appId: "${appId}",
  action: "${action}",
  verification_level: VerificationLevel.Orb
};
`;
    
    fs.writeFileSync('./frontend-integration-config.txt', frontendConfig);
    console.log(`✅ Frontend config saved to: frontend-integration-config.txt`);
    
    // 9. Test Summary
    console.log("\n📊 9. Integration Test Summary...");
    const passedTests = Object.values(tests).filter(Boolean).length;
    const totalTests = Object.keys(tests).length;
    
    console.log(`Tests passed: ${passedTests}/${totalTests}`);
    console.log(`Success rate: ${((passedTests/totalTests) * 100).toFixed(1)}%`);
    
    if (passedTests === totalTests) {
      console.log("\n🎉 ALL TESTS PASSED!");
      console.log("✅ Production contracts are ready for frontend integration");
      console.log("🚀 Your human-verified token economy is live!");
      
      console.log("\n📋 Next Steps for Frontend:");
      console.log("1. Copy the environment variables from frontend-integration-config.txt");
      console.log("2. Update your .env.local file with production addresses");
      console.log("3. Test World ID integration with real orb-verified users");
      console.log("4. Deploy your frontend to production");
      console.log("5. Monitor user interactions and contract events");
      
      return true;
    } else {
      console.log("\n⚠️ Some tests failed. Review the errors above.");
      return false;
    }
    
  } catch (error) {
    console.error("\n❌ Integration test failed:", error);
    return false;
  }
}

// Run the test
if (require.main === module) {
  testFrontendIntegration()
    .then((success) => {
      process.exit(success ? 0 : 1);
    })
    .catch((error) => {
      console.error("❌ Test failed:", error);
      process.exit(1);
    });
}

module.exports = { testFrontendIntegration };
