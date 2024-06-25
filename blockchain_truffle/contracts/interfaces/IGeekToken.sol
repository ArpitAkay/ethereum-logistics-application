// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

import "../libraries/Types.sol";

interface IGeekToken {
  function transferTokens(
    address to,
    uint256 cargoInsurableValue,
    Types.Status acceptance
  ) external;
}
