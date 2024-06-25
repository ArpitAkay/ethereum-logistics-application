const { expect } = require("chai");
const { ethers } = require("hardhat");
const {
  loadFixture,
} = require("@nomicfoundation/hardhat-toolbox/network-helpers");

describe("DrivingLicenseNFT", function () {
  async function deployContracts() {
    const [owner, user1] = await ethers.getSigners();
    const DrivingLicenseNFT = await ethers.getContractFactory(
      "DrivingLicenseNFT"
    );
    const drivingLicenseNFT = await DrivingLicenseNFT.deploy(owner.address);
    await drivingLicenseNFT.waitForDeployment();

    return { drivingLicenseNFT, owner, user1 };
  }

  describe("Deployment", function () {
    it("should set the right owner", async function () {
      const { drivingLicenseNFT, owner } = await loadFixture(deployContracts);
      expect(await drivingLicenseNFT.owner()).to.equal(owner.address);
    });
  });

  describe("Minting", function () {
    it("should allow public minting when open", async function () {
      const { drivingLicenseNFT, user1 } = await loadFixture(deployContracts);
      await drivingLicenseNFT.editMintWindows(true);
      await expect(
        drivingLicenseNFT
          .connect(user1)
          .publicMint("John Doe", "DL123456", "ipfsHashHere", {
            value: ethers.parseEther("0.01"),
          })
      ).to.emit(drivingLicenseNFT, "Transfer");
    });

    it("should prevent minting when public mint is closed", async function () {
      const { drivingLicenseNFT, user1 } = await loadFixture(deployContracts);
      await drivingLicenseNFT.editMintWindows(false);
      await expect(
        drivingLicenseNFT
          .connect(user1)
          .publicMint("John Doe", "DL123456", "ipfsHashHere", {
            value: ethers.parseEther("0.01"),
          })
      ).to.be.reverted;
    });

    it("should reject minting without enough funds", async function () {
      const { drivingLicenseNFT, user1 } = await loadFixture(deployContracts);
      await drivingLicenseNFT.editMintWindows(true);
      await expect(
        drivingLicenseNFT
          .connect(user1)
          .publicMint("John Doe", "DL123456", "ipfsHashHere", {
            value: ethers.parseEther("0.005"),
          })
      ).to.be.reverted;
    });
  });

  describe("NFT Validation", function () {
    it("should validate NFT ownership correctly", async function () {
      const { drivingLicenseNFT, user1 } = await loadFixture(deployContracts);
      await drivingLicenseNFT.editMintWindows(true);
      await drivingLicenseNFT
        .connect(user1)
        .publicMint("John Doe", "DL123456", "ipfsHashHere", {
          value: ethers.parseEther("0.01"),
        });

      expect(await drivingLicenseNFT.validateNFT(user1.address)).to.be.true;
    });
  });

  describe("Access Control", function () {
    it("should allow only the owner to pause and unpause the contract", async function () {
      const { drivingLicenseNFT, owner, user1 } = await loadFixture(
        deployContracts
      );
      await expect(drivingLicenseNFT.connect(owner).pause()).not.to.be.reverted;
      await expect(drivingLicenseNFT.connect(user1).unpause()).to.be.reverted;
    });
  });
});
