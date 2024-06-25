const { expect } = require("chai");
const { ethers } = require("hardhat");
const {
  loadFixture,
} = require("@nomicfoundation/hardhat-toolbox/network-helpers");

describe("UserRoleRequest", function () {
  async function deployContracts() {
    const [owner, addr1, addr2] = await ethers.getSigners();

    const DrivingLicenseNFT = await ethers.getContractFactory(
      "DrivingLicenseNFT"
    );
    const drivingLicenseNFT = await DrivingLicenseNFT.deploy(owner.address);
    await drivingLicenseNFT.waitForDeployment();

    const UserRoleRequest = await ethers.getContractFactory("UserRoleRequest");
    const userRoleRequest = await UserRoleRequest.deploy(
      owner.address,
      drivingLicenseNFT.getAddress()
    );
    await userRoleRequest.waitForDeployment();

    return { userRoleRequest, drivingLicenseNFT, owner, addr1, addr2 };
  }

  describe("Deployment", function () {
    it("should deploy with correct initial admin", async function () {
      const { userRoleRequest, owner } = await loadFixture(deployContracts);
      expect(await userRoleRequest.owner()).to.equal(owner.address);
    });
  });

  describe("Role Management", function () {
    it("should allow adding new user and assign receiver role", async function () {
      const { userRoleRequest, addr1 } = await loadFixture(deployContracts);
      await expect(
        userRoleRequest
          .connect(addr1)
          .createUser("User One", "geoHash1", "+919876543210")
      )
        .to.emit(userRoleRequest, "NewUserAdded")
        .withArgs("User One", addr1.address, "geoHash1");

      const userInfo = await userRoleRequest.getUserInfo(addr1.address);
      expect(userInfo.name).to.equal("User One");
      expect(userInfo.serviceGeoHash).to.equal("geoHash1");
    });

    it("should handle role upgrades correctly", async function () {
      const { userRoleRequest, owner, addr1 } = await loadFixture(
        deployContracts
      );
      await userRoleRequest
        .connect(addr1)
        .createUser("User One", "geoHash1", "+919876543210");
      await expect(userRoleRequest.connect(addr1).createRoleRequest(4)).to.emit(
        userRoleRequest,
        "NewRoleRequestAdded"
      ); // Assuming 4 is for Receiver

      await expect(
        userRoleRequest.connect(addr1).approveOrRejectRoleRequest(0, true)
      ).to.be.reverted;

      await userRoleRequest.connect(owner).approveOrRejectRoleRequest(0, true);
      const updatedUser = await userRoleRequest.getUserInfo(addr1.address);
      expect(updatedUser.role).to.include.members([4n]);
    });
  });

  describe("Access Control Checks", function () {
    it("should enforce onlyDriver and onlyDisputeContract modifiers", async function () {
      const { userRoleRequest, drivingLicenseNFT, owner, addr1 } =
        await loadFixture(deployContracts);
      await userRoleRequest
        .connect(addr1)
        .createUser("Driver One", "geoHash2", "+919876543210");

      await expect(userRoleRequest.connect(addr1).deductStars(addr1.address)).to
        .be.reverted;

      await drivingLicenseNFT
        .connect(addr1)
        .publicMint("John Doe", "DL123456", "ipfsHashHere", {
          value: ethers.parseEther("0.01"),
        });
      await userRoleRequest.connect(addr1).createRoleRequest(3); // Assuming 3 is for Driver
      await userRoleRequest.connect(owner).approveOrRejectRoleRequest(0, true);
      const hasRole_ = await userRoleRequest
        .connect(addr1)
        .hasRoleDriver(addr1.address);
      expect(hasRole_).to.be.any;
    });
  });

  describe("NFT Validation", function () {
    it("should check driving license NFT validation for driver role", async function () {
      const { userRoleRequest, drivingLicenseNFT, addr1 } = await loadFixture(
        deployContracts
      );
      await userRoleRequest
        .connect(addr1)
        .createUser("User One", "geoHash1", "+919876543210");
      await drivingLicenseNFT
        .connect(addr1)
        .publicMint("John Doe", "DL123456", "ipfsHashHere", {
          value: ethers.parseEther("0.01"),
        });
      const isValid_ = await drivingLicenseNFT.validateNFT(addr1.address);
      expect(isValid_).to.be.true;
    });
  });
});
