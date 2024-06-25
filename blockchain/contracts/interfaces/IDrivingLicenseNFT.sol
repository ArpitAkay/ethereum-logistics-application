// SPDX-License-Identifier: MIT

pragma solidity 0.8.24;

interface IDrivingLicenseNFT {
  function validateNFT(address uid) external view returns (bool);
}
