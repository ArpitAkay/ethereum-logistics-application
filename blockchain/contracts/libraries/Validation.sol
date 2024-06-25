// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

import "./Types.sol";
import "./Errors.sol";
import "./Helpers.sol";

/**
 * @title Validation Library
 * @author Suresh Konakanchi
 * @dev Library to handle all validations related to service requests and their related data points in the logistics application.
 */
library Validation {
  /**
   * @notice Validates all inputs for a new service request creation.
   * @param _srInfo The service request information being validated.
   * @param _serviceFee The service fee associated with the service request.
   * @dev Performs multiple checks on service request details to ensure all inputs are valid.
   */
  function checkValidationsForServiceRequestCreation(
    Types.SRInfo memory _srInfo,
    uint256 _serviceFee
  ) internal view {
    // Validate the status of the service request is either DRAFT or READY_FOR_AUCTION
    checkSRStatus(_srInfo.status);

    // Ensure the description of the product is provided
    checkValue(_srInfo.description);

    // Validate geographic hashes for origin and destination
    checkValidGeoHash(_srInfo.originGeoHash);
    checkValidGeoHash(_srInfo.destGeoHash);

    // Ensure origin and destination geographic hashes are not identical
    compareOriginAndDestinationGeoHash(
      _srInfo.originGeoHash,
      _srInfo.destGeoHash
    );

    // Validate cargo insurable value is positive
    if (_srInfo.cargoInsurableValue <= 0) {
      revert Errors.InvalidProductValue({
        value: _srInfo.cargoInsurableValue,
        message: "Cargo insurance value should be greater than zero"
      });
    }

    // Ensure service fee is positive
    if (_serviceFee <= 0) {
      revert Errors.InvalidProductValue({
        value: _serviceFee,
        message: "Service value should be greater than zero"
      });
    }

    // Check validity of pickup, delivery, and auction end time
    checkValidTimmings(
      _srInfo.requestedPickupTime,
      _srInfo.requestedDeliveryTime,
      _srInfo.auctionEndTime
    );
  }

  /**
   * @notice Checks if the provided value (typically a string) is non-empty.
   * @param _value The string value to check.
   * @dev Reverts if the string is empty, using a specific error message.
   */
  function checkValue(string memory _value) internal pure {
    if (bytes(_value).length == 0) {
      revert Errors.InvalidValue({
        value: _value,
        message: "Value cannot be empty"
      });
    }
  }

  /**
   * @notice Validates that the service request status is appropriate for creating a new request.
   * @param _status The status to check, should be either DRAFT or READY_FOR_AUCTION.
   * @dev Reverts if the status is not one of the acceptable statuses.
   */
  function checkSRStatus(Types.Status _status) internal pure {
    if (
      _status != Types.Status.DRAFT && _status != Types.Status.READY_FOR_AUCTION
    ) {
      revert Errors.InvalidSRStatus({
        status: _status,
        message: "SR status can be DRAFT or READY_FOR_AUCTION during creation"
      });
    }
  }

  /**
   * @notice Checks the validity of a geographic hash provided for locations.
   * @param _geoHash The geographic hash to validate.
   * @dev Reverts if the geographic hash is shorter than 3 characters, indicating an invalid or too general hash.
   */
  function checkValidGeoHash(string memory _geoHash) internal pure {
    // if (bytes(_geoHash).length == 0) {
    //   revert Errors.InvalidGeoHash({
    //     geoHash: _geoHash,
    //     message: "GeoHash cannot be empty"
    //   });
    // }

    if (bytes(_geoHash).length <= 3) {
      revert Errors.InvalidGeoHash({
        geoHash: _geoHash,
        message: "Invalid GeoHash provided"
      });
    }
  }

  /**
   * @notice Compares two geographic hashes to ensure they are not identical.
   * @param _originGeoHash The geographic hash of the origin.
   * @param _destGeoHash The geographic hash of the destination.
   * @dev Reverts if the geographic hashes are identical, as origin and destination cannot be the same.
   */
  function compareOriginAndDestinationGeoHash(
    string memory _originGeoHash,
    string memory _destGeoHash
  ) internal pure {
    if (Helpers.compareStrings(_originGeoHash, _destGeoHash)) {
      revert Errors.InvalidGeoHash({
        geoHash: _originGeoHash,
        message: "Origin and Destination geo hash cannot be same"
      });
    }
  }

  /**
   * @notice Validates the timing for auction end, pickup, and delivery to ensure logical sequencing and future dates.
   * @param _requestedPickupTime The scheduled pickup time.
   * @param _requestedDeliveryTime The scheduled delivery time.
   * @param _auctionEndTime The end time of the auction in minutes.
   * @dev Ensures all times are in the future and logically ordered, reverting with detailed errors if not.
   */
  function checkValidTimmings(
    uint256 _requestedPickupTime,
    uint256 _requestedDeliveryTime,
    uint256 _auctionEndTime
  ) internal view {
    if (_auctionEndTime <= 0) {
      revert Errors.InvalidAuctionTime({
        timestamp: _auctionEndTime,
        message: "Auction time cannot be less than or equal to zero"
      });
    }

    // Check requested pickup time is in the future
    if (_requestedPickupTime <= block.timestamp) {
      revert Errors.InvalidAuctionTime({
        timestamp: _requestedPickupTime,
        message: "Request pickup time must be in the future"
      });
    }

    if (_requestedPickupTime < block.timestamp + 1 hours) {
      revert Errors.InvalidAuctionTime({
        timestamp: _requestedPickupTime,
        message: "Request pickup time must be after 1 hour from current time"
      });
    }

    if (
      block.timestamp + (_auctionEndTime * 1 minutes) >= _requestedPickupTime
    ) {
      revert Errors.InvalidAuctionTime({
        timestamp: _requestedDeliveryTime,
        message: "Requested pickup time must be greater than the auction time"
      });
    }

    // Check requested delivery time is in the future
    if (_requestedDeliveryTime <= block.timestamp) {
      revert Errors.InvalidAuctionTime({
        timestamp: _requestedDeliveryTime,
        message: "Request delivery time must be in the future"
      });
    }

    // Check if requested delivery time is after requested pickup time
    if (_requestedDeliveryTime <= _requestedPickupTime) {
      revert Errors.InvalidAuctionTime({
        timestamp: _requestedDeliveryTime,
        message: "Requested delivery time must be after requested pickup time"
      });
    }

    if ((_requestedDeliveryTime - _requestedPickupTime) < 30 minutes) {
      revert Errors.InvalidAuctionTime({
        timestamp: _requestedDeliveryTime,
        message: "Requested pickup and delivery times should have a minimum of 30 minutes difference"
      });
    }
  }

  /**
   * @notice Validates the completeness and formatting of driver license related fields.
   * @param _driverName The name of the driver.
   * @param _driverLicenseNumber The driver's license number.
   * @param _ipfsHash The IPFS hash of the driver's license document.
   * @dev Ensures all fields are non-empty, reverting with detailed errors if not.
   */
  function checkLicenseValidations(
    string memory _driverName,
    string memory _driverLicenseNumber,
    string memory _ipfsHash
  ) internal pure {
    if (bytes(_driverName).length == 0) {
      revert Errors.InvalidDLInput({
        name: "DriverName",
        value: _driverName,
        message: "Driver name cannot be empty"
      });
    }

    if (bytes(_driverLicenseNumber).length == 0) {
      revert Errors.InvalidDLInput({
        name: "Driver License",
        value: _driverLicenseNumber,
        message: "Driver license number cannot be empty"
      });
    }

    if (bytes(_ipfsHash).length == 0) {
      revert Errors.InvalidDLInput({
        name: "Ipfs hash",
        value: _driverLicenseNumber,
        message: "Driver license number cannot be empty"
      });
    }
  }
}
