// SPDX-License-Identifier: MIT

pragma solidity 0.8.24;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Strings.sol";
import "./interfaces/IDrivingLicenseNFT.sol";
import "./libraries/Types.sol";
import "./libraries/Errors.sol";
import "./libraries/Events.sol";
import "./libraries/Helpers.sol";
import "./libraries/Computation.sol";
import "./libraries/Validation.sol";

/**
 * @title Managing Users & their roles in a Logistics Application
 * @author Suresh Konakanchi
 * @notice This contract allows for the management of user roles and handles requests for role changes.
 * @dev Inherits from OpenZeppelin's Ownable to provide basic authorization control.
 */
contract UserRoleRequest is Ownable {
  // ----- Dependent Contracts -----
  IDrivingLicenseNFT immutable drivingLicenseNFT;

  // ----- State Variables -----
  Types.RoleRequest[] internal roleRequests;
  mapping(address => Types.User) internal users;
  address disputeContractAddress = address(0);

  /**
   * @dev Sets the initial admin user and links the Driving License NFT contract.
   */
  constructor(address adminUID, address dlNFTAddress) Ownable(adminUID) {
    drivingLicenseNFT = IDrivingLicenseNFT(dlNFTAddress);

    Types.Role[] memory adminRole = new Types.Role[](1);
    adminRole[0] = Types.Role.Admin;
    Types.User memory admin = Types.User({
      name: "Admin",
      uid: adminUID,
      phoneNumberWithISO: "+918877665544",
      role: adminRole,
      serviceGeoHash: "",
      ratingStarsInt: 50,
      ratingStarsString: "50"
    });
    users[adminUID] = admin;
  }

  // ----- Helper Functions -----
  /**
   * @dev Internal function to add the Receiver role to a user.
   * @param _name The name of the receiver.
   * @param _geoHash The geographic location(hash) of the receiver.
   * @param _phoneNumberWithISO The phone number of the receiver including the ISO country code.
   * @param uid The address of the receiver.
   * @param isNewUser A flag indicating if the receiver is a new user.
   */
  function addReceiverRoleInternal(
    string memory _name,
    string memory _geoHash,
    string memory _phoneNumberWithISO,
    address uid,
    bool isNewUser
  ) internal {
    if (isNewUser) {
      Types.Role[] memory receiverRole = new Types.Role[](1);
      receiverRole[0] = Types.Role.Receiver;

      Types.User memory newUser = Types.User({
        name: _name,
        uid: uid,
        phoneNumberWithISO: _phoneNumberWithISO,
        role: receiverRole,
        serviceGeoHash: _geoHash,
        ratingStarsInt: 50,
        ratingStarsString: "50"
      });

      users[uid] = newUser;
    } else {
      addRoleToUser(
        Types.RoleRequest({
          requestId: roleRequests.length + 1,
          applicantUID: uid,
          requestedRole: Types.Role.Receiver,
          requestStatus: Types.RequestStatus.Approved,
          approverUID: msg.sender
        })
      );
    }
  }

  /**
   * @dev Sets the dispute contract address, restricting this action to the owner.
   */
  function setDisputeContractAddress(
    address _onlyDisputeContract
  ) external onlyOwner {
    disputeContractAddress = _onlyDisputeContract;
  }

  /**
   * @dev Internal function to add a role to a user.
   */
  function addRoleToUser(Types.RoleRequest memory roleRequest) internal {
    Types.User memory user = users[roleRequest.applicantUID];
    Types.Role[] memory userRoles = user.role;

    if (userRoles.length == 1 && userRoles[0] == Types.Role.None) {
      Types.Role[] memory updatedRoles = new Types.Role[](1);
      updatedRoles[0] = roleRequest.requestedRole;
      user.role = updatedRoles;
      users[roleRequest.applicantUID] = user;
    } else {
      Types.Role[] memory updatedRoles = new Types.Role[](user.role.length + 1);
      // Copy existing roles
      for (uint i = 0; i < user.role.length; i++) {
        updatedRoles[i] = user.role[i];
      }
      // Add new role
      updatedRoles[user.role.length] = roleRequest.requestedRole;
      // Update the state variables
      user.role = updatedRoles;
      users[roleRequest.applicantUID] = user;
    }
  }

  // ----- Modifiers -----
  modifier checkUserExists() {
    if (users[msg.sender].uid == address(0)) {
      revert Errors.UserNotRegistered({
        uid: msg.sender,
        message: "Unregistered User"
      });
    }
    _;
  }

  modifier checkUserNotExists() {
    if (users[msg.sender].uid != address(0)) {
      revert Errors.UserAlreadyExists({
        uid: msg.sender,
        message: "User already exists"
      });
    }
    _;
  }

  modifier checkValidInput(string memory _name, string memory _hash) {
    if (bytes(_name).length <= 0) {
      revert Errors.InvalidInput({
        uid: msg.sender,
        message: "Name is required"
      });
    }

    if (bytes(_hash).length <= 0) {
      revert Errors.InvalidInput({
        uid: msg.sender,
        message: "Service GeoHash is required"
      });
    }
    _;
  }

  modifier checkRoleRequest(Types.Role _requestedRole) {
    Types.Role[] memory userRoles = users[msg.sender].role;

    // Check if user already has requested role
    for (uint i = 0; i < userRoles.length; i++) {
      if (userRoles[i] == _requestedRole) {
        revert Errors.InvalidInput({
          uid: msg.sender,
          message: "Requested role already allocated to user"
        });
      }
    }

    // Cannot request None role
    if (_requestedRole == Types.Role.None) {
      revert Errors.InvalidInput({
        uid: msg.sender,
        message: "Cannot request None role"
      });
    }

    // Need to validate Driving License NFT
    if (_requestedRole == Types.Role.Driver) {
      if (!drivingLicenseNFT.validateNFT(msg.sender)) {
        revert Errors.NFTNotFound({
          uid: msg.sender,
          message: "Driving License NFT not found"
        });
      }
    }
    _;
  }

  modifier onlyDriver(address _addr) {
    Types.Role[] memory userRoles = users[_addr].role;

    bool isDriver = false;
    for (uint i = 0; i < userRoles.length; i++) {
      if (userRoles[i] == Types.Role.Driver) {
        isDriver = true;
        break;
      }
    }

    if (!isDriver) {
      revert Errors.NotAuthorized({
        uid: _addr,
        message: "User is not a Driver"
      });
    }
    _;
  }

  modifier onlyDisputeContract() {
    if (disputeContractAddress != msg.sender) {
      revert Errors.NotAuthorized({
        uid: msg.sender,
        message: "Not authorized to call this method"
      });
    }
    _;
  }

  // ----- User Contract Functions -----
  /**
   * @notice Retrieves all role requests.
   * @dev Returns a list of all role requests stored in the contract.
   * @return An array of `RoleRequest` structs containing details of all role requests.
   */
  function getAllRoleRequests()
    public
    view
    returns (Types.RoleRequest[] memory)
  {
    return roleRequests;
  }

  /**
   * @notice Retrieves role requests specific to the caller.
   * @dev Filters the roleRequests array to find requests made by the caller.
   * @return An array of `RoleRequest` structs relevant to the caller.
   */
  function getMyRoleRequests()
    public
    view
    returns (Types.RoleRequest[] memory)
  {
    uint256 count = 0;
    Types.RoleRequest[] memory temp_ = new Types.RoleRequest[](
      roleRequests.length
    );

    // Filter relevant entries and store them in temp_
    for (uint256 i = 0; i < roleRequests.length; i++) {
      if (roleRequests[i].applicantUID == msg.sender) {
        temp_[count] = roleRequests[i];
        count++;
      }
    }

    // Create the final array of the correct size
    Types.RoleRequest[] memory requests_ = new Types.RoleRequest[](count);

    // Populate the final array
    for (uint256 i = 0; i < count; i++) {
      requests_[i] = temp_[i];
    }

    return requests_;
  }

  /**
   * @notice Retrieves role requests from users within the same region as the caller.
   * @dev Filters role requests based on the geographic(geohash) location stored in `serviceGeoHash`.
   * @return An array of `RoleRequest` that occur within the same geographic region as the caller.
   */
  function getRoleRequestsInMyRegion()
    public
    view
    returns (Types.RoleRequest[] memory)
  {
    Types.User memory self_ = users[msg.sender];
    uint256 count = 0;
    Types.RoleRequest[] memory temp_ = new Types.RoleRequest[](
      roleRequests.length
    );

    // Filter relevant entries and store them in temp_
    for (uint256 i = 0; i < roleRequests.length; i++) {
      Types.User memory user_ = users[roleRequests[i].applicantUID];
      if (Helpers.compareGeoHash(self_.serviceGeoHash, user_.serviceGeoHash)) {
        temp_[count] = roleRequests[i];
        count++;
      }
    }

    // Create the final array of the correct size
    Types.RoleRequest[] memory requests_ = new Types.RoleRequest[](count);

    // Populate the final array
    for (uint256 i = 0; i < count; i++) {
      requests_[i] = temp_[i];
    }

    return requests_;
  }

  /**
   * @notice Returns the geographic hash of the user specified by `_uid`.
   * @param _uid The user identifier.
   * @return The service geographic hash of the user.
   */
  function getUserGeoHash(address _uid) external view returns (string memory) {
    return users[_uid].serviceGeoHash;
  }

  /**
   * @notice Checks if a user is registered.
   * @param _userAddr The address of the user to check.
   * @dev Throws an error if the user is not registered.
   */
  function isUserRegistered(address _userAddr) public view {
    if (users[_userAddr].uid == address(0)) {
      revert Errors.UserNotRegistered({
        uid: _userAddr,
        message: "User is not registered"
      });
    }
  }

  /**
   * @notice Allows a new user to register.
   * @param _name The name of the user.
   * @param _geoHash The geographic hash representing the user's location.
   * @param _phoneNumberWithISO The user's phone number including the ISO country code.
   * @dev Registers a user only if they are not already registered and inputs are valid.
   */
  function createUser(
    string memory _name,
    string memory _geoHash,
    string memory _phoneNumberWithISO
  ) public checkUserNotExists checkValidInput(_name, _geoHash) {
    Types.Role[] memory noneRole = new Types.Role[](1);
    noneRole[0] = Types.Role.None;

    Types.User memory newUser = Types.User({
      name: _name,
      uid: msg.sender,
      phoneNumberWithISO: _phoneNumberWithISO,
      role: noneRole,
      serviceGeoHash: _geoHash,
      ratingStarsInt: 50,
      ratingStarsString: "50"
    });

    users[msg.sender] = newUser;

    emit Events.NewUserAdded(_name, msg.sender, _geoHash);
  }

  /**
   * @notice Submits a request for a new role.
   * @param _requestedRole The role being requested.
   * @dev Submits a role request and validates it against current roles and permissions.
   */
  function createRoleRequest(
    Types.Role _requestedRole
  ) public checkUserExists checkRoleRequest(_requestedRole) {
    uint256 _requestId = roleRequests.length;
    Types.RoleRequest memory newRoleRequest = Types.RoleRequest({
      requestId: _requestId,
      applicantUID: msg.sender,
      requestedRole: _requestedRole,
      requestStatus: Types.RequestStatus.Pending,
      approverUID: address(0)
    });

    roleRequests.push(newRoleRequest);

    emit Events.NewRoleRequestAdded(_requestId, msg.sender, _requestedRole);
  }

  /**
   * @notice Approves or rejects a role request.
   * @param _roleRequestId The index of the role request in the `roleRequests` array.
   * @param approve Whether the request is approved (`true`) or rejected (`false`).
   * @dev Updates the role request status and modifies user roles if approved.
   */
  function approveOrRejectRoleRequest(
    uint256 _roleRequestId,
    bool approve
  ) public checkUserExists {
    Types.Role[] memory approverRoles = users[msg.sender].role;

    if (_roleRequestId >= roleRequests.length) {
      revert Errors.InvalidInput({
        uid: msg.sender,
        message: "Invalid Role Request ID"
      });
    }

    Types.RoleRequest memory roleRequest = roleRequests[_roleRequestId];

    // Check if proper permission is there or not
    if (!Computation.isApproverHavingPermission(approverRoles, roleRequest)) {
      revert Errors.NotAuthorized({
        uid: msg.sender,
        message: "You don't have permission"
      });
    }
    // Checking for already approved or rejected request
    Computation.checkRoleRequestStatus(roleRequest);

    if (approve) {
      roleRequest.requestStatus = Types.RequestStatus.Approved;
      roleRequest.approverUID = msg.sender;
      roleRequests[_roleRequestId] = roleRequest;
      addRoleToUser(roleRequest);
    } else {
      roleRequest.requestStatus = Types.RequestStatus.Rejected;
      roleRequest.approverUID = msg.sender;
      roleRequests[_roleRequestId] = roleRequest;
    }
  }

  /**
   * @notice Checks if the specified address has either 'Shipper' or 'Admin' roles or adds the 'Receiver' role if necessary.
   * @param _shipper The address to check for 'Shipper' or 'Admin' roles.
   * @param _receiverUID The address of the potential receiver.
   * @param _receiverName The name of the receiver, used if a new receiver is being added.
   * @param _receiverGeoHash The geographic hash of the receiver, used if a new receiver is being added.
   * @param _phoneNumberWithISO The phone number of the receiver including the ISO country code, used if a new receiver is being added.
   * @dev This function will add the 'Receiver' role if the receiver does not already have it and the specified shipper address has the necessary roles.
   */
  function createSRRoleCheck(
    address _shipper,
    address _receiverUID,
    string memory _receiverName,
    string memory _receiverGeoHash,
    string memory _phoneNumberWithISO
  ) external {
    if (_shipper == _receiverUID) {
      revert Errors.InvalidInput({
        uid: _shipper,
        message: "Shipper and Receiver can't be same"
      });
    }

    if (users[_shipper].uid == address(0)) {
      revert Errors.UserNotRegistered({
        uid: _shipper,
        message: "Shipper not registered"
      });
    }

    if (users[_receiverUID].uid == address(0)) {
      addReceiverRoleInternal(
        _receiverName,
        _receiverGeoHash,
        _phoneNumberWithISO,
        _receiverUID,
        true
      );
    }

    bool isShipper = false;
    bool isReceiver = false;

    Types.Role[] memory receiverRoles = users[_receiverUID].role;
    for (uint i = 0; i < receiverRoles.length; i++) {
      if (receiverRoles[i] == Types.Role.Receiver) {
        isReceiver = true;
        break;
      }
    }

    // Add Receiver role if not present
    if (!isReceiver) {
      addReceiverRoleInternal(
        _receiverName,
        _receiverGeoHash,
        _phoneNumberWithISO,
        _receiverUID,
        false
      );
    }

    Types.Role[] memory shipperRoles = users[_shipper].role;
    for (uint i = 0; i < shipperRoles.length; i++) {
      if (
        shipperRoles[i] == Types.Role.Shipper ||
        shipperRoles[i] == Types.Role.Admin
      ) {
        isShipper = true;
        break;
      }
    }

    // If not Shipper, then throw error
    if (!isShipper) {
      revert Errors.NotAuthorized({
        uid: _shipper,
        message: "Shipper provided doesn't have SHIPPER role"
      });
    }
  }

  // --- Simple functions to check for appropriate roles ---
  function hasRoleShipper(address _addr) external view {
    Types.Role[] memory userRoles = users[_addr].role;

    bool isShipper = false;
    for (uint i = 0; i < userRoles.length; i++) {
      if (userRoles[i] == Types.Role.Shipper) {
        isShipper = true;
        break;
      }
    }

    if (!isShipper) {
      revert Errors.NotAuthorized({
        uid: _addr,
        message: "User is not a Shipper"
      });
    }
  }

  function hasRoleDriver(address _addr) external view {
    Types.Role[] memory userRoles = users[_addr].role;

    bool isDriver = false;
    for (uint i = 0; i < userRoles.length; i++) {
      if (userRoles[i] == Types.Role.Driver) {
        isDriver = true;
        break;
      }
    }

    if (!isDriver) {
      revert Errors.NotAuthorized({
        uid: _addr,
        message: "User is not a Driver"
      });
    }
  }

  function hasRoleReceiver(address _addr) external view {
    Types.Role[] memory userRoles = users[_addr].role;

    bool isReceiver = false;
    for (uint i = 0; i < userRoles.length; i++) {
      if (userRoles[i] == Types.Role.Receiver) {
        isReceiver = true;
        break;
      }
    }

    if (!isReceiver) {
      revert Errors.NotAuthorized({
        uid: _addr,
        message: "User is not a Receiver"
      });
    }
  }

  function isAdmin(address _addr) external view returns (bool) {
    Types.Role[] memory userRoles = users[_addr].role;

    for (uint i = 0; i < userRoles.length; i++) {
      if (userRoles[i] == Types.Role.Admin) {
        return true;
      }
    }

    return false;
  }

  /**
   * @notice Deducts stars from a driver's rating as a penalty.
   * @param _addr The address of the driver whose rating is to be deducted.
   * @dev Requires the caller to be a driver and can only be called by the dispute contract.
   */
  function deductStars(
    address _addr
  ) external onlyDriver(_addr) onlyDisputeContract {
    Types.User memory user = users[_addr];
    uint intStars = user.ratingStarsInt;
    intStars -= 1;
    if (intStars >= 0) {
      users[_addr].ratingStarsInt = intStars;
      uint rem = intStars % 10;
      uint quot = intStars / 10;
      users[_addr].ratingStarsString = string(
        abi.encodePacked(Strings.toString(quot), ".", Strings.toString(rem))
      );
    }
  }

  /**
   * @notice Updates user information for the calling user.
   * @param _name New name for the user.
   * @param _geoHash New geographic hash representing the user's location.
   * @param _phoneNumberWithISO New phone number including the ISO country code.
   * @return Returns the updated user object.
   * @dev Validates input, checks if user is registered, and updates the user's information.
   */
  function updateUserInfo(
    string memory _name,
    string memory _geoHash,
    string memory _phoneNumberWithISO
  ) external returns (Types.User memory) {
    isUserRegistered(msg.sender);

    Validation.checkValue(_name);
    Validation.checkValue(_phoneNumberWithISO);
    Validation.checkValidGeoHash(_geoHash);

    Types.User memory user = users[msg.sender];
    user.name = _name;
    user.serviceGeoHash = _geoHash;
    user.phoneNumberWithISO = _phoneNumberWithISO;
    users[msg.sender] = user;
    return user;
  }

  /**
   * @notice Retrieves user information for a specified user ID.
   * @param _uid The user identifier.
   * @return A `User` struct containing the user's details.
   * @dev Fetches and returns the user's details from the contract's storage.
   */
  function getUserInfo(address _uid) external view returns (Types.User memory) {
    return users[_uid];
  }
}
