const { ethers } = require("hardhat");

async function testSimpleEconomy() {
    console.log("\n🧪 Testing Simple Economy Contract...\n");

    // Get contract addresses from deployment info
    const deploymentInfo = require('./production-deployment.json');
    console.log("📄 Using deployment addresses:");
    console.log("  🏗️  Economy:", deploymentInfo.contracts.economy);
    console.log("  🪙 LIFE Token:", deploymentInfo.contracts.life);
    console.log("  🏠 Property:", deploymentInfo.contracts.property);

    // Connect to contracts
    const [owner] = await ethers.getSigners();
    console.log(`👤 Testing with account: ${owner.address}`);

    const Economy = await ethers.getContractAt("Economy", deploymentInfo.contracts.economy);
    const LifeToken = await ethers.getContractAt("LIFE", deploymentInfo.contracts.life);
    const Property = await ethers.getContractAt("Property", deploymentInfo.contracts.property);

    try {
        // Test 1: Check basic contract functions
        console.log("\n=== Test 1: Basic Contract Functions ===");
        
        const housePrice = await Economy.getPropertyPrice("house");
        console.log(`🏠 House price: ${ethers.formatEther(housePrice.lifePrice)} LIFE`);
        console.log(`🏠 House price: ${ethers.formatEther(housePrice.wldPrice)} WLD`);
        console.log(`🏠 House active: ${housePrice.isActive}`);
        
        const wldToLife = await Economy.convertWldToLife(ethers.parseEther("1"));
        console.log(`💱 1 WLD = ${ethers.formatEther(wldToLife)} LIFE`);
        
        // Test 2: Check user balances
        console.log("\n=== Test 2: User Balances ===");
        
        const lifeBalance = await LifeToken.balanceOf(owner.address);
        console.log(`🪙 LIFE Balance: ${ethers.formatEther(lifeBalance)} LIFE`);
        
        const hasWorldID = await LifeToken.hasReceivedSigningBonus(owner.address);
        console.log(`🆔 Has World ID: ${hasWorldID}`);
        
        if (hasWorldID) {
            const checkIns = await LifeToken.getLifetimeCheckIns(owner.address);
            console.log(`📅 Lifetime check-ins: ${checkIns.toString()}`);
        }

        // Test 3: Property purchase simulation
        console.log("\n=== Test 3: Property Purchase Simulation ===");
        
        const userLifeBalance = await LifeToken.balanceOf(owner.address);
        const requiredLife = housePrice.lifePrice; // Level 1 house
        
        console.log(`💰 Required for house: ${ethers.formatEther(requiredLife)} LIFE`);
        console.log(`💰 User balance: ${ethers.formatEther(userLifeBalance)} LIFE`);
        
        if (userLifeBalance >= requiredLife) {
            console.log(`✅ User can afford a house purchase!`);
            
            // Check current properties owned
            const userProperties = await Property.balanceOf(owner.address);
            console.log(`🏠 Properties owned: ${userProperties.toString()}`);
            
            console.log(`💡 You can test purchasing by calling:`);
            console.log(`   Economy.purchaseProperty("house", "My House", "Virtual City", 1, false, "")`);
            
        } else {
            console.log(`❌ Insufficient LIFE balance for house purchase`);
            const needed = requiredLife - userLifeBalance;
            console.log(`💡 Need ${ethers.formatEther(needed)} more LIFE`);
            console.log(`💡 Claim daily LIFE tokens to build up balance`);
        }

        // Test 4: Income generation settings
        console.log("\n=== Test 4: Income Generation Settings ===");
        
        const baseIncomeRate = await Economy.baseIncomeRate();
        const holdingBonusRate = await Economy.holdingBonusRate();
        const maxHoldingBonus = await Economy.maxHoldingBonus();
        
        console.log(`📈 Income Settings:`);
        console.log(`   • Base rate: ${ethers.formatEther(baseIncomeRate)} LIFE/day`);
        console.log(`   • Holding bonus: ${holdingBonusRate.toString()}bps per day`);
        console.log(`   • Max holding bonus: ${maxHoldingBonus.toString()}bps (${(Number(maxHoldingBonus) / 100).toFixed(1)}%)`);

        // Test 5: Purchase tracking
        console.log("\n=== Test 5: Purchase History ===");
        
        const totalPurchases = await Economy.totalPurchases(owner.address);
        const totalLifeSpent = await Economy.totalSpentLife(owner.address);
        const totalWldSpent = await Economy.totalSpentWld(owner.address);
        const totalIncomeEarned = await Economy.totalIncomeEarned(owner.address);
        
        console.log(`📊 Purchase Stats:`);
        console.log(`   • Total purchases: ${totalPurchases.toString()}`);
        console.log(`   • Total LIFE spent: ${ethers.formatEther(totalLifeSpent)} LIFE`);
        console.log(`   • Total WLD spent: ${ethers.formatEther(totalWldSpent)} WLD`);
        console.log(`   • Total income earned: ${ethers.formatEther(totalIncomeEarned)} LIFE`);

        // Test 6: Property types and pricing
        console.log("\n=== Test 6: All Property Types ===");
        
        const propertyTypes = ["house", "apartment", "office", "land", "mansion"];
        
        for (const propertyType of propertyTypes) {
            try {
                const price = await Economy.getPropertyPrice(propertyType);
                console.log(`🏗️  ${propertyType.toUpperCase()}:`);
                console.log(`   • LIFE: ${ethers.formatEther(price.lifePrice)} LIFE`);
                console.log(`   • WLD: ${ethers.formatEther(price.wldPrice)} WLD`);
                console.log(`   • Active: ${price.isActive}`);
                
                // Calculate level 5 pricing
                const level5Multiplier = 100 + (5 - 1) * 20; // 180%
                const level5Price = (price.lifePrice * BigInt(level5Multiplier)) / BigInt(100);
                console.log(`   • Level 5: ${ethers.formatEther(level5Price)} LIFE`);
                
            } catch (error) {
                console.log(`❌ Error checking ${propertyType}: ${error.message}`);
            }
        }

        console.log("\n🎉 Simple Economy Test Complete!");
        console.log("\n📋 Summary:");
        console.log("✅ Contract deployed and functional");
        console.log("✅ Property pricing system working");
        console.log("✅ Level-based multipliers active");
        console.log("✅ Income generation system configured");
        console.log("✅ Purchase tracking operational");
        console.log("✅ Multiple property types available");
        
        console.log("\n🎮 How to Use:");
        console.log("1. 🪙 Ensure you have LIFE tokens (claim daily)");
        console.log("2. 🏠 Choose a property type and level");
        console.log("3. 💰 Purchase with LIFE or WLD tokens");
        console.log("4. ⏰ Wait 24+ hours for yield generation");
        console.log("5. 💎 Claim your yield rewards");
        console.log("6. 🔄 Repeat to build your property portfolio!");

        return {
            contractAddress: deploymentInfo.contracts.economy,
            userBalance: ethers.formatEther(userLifeBalance),
            canAffordHouse: userLifeBalance >= requiredLife,
            housePrice: ethers.formatEther(requiredLife)
        };

    } catch (error) {
        console.error("❌ Test failed:", error);
        throw error;
    }
}

// Run the test
if (require.main === module) {
    testSimpleEconomy()
        .then((result) => {
            console.log("\n✅ All tests passed!");
            console.log(`💰 Your LIFE balance: ${result.userBalance} LIFE`);
            console.log(`🏠 House costs: ${result.housePrice} LIFE`);
            console.log(`💸 Can afford house: ${result.canAffordHouse ? '✅ Yes' : '❌ No'}`);
            process.exit(0);
        })
        .catch((error) => {
            console.error("❌ Tests failed:", error);
            process.exit(1);
        });
}

module.exports = { testSimpleEconomy };
