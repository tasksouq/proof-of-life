const { ethers } = require("hardhat");

async function testCurrentEconomy() {
    console.log("\n🔍 Testing Current Economy Contract...\n");

    // Get contract addresses from deployment info
    const deploymentInfo = require('./production-deployment.json');
    console.log("📄 Using production deployment addresses:");
    console.log("  🏗️  Economy:", deploymentInfo.contracts.economy);
    console.log("  🪙 LIFE Token:", deploymentInfo.contracts.life);

    // Connect to contracts
    const [owner] = await ethers.getSigners();
    console.log(`👤 Testing with account: ${owner.address}`);

    try {
        const Economy = await ethers.getContractAt("Economy", deploymentInfo.contracts.economy);
        const LifeToken = await ethers.getContractAt("LIFE", deploymentInfo.contracts.life);

        console.log("\n=== Testing Basic Functions ===");
        
        // Test basic contract interactions
        const housePrice = await Economy.getPropertyPrice("house");
        console.log(`🏠 House price: ${ethers.formatEther(housePrice.lifePrice)} LIFE`);
        
        const userBalance = await LifeToken.balanceOf(owner.address);
        console.log(`💰 User LIFE balance: ${ethers.formatEther(userBalance)} LIFE`);
        
        // Test World ID status
        const hasWorldID = await LifeToken.hasReceivedSigningBonus(owner.address);
        console.log(`🆔 Has World ID: ${hasWorldID}`);
        
        if (hasWorldID) {
            const checkIns = await LifeToken.getLifetimeCheckIns(owner.address);
            console.log(`📅 Lifetime check-ins: ${checkIns.toString()}`);
        }

        console.log("\n=== Testing New Functions ===");
        
        // Test if new functions exist
        try {
            const discountInfo = await Economy.getUserDiscountInfo(owner.address);
            console.log("✅ getUserDiscountInfo function exists and works");
            console.log(`   • Has World ID: ${discountInfo.hasWorldID}`);
            console.log(`   • Check-ins: ${discountInfo.checkIns.toString()}`);
            console.log(`   • Applicable discount: ${discountInfo.applicableDiscount.toString()}bps`);
        } catch (error) {
            console.log("❌ getUserDiscountInfo function not available:", error.message);
        }
        
        try {
            const discountedPrice = await Economy.calculateDiscountedPropertyPrice(
                "house", 
                1, 
                false, 
                owner.address
            );
            console.log("✅ calculateDiscountedPropertyPrice function exists and works");
            console.log(`   • Original: ${ethers.formatEther(discountedPrice.originalPrice)} LIFE`);
            console.log(`   • Discounted: ${ethers.formatEther(discountedPrice.discountedPrice)} LIFE`);
            console.log(`   • Discount rate: ${discountedPrice.discountRate.toString()}bps`);
        } catch (error) {
            console.log("❌ calculateDiscountedPropertyPrice function not available:", error.message);
        }

        try {
            const isWorldIDOnly = await Economy.isWorldIDOnlyProperty("mansion");
            console.log("✅ isWorldIDOnlyProperty function exists and works");
            console.log(`   • Mansion is World ID only: ${isWorldIDOnly}`);
        } catch (error) {
            console.log("❌ isWorldIDOnlyProperty function not available:", error.message);
        }

        console.log("\n🎯 Contract Analysis:");
        console.log("The current Economy contract appears to be the original version.");
        console.log("To add enhanced features, we need to:");
        console.log("1. Deploy a new upgradeable Economy contract, OR");
        console.log("2. Add functions to the current contract if it supports upgrades, OR");
        console.log("3. Deploy an enhancement contract that works alongside the current one");

    } catch (error) {
        console.error("❌ Test failed:", error);
    }
}

// Run the test
if (require.main === module) {
    testCurrentEconomy()
        .then(() => process.exit(0))
        .catch((error) => {
            console.error(error);
            process.exit(1);
        });
}

module.exports = { testCurrentEconomy };
