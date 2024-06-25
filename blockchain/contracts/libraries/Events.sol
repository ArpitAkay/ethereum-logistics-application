// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

import "./Types.sol";

library Events {
  // Disputed Service Request events
  event NewSRInDisputeSystem(address from, uint256 srId, Types.SRInfo srInfo);
  event NewVoteAdded(uint256 srId, string message);

  // Geek Token events
  event TransferedTokens(address from, address to, uint256 tokens);

  // User Role Request events
  event NewUserAdded(string name, address uid, string serviceGeoHash);
  event NewRoleRequestAdded(
    uint256 requestId,
    address applicantUID,
    Types.Role requestedRole
  );

  // Service Request events
  event NewSRAdded(Types.SRInfo srInfo, address by, string message);
  event SRUpdated(Types.SRInfo srInfo, address by, string message);
  event SRCancelled(uint256 srId, address by, string message);
  event NewBidEntry(uint256 srId, address by, uint256 serviceFee);
  event AuctionResults(uint256 srId, address wonBy, string message);
  event SRStatusUpdated(Types.SRInfo srInfo, string message);
  event DisputedSRResult(uint256 srId, string message);
}
