// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

import "../libraries/Types.sol";

interface IDisputedServiceRequest {
  function addNewDisputedSR(address from, Types.SRInfo memory srInfo) external;

  function decideDisputeWinner(
    uint256 _serviceRequestId
  ) external returns (Types.SRInfo memory);
}
