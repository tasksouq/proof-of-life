const { ethers } = require("hardhat");

async function main() {
  console.log("🔍 Testing Current Contract Setup...");
  console.log("");

  // Get the deployer account
  const [deployer] = await ethers.getSigners();
  console.log("📝 Testing with account:", deployer.address);
  
  // Contract addresses
  const LIFE_TOKEN = "0xE4D62e62013EaF065Fa3F0316384F88559C80889"; // Your upgraded token
  const ECONOMY_CONTRACT = "0xB6831e4EC7502cAe80Ba6308Ac2B3812c5C815Df"; // New Economy contract
  const WLD_TOKEN = "0x2cFc85d8E48F8EAB294be644d9E25C3030863003"; // Worldchain WLD
  
  console.log("🏗️  Contract Addresses:");
  console.log("   LIFE Token:", LIFE_TOKEN);
  console.log("   Economy Contract:", ECONOMY_CONTRACT);
  console.log("   WLD Token:", WLD_TOKEN);
  console.log("");

  try {
    // Test LIFE Token
    console.log("🧪 Testing LIFE Token...");
    const lifeToken = await ethers.getContractAt("LIFE", LIFE_TOKEN);
    
    console.log("📊 LIFE Token Details:");
    console.log("   Name:", await lifeToken.name());
    console.log("   Symbol:", await lifeToken.symbol());
    console.log("   Total Supply:", ethers.formatEther(await lifeToken.totalSupply()));
    console.log("   Decimals:", await lifeToken.decimals());
    console.log("   App ID:", await lifeToken.APP_ID());
    console.log("   Group ID:", await lifeToken.getGroupId());
    console.log("");
    
    // Test Economy Contract
    console.log("🧪 Testing Economy Contract...");
    const economyContract = await ethers.getContractAt("Economy", ECONOMY_CONTRACT);
    
    console.log("📊 Economy Contract Details:");
    console.log("   Treasury:", await economyContract.treasury());
    console.log("   Dev Wallet:", await economyContract.devWallet());
    console.log("   Treasury Fee:", Number(await economyContract.treasuryFee()) / 100 + "%");
    console.log("   Dev Fee:", Number(await economyContract.devFee()) / 100 + "%");
    console.log("");
    
    // Test Economy's LIFE token reference
    console.log("🔍 Checking Economy's LIFE Token Reference...");
    const economyLifeToken = await economyContract.lifeToken();
    console.log("   Economy's LIFE token address:", economyLifeToken);
    
    if (economyLifeToken.toLowerCase() === LIFE_TOKEN.toLowerCase()) {
      console.log("   ✅ Economy contract is using the correct LIFE token");
    } else {
      console.log("   ❌ Economy contract is using a different LIFE token");
      console.log("   Expected:", LIFE_TOKEN);
      console.log("   Actual:", economyLifeToken);
    }
    console.log("");
    
    // Test WLD Token
    console.log("🧪 Testing WLD Token...");
    const wldToken = await ethers.getContractAt("IERC20", WLD_TOKEN);
    
    console.log("📊 WLD Token Details:");
    console.log("   Name:", await wldToken.name());
    console.log("   Symbol:", await wldToken.symbol());
    console.log("   Total Supply:", ethers.formatEther(await wldToken.totalSupply()));
    console.log("   Decimals:", await wldToken.decimals());
    console.log("");
    
    // Test Economy's WLD token reference
    console.log("🔍 Checking Economy's WLD Token Reference...");
    const economyWldToken = await economyContract.wldToken();
    console.log("   Economy's WLD token address:", economyWldToken);
    
    if (economyWldToken.toLowerCase() === WLD_TOKEN.toLowerCase()) {
      console.log("   ✅ Economy contract is using the correct WLD token");
    } else {
      console.log("   ❌ Economy contract is using a different WLD token");
      console.log("   Expected:", WLD_TOKEN);
      console.log("   Actual:", economyWldToken);
    }
    console.log("");
    
    // Test property prices
    console.log("🏠 Testing Property Prices...");
    try {
      const housePrice = await economyContract.getPropertyPrice("house");
      console.log("   House Price - LIFE:", ethers.formatEther(housePrice.lifePrice));
      console.log("   House Price - WLD:", ethers.formatEther(housePrice.wldPrice));
      console.log("   House Active:", housePrice.isActive);
    } catch (error) {
      console.log("   ❌ Error getting house price:", error.message);
    }
    console.log("");
    
    // Test new direct transfer functions
    console.log("🧪 Testing New Direct Transfer Functions...");
    try {
      // Test if the new functions exist
      const hasDirectTransfer = await economyContract.purchasePropertyWithDirectTransfer.staticCall(
        "house",
        "Test House",
        "Test Location",
        1,
        ""
      ).catch(() => false);
      
      const hasDirectWLDTransfer = await economyContract.purchasePropertyWithDirectWLDTransfer.staticCall(
        "house", 
        "Test House",
        "Test Location",
        1,
        ""
      ).catch(() => false);
      
      console.log("   ✅ purchasePropertyWithDirectTransfer function available");
      console.log("   ✅ purchasePropertyWithDirectWLDTransfer function available");
    } catch (error) {
      console.log("   ❌ Error testing new functions:", error.message);
    }
    console.log("");
    
    // Test authorization
    console.log("🔐 Testing Authorization...");
    const isAuthorized = await lifeToken.authorizedMinters(ECONOMY_CONTRACT);
    console.log("   Economy contract authorized to mint LIFE:", isAuthorized);
    console.log("");
    
  } catch (error) {
    console.log("❌ Error testing contracts:", error.message);
    console.log("   This might indicate a contract mismatch or deployment issue");
  }
  
  console.log("");
  console.log("🌐 Network Information:");
  const network = await deployer.provider.getNetwork();
  console.log("   Network Name:", network.name);
  console.log("   Chain ID:", network.chainId.toString());
  console.log("   Network Type:", network.chainId === 480n ? "Worldchain Mainnet" : "Other");
  
  console.log("");
  console.log("📝 Frontend Configuration Needed:");
  console.log("   NEXT_PUBLIC_LIFE_TOKEN_ADDRESS=" + LIFE_TOKEN);
  console.log("   NEXT_PUBLIC_ECONOMY_CONTRACT_ADDRESS=" + ECONOMY_CONTRACT);
  console.log("   NEXT_PUBLIC_WLD_CONTRACT_ADDRESS=" + WLD_TOKEN);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Test failed:", error);
    process.exit(1);
  });
