const { expect } = require("chai");
const { ethers } = require("hardhat");
const {
  loadFixture,
} = require("@nomicfoundation/hardhat-toolbox/network-helpers");
const { anyValue } = require("@nomicfoundation/hardhat-chai-matchers/withArgs");

describe("GeekToken", function () {
  async function deployGeekToken() {
    const [owner, addr1, addr2, addr3] = await ethers.getSigners();

    const GeekToken = await ethers.getContractFactory("GeekToken");
    const geekToken = await GeekToken.deploy(owner.address);
    await geekToken.waitForDeployment();

    return { geekToken, owner, addr1, addr2, addr3 };
  }

  describe("Deployment", function () {
    it("should deploy with the correct initial supply and ownership", async function () {
      const { geekToken, owner } = await loadFixture(deployGeekToken);
      const initialSupply = await geekToken.totalSupply();
      expect(await geekToken.balanceOf(owner.address)).to.equal(initialSupply);
      expect(await geekToken.owner()).to.equal(owner.address);
    });
  });

  describe("Minting", function () {
    it("should allow owner to mint tokens within the cap", async function () {
      const { geekToken, owner } = await loadFixture(deployGeekToken);
      const mintAmount = ethers.parseUnits("10000", 18);
      await expect(geekToken.mint(owner.address, mintAmount))
        .to.emit(geekToken, "Transfer")
        .withArgs(ethers.ZeroAddress, owner.address, mintAmount);
    });

    it("should prevent minting beyond the max supply", async function () {
      const { geekToken, owner } = await loadFixture(deployGeekToken);
      const mintAmount = ethers.parseUnits("10000001", 18);
      await expect(
        geekToken.mint(owner.address, mintAmount)
      ).to.be.revertedWith("We sold out");
    });
  });

  describe("Pausing and Unpausing", function () {
    it("should allow the owner to pause and unpause the token", async function () {
      const { geekToken, owner } = await loadFixture(deployGeekToken);
      await expect(geekToken.pause())
        .to.emit(geekToken, "Paused")
        .withArgs(owner.address);
      await expect(geekToken.unpause())
        .to.emit(geekToken, "Unpaused")
        .withArgs(owner.address);
    });

    it("should prevent transfers while paused", async function () {
      const { geekToken, addr1 } = await loadFixture(deployGeekToken);
      await geekToken.pause();
      await expect(geekToken.transfer(addr1.address, 100)).to.be.reverted;
    });
  });

  describe("Access Control", function () {
    it("should prevent non-owners from pausing or minting", async function () {
      const { geekToken, addr1 } = await loadFixture(deployGeekToken);
      await expect(geekToken.connect(addr1).pause()).to.be.reverted;
      await expect(geekToken.connect(addr1).mint(addr1.address, 1000)).to.be
        .reverted;
    });
  });

  describe("Service Request Integration", function () {
    it("should allow token transfers via the service request contract", async function () {
      const { geekToken, owner, addr1, addr2 } = await loadFixture(
        deployGeekToken
      );
      await geekToken.connect(owner).updateServiceRequestAddress(addr1.address);

      const cargoInsurableValue = ethers.parseUnits("100", 18);
      const acceptance = 7; // Simulating an accepted status

      await expect(
        geekToken
          .connect(addr1)
          .transferTokens(addr2.address, cargoInsurableValue, acceptance)
      ).to.emit(geekToken, "TransferedTokens");
    });

    it("should revert if non-authorized contract attempts a token transfer", async function () {
      const { geekToken, addr1, addr2 } = await loadFixture(deployGeekToken);

      const cargoInsurableValue = ethers.parseUnits("1000", 18);
      const acceptance = 7; // Simulating an accepted status

      await expect(
        geekToken
          .connect(addr2)
          .transferTokens(addr1.address, cargoInsurableValue, acceptance)
      ).to.be.reverted;
    });
  });
});
