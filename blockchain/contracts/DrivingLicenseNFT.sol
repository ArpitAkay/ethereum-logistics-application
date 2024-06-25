// SPDX-License-Identifier: MIT

pragma solidity 0.8.24;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Pausable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Burnable.sol";
import "./libraries/Types.sol";
import "./libraries/Helpers.sol";
import "./libraries/Errors.sol";
import "./libraries/Validation.sol";

/**
 * @title A blockchain-based Driving License as an NFT.
 * @author Suresh Konakanchi
 * @notice This contract manages the minting, pausing, and burning of driving license NFTs, ensuring they are uniquely associated with verified drivers.
 * @dev Extends ERC721 standard with additional features like enumeration, pausability, and burnability.
 */
contract DrivingLicenseNFT is
  ERC721,
  ERC721Enumerable,
  ERC721Pausable,
  Ownable,
  ERC721Burnable
{
  // Determines if the public can currently mint NFTs.
  bool internal publicMintOpen = true;
  // Counter for assigning unique token IDs.
  uint256 private _nextTokenId;
  // Price for public minting.
  uint256 internal publicMintPrice = 0.01 ether;
  // Maximum number of tokens that can be minted.
  uint256 internal maxSupply = 200;
  // Mapping from token ID to driving license information.
  mapping(uint256 => Types.DrivingLicenseInfo) internal drivingLicenseInfo;

  /**
   * @dev Sets up the token by initializing its name, symbol, and the initial owner.
   * @param initialOwner The address that will be granted ownership of the contract.
   */
  constructor(
    address initialOwner
  ) ERC721("DrivingLicense", "DL") Ownable(initialOwner) {}

  /**
   * @dev Returns the base URI set for all tokens, used for token metadata storage.
   */
  function _baseURI() internal pure override returns (string memory) {
    return "https://aquamarine-casual-tarantula-177.mypinata.cloud/ipfs/";
  }

  /**
   * @notice Pauses all token transfers and minting.
   * @dev Only callable by the owner.
   */
  function pause() public onlyOwner {
    _pause();
  }

  /**
   * @notice Unpauses all token transfers and minting.
   * @dev Only callable by the owner.
   */
  function unpause() public onlyOwner {
    _unpause();
  }

  /**
   * @notice Updates the state controlling public access to minting.
   * @param _publicMintOpen Boolean representing the desired state of public minting availability.
   * @dev Only callable by the owner.
   */
  function editMintWindows(bool _publicMintOpen) external onlyOwner {
    publicMintOpen = _publicMintOpen;
  }

  /**
   * @notice Adjusts the maximum supply of tokens that can be minted.
   * @param _maxSupply New maximum supply limit.
   * @dev Only callable by the owner.
   */
  function editMaxSupply(uint256 _maxSupply) external onlyOwner {
    maxSupply = _maxSupply;
  }

  /**
   * @notice Allows public to mint their own driving license NFT if conditions are met.
   * @param _driverName Driver's name.
   * @param _driverLicenseNumber Driver's license number.
   * @param _ipfsHash IPFS hash of the driving license document.
   * @dev Requires payment of the set minting price and checks against the minting window and maximum supply.
   */
  function publicMint(
    string memory _driverName,
    string memory _driverLicenseNumber,
    string memory _ipfsHash
  ) external payable {
    Validation.checkLicenseValidations(
      _driverName,
      _driverLicenseNumber,
      _ipfsHash
    );
    if (!publicMintOpen) {
      revert Errors.PublicMintError({
        name: _driverName,
        id: _driverLicenseNumber,
        image: _ipfsHash,
        message: "Public mint is closed"
      });
    }

    if (msg.value != publicMintPrice) {
      revert Errors.PublicMintError({
        name: _driverName,
        id: _driverLicenseNumber,
        image: _ipfsHash,
        message: "Not enough funds provided"
      });
    }
    uint256 tokenId = internalMint(msg.sender);
    string memory dlNumber = Helpers.formatDrivingLicenseNumber(
      _driverLicenseNumber
    );
    drivingLicenseInfo[tokenId] = Types.DrivingLicenseInfo(
      _driverName,
      dlNumber,
      _ipfsHash
    );
  }

  /**
   * @dev Internal function to handle minting logic, ensuring no duplicates for a single address and respecting the max supply.
   * @param _to Address to mint the token for.
   * @return tokenId The new token's ID.
   */
  function internalMint(address _to) internal returns (uint256) {
    if (balanceOf(_to) != 0) {
      revert Errors.InternalMintError({
        from: msg.sender,
        to: _to,
        message: "You have already minted driving NFT"
      });
    }

    if (totalSupply() >= maxSupply) {
      revert Errors.InternalMintError({
        from: msg.sender,
        to: _to,
        message: "We sold out"
      });
    }
    uint256 tokenId = _nextTokenId++;
    _safeMint(_to, tokenId);
    return tokenId;
  }

  /**
   * @dev Override of the burn function to also clear associated data.
   */
  function burn(uint256 _tokenId) public override {
    super.burn(_tokenId);
    delete drivingLicenseInfo[_tokenId];
  }

  /**
   * @notice Allows the owner to burn a token.
   * @param _tokenId The ID of the token to burn.
   * @dev Calls the internal _burn function and clears associated data.
   */
  function burnViaOwner(uint256 _tokenId) public onlyOwner {
    super._burn(_tokenId);
    delete drivingLicenseInfo[_tokenId];
  }

  /**
   * @notice Validates the ownership and existence of an NFT for a specific address.
   * @param _addr The address to check.
   * @return isValid True if valid NFTs exist for the address.
   * @dev Loops through tokens owned by the address and checks for valid data.
   */
  function validateNFT(address _addr) external view returns (bool) {
    uint256 totalOwned = balanceOf(_addr);
    uint256[] memory ownedTokens = new uint256[](totalOwned);

    for (uint256 i = 0; i < totalOwned; i++) {
      ownedTokens[i] = tokenOfOwnerByIndex(_addr, i);
    }

    for (uint256 i = 0; i < ownedTokens.length; i++) {
      if (
        bytes(drivingLicenseInfo[ownedTokens[i]].name).length > 0 &&
        bytes(drivingLicenseInfo[ownedTokens[i]].id).length > 0
      ) {
        return true;
      }
    }

    return false;
  }

  /**
   * @notice Retrieves driving license information associated with a specific token ID.
   * @param _tokenId The ID of the token.
   * @return DrivingLicenseInfo Struct containing the driver's name, license number, and document hash.
   * @dev Verifies that the caller is the owner of the token and that data exists.
   */
  function getDriverLicenseInfoByTokenId(
    uint256 _tokenId
  ) public view returns (Types.DrivingLicenseInfo memory) {
    if (ownerOf(_tokenId) != msg.sender) {
      revert Errors.OwnerUnauthorized({
        tokenId: _tokenId,
        message: "You are not the owner of NFT"
      });
    }

    if (bytes(drivingLicenseInfo[_tokenId].id).length == 0) {
      revert Errors.DLInfoNotFound({
        tokenId: _tokenId,
        message: "Driver License info not found"
      });
    }

    return drivingLicenseInfo[_tokenId];
  }

  // --- The following functions are overrides required by Solidity ---
  function _update(
    address to,
    uint256 tokenId,
    address auth
  )
    internal
    override(ERC721, ERC721Enumerable, ERC721Pausable)
    returns (address)
  {
    return super._update(to, tokenId, auth);
  }

  function _increaseBalance(
    address account,
    uint128 value
  ) internal override(ERC721, ERC721Enumerable) {
    super._increaseBalance(account, value);
  }

  function supportsInterface(
    bytes4 interfaceId
  ) public view override(ERC721, ERC721Enumerable) returns (bool) {
    return super.supportsInterface(interfaceId);
  }
}
