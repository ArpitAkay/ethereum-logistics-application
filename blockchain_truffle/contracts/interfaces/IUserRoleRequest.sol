// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

interface IUserRoleRequest {
  function createSRRoleCheck(
    address _shipper,
    address _receiverUID,
    string memory _receiverName,
    string memory _receiverGeoHash,
    string memory _phoneNumberWithISO
  ) external view;

  function hasRoleShipper(address _addr) external view;

  function hasRoleDriver(address _addr) external view;

  function hasRoleReceiver(address _addr) external view;

  function getUserGeoHash(address _addr) external view returns (string memory);

  function isUserRegistered(address _userAddr) external view;

  function isAdmin(address _addr) external view returns (bool);

  function deductStars(address _addr) external;
}
