// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

import "./Types.sol";

library Errors {
  // Common Errors
  error AccessDenied(address from, string message);
  error NotAuthorized(address uid, string message);
  error InvalidInput(address uid, string message);

  // Token Errors
  error NotSufficientFunds(address account, string message);

  // Dispute Errors
  error OnlyDisputedSRCanBeAdded(address from, Types.SRInfo srInfo);
  error AlreadyVoted(uint256 srId, string message);
  error VotingEndedAlready(uint256 srId, string message);
  error SelfVoteNotAllowed(uint256 srId, string message);
  error VotingInProgress(address from, uint256 srId, string message);

  // Driving License Errors
  error InvalidDLInput(string name, string value, string message);
  error PublicMintError(string name, string id, string image, string message);
  error InternalMintError(address from, address to, string message);
  error DLInfoNotFound(uint256 tokenId, string message);
  error OwnerUnauthorized(uint256 tokenId, string message);

  // User Errors
  error NFTNotFound(address uid, string message);
  error UserNotRegistered(address uid, string message);
  error UserAlreadyExists(address uid, string message);
  error RequestAlreadyProcessed(address uid, string message, uint256 requestId);

  // Service Request Errors
  error InvalidSRStatus(Types.Status status, string message);
  error InvalidValue(string value, string message);
  error InvalidGeoHash(string geoHash, string message);
  error InvalidProductValue(uint256 value, string message);
  error InvalidAuctionTime(uint256 timestamp, string message);
  error SRDoesNotExists(uint256 srId, string message);
  error SRCannotBeUpdated(uint256 srId, string message);
  error SRAccessDenied(uint256 srId, string message);
  error SRCannotBeCancelled(uint256 srId, string message);
  error AuctionNotStarted(uint256 srId, string message);
  error AuctionEnded(uint256 srId, string message);
  error SROutOfRegion(uint256 srId, string message);
  error AlreadyBidded(address bidder, string message);
  error AuctionInProgress(uint256 srId, string message);
  error SRDisputeAlreadyResolved(uint256 srId, string message);
}
