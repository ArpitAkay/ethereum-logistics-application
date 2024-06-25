// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

import "@openzeppelin/contracts/access/Ownable.sol";
import "./interfaces/IUserRoleRequest.sol";
import "./libraries/Types.sol";
import "./libraries/Events.sol";
import "./libraries/Errors.sol";
import "./libraries/Helpers.sol";

/**
 * @title Disputed Service Request Contract
 * @author Suresh Konakanchi
 * @notice This contract allows for the creation, voting, and resolution of disputes concerning service requests.
 * @dev Manages disputed service requests in a decentralized logistics system, allowing voting on disputes and deciding winners based on votes.
 * This contract uses the Ownable contract from OpenZeppelin to manage ownership privileges.
 */
contract DisputedServiceRequest is Ownable {
  // ----- Other Contracts & State Variables -----
  IUserRoleRequest immutable userRoleRequest;
  uint256 immutable MAX_VOTES = 3;

  /// Array of service request information, specifically for those in dispute.
  Types.SRInfo[] internal srInfos;
  /// Mapping from service request ID to the current vote counts.
  mapping(uint256 => Types.VoteCount) public voteCounts;
  /// Mapping to track which addresses have already voted on a particular service request dispute.
  mapping(uint256 => address[]) internal peopleWhoAlreadyVoted;
  /// Address of the service request contract, used for validating permissions.
  address srContractAddr = address(0);

  /**
   * @notice Sets the initial owner and UserRoleRequest contract address upon deployment.
   * @param uid Owner's address.
   * @param _roleRequest Address of the IUserRoleRequest contract to interact with user roles and permissions.
   * @dev The IUserRoleRequest contract is used to check if a user has a role other than None.
   */
  constructor(address uid, address _roleRequest) Ownable(uid) {
    userRoleRequest = IUserRoleRequest(_roleRequest);
  }

  // ----- Modifiers -----
  modifier isValidUser(address _addr) {
    // Checks if provided address has any role other than None
    userRoleRequest.isUserRegistered(_addr);
    _;
  }

  modifier hasRoleDriver(address _addr) {
    userRoleRequest.hasRoleDriver(_addr);
    _;
  }

  modifier isServiceRequestContract(address _addr) {
    if (srContractAddr != _addr) {
      revert Errors.AccessDenied({
        from: _addr,
        message: "You are not allowed to call this method"
      });
    }
    _;
  }

  // ----- Helper Functions -----

  /**
   * @dev Internal function to increment the vote count for a given service request ID and voter type.
   * @param _srId Service request ID.
   * @param whomToVote Enum value indicating whom the vote is for (Driver or Receiver).
   */
  function increaseVote(uint256 _srId, Types.WhomToVote whomToVote) internal {
    if (whomToVote == Types.WhomToVote.Driver) voteCounts[_srId].driver++;
    else voteCounts[_srId].receiver++;
    voteCounts[_srId].total =
      voteCounts[_srId].driver +
      voteCounts[_srId].receiver;
  }

  /**
   * @dev Internal function to decide the winner of a dispute based on current vote counts and update the service request status and dispute winner accordingly.
   * @param _srId Service request ID.
   */
  function updateDisputeWinner(uint256 _srId) internal {
    Types.VoteCount memory voteCount = voteCounts[_srId];
    Types.SRResult memory srResult_ = getDisputedSRbyIdWithIndex(_srId);
    Types.SRInfo memory srInfo = srResult_.sr;
    uint256 index = srResult_.index;

    // Decide the winner
    if (voteCount.driver > voteCount.receiver) {
      srInfos[index].status = Types.Status.DISPUTE_RESOLVED;
      srInfos[index].disputeWinner = "DRIVER";
    } else if (voteCount.driver < voteCount.receiver) {
      userRoleRequest.deductStars(srInfo.driverUID);
      srInfos[index].status = Types.Status.DISPUTE_RESOLVED;
      srInfos[index].disputeWinner = "RECEIVER";
    } else {
      srInfos[index].disputeWinner = "DRAW";
    }
  }

  // ----- Contract Functions -----

  /**
   * @notice Updates the address of the service request contract.
   * @dev Can only be called by the owner. Used to set or update the address of the contract handling non-disputed service requests.
   * @param _addr Address of the new service request contract.
   */
  function updateServiceRequestAddr(address _addr) external onlyOwner {
    srContractAddr = _addr;
  }

  /**
   * @notice Adds a new disputed service request to the system.
   * @dev Ensures that only disputes can be added and that the function caller must be the service request contract.
   * @param from Address from which the call is made.
   * @param srInfo Struct containing information about the disputed service request.
   */
  function addNewDisputedSR(
    address from,
    Types.SRInfo memory srInfo
  ) external isServiceRequestContract(msg.sender) {
    if (srInfo.status != Types.Status.DISPUTE) {
      revert Errors.OnlyDisputedSRCanBeAdded(from, srInfo);
    }

    srInfos.push(srInfo);
    Types.VoteCount memory voteCount = Types.VoteCount({
      driver: 0,
      receiver: 0,
      total: 0
    });

    voteCounts[srInfo.requestId] = voteCount;

    emit Events.NewSRInDisputeSystem(from, srInfo.requestId, srInfo);
  }

  /**
   * @notice Allows a valid user to cast a vote on a disputed service request.
   * @dev Checks for the validity of the user, if they've already voted, and if the service request is within their operational region. Updates vote count and handles tie-breaking by shipper.
   * @param _srId Service request ID.
   * @param whomToVote Enum indicating the vote direction (Driver or Receiver).
   */
  function vote(
    uint256 _srId,
    Types.WhomToVote whomToVote
  ) external isValidUser(msg.sender) {
    // Check if the user is already voted
    address[] memory addressesOfPeopleWhoAlreadyVoted = peopleWhoAlreadyVoted[
      _srId
    ];
    for (uint256 i = 0; i < addressesOfPeopleWhoAlreadyVoted.length; i++) {
      if (addressesOfPeopleWhoAlreadyVoted[i] == msg.sender) {
        revert Errors.AlreadyVoted({
          srId: _srId,
          message: "Already voted for this disputed SR"
        });
      }
    }

    // Check if origin, destination falls in driver's region
    Types.SRResult memory srResult_ = getDisputedSRbyIdWithIndex(_srId);
    Types.SRInfo memory srInfo = srResult_.sr;
    string memory _votersGeoHash = userRoleRequest.getUserGeoHash(msg.sender);
    if (
      !Helpers.compareGeoHash(_votersGeoHash, srInfo.originGeoHash) ||
      !Helpers.compareGeoHash(_votersGeoHash, srInfo.destGeoHash)
    ) {
      revert Errors.SROutOfRegion({
        srId: _srId,
        message: "SR is not in your service region"
      });
    }

    // Check if required votes are already casted
    Types.VoteCount memory voteCount = voteCounts[_srId];
    if (voteCount.total >= MAX_VOTES) {
      if (
        voteCount.driver == voteCount.receiver &&
        srInfo.shipperUID == msg.sender
      ) {
        increaseVote(_srId, whomToVote);
        peopleWhoAlreadyVoted[_srId].push(msg.sender);
        emit Events.NewVoteAdded(
          _srId,
          "Shipper voted successfully as the dispute is tie"
        );
        return;
      }

      // Decide the winner
      updateDisputeWinner(_srId);
      revert Errors.VotingEndedAlready({
        srId: _srId,
        message: "Voting has already ended"
      });
    }

    // Do not allow self vote
    if (
      msg.sender == srInfo.shipperUID ||
      msg.sender == srInfo.receiverUID ||
      msg.sender == srInfo.driverUID
    ) {
      revert Errors.SelfVoteNotAllowed({
        srId: _srId,
        message: "Self vote is not allowed"
      });
    }

    // If not driver then revert
    userRoleRequest.hasRoleDriver(msg.sender);

    // Add new vote
    peopleWhoAlreadyVoted[_srId].push(msg.sender);
    increaseVote(_srId, whomToVote);
    emit Events.NewVoteAdded(_srId, "New vote is added by DAO members");
  }

  /**
   * @notice Decides the winner of a disputed service request once maximum votes are reached or voting is otherwise deemed complete.
   * @dev Checks if voting is complete and updates the service request's status and dispute winner. Can only be called by the service request contract.
   * @param _srId Service request ID.
   * @return Types.SRInfo Struct containing updated information about the service request.
   */
  function decideDisputeWinner(
    uint256 _srId
  )
    external
    isServiceRequestContract(msg.sender)
    returns (Types.SRInfo memory)
  {
    Types.SRResult memory srResult_ = getDisputedSRbyIdWithIndex(_srId);
    Types.SRInfo memory srInfo = srResult_.sr;
    uint256 index = srResult_.index;

    // Check if already winner declared
    if (srInfo.status == Types.Status.DISPUTE_RESOLVED) {
      return srInfo;
    }

    // Checking required votes are casted
    Types.VoteCount memory voteCount = voteCounts[_srId];
    if (voteCount.total < MAX_VOTES) {
      revert Errors.VotingInProgress({
        from: msg.sender,
        srId: _srId,
        message: "Voting on this disputed SR is still in progress"
      });
    }

    // Decide the winner & return
    updateDisputeWinner(_srId);
    return srInfos[index];
  }

  /**
   * @dev Retrieves the disputed service request by ID along with its index in the storage array for internal use.
   * @param _srId Service request ID.
   * @return Types.SRResult Struct containing the service request and its index.
   */
  function getDisputedSRbyIdWithIndex(
    uint256 _srId
  ) internal view returns (Types.SRResult memory) {
    Types.SRResult memory srResult_;

    for (uint256 i = 0; i < srInfos.length; i++) {
      if (srInfos[i].requestId == _srId) {
        srResult_.sr = srInfos[i];
        srResult_.index = i;
        return srResult_;
      }
    }

    revert Errors.SRDoesNotExists({
      srId: _srId,
      message: "Disputed SR does not exists"
    });
  }

  /**
   * @notice Retrieves all disputed service requests within a users's operational area.
   * @dev Filters and returns service requests based on geographical matching with the users's registered geohash.
   * @return Types.SRInfo[] Array of service requests matching the users's area.
   */
  function getAllDisputedSRInDriverArea()
    external
    view
    returns (Types.SRInfo[] memory)
  {
    string memory _geoHash = userRoleRequest.getUserGeoHash(msg.sender);
    Types.SRInfo[] memory temp_ = new Types.SRInfo[](srInfos.length);
    uint256 count = 0;

    // Filter and store relevant entries in the temp_ array
    for (uint256 i = 0; i < srInfos.length; i++) {
      Types.SRInfo memory request_ = srInfos[i];
      if (
        Helpers.compareGeoHash(_geoHash, request_.originGeoHash) &&
        Helpers.compareGeoHash(_geoHash, request_.destGeoHash)
      ) {
        // Check if the caller has already voted for this requestId
        address[] memory voters = peopleWhoAlreadyVoted[request_.requestId];
        for (uint256 k = 0; k < voters.length; k++) {
          if (voters[k] == msg.sender) {
            request_.disputeVoteGiven = true;
            break;
          }
        }
        temp_[count] = request_;
        count++;
      }
    }

    // Create the final array of the correct size
    Types.SRInfo[] memory disputes_ = new Types.SRInfo[](count);

    // Populate the final array
    for (uint256 i = 0; i < count; i++) {
      disputes_[i] = temp_[i];
    }

    return disputes_;
  }
}

// TODO: Once the winner is declared/updated,
// 1. Update the SR back to Service Request Contract and delete from state variable from here
// 2. In Vote Method, change `isValidUser` to check if role had either Shipper or Driver
