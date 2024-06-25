const { expect } = require("chai");
const { ethers } = require("hardhat");
const {
  time,
  loadFixture,
} = require("@nomicfoundation/hardhat-toolbox/network-helpers");
const { anyValue } = require("@nomicfoundation/hardhat-chai-matchers/withArgs");

describe("ServiceRequest", function () {
  async function deployContracts() {
    const [owner, addr1, addr2, addr3, addr4, addr5] =
      await ethers.getSigners();

    const GeekToken = await ethers.getContractFactory("GeekToken");
    const geekToken = await GeekToken.deploy(owner.address);
    await geekToken.waitForDeployment();

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

    const DisputedServiceRequest = await ethers.getContractFactory(
      "DisputedServiceRequest"
    );
    const disputedServiceRequest = await DisputedServiceRequest.deploy(
      owner.address,
      userRoleRequest.getAddress()
    );
    await disputedServiceRequest.waitForDeployment();

    const ServiceRequest = await ethers.getContractFactory("ServiceRequest");
    const serviceRequest = await ServiceRequest.deploy(
      geekToken.getAddress(),
      disputedServiceRequest.getAddress(),
      userRoleRequest.getAddress()
    );
    await serviceRequest.waitForDeployment();

    return {
      geekToken,
      drivingLicenseNFT,
      userRoleRequest,
      disputedServiceRequest,
      serviceRequest,
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

  describe("createNewSR", function () {
    it("should allow creation of a new SR by user with shipper role", async function () {
      const { serviceRequest, userRoleRequest, addr1, addr2 } =
        await loadFixture(deployContracts);

      // Create 2 users
      await createUserWithRole(addr1, userRoleRequest, undefined, 2, 0); // Shipper
      await createUserWithRole(addr2, userRoleRequest, undefined, 4, 1); // Receiver

      const newSRInfo = {
        requestId: 1,
        description: "Deliver a laptop",
        shipperUID: addr1.address,
        driverUID: ethers.ZeroAddress,
        receiverUID: addr2.address,
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
        status: 0, // Draft
        disputeWinner: "",
      };

      await expect(
        serviceRequest.connect(addr1).createNewSR(newSRInfo, "+919848012345", {
          value: ethers.parseEther("10"),
        })
      )
        .to.emit(serviceRequest, "NewSRAdded")
        .withArgs(anyValue, addr1.address, "New SR is added");
    });

    it("should revert if user is not having shipper role", async function () {
      const { serviceRequest, userRoleRequest, addr1, addr2 } =
        await loadFixture(deployContracts);

      // Create a user with Reciver role
      await createUserWithRole(addr1, userRoleRequest, undefined, 4, 0); // Receiver

      const newSRInfo = {
        requestId: 1,
        description: "Deliver a laptop",
        shipperUID: addr2.address,
        driverUID: ethers.ZeroAddress,
        receiverUID: addr1.address,
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
        status: 0, // Draft
        disputeWinner: "",
      };

      await expect(
        serviceRequest.connect(addr1).createNewSR(newSRInfo, "+919848012345", {
          value: ethers.parseEther("10"),
        })
      ).to.be.reverted;
    });

    it("should add receiver if not a registered user", async function () {
      const { serviceRequest, userRoleRequest, addr1, addr2 } =
        await loadFixture(deployContracts);

      // Create Shipper user
      await createUserWithRole(addr1, userRoleRequest, undefined, 2, 0); // Shipper

      const destGeoHash = "geoHashh1";
      const newSRInfo = {
        requestId: 1,
        description: "Deliver a laptop",
        shipperUID: addr1.address,
        driverUID: ethers.ZeroAddress,
        receiverUID: addr2.address,
        originGeoHash: "geoHash11",
        destGeoHash: destGeoHash,
        originApproxGeoHash: "geoHash1",
        destApproxGeoHash: "geoHashh",
        cargoInsurableValue: 100,
        serviceFee: 10,
        requestedPickupTime: new Date(Date.now() + 60 * 60 * 24 * 2).getTime(),
        requestedDeliveryTime: new Date(
          Date.now() + 60 * 60 * 24 * 3
        ).getTime(),
        auctionEndTime: 240, // After 4 hours (4*60)
        status: 0, // Draft
        disputeWinner: "",
      };
      await expect(
        serviceRequest.connect(addr1).createNewSR(newSRInfo, "+919848012345", {
          value: ethers.parseEther("10"),
        })
      )
        .to.emit(userRoleRequest, "NewUserAdded")
        .withArgs(anyValue, addr2.address, destGeoHash);
    });
  });

  describe("editDraftSR", function () {
    it("should allow editing of a draft service request", async function () {
      const { serviceRequest, userRoleRequest, addr1, addr2 } =
        await loadFixture(deployContracts);

      // Create 2 users
      await createUserWithRole(addr1, userRoleRequest, undefined, 2, 0); // Shipper
      await createUserWithRole(addr2, userRoleRequest, undefined, 4, 1); // Receiver

      const newSRInfo = {
        requestId: 1,
        description: "Deliver a laptop",
        shipperUID: addr1.address,
        driverUID: ethers.ZeroAddress,
        receiverUID: addr2.address,
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
        status: 0, // Draft
        disputeWinner: "",
      };
      await serviceRequest
        .connect(addr1)
        .createNewSR(newSRInfo, "+919848012345", {
          value: ethers.parseEther("10"),
        });

      const newStatus = 1; // READY_FOR_AUCTION
      const newPickupTime = new Date(Date.now() + 60 * 60 * 24 * 3).getTime();
      const newDeliveryTime = new Date(Date.now() + 60 * 60 * 24 * 4).getTime();
      const newAuctionEndTime = 240; // After 4 hours (4*60)

      // Assume _requestId from a previously created SR
      await expect(
        serviceRequest
          .connect(addr1)
          .editDraftSR(
            0,
            newStatus,
            newPickupTime,
            newDeliveryTime,
            newAuctionEndTime
          )
      )
        .to.emit(serviceRequest, "SRUpdated")
        .withArgs(anyValue, addr1.address, "SR updated successfully");
    });

    it("should revert if not a right owner edits the SR", async function () {
      const { serviceRequest, userRoleRequest, addr1, addr2 } =
        await loadFixture(deployContracts);

      // Create 2 users
      await createUserWithRole(addr1, userRoleRequest, undefined, 2, 0); // Shipper
      await createUserWithRole(addr2, userRoleRequest, undefined, 4, 1); // Receiver

      const newSRInfo = {
        requestId: 1,
        description: "Deliver a laptop",
        shipperUID: addr1.address,
        driverUID: ethers.ZeroAddress,
        receiverUID: addr2.address,
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
        status: 0, // Draft
        disputeWinner: "",
      };
      await serviceRequest
        .connect(addr1)
        .createNewSR(newSRInfo, "+919848012345", {
          value: ethers.parseEther("10"),
        });

      const newStatus = 1; // READY_FOR_AUCTION
      const newPickupTime = new Date(Date.now() + 60 * 60 * 24 * 3).getTime();
      const newDeliveryTime = new Date(Date.now() + 60 * 60 * 24 * 5).getTime();
      const newAuctionEndTime = 240; // After 4 hours (4*60)

      // Assume _requestId from a previously created SR
      await expect(
        serviceRequest
          .connect(addr2)
          .editDraftSR(
            0,
            newStatus,
            newPickupTime,
            newDeliveryTime,
            newAuctionEndTime
          )
      ).to.be.reverted;
    });
  });

  describe("cancelSR", function () {
    it("should allow cancellation of a SR in DRAFT mode", async function () {
      const { serviceRequest, userRoleRequest, addr1, addr2 } =
        await loadFixture(deployContracts);

      // Create 2 users
      await createUserWithRole(addr1, userRoleRequest, undefined, 2, 0); // Shipper
      await createUserWithRole(addr2, userRoleRequest, undefined, 4, 1); // Receiver

      const newSRInfo = {
        requestId: 1,
        description: "Deliver a laptop",
        shipperUID: addr1.address,
        driverUID: ethers.ZeroAddress,
        receiverUID: addr2.address,
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
        status: 0, // Draft
        disputeWinner: "",
      };
      await serviceRequest
        .connect(addr1)
        .createNewSR(newSRInfo, "+919848012345", {
          value: ethers.parseEther("10"),
        });

      await expect(serviceRequest.connect(addr1).cancelSR(0))
        .to.emit(serviceRequest, "SRCancelled")
        .withArgs(0, addr1.address, "SR cancelled");
    });

    it("should revert while trying to cancel SR is in other than DRAFT mode", async function () {
      const { serviceRequest, userRoleRequest, addr1, addr2 } =
        await loadFixture(deployContracts);

      // Create 2 users
      await createUserWithRole(addr1, userRoleRequest, undefined, 2, 0); // Shipper
      await createUserWithRole(addr2, userRoleRequest, undefined, 4, 1); // Receiver

      const newSRInfo = {
        requestId: 1,
        description: "Deliver a laptop",
        shipperUID: addr1.address,
        driverUID: ethers.ZeroAddress,
        receiverUID: addr2.address,
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
        status: 1, // READY_FOR_AUCTION
        disputeWinner: "",
      };
      await serviceRequest
        .connect(addr1)
        .createNewSR(newSRInfo, "+919848012345", {
          value: ethers.parseEther("10"),
        });

      await expect(serviceRequest.connect(addr1).cancelSR(0)).to.be.reverted;
    });

    it("should revert while others try to cancel SR", async function () {
      const { serviceRequest, userRoleRequest, addr1, addr2 } =
        await loadFixture(deployContracts);

      // Create 2 users
      await createUserWithRole(addr1, userRoleRequest, undefined, 2, 0); // Shipper
      await createUserWithRole(addr2, userRoleRequest, undefined, 4, 1); // Receiver

      const newSRInfo = {
        requestId: 1,
        description: "Deliver a laptop",
        shipperUID: addr1.address,
        driverUID: ethers.ZeroAddress,
        receiverUID: addr2.address,
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
        status: 0, // Draft
        disputeWinner: "",
      };
      await serviceRequest
        .connect(addr1)
        .createNewSR(newSRInfo, "+919848012345", {
          value: ethers.parseEther("10"),
        });

      await expect(serviceRequest.connect(addr2).cancelSR(0)).to.be.reverted;
    });
  });

  describe("dutchBid", function () {
    it("should allow valid bids during an auction", async function () {
      const {
        serviceRequest,
        userRoleRequest,
        drivingLicenseNFT,
        addr1,
        addr2,
        addr3,
      } = await loadFixture(deployContracts);

      // Create 3 users
      await createUserWithRole(addr1, userRoleRequest, undefined, 2, 0); // Shipper
      await createUserWithRole(addr2, userRoleRequest, undefined, 4, 1); // Receiver
      await createUserWithRole(addr3, userRoleRequest, drivingLicenseNFT, 3, 2); // Driver

      const newSRInfo = {
        requestId: 1,
        description: "Deliver a laptop",
        shipperUID: addr1.address,
        driverUID: ethers.ZeroAddress,
        receiverUID: addr2.address,
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
        status: 1, // READY_FOR_AUCTION
        disputeWinner: "",
      };
      await serviceRequest
        .connect(addr1)
        .createNewSR(newSRInfo, "+919848012345", {
          value: ethers.parseEther("10"),
        });

      const bidServiceFee = ethers.parseEther("9");
      await time.increase(3600); // In Seconds, 1 hour advance block time
      await expect(
        serviceRequest
          .connect(addr3)
          .dutchBid(0, bidServiceFee, { value: ethers.parseEther("100") })
      )
        .to.emit(serviceRequest, "NewBidEntry")
        .withArgs(0, addr3.address, bidServiceFee);
    });

    it("should revert if bids more than serviceFee by voilating dutch auction", async function () {
      const {
        serviceRequest,
        userRoleRequest,
        drivingLicenseNFT,
        addr1,
        addr2,
        addr3,
      } = await loadFixture(deployContracts);

      // Create 3 users
      await createUserWithRole(addr1, userRoleRequest, undefined, 2, 0); // Shipper
      await createUserWithRole(addr2, userRoleRequest, undefined, 4, 1); // Receiver
      await createUserWithRole(addr3, userRoleRequest, drivingLicenseNFT, 3, 2); // Driver

      const newSRInfo = {
        requestId: 1,
        description: "Deliver a laptop",
        shipperUID: addr1.address,
        driverUID: ethers.ZeroAddress,
        receiverUID: addr2.address,
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
        status: 1, // READY_FOR_AUCTION
        disputeWinner: "",
      };
      await serviceRequest
        .connect(addr1)
        .createNewSR(newSRInfo, "+919848012345", {
          value: ethers.parseEther("10"),
        });

      const bidServiceFee = ethers.parseEther("11");
      await time.increase(3600); // In Seconds, 1 hour advance block time
      await expect(
        serviceRequest
          .connect(addr3)
          .dutchBid(0, bidServiceFee, { value: ethers.parseEther("100") })
      ).to.be.reverted;
    });

    it("should revert if other than driver tries to enter auction", async function () {
      const {
        serviceRequest,
        userRoleRequest,
        drivingLicenseNFT,
        addr1,
        addr2,
        addr3,
        addr4,
      } = await loadFixture(deployContracts);

      // Create 3 users
      await createUserWithRole(addr1, userRoleRequest, undefined, 2, 0); // Shipper
      await createUserWithRole(addr2, userRoleRequest, undefined, 4, 1); // Receiver
      await createUserWithRole(addr3, userRoleRequest, drivingLicenseNFT, 3, 2); // Driver
      await createUserWithRole(addr4, userRoleRequest, undefined, 4, 3); // Receiver

      const newSRInfo = {
        requestId: 1,
        description: "Deliver a laptop",
        shipperUID: addr1.address,
        driverUID: ethers.ZeroAddress,
        receiverUID: addr2.address,
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
        status: 1, // READY_FOR_AUCTION
        disputeWinner: "",
      };
      await serviceRequest
        .connect(addr1)
        .createNewSR(newSRInfo, "+919848012345", {
          value: ethers.parseEther("10"),
        });

      const bidServiceFee = ethers.parseEther("9");
      await time.increase(3600); // In Seconds, 1 hour advance block time
      await expect(
        serviceRequest
          .connect(addr4)
          .dutchBid(0, bidServiceFee, { value: ethers.parseEther("100") })
      ).to.be.reverted;
    });

    it("should revert if origin, Destination falls outside of driver service region", async function () {
      const {
        serviceRequest,
        userRoleRequest,
        drivingLicenseNFT,
        addr1,
        addr2,
        addr3,
        addr4,
      } = await loadFixture(deployContracts);

      // Create 3 users
      await createUserWithRole(addr1, userRoleRequest, undefined, 2, 0); // Shipper
      await createUserWithRole(addr2, userRoleRequest, undefined, 4, 1); // Receiver
      await createUserWithRole(addr3, userRoleRequest, drivingLicenseNFT, 3, 2); // Driver
      await userRoleRequest
        .connect(addr4)
        .createUser("Driver", "newHash", `+919876590210`);
      await drivingLicenseNFT
        .connect(addr4)
        .publicMint("John Doe", "DL123456", "ipfsHashHere", {
          value: ethers.parseEther("0.01"),
        });
      await userRoleRequest.connect(addr4).createRoleRequest(3);
      await userRoleRequest.approveOrRejectRoleRequest(3, true);

      const newSRInfo = {
        requestId: 1,
        description: "Deliver a laptop",
        shipperUID: addr1.address,
        driverUID: ethers.ZeroAddress,
        receiverUID: addr2.address,
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
        status: 1, // READY_FOR_AUCTION
        disputeWinner: "",
      };
      await serviceRequest
        .connect(addr1)
        .createNewSR(newSRInfo, "+919848012345", {
          value: ethers.parseEther("10"),
        });

      const bidServiceFee = ethers.parseEther("5");
      await time.increase(3600); // In Seconds, 1 hour advance block time
      await expect(
        serviceRequest
          .connect(addr4)
          .dutchBid(0, bidServiceFee, { value: ethers.parseEther("100") })
      ).to.be.reverted;
    });
  });

  describe("declareWinner", function () {
    it("should declare a winner after the auction ends", async function () {
      const {
        serviceRequest,
        userRoleRequest,
        drivingLicenseNFT,
        addr1,
        addr2,
        addr3,
      } = await loadFixture(deployContracts);

      // Create 3 users
      await createUserWithRole(addr1, userRoleRequest, undefined, 2, 0); // Shipper
      await createUserWithRole(addr2, userRoleRequest, undefined, 4, 1); // Receiver
      await createUserWithRole(addr3, userRoleRequest, drivingLicenseNFT, 3, 2); // Driver

      const newSRInfo = {
        requestId: 1,
        description: "Deliver a laptop",
        shipperUID: addr1.address,
        driverUID: ethers.ZeroAddress,
        receiverUID: addr2.address,
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
        status: 1, // READY_FOR_AUCTION
        disputeWinner: "",
      };
      await serviceRequest
        .connect(addr1)
        .createNewSR(newSRInfo, "+919848012345", {
          value: ethers.parseEther("10"),
        });

      const bidServiceFee = ethers.parseEther("9");
      await time.increase(3600); // In Seconds, 1 hour advance block time
      await serviceRequest
        .connect(addr3)
        .dutchBid(0, bidServiceFee, { value: ethers.parseEther("100") });
      await time.increase(14400); // In Seconds, 4 hour advance block time

      await expect(serviceRequest.connect(addr1).declareWinner(0))
        .to.emit(serviceRequest, "AuctionResults")
        .withArgs(0, addr3.address, "Winner declared");
    });
  });

  describe("updateSRStatus", function () {
    it("should allow status updates by the appropriate parties", async function () {
      const {
        serviceRequest,
        userRoleRequest,
        drivingLicenseNFT,
        addr1,
        addr2,
        addr3,
      } = await loadFixture(deployContracts);

      // Create 3 users
      await createUserWithRole(addr1, userRoleRequest, undefined, 2, 0); // Shipper
      await createUserWithRole(addr2, userRoleRequest, undefined, 4, 1); // Receiver
      await createUserWithRole(addr3, userRoleRequest, drivingLicenseNFT, 3, 2); // Driver

      const newSRInfo = {
        requestId: 1,
        description: "Deliver a laptop",
        shipperUID: addr1.address,
        driverUID: ethers.ZeroAddress,
        receiverUID: addr2.address,
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
        status: 1, // READY_FOR_AUCTION
        disputeWinner: "",
      };
      await serviceRequest
        .connect(addr1)
        .createNewSR(newSRInfo, "+919848012345", {
          value: ethers.parseEther("10"),
        });

      const bidServiceFee = ethers.parseEther("9");
      await time.increase(3600); // In Seconds, 1 hour advance block time
      await serviceRequest
        .connect(addr3)
        .dutchBid(0, bidServiceFee, { value: ethers.parseEther("100") });
      await time.increase(14400); // In Seconds, 4 hour advance block time
      await serviceRequest.connect(addr1).declareWinner(0);

      await expect(serviceRequest.connect(addr1).updateSRStatus(0, 3)) // READY_FOR_PICKUP
        .to.emit(serviceRequest, "SRStatusUpdated")
        .withArgs(anyValue, "SR updated");
    });

    it("should revert if trying to update 2 status forward or updates by wrong person", async function () {
      const {
        serviceRequest,
        userRoleRequest,
        drivingLicenseNFT,
        addr1,
        addr2,
        addr3,
        addr4,
      } = await loadFixture(deployContracts);

      // Create 3 users
      await createUserWithRole(addr1, userRoleRequest, undefined, 2, 0); // Shipper
      await createUserWithRole(addr2, userRoleRequest, undefined, 4, 1); // Receiver
      await createUserWithRole(addr3, userRoleRequest, drivingLicenseNFT, 3, 2); // Driver
      await createUserWithRole(addr4, userRoleRequest, undefined, 2, 3); // Shipper

      const newSRInfo = {
        requestId: 1,
        description: "Deliver a laptop",
        shipperUID: addr1.address,
        driverUID: ethers.ZeroAddress,
        receiverUID: addr2.address,
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
        status: 1, // READY_FOR_AUCTION
        disputeWinner: "",
      };
      await serviceRequest
        .connect(addr1)
        .createNewSR(newSRInfo, "+919848012345", {
          value: ethers.parseEther("10"),
        });

      const bidServiceFee = ethers.parseEther("9");
      await time.increase(3600); // In Seconds, 1 hour advance block time
      await serviceRequest
        .connect(addr3)
        .dutchBid(0, bidServiceFee, { value: ethers.parseEther("100") });
      await time.increase(14400); // In Seconds, 4 hour advance block time
      await serviceRequest.connect(addr1).declareWinner(0);

      await expect(serviceRequest.connect(addr1).updateSRStatus(0, 4)).to.be // PARCEL_PICKED_UP
        .reverted;
      await expect(serviceRequest.connect(addr4).updateSRStatus(0, 3)).to.be // READY_FOR_PICKUP
        .reverted;
      await serviceRequest.connect(addr1).updateSRStatus(0, 3);
      await expect(serviceRequest.connect(addr3).updateSRStatus(0, 5)).to.be // IN_TRANSIT
        .reverted;
      await expect(serviceRequest.connect(addr3).updateSRStatus(0, 4)).to.not.be // PARCEL_PICKED_UP
        .reverted;
    });
  });

  describe("getAuctionSRListinDriverRegion", function () {
    it("should retrieve SRs ready for auction in the driver's region", async function () {
      const {
        serviceRequest,
        userRoleRequest,
        drivingLicenseNFT,
        addr1,
        addr2,
        addr3,
      } = await loadFixture(deployContracts);

      // Create 3 users
      await createUserWithRole(addr1, userRoleRequest, undefined, 2, 0); // Shipper
      await createUserWithRole(addr2, userRoleRequest, undefined, 4, 1); // Receiver
      await createUserWithRole(addr3, userRoleRequest, drivingLicenseNFT, 3, 2); // Driver

      const newSRInfo = {
        requestId: 1,
        description: "Deliver a laptop",
        shipperUID: addr1.address,
        driverUID: ethers.ZeroAddress,
        receiverUID: addr2.address,
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
        status: 1, // READY_FOR_AUCTION
        disputeWinner: "",
      };
      await serviceRequest
        .connect(addr1)
        .createNewSR(newSRInfo, "+919848012345", {
          value: ethers.parseEther("10"),
        });

      await expect(
        serviceRequest.connect(addr3).getAuctionSRListinDriverRegion()
      ).to.not.be.reverted;
    });

    it("should revert if other than Driver calls this function", async function () {
      const {
        serviceRequest,
        userRoleRequest,
        drivingLicenseNFT,
        addr1,
        addr2,
        addr3,
      } = await loadFixture(deployContracts);

      // Create 3 users
      await createUserWithRole(addr1, userRoleRequest, undefined, 2, 0); // Shipper
      await createUserWithRole(addr2, userRoleRequest, undefined, 4, 1); // Receiver
      await createUserWithRole(addr3, userRoleRequest, undefined, 4, 2); // Receiver

      const newSRInfo = {
        requestId: 1,
        description: "Deliver a laptop",
        shipperUID: addr1.address,
        driverUID: ethers.ZeroAddress,
        receiverUID: addr2.address,
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
        status: 1, // READY_FOR_AUCTION
        disputeWinner: "",
      };
      await serviceRequest
        .connect(addr1)
        .createNewSR(newSRInfo, "+919848012345", {
          value: ethers.parseEther("10"),
        });

      await expect(
        serviceRequest.connect(addr3).getAuctionSRListinDriverRegion()
      ).to.be.reverted;
    });
  });
});
