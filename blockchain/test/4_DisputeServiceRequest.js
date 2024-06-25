const { expect } = require("chai");
const { ethers } = require("hardhat");
const {
  loadFixture,
} = require("@nomicfoundation/hardhat-toolbox/network-helpers");

describe("DisputedServiceRequest", function () {
  async function deployContracts() {
    const [owner, addr1, addr2, addr3, addr4, addr5] =
      await ethers.getSigners();

    const DrivingLicenseNFT = await ethers.getContractFactory(
      "DrivingLicenseNFT"
    );
    const drivingLicenseNFT = await DrivingLicenseNFT.deploy(owner.address);
    await drivingLicenseNFT.waitForDeployment();

    const UserRoleRequest = await ethers.getContractFactory("UserRoleRequest");
    const userRoleRequestMock = await UserRoleRequest.deploy(
      owner.address,
      drivingLicenseNFT.getAddress()
    );
    await userRoleRequestMock.waitForDeployment();

    const DisputedServiceRequest = await ethers.getContractFactory(
      "DisputedServiceRequest"
    );
    const disputedServiceRequest = await DisputedServiceRequest.deploy(
      owner.address,
      userRoleRequestMock.getAddress()
    );
    await disputedServiceRequest.waitForDeployment();

    return {
      drivingLicenseNFT,
      userRoleRequestMock,
      disputedServiceRequest,
      owner,
      addr1,
      addr2,
      addr3,
      addr4,
      addr5,
    };
  }

  async function createUserWithRole(
    addr,
    userRoleRequestMock,
    drivingLicenseNFT,
    roleId,
    reqId
  ) {
    await userRoleRequestMock
      .connect(addr)
      .createUser("User Name", "geoHash", `+9198765${roleId}3210`);
    if (roleId === 3) {
      await drivingLicenseNFT
        .connect(addr)
        .publicMint("John Doe", "DL123456", "ipfsHashHere", {
          value: ethers.parseEther("0.01"),
        });
    }
    await userRoleRequestMock.connect(addr).createRoleRequest(roleId);
    await userRoleRequestMock.approveOrRejectRoleRequest(reqId, true);
  }

  describe("Deployment", function () {
    it("should deploy with correct initial owner", async function () {
      const { disputedServiceRequest, owner } = await loadFixture(
        deployContracts
      );
      expect(await disputedServiceRequest.owner()).to.equal(owner.address);
    });
  });

  describe("updateServiceRequestAddr", function () {
    it("should allow only the owner to update the service request address", async function () {
      const { disputedServiceRequest, owner, addr1, addr2 } = await loadFixture(
        deployContracts
      );
      await disputedServiceRequest
        .connect(owner)
        .updateServiceRequestAddr(addr1.address);
      await expect(
        disputedServiceRequest
          .connect(addr1)
          .updateServiceRequestAddr(addr2.address)
      ).to.be.reverted;
    });
  });

  describe("Voting on disputes", function () {
    it("should allow valid users to VOTE on Disputes correctly", async function () {
      const {
        disputedServiceRequest,
        userRoleRequestMock,
        drivingLicenseNFT,
        owner,
        addr1,
        addr2,
        addr3,
        addr4,
        addr5,
      } = await loadFixture(deployContracts);
      await createUserWithRole(addr1, userRoleRequestMock, undefined, 2, 0); // Shipper
      await createUserWithRole(
        addr2,
        userRoleRequestMock,
        drivingLicenseNFT,
        3,
        1
      ); // Driver
      await createUserWithRole(
        addr3,
        userRoleRequestMock,
        drivingLicenseNFT,
        3,
        2
      ); // Driver
      await createUserWithRole(addr4, userRoleRequestMock, undefined, 4, 3); // Receiver

      const srInfo = {
        requestId: 1,
        description: "Description",
        shipperUID: addr1.address,
        driverUID: addr2.address, // ethers.ZeroAddress
        receiverUID: addr4.address,
        originGeoHash: "geoHash11",
        destGeoHash: "geoHashh1",
        originApproxGeoHash: "geoHash1",
        destApproxGeoHash: "geoHashh",
        cargoInsurableValue: 100,
        serviceFee: 10,
        requestedPickupTime: new Date(Date.now() + 60 * 60 * 24 * 2).getTime(),
        requestedDeliveryTime: new Date(
          Date.now() + 60 * 60 * 24 * 3
        ).getTime(),
        auctionEndTime: 240, // After 4 hours (4*60)
        status: 10, // Disputed
        disputeWinner: "",
      };

      // Adding a disputed service request
      await disputedServiceRequest
        .connect(owner)
        .updateServiceRequestAddr(addr5.address);
      await disputedServiceRequest
        .connect(addr5)
        .addNewDisputedSR(addr4.address, srInfo);

      // Voting by a Valid user
      await expect(disputedServiceRequest.connect(addr3).vote(1, 1)) // Vote for the Driver
        .to.emit(disputedServiceRequest, "NewVoteAdded")
        .withArgs(1, "New vote is added by DAO members");
    });

    it("should not allow voting outside of Service Regions", async function () {
      const {
        disputedServiceRequest,
        userRoleRequestMock,
        drivingLicenseNFT,
        owner,
        addr1,
        addr2,
        addr3,
        addr4,
        addr5,
      } = await loadFixture(deployContracts);
      await createUserWithRole(addr1, userRoleRequestMock, undefined, 2, 0); // Shipper
      await createUserWithRole(
        addr2,
        userRoleRequestMock,
        drivingLicenseNFT,
        3,
        1
      ); // Driver
      await createUserWithRole(addr3, userRoleRequestMock, undefined, 4, 2); // Receiver
      await userRoleRequestMock
        .connect(addr4)
        .createUser("User Four", "asdfghjk", `+919876993210`);
      await drivingLicenseNFT
        .connect(addr4)
        .publicMint("John Doe", "DL123456", "ipfsHashHere", {
          value: ethers.parseEther("0.01"),
        });
      await userRoleRequestMock.connect(addr4).createRoleRequest(3);
      await userRoleRequestMock.approveOrRejectRoleRequest(3, true);

      const srInfo = {
        requestId: 1,
        description: "Description",
        shipperUID: addr1.address,
        driverUID: addr2.address, // ethers.ZeroAddress
        receiverUID: addr3.address,
        originGeoHash: "geoHash11",
        destGeoHash: "geoHashh1",
        originApproxGeoHash: "geoHash1",
        destApproxGeoHash: "geoHashh",
        cargoInsurableValue: 100,
        serviceFee: 10,
        requestedPickupTime: new Date(Date.now() + 60 * 60 * 24 * 2).getTime(),
        requestedDeliveryTime: new Date(
          Date.now() + 60 * 60 * 24 * 3
        ).getTime(),
        auctionEndTime: 240, // After 4 hours (4*60)
        status: 10, // Disputed
        disputeWinner: "",
      };

      // Adding a disputed service request
      await disputedServiceRequest
        .connect(owner)
        .updateServiceRequestAddr(addr5.address);
      await disputedServiceRequest
        .connect(addr5)
        .addNewDisputedSR(addr3.address, srInfo);

      // Attempting to vote outside service region
      await expect(disputedServiceRequest.connect(addr4).vote(1, 1)).to.be
        .reverted;
    });

    it("should allow only drivers in the same Service Region", async function () {
      const {
        disputedServiceRequest,
        userRoleRequestMock,
        drivingLicenseNFT,
        owner,
        addr1,
        addr2,
        addr3,
        addr4,
        addr5,
      } = await loadFixture(deployContracts);
      await createUserWithRole(addr1, userRoleRequestMock, undefined, 2, 0); // Shipper
      await createUserWithRole(
        addr2,
        userRoleRequestMock,
        drivingLicenseNFT,
        3,
        1
      ); // Driver
      await createUserWithRole(addr3, userRoleRequestMock, undefined, 4, 2); // Receiver
      await createUserWithRole(addr4, userRoleRequestMock, undefined, 2, 3); // shipper

      const srInfo = {
        requestId: 1,
        description: "Description",
        shipperUID: addr1.address,
        driverUID: addr2.address, // ethers.ZeroAddress
        receiverUID: addr3.address,
        originGeoHash: "geoHash11",
        destGeoHash: "geoHashh1",
        originApproxGeoHash: "geoHash1",
        destApproxGeoHash: "geoHashh",
        cargoInsurableValue: 100,
        serviceFee: 10,
        requestedPickupTime: new Date(Date.now() + 60 * 60 * 24 * 2).getTime(),
        requestedDeliveryTime: new Date(
          Date.now() + 60 * 60 * 24 * 3
        ).getTime(),
        auctionEndTime: 240, // After 4 hours (4*60)
        status: 10, // Disputed
        disputeWinner: "",
      };

      // Adding a disputed service request
      await disputedServiceRequest
        .connect(owner)
        .updateServiceRequestAddr(addr5.address);
      await disputedServiceRequest
        .connect(addr5)
        .addNewDisputedSR(addr3.address, srInfo);

      // Only Drivers are allowed to vote
      await expect(disputedServiceRequest.connect(addr4).vote(1, 1)).to.be
        .reverted;
    });
  });

  describe("Access control", function () {
    it("should enforce role-based access controls for actions", async function () {
      const { disputedServiceRequest, userRoleRequestMock, addr1 } =
        await loadFixture(deployContracts);

      await createUserWithRole(addr1, userRoleRequestMock, undefined, 2, 0); // Shipper

      // Attempt to access driver-only function
      await expect(
        disputedServiceRequest.connect(addr1).getAllDisputedSRInDriverArea()
      ).to.be.reverted;
    });
  });
});
