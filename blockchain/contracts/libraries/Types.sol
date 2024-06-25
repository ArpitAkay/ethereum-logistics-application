// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

library Types {
  enum Role {
    None,
    Admin,
    Shipper,
    Driver,
    Receiver
  }
  enum RequestStatus {
    Pending,
    Approved,
    Rejected
  }
  enum Status {
    DRAFT, // Created by Shipper
    READY_FOR_AUCTION, // Updated by Shipper
    DRIVER_ASSIGNED, // Updated by System
    READY_FOR_PICKUP, // Updated by Shipper
    PARCEL_PICKED_UP, // Updated by Driver
    IN_TRANSIT, // Updated by Driver
    DELIVERED, // Updated by Driver
    CONDITIONALLY_ACCEPTED, // Updated by Receiver
    UNCONDITIONALLY_ACCEPTED, // Updated by Receiver
    CANCELLED, // Updated by Shipper (Only in DRAFT status)
    DISPUTE, // Updated by Receiver
    DISPUTE_RESOLVED // Updated by System
  }
  enum WhomToVote {
    Driver,
    Receiver,
    None
  }
  enum Acceptance {
    CONDITIONAL,
    UNCONDITIONAL
  }

  struct RoleRequest {
    uint256 requestId;
    address applicantUID;
    Role requestedRole;
    RequestStatus requestStatus;
    address approverUID; // Person who approves or rejects the request
  }
  struct User {
    string name;
    address uid;
    string phoneNumberWithISO;
    string serviceGeoHash;
    uint ratingStarsInt;
    string ratingStarsString;
    Role[] role;
  }
  /**
   * @dev For finding out role request info and it's index for updation in User Role Request contract
   */
  struct RoleRequestWithIndexDto {
    RoleRequest roleRequest;
    uint index;
  }
  struct DrivingLicenseInfo {
    string name;
    string id;
    string image;
  }
  struct DriverInfo {
    address driverUID;
    uint256 serviceFee;
    uint256 cargoInsuranceValue;
    bool cargoValueRefunded;
    bool serviceFeeRefunded;
  }
  struct BidInfo {
    address uid;
    uint256 serviceFee;
  }
  /**
   * @dev For Maintaining vote count for Driver & Receiver in case of dispute
   */
  struct VoteCount {
    uint256 driver;
    uint256 receiver;
    uint256 total;
  }
  struct SRInfo {
    uint256 requestId;
    string description;
    address shipperUID;
    address receiverUID;
    string originGeoHash; // Origin geo hash from where parcel has to be picked up
    string destGeoHash; // Destination geo hash from where parcel has to dropped
    uint256 cargoInsurableValue; // Product Value
    uint256 serviceFee; // Delivery charges that shipper is willing to pay
    uint256 requestedPickupTime; // Time at which parcel has to be picket up (In timestamp - seconds)
    uint256 requestedDeliveryTime; // Time at which parcel has to be dropped (In timestamp - seconds)
    uint256 auctionEndTime; // After how many minutes auction should end (Number - minutes)
    address driverUID; // System will update this after auction ends
    Status status;
    string disputeWinner; // empty or DRAW or DRIVER or RECEIVER
    BidInfo bidInfo;
    bool disputeVoteGiven;
  }
  /**
   * @dev For finding out SR info and it's index for updation in Dispute Service Request contract
   */
  struct SRResult {
    Types.SRInfo sr;
    uint256 index;
  }
}
