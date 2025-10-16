const { ethers } = require("hardhat");

async function main() {
  console.log("🔍 Checking Contract Upgradeability...");
  console.log("");

  const EXISTING_LIFE_TOKEN = "0xE4D62e62013EaF065Fa3F0316384F88559C80889";
  
  // Get the deployer account
  const [deployer] = await ethers.getSigners();
  console.log("📝 Checking with account:", deployer.address);
  console.log("🎯 Target address:", EXISTING_LIFE_TOKEN);
  console.log("");

  try {
    // Check if the address has code (is a contract)
    const code = await deployer.provider.getCode(EXISTING_LIFE_TOKEN);
    console.log("📋 Contract Code Length:", code.length);
    
    if (code === "0x") {
      console.log("❌ ERROR: No contract code found at this address!");
      return;
    }
    
    console.log("✅ Contract code found at address");
    console.log("");

    // Try to interact with it as a basic ERC20 first
    console.log("🧪 Testing as Basic ERC20...");
    try {
      // Use direct calls to avoid ABI issues
      const nameCall = await deployer.provider.call({
        to: EXISTING_LIFE_TOKEN,
        data: "0x06fdde03" // name() function selector
      });
      
      const symbolCall = await deployer.provider.call({
        to: EXISTING_LIFE_TOKEN,
        data: "0x95d89b41" // symbol() function selector
      });
      
      const totalSupplyCall = await deployer.provider.call({
        to: EXISTING_LIFE_TOKEN,
        data: "0x18160ddd" // totalSupply() function selector
      });
      
      const decimalsCall = await deployer.provider.call({
        to: EXISTING_LIFE_TOKEN,
        data: "0x313ce567" // decimals() function selector
      });
      
      // Decode the results
      const name = ethers.toUtf8String(nameCall);
      const symbol = ethers.toUtf8String(symbolCall);
      const totalSupply = BigInt(totalSupplyCall);
      const decimals = BigInt(decimalsCall);
      
      console.log("✅ Basic ERC20 Details:");
      console.log("   Name:", name);
      console.log("   Symbol:", symbol);
      console.log("   Total Supply:", ethers.formatEther(totalSupply));
      console.log("   Decimals:", decimals.toString());
      console.log("");
      
    } catch (error) {
      console.log("❌ Failed to interact as ERC20:", error.message);
      return;
    }

    // Check if it's an upgradeable contract by looking for proxy patterns
    console.log("🔍 Checking for Proxy Patterns...");
    
    // Check for EIP-1967 proxy storage slots
    const IMPLEMENTATION_SLOT = "0x360894a13ba1a3210667c828492db98dca3e2076cc3735a920a3ca505d382bbc";
    const ADMIN_SLOT = "0xb53127684a568b3173ae13b9f8a6016e243e63b6e8ee1178d6a717850b5d6103";
    
    try {
      const implementation = await deployer.provider.getStorage(EXISTING_LIFE_TOKEN, IMPLEMENTATION_SLOT);
      const admin = await deployer.provider.getStorage(EXISTING_LIFE_TOKEN, ADMIN_SLOT);
      
      console.log("📋 Proxy Storage Analysis:");
      console.log("   Implementation Slot:", implementation);
      console.log("   Admin Slot:", admin);
      
      if (implementation !== "0x0000000000000000000000000000000000000000000000000000000000000000") {
        console.log("✅ Contract appears to be a proxy (EIP-1967)");
        console.log("   Implementation Address:", "0x" + implementation.slice(-40));
      } else {
        console.log("❌ Contract is NOT a proxy - cannot be upgraded");
      }
      
    } catch (error) {
      console.log("❌ Error checking proxy storage:", error.message);
    }
    
    // Try to check if it has owner/admin functions
    console.log("");
    console.log("🔍 Checking for Owner/Admin Functions...");
    
    try {
      // Try to call owner() function
      const owner = await deployer.provider.call({
        to: EXISTING_LIFE_TOKEN,
        data: "0x8da5cb5b" // owner() function selector
      });
      
      if (owner && owner !== "0x") {
        const ownerAddress = "0x" + owner.slice(-40);
        console.log("✅ Contract has owner function");
        console.log("   Owner Address:", ownerAddress);
        console.log("   Is deployer owner?", ownerAddress.toLowerCase() === deployer.address.toLowerCase());
      } else {
        console.log("❌ No owner function found");
      }
      
    } catch (error) {
      console.log("❌ Error checking owner function:", error.message);
    }
    
    // Check for upgrade functions
    console.log("");
    console.log("🔍 Checking for Upgrade Functions...");
    
    const upgradeSelectors = [
      "0x3659cfe6", // upgradeTo(address)
      "0x4f1ef286", // upgradeToAndCall(address,bytes)
      "0x8f283970", // changeAdmin(address)
      "0xf851a440"  // admin()
    ];
    
    for (const selector of upgradeSelectors) {
      try {
        await deployer.provider.call({
          to: EXISTING_LIFE_TOKEN,
          data: selector
        });
        console.log(`✅ Found upgrade function: ${selector}`);
      } catch (error) {
        // Function doesn't exist or requires parameters
      }
    }
    
  } catch (error) {
    console.log("❌ Error checking contract:", error.message);
  }
  
  console.log("");
  console.log("📝 Recommendations:");
  console.log("   1. If contract is upgradeable: We can upgrade it to add World ID features");
  console.log("   2. If contract is NOT upgradeable: We need to modify Economy contract");
  console.log("   3. If you're the owner: We can try to upgrade");
  console.log("   4. If you're not the owner: We need to work with the existing contract");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Script failed:", error);
    process.exit(1);
  });
