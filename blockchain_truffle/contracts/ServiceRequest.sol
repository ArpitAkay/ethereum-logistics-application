// SPDX-License-Identifier: MIT

pragma solidity 0.8.24;

import "./interfaces/IGeekToken.sol";
import "./interfaces/IUserRoleRequest.sol";
import "./interfaces/IDisputedServiceRequest.sol";
import "./libraries/Types.sol";
import "./libraries/Errors.sol";
import "./libraries/Events.sol";
import "./libraries/Validation.sol";
import "./libraries/Computation.sol";
import "./libraries/Refund.sol";
import "./libraries/Helpers.sol";

/**
 * @title Service Request Contract for Logistics Application
 * @author Suresh Konakanchi
 * @notice Manages the lifecycle of service requests, from creation through auction and final delivery, including dispute resolution.
 * @dev Integrates with multiple interfaces and libraries to handle service requests, user roles, disputes, and validations.
 */
contract ServiceRequest {
  // ----- Other Contract References -----
  IGeekToken immutable geekToken;
  IDisputedServiceRequest immutable disputedServiceRequest;
  IUserRoleRequest immutable userRoleRequest;

  // ----- State variables -----
  address immutable owner;
  Types.SRInfo[] internal srInfos;
  mapping(uint256 => Types.DriverInfo) winnerInfo;
  mapping(uint256 => Types.DriverInfo[]) bidEntries;

  /**
   * @notice Initializes the contract with references to other required contracts.
   * @param initialOwner Address to be set as the initial owner, typically the deploying address.
   * @param _geekTokenAddr Address of the GeekToken contract used for payments and rewards.
   * @param _disputedServiceRequestAddr Address of the DisputedServiceRequest contract for handling disputes.
   * @param _userRoleRequestAddr Address of the UserRoleRequest contract for user role management.
   * @dev Sets up immutable references to other contracts that are essential for the operation of this contract.
   */
  constructor(
    address initialOwner,
    address _geekTokenAddr,
    address _disputedServiceRequestAddr,
    address _userRoleRequestAddr
  ) {
    owner = initialOwner;
    geekToken = IGeekToken(_geekTokenAddr);
    disputedServiceRequest = IDisputedServiceRequest(
      _disputedServiceRequestAddr
    );
    userRoleRequest = IUserRoleRequest(_userRoleRequestAddr);
  }

  // ----- Modifiers -----

  /**
   * @notice Modifier to check if the user is allowed to create a service request
   * @param _shipperUID address of the Shipper
   * @param _receiverUID address of the Receiver
   * @param _receiverName Name of the Receiver
   * @param _receiverGeoHash Geohash of the Receiver
   * @param _phoneNumberWithISO Receiver's phone number with ISO country code
   * @dev This modifier checks if the Shipper has the Shipper or Admin role, if the Receiver has the Receiver role, and if the Shipper and Receiver are not the same
   */
  modifier createServiceRequestPrecheck(
    address _shipperUID,
    address _receiverUID,
    string memory _receiverName,
    string memory _receiverGeoHash,
    string memory _phoneNumberWithISO
  ) {
    userRoleRequest.createSRRoleCheck(
      _shipperUID,
      _receiverUID,
      _receiverName,
      _receiverGeoHash,
      _phoneNumberWithISO
    );
    _;
  }

  modifier hasRoleDriver(address _addr) {
    userRoleRequest.hasRoleDriver(_addr);
    _;
  }

  // ----- Contract Functions -----
  /**
   * @notice Creates a new service request with initial details and validations.
   * @param _srInfo The details of the service request.
   * @param _receiverPhoneNoWithISO The phone number of the receiver with ISO prefix.
   * @dev Validates all inputs and adds a new service request to the state. Requires payment equal to the service fee.
   */
  function createNewSR(
    Types.SRInfo memory _srInfo,
    string memory _receiverPhoneNoWithISO
  )
    external
    payable
    createServiceRequestPrecheck(
      msg.sender,
      _srInfo.receiverUID,
      "Receiver",
      _srInfo.destGeoHash,
      _receiverPhoneNoWithISO
    )
  {
    Validation.checkValidationsForServiceRequestCreation(_srInfo, msg.value);
    uint256 _requestId = srInfos.length;

    // Add SR to state variable - `srInfos`
    Types.SRInfo memory serviceRequestInfo = Types.SRInfo({
      requestId: _requestId,
      description: _srInfo.description,
      shipperUID: msg.sender,
      receiverUID: _srInfo.receiverUID,
      originGeoHash: _srInfo.originGeoHash,
      destGeoHash: _srInfo.destGeoHash,
      cargoInsurableValue: _srInfo.cargoInsurableValue * (10 ** 18),
      serviceFee: msg.value,
      requestedPickupTime: _srInfo.requestedPickupTime,
      requestedDeliveryTime: _srInfo.requestedDeliveryTime,
      auctionEndTime: _srInfo.status == Types.Status.READY_FOR_AUCTION
        ? block.timestamp + (1 minutes * _srInfo.auctionEndTime)
        : 0,
      driverUID: address(0),
      status: _srInfo.status == Types.Status.READY_FOR_AUCTION
        ? Types.Status.READY_FOR_AUCTION
        : Types.Status.DRAFT,
      disputeWinner: "",
      bidInfo: Types.BidInfo({uid: address(0), serviceFee: 0}),
      disputeVoteGiven: false
    });
    srInfos.push(serviceRequestInfo);
    emit Events.NewSRAdded(serviceRequestInfo, msg.sender, "New SR is added");

    // Add Dummy Driver object to auctions
    Types.DriverInfo memory bidWinner_ = Types.DriverInfo({
      driverUID: address(0),
      serviceFee: msg.value + 1,
      cargoInsuranceValue: _srInfo.cargoInsurableValue * (10 ** 18),
      cargoValueRefunded: false,
      serviceFeeRefunded: false
    });
    winnerInfo[_requestId] = bidWinner_;
  }

  /**
   * @notice Edits an existing draft service request to update its details or status.
   * @param _requestId The unique identifier of the service request to edit.
   * @param _newStatus The new status to apply to the service request.
   * @param _requestedPickupTime The new requested pickup time.
   * @param _requestedDeliveryTime The new requested delivery time.
   * @param _auctionEndTime The new auction end time.
   * @dev Can only be called by the service request's shipper and only if the service request is in DRAFT status.
   */
  function editDraftSR(
    uint256 _requestId,
    Types.Status _newStatus,
    uint256 _requestedPickupTime,
    uint256 _requestedDeliveryTime,
    uint256 _auctionEndTime
  ) external {
    Validation.checkValidTimmings(
      _requestedPickupTime,
      _requestedDeliveryTime,
      _auctionEndTime
    );
    Types.SRInfo memory _srInfo = srInfos[_requestId];

    if (
      _srInfo.status != Types.Status.DRAFT ||
      (_newStatus != Types.Status.DRAFT &&
        _newStatus != Types.Status.READY_FOR_AUCTION)
    ) {
      revert Errors.SRCannotBeUpdated({
        srId: _requestId,
        message: _srInfo.status != Types.Status.DRAFT
          ? "SR is not in DRAFT mode"
          : "From DRAFT only READY_FOR_AUCTION is allowed"
      });
    }
    Computation.checkForRightOwner(_requestId, _srInfo.shipperUID);

    srInfos[_requestId].requestedPickupTime = _requestedPickupTime;
    srInfos[_requestId].requestedDeliveryTime = _requestedDeliveryTime;
    srInfos[_requestId].auctionEndTime =
      block.timestamp +
      (_auctionEndTime * 1 minutes);
    srInfos[_requestId].status = _newStatus;

    emit Events.SRUpdated(
      srInfos[_requestId],
      msg.sender,
      "SR updated successfully"
    );
  }

  /**
   * @notice Cancels an existing service request, refunding the service fee to the shipper.
   * @param _requestId The unique identifier of the service request to cancel.
   * @dev Can only be called by the shipper and only if the service request is in DRAFT status.
   */
  function cancelSR(uint256 _requestId) external {
    Types.SRInfo memory _srInfo = srInfos[_requestId];
    Computation.checkForCancelledStatus(_srInfo);
    Computation.checkForRightOwner(_requestId, _srInfo.shipperUID);
    if (_srInfo.status != Types.Status.DRAFT) {
      revert Errors.SRCannotBeCancelled({
        srId: _requestId,
        message: "SR cancellation is allowed only in DRAFT mode"
      });
    }

    // ----- Cancelling service request -----
    srInfos[_requestId].status = Types.Status.CANCELLED;
    payable(_srInfo.shipperUID).transfer(_srInfo.serviceFee);

    emit Events.SRCancelled(_requestId, msg.sender, "SR cancelled");
  }

  /**
   * @notice Places a dutch bid on an available service request.
   * @param _requestId The unique identifier of the service request to bid on.
   * @param _serviceFee The bid amount in terms of service fee offered by the driver.
   * @dev Requires that the caller is a registered driver with sufficient cargo insurance staked.
   */
  function dutchBid(
    uint256 _requestId,
    uint256 _serviceFee
  ) external payable hasRoleDriver(msg.sender) {
    Types.SRInfo memory _srInfo = srInfos[_requestId];
    if (_srInfo.status != Types.Status.READY_FOR_AUCTION) {
      revert Errors.AuctionNotStarted({
        srId: _requestId,
        message: "SR stopped taking new Bid entries"
      });
    }
    if (block.timestamp >= _srInfo.auctionEndTime) {
      revert Errors.AuctionEnded({
        srId: _requestId,
        message: "Auction for this SR has ended already"
      });
    }

    string memory _driverGeoHash = userRoleRequest.getUserGeoHash(msg.sender);

    // Comparing geohash of service request i.e originGeoHash and destGeoHash with driverGeoHash
    if (
      !Helpers.compareGeoHash(_driverGeoHash, _srInfo.originGeoHash) ||
      !Helpers.compareGeoHash(_driverGeoHash, _srInfo.destGeoHash)
    ) {
      revert Errors.SROutOfRegion({
        srId: _requestId,
        message: "SR is not in your service region"
      });
    }

    // Checking msg.value is equal to cargo insurable value
    if (msg.value != _srInfo.cargoInsurableValue) {
      revert Errors.InvalidProductValue({
        value: msg.value,
        message: "Cargo insurable value should be staked"
      });
    }

    // Checking service fee with cargo insurable value
    if (_serviceFee <= 0 || _serviceFee > _srInfo.serviceFee) {
      revert Errors.InvalidProductValue({
        value: _serviceFee,
        message: "Invalid Service Fee in dutch bid entry"
      });
    }

    Types.DriverInfo[] memory bidInfo_ = bidEntries[_requestId];
    Computation.checkAlreadyBidded(msg.sender, bidInfo_);

    // Storing bidder address in array of people who already voted
    Types.DriverInfo memory bidEntry_ = Types.DriverInfo({
      driverUID: msg.sender,
      serviceFee: _serviceFee,
      cargoInsuranceValue: msg.value,
      cargoValueRefunded: false,
      serviceFeeRefunded: false
    });
    bidEntries[_requestId].push(bidEntry_);
    emit Events.NewBidEntry(_requestId, msg.sender, _serviceFee);

    if (_serviceFee < winnerInfo[_requestId].serviceFee) {
      winnerInfo[_requestId] = bidEntry_;
    }
  }

  /**
   * @notice Declares a winner for the service request auction based on the lowest bid.
   * @param _requestId The unique identifier of the service request for which to declare a winner.
   * @dev Processes refunds to all other bidders and transitions the service request status to DRIVER_ASSIGNED.
   */
  function declareWinner(uint256 _requestId) external {
    Types.SRInfo memory _srInfo = srInfos[_requestId];
    Computation.checkForCancelledStatus(_srInfo);
    if (_srInfo.status == Types.Status.DRIVER_ASSIGNED) {
      revert Errors.SRAccessDenied({
        srId: _requestId,
        message: "Winner already declared"
      });
    }

    if (block.timestamp < _srInfo.auctionEndTime) {
      revert Errors.AuctionInProgress({
        srId: _requestId,
        message: "Auction is still in-progress"
      });
    }

    Types.DriverInfo memory bidWinner_ = winnerInfo[_requestId];

    if (bidWinner_.driverUID == address(0)) {
      srInfos[_requestId].status = Types.Status.CANCELLED;
      emit Events.SRCancelled(
        _requestId,
        msg.sender,
        "SR is auto-cancelled as there's no bid entries"
      );
    } else {
      srInfos[_requestId].status = Types.Status.DRIVER_ASSIGNED;
      srInfos[_requestId].driverUID = bidWinner_.driverUID;
      emit Events.AuctionResults(
        _requestId,
        bidWinner_.driverUID,
        "Winner declared"
      );

      Refund.cargoValueToDriversExceptWinner(
        bidEntries,
        _requestId,
        bidWinner_.driverUID
      );
    }
  }

  /**
   * @notice Updates the status of a service request throughout its lifecycle.
   * @param _requestId The unique identifier of the service request to update.
   * @param _newStatus The new status to be set for the service request.
   * @dev Validates the transition based on the current status and the role of the caller. Certain transitions may trigger payouts or finalize service delivery.
   */
  function updateSRStatus(
    uint256 _requestId,
    Types.Status _newStatus
  ) external {
    Types.SRInfo memory _srInfo = srInfos[_requestId];
    Computation.checkForCancelledStatus(_srInfo);
    Types.Status status_ = _srInfo.status;

    if (
      _newStatus == Types.Status.READY_FOR_PICKUP &&
      status_ == Types.Status.DRIVER_ASSIGNED
    ) {
      // Only Shipper can update to READY_FOR_PICKUP
      Computation.checkForRightOwner(_requestId, _srInfo.shipperUID);
      Computation.updateSRObjectStatus(srInfos, _requestId, _newStatus);
    } else if (
      _newStatus == Types.Status.PARCEL_PICKED_UP ||
      _newStatus == Types.Status.IN_TRANSIT ||
      _newStatus == Types.Status.DELIVERED
    ) {
      // Only Driver can update to PARCEL_PICKED_UP, IN_TRANSIT, or DELIVERED
      Computation.checkForRightOwner(_requestId, _srInfo.driverUID);
      Computation.requireValidTransition(status_, _newStatus, _requestId);
      Computation.updateSRObjectStatus(srInfos, _requestId, _newStatus);
    } else if (
      _newStatus == Types.Status.CONDITIONALLY_ACCEPTED ||
      _newStatus == Types.Status.UNCONDITIONALLY_ACCEPTED ||
      _newStatus == Types.Status.DISPUTE
    ) {
      // Only Receiver can update to CONDITIONALLY_ACCEPTED, UNCONDITIONALLY_ACCEPTED, or DISPUTE
      Computation.checkForRightOwner(_requestId, _srInfo.receiverUID);
      require(status_ == Types.Status.DELIVERED, "Parcel is still in Transit");
      Computation.updateSRObjectStatus(srInfos, _requestId, _newStatus);

      if (
        _newStatus == Types.Status.CONDITIONALLY_ACCEPTED ||
        _newStatus == Types.Status.UNCONDITIONALLY_ACCEPTED
      ) {
        Refund.cargoValueToWinningDriver(winnerInfo, _requestId);
        Refund.serviceFeeToShipperAndWinningDriver(winnerInfo, _srInfo);
        geekToken.transferTokens(
          _srInfo.driverUID,
          _srInfo.cargoInsurableValue,
          _newStatus
        );
      } else if (_newStatus == Types.Status.DISPUTE) {
        _srInfo.status = Types.Status.DISPUTE;
        disputedServiceRequest.addNewDisputedSR(address(this), _srInfo);
      }
    } else {
      revert Errors.SRAccessDenied(
        _requestId,
        "You don't have access to update this status"
      );
    }
  }

  /**
   * @notice Retrieves all service requests that are in the auction phase and are within the driver's service region.
   * @dev Filters service requests based on their geographic hashes matching with the driver's registered geohash.
   * @return An array of service requests that are in the auction phase and are within the driver's service region.
   */
  function getAuctionSRListinDriverRegion()
    external
    view
    hasRoleDriver(msg.sender)
    returns (Types.SRInfo[] memory)
  {
    string memory _geoHash = userRoleRequest.getUserGeoHash(msg.sender);
    Types.SRInfo[] memory tempList = new Types.SRInfo[](srInfos.length);
    uint256 count = 0;

    for (uint256 i = 0; i < srInfos.length; i++) {
      Types.SRInfo memory request = srInfos[i];
      // Checking SR is in Auction and origin / destination in service region of driver
      if (
        request.status == Types.Status.READY_FOR_AUCTION &&
        Helpers.compareGeoHash(_geoHash, request.originGeoHash) &&
        Helpers.compareGeoHash(_geoHash, request.destGeoHash)
      ) {
        // Check if the caller has a bid entry for this requestId
        Types.DriverInfo[] memory bids = bidEntries[request.requestId];
        for (uint256 j = 0; j < bids.length; j++) {
          if (bids[j].driverUID == msg.sender) {
            request.bidInfo.uid = bids[j].driverUID;
            request.bidInfo.serviceFee = bids[j].serviceFee;
            break;
          }
        }
        tempList[count] = request;
        count++;
      }
    }

    Types.SRInfo[] memory srList_ = new Types.SRInfo[](count);
    for (uint256 i = 0; i < count; i++) {
      srList_[i] = tempList[i];
    }

    return srList_;
  }

  // /**
  //  * @notice Retrieves SR details based on provided ID
  //  * @dev Should be used only by shipper,receiver, or driver of the requested SR
  //  * @return SRInfo object.
  //  */
  // function getSRDetailsbyID(
  //   uint256 _requestId
  // ) external view returns (Types.SRInfo memory) {
  //   /** ----- Getting SRInfo and index of it by request id ----- */
  //   Types.SRInfo memory _srInfo = srInfos[_requestId];

  //   address _userUID = msg.sender;
  //   if (
  //     _userUID == _srInfo.shipperUID ||
  //     _userUID == _srInfo.receiverUID ||
  //     _userUID == _srInfo.driverUID
  //   ) {
  //     return _srInfo;
  //   }

  //   revert Errors.SRAccessDenied({srId: _requestId, message: "Access denied"});
  // }

  /**
   * @notice Retrieves all service requests
   * @dev Only for admin to view all service requests
   * @return An array of service requests.
   */
  function getAllSRs() external view returns (Types.SRInfo[] memory) {
    require(msg.sender == owner, "Only Admin can view all SRs");
    return srInfos;
  }

  /**
   * @notice Retrieves all service requests in which the caller was involved, either as a shipper, driver, or receiver.
   * @dev Useful for users to view their history of service requests.
   * @return An array of service requests in which the caller was involved.
   */
  function getMySRs() external view returns (Types.SRInfo[] memory) {
    address _userUID = msg.sender;
    Types.SRInfo[] memory tempArray = new Types.SRInfo[](srInfos.length);
    uint256 count = 0;
    for (uint256 i = 0; i < srInfos.length; i++) {
      Types.SRInfo memory request = srInfos[i];
      if (
        request.shipperUID == _userUID ||
        request.receiverUID == _userUID ||
        request.driverUID == _userUID
      ) {
        tempArray[count] = request;
        count++;
      }
    }
    Types.SRInfo[] memory srList_ = new Types.SRInfo[](count);
    for (uint256 i = 0; i < count; i++) {
      srList_[i] = tempArray[i];
    }
    return srList_;
  }

  /**
   * @notice Decides the outcome of a disputed service request and finalizes the result.
   * @param _requestId The unique identifier of the service request involved in a dispute.
   * @dev Can be called by any party involved in the service request. Handles refunds and rewards based on the dispute resolution.
   */
  function decideWinnerForDispute(uint256 _requestId) external {
    Types.SRInfo memory _srInfo = srInfos[_requestId];
    if (_srInfo.status == Types.Status.DISPUTE_RESOLVED) {
      revert Errors.SRDisputeAlreadyResolved({
        srId: _requestId,
        message: "Dispute is already resolved"
      });
    }

    Types.SRInfo memory disputedSRInfo_ = disputedServiceRequest
      .decideDisputeWinner(_requestId);

    if (
      msg.sender != _srInfo.shipperUID &&
      msg.sender != _srInfo.receiverUID &&
      msg.sender != _srInfo.driverUID
    ) {
      revert Errors.SRAccessDenied({
        srId: _requestId,
        message: "Not Authorized"
      });
    }

    srInfos[_requestId].status = disputedSRInfo_.status;
    srInfos[_requestId].disputeWinner = disputedSRInfo_.disputeWinner;

    if (Helpers.compareStrings(disputedSRInfo_.disputeWinner, "DRIVER")) {
      Refund.cargoValueToWinningDriver(winnerInfo, _srInfo.requestId);
      Refund.serviceFeeToShipperAndWinningDriver(winnerInfo, disputedSRInfo_);
      geekToken.transferTokens(
        _srInfo.driverUID,
        _srInfo.cargoInsurableValue,
        Types.Status.CONDITIONALLY_ACCEPTED
      );

      emit Events.DisputedSRResult(_requestId, "Driver has won");
    } else if (
      Helpers.compareStrings(disputedSRInfo_.disputeWinner, "RECEIVER")
    ) {
      Refund.refundCargoValueToReceiver(
        disputedSRInfo_.receiverUID,
        disputedSRInfo_.cargoInsurableValue
      );
      Refund.serviceFeeToShipper(
        disputedSRInfo_.shipperUID,
        disputedSRInfo_.serviceFee
      );

      emit Events.DisputedSRResult(_requestId, "Receiver has won");
    } else {
      emit Events.DisputedSRResult(
        _requestId,
        "Draw, Shipper has special access to vote for breaking the tie"
      );
    }
  }
}
