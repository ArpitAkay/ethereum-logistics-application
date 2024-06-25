// SPDX-License-Identifier: MIT

pragma solidity 0.8.24;

/**
 * @title Helper Library
 * @author Suresh Konakanchi
 * @dev Provides utility functions for string manipulations and comparisons often required in blockchain applications.
 */
library Helpers {
  /**
   * @dev Compares two strings for equality using keccak256 hashing.
   * @param a First string to compare.
   * @param b Second string to compare.
   * @return bool True if the strings are equal, false otherwise.
   */
  function compareStrings(
    string memory a,
    string memory b
  ) internal pure returns (bool) {
    return keccak256(abi.encodePacked(a)) == keccak256(abi.encodePacked(b));
  }

  /**
   * @dev Compares geographic hashes to determine if the second hash (child) starts with the first hash (parent).
   * @param _geoHashParent The parent geohash (prefix).
   * @param _geoHashChild The child geohash to be tested against the parent.
   * @return bool True if the child geohash starts with the parent geohash, false otherwise.
   */
  function compareGeoHash(
    string memory _geoHashParent,
    string memory _geoHashChild
  ) internal pure returns (bool) {
    bytes memory parentBytes = bytes(_geoHashParent);
    bytes memory childBytes = bytes(_geoHashChild);

    // Compare lengths
    if (parentBytes.length > childBytes.length) {
      return false;
    }

    // Compare prefixes
    for (uint256 i = 0; i < parentBytes.length; i++) {
      if (parentBytes[i] != childBytes[i]) {
        return false;
      }
    }

    return true;
  }

  /**
   * @dev Extracts a substring from a given string.
   * @param str The original string.
   * @param startIndex The starting index of the substring.
   * @param length The length of the substring.
   * @return string A new string which is the substring of the original.
   * @notice Reverts if the requested range is out of the bounds of the original string.
   */
  function substring(
    string memory str,
    uint256 startIndex,
    uint256 length
  ) internal pure returns (string memory) {
    bytes memory strBytes = bytes(str);
    require(startIndex + length <= strBytes.length, "Invalid substring range");

    bytes memory result = new bytes(length);
    for (uint256 i = 0; i < length; i++) {
      result[i] = strBytes[startIndex + i];
    }

    return string(result);
  }

  /**
   * @dev Formats a driving license number by masking all characters except the last two.
   * @param input The full driving license number.
   * @return string The masked driving license number, with all characters replaced by '*' except the last two.
   */
  function formatDrivingLicenseNumber(
    string memory input
  ) internal pure returns (string memory) {
    string memory lastTwo = substring(input, bytes(input).length - 2, 2);

    string memory firstChars = "";
    for (uint256 i = 0; i < bytes(input).length - 2; i++) {
      if (bytes(input)[i] == bytes(" ")[0]) {
        firstChars = string(abi.encodePacked(firstChars, " "));
      } else {
        firstChars = string(abi.encodePacked(firstChars, "*"));
      }
    }

    string memory formattedDL = string(abi.encodePacked(firstChars, lastTwo));

    return formattedDL;
  }
}
