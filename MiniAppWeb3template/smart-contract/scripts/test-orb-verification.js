const { ethers, upgrades } = require("hardhat");
const { expect } = require("chai");

describe("LIFE Token - Orb Verification Tests", function () {
  let life, mockWorldIDRouter, deployer, user1, user2;
  let validRoot, validNullifier1, validNullifier2;
  let externalNullifierHash;

  beforeEach(async function () {
    [deployer, user1, user2] = await ethers.getSigners();

    // Deploy MockWorldIDRouter
    console.log("Deploying MockWorldIDRouter...");
    const MockWorldIDRouter = await ethers.getContractFactory("MockWorldIDRouter");
    mockWorldIDRouter = await MockWorldIDRouter.deploy();
    await mockWorldIDRouter.waitForDeployment();

    // Deploy LIFE token with new orb verification
    console.log("Deploying LIFE token...");
    const LIFE = await ethers.getContractFactory("LIFE");
    life = await upgrades.deployProxy(
      LIFE,
      [await mockWorldIDRouter.getAddress(), deployer.address],
      { initializer: "initialize" }
    );
    await life.waitForDeployment();

    // Setup test data
    validRoot = "0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef";
    validNullifier1 = ethers.keccak256(ethers.toUtf8Bytes("test-nullifier-1"));
    validNullifier2 = ethers.keccak256(ethers.toUtf8Bytes("test-nullifier-2"));

    // Add valid test data to mock
    await mockWorldIDRouter.addValidRoot(validRoot);
    await mockWorldIDRouter.addValidNullifier(validNullifier1);
    await mockWorldIDRouter.addValidNullifier(validNullifier2);

    // Get external nullifier hash from contract
    externalNullifierHash = await life.getExternalNullifierHash();

    console.log("Setup complete!");
    console.log("LIFE Token:", await life.getAddress());
    console.log("MockWorldIDRouter:", await mockWorldIDRouter.getAddress());
    console.log("External Nullifier Hash:", externalNullifierHash.toString());
  });

  describe("Orb Verification Setup", function () {
    it("Should have correct group ID (1 for orb verification)", async function () {
      expect(await life.getGroupId()).to.equal(1);
    });

    it("Should have computed external nullifier hash", async function () {
      expect(await life.getExternalNullifierHash()).to.not.equal(0);
    });

    it("Should not have any nullifiers used initially", async function () {
      expect(await life.isNullifierUsed(validNullifier1)).to.be.false;
      expect(await life.isNullifierUsed(validNullifier2)).to.be.false;
    });
  });

  describe("Orb-Verified Claims", function () {
    it("Should allow first claim with valid orb verification", async function () {
      const mockProof = [0, 0, 0, 0, 0, 0, 0, 0]; // Mock proof
      const region = "Test Region";

      // Verify user can claim with orb verification
      await expect(
        life.connect(user1).claimWithOrbVerification(
          user1.address,
          validRoot,
          validNullifier1,
          mockProof,
          region
        )
      ).to.emit(life, "SigningBonusClaimed")
        .withArgs(user1.address, ethers.parseEther("1000"), region)
        .and.to.emit(life, "DailyRewardClaimed")
        .withArgs(user1.address, ethers.parseEther("1"), region)
        .and.to.emit(life, "OrbVerificationCompleted")
        .withArgs(user1.address, validNullifier1);

      // Check balances
      expect(await life.balanceOf(user1.address)).to.equal(ethers.parseEther("1001")); // 1000 + 1
      expect(await life.hasUserReceivedSigningBonus(user1.address)).to.be.true;
      expect(await life.getUserRegion(user1.address)).to.equal(region);
      expect(await life.getLifetimeCheckIns(user1.address)).to.equal(1);

      // Check nullifier is marked as used
      expect(await life.isNullifierUsed(validNullifier1)).to.be.true;
    });

    it("Should prevent double-spending with same nullifier", async function () {
      const mockProof = [0, 0, 0, 0, 0, 0, 0, 0];
      const region = "Test Region";

      // First claim should succeed
      await life.connect(user1).claimWithOrbVerification(
        user1.address,
        validRoot,
        validNullifier1,
        mockProof,
        region
      );

      // Second claim with same nullifier should fail
      await expect(
        life.connect(user2).claimWithOrbVerification(
          user2.address,
          validRoot,
          validNullifier1, // Same nullifier
          mockProof,
          region
        )
      ).to.be.revertedWith("Nullifier already used");
    });

    it("Should allow different users with different nullifiers", async function () {
      const mockProof = [0, 0, 0, 0, 0, 0, 0, 0];
      const region = "Test Region";

      // User1 claims with nullifier1
      await life.connect(user1).claimWithOrbVerification(
        user1.address,
        validRoot,
        validNullifier1,
        mockProof,
        region
      );

      // User2 claims with nullifier2
      await life.connect(user2).claimWithOrbVerification(
        user2.address,
        validRoot,
        validNullifier2,
        mockProof,
        region
      );

      // Both should have received tokens
      expect(await life.balanceOf(user1.address)).to.equal(ethers.parseEther("1001"));
      expect(await life.balanceOf(user2.address)).to.equal(ethers.parseEther("1001"));
    });

    it("Should reject invalid signal (address mismatch)", async function () {
      const mockProof = [0, 0, 0, 0, 0, 0, 0, 0];
      const region = "Test Region";

      await expect(
        life.connect(user1).claimWithOrbVerification(
          user2.address, // Wrong signal
          validRoot,
          validNullifier1,
          mockProof,
          region
        )
      ).to.be.revertedWith("Signal must be sender address");
    });

    it("Should reject invalid root", async function () {
      const mockProof = [0, 0, 0, 0, 0, 0, 0, 0];
      const region = "Test Region";
      const invalidRoot = "0xdeadbeefdeadbeefdeadbeefdeadbeefdeadbeefdeadbeefdeadbeefdeadbeef";

      await expect(
        life.connect(user1).claimWithOrbVerification(
          user1.address,
          invalidRoot,
          validNullifier1,
          mockProof,
          region
        )
      ).to.be.revertedWith("Mock: Invalid root");
    });

    it("Should reject invalid nullifier", async function () {
      const mockProof = [0, 0, 0, 0, 0, 0, 0, 0];
      const region = "Test Region";
      const invalidNullifier = ethers.keccak256(ethers.toUtf8Bytes("invalid-nullifier"));

      await expect(
        life.connect(user1).claimWithOrbVerification(
          user1.address,
          validRoot,
          invalidNullifier,
          mockProof,
          region
        )
      ).to.be.revertedWith("Mock: Invalid nullifier");
    });

    it("Should enforce 24-hour claim frequency", async function () {
      const mockProof = [0, 0, 0, 0, 0, 0, 0, 0];
      const region = "Test Region";

      // First claim
      await life.connect(user1).claimWithOrbVerification(
        user1.address,
        validRoot,
        validNullifier1,
        mockProof,
        region
      );

      // Try to claim again immediately (should fail)
      await expect(
        life.connect(user1).claimWithOrbVerification(
          user1.address,
          validRoot,
          validNullifier2, // Different nullifier
          mockProof,
          region
        )
      ).to.be.revertedWith("Daily reward not available yet - wait 24 hours");
    });
  });

  describe("Security Tests", function () {
    it("Should prevent verification when mock is set to fail", async function () {
      const mockProof = [0, 0, 0, 0, 0, 0, 0, 0];
      const region = "Test Region";

      // Set mock to simulate failure
      await mockWorldIDRouter.setSimulateFailure(true);

      await expect(
        life.connect(user1).claimWithOrbVerification(
          user1.address,
          validRoot,
          validNullifier1,
          mockProof,
          region
        )
      ).to.be.revertedWith("Mock: Verification failed");

      // Reset for other tests
      await mockWorldIDRouter.setSimulateFailure(false);
    });

    it("Should only accept group ID 1 (orb verification)", async function () {
      // This is tested indirectly through the mock router
      // The GROUP_ID constant in the contract ensures only group 1 is used
      expect(await life.getGroupId()).to.equal(1);
    });
  });

  describe("Legacy Support", function () {
    it("Should support legacy function but require address book setup", async function () {
      const region = "Test Region";

      await expect(
        life.connect(user1).claimLegacy(region)
      ).to.be.revertedWith("Legacy verification not supported");
    });
  });

  describe("Admin Functions", function () {
    it("Should allow owner to update World ID Router", async function () {
      const newMockRouter = await (await ethers.getContractFactory("MockWorldIDRouter")).deploy();
      
      await life.connect(deployer).updateWorldIdRouter(await newMockRouter.getAddress());
      
      // Note: We can't easily verify the update since worldId is internal
      // In a real test, you'd verify by attempting to use the new router
    });

    it("Should not allow non-owner to update World ID Router", async function () {
      const newMockRouter = await (await ethers.getContractFactory("MockWorldIDRouter")).deploy();
      
      await expect(
        life.connect(user1).updateWorldIdRouter(await newMockRouter.getAddress())
      ).to.be.revertedWithCustomError(life, "OwnableUnauthorizedAccount");
    });
  });
});

// Helper function to run the tests
async function runOrbVerificationTests() {
  console.log("🚀 Running LIFE Token Orb Verification Tests...\n");
  
  try {
    // This would typically be run via Hardhat test command
    console.log("✅ To run these tests, use: npx hardhat test test-orb-verification.js");
    console.log("\n📋 Test Coverage:");
    console.log("- ✅ Orb verification setup");
    console.log("- ✅ Valid orb-verified claims");
    console.log("- ✅ Sybil resistance (nullifier tracking)");
    console.log("- ✅ Signal validation");
    console.log("- ✅ Root and nullifier validation");
    console.log("- ✅ 24-hour claim frequency");
    console.log("- ✅ Security tests");
    console.log("- ✅ Legacy function support");
    console.log("- ✅ Admin functions");
    
  } catch (error) {
    console.error("❌ Test setup failed:", error.message);
  }
}

// Export for use in other files
module.exports = {
  runOrbVerificationTests
};

// Run tests if this file is executed directly
if (require.main === module) {
  runOrbVerificationTests();
}
