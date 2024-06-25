// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

import "./Types.sol";
import "./Errors.sol";
import "./Helpers.sol";
import "./Events.sol";

/**
 * @title Computation Library
 * @author Suresh Konakanchi
 * @dev Provides utility functions to perform various checks and updates on data structures related to service requests and user roles.
 */
library Computation {
  /**
   * @dev Checks if a bidder has already placed a bid on a service request.
   * @param _bidder Address of the bidder.
   * @param _driverInfosWhoHasAlreadyBidded Array of DriverInfo structures to check against.
   * @notice Reverts with an AlreadyBidded error if the bidder has already placed a bid.
   */
  function checkAlreadyBidded(
    address _bidder,
    Types.DriverInfo[] memory _driverInfosWhoHasAlreadyBidded
  ) internal pure {
    for (uint256 i = 0; i < _driverInfosWhoHasAlreadyBidded.length; i++) {
      if (_driverInfosWhoHasAlreadyBidded[i].driverUID == _bidder) {
        revert Errors.AlreadyBidded({
          bidder: _bidder,
          message: "You have already bidded for this service request"
        });
      }
    }
  }

  /**
   * @dev Checks if the approver has the necessary permissions to approve or reject a role request.
   * @param approverRoles Array of Roles the approver holds.
   * @param roleRequest The role request being processed.
   * @return bool True if the approver has the required permissions, false otherwise.
   * @notice Reverts with a NotAuthorized error if the approver tries to approve their own request.
   */
  function isApproverHavingPermission(
    Types.Role[] memory approverRoles,
    Types.RoleRequest memory roleRequest
  ) internal view returns (bool) {
    if (msg.sender == roleRequest.applicantUID) {
      revert Errors.NotAuthorized({
        uid: msg.sender,
        message: "Self approve/reject is not allowed"
      });
    }

    Types.Role requestedRole = roleRequest.requestedRole;

    for (uint i = 0; i < approverRoles.length; i++) {
      if (approverRoles[i] == Types.Role.Admin) {
        return true;
      } else if (
        requestedRole == Types.Role.Shipper &&
        approverRoles[i] == Types.Role.Shipper
      ) {
        return true;
      } else if (
        requestedRole == Types.Role.Driver &&
        (approverRoles[i] == Types.Role.Driver ||
          approverRoles[i] == Types.Role.Shipper)
      ) {
        return true;
      } else if (
        requestedRole == Types.Role.Receiver &&
        approverRoles[i] != Types.Role.None
      ) {
        return true;
      }
    }
    return false;
  }

  /**
   * @dev Checks the status of a role request to ensure it has not been previously processed.
   * @param roleRequest The role request being checked.
   * @notice Reverts with a RequestAlreadyProcessed error if the role request is already approved or rejected.
   */
  function checkRoleRequestStatus(
    Types.RoleRequest memory roleRequest
  ) internal view {
    if (roleRequest.requestStatus == Types.RequestStatus.Approved) {
      revert Errors.RequestAlreadyProcessed({
        uid: msg.sender,
        message: "Role request already approved",
        requestId: roleRequest.requestId
      });
    }

    if (roleRequest.requestStatus == Types.RequestStatus.Rejected) {
      revert Errors.RequestAlreadyProcessed({
        uid: msg.sender,
        message: "Role request already rejected",
        requestId: roleRequest.requestId
      });
    }
  }

  /**
   * @dev Checks if a service request (SR) has been cancelled.
   * @param _srInfo The service request information.
   * @notice Reverts with an SRAccessDenied error if the service request is cancelled.
   */
  function checkForCancelledStatus(Types.SRInfo memory _srInfo) internal pure {
    if (_srInfo.status == Types.Status.CANCELLED) {
      revert Errors.SRAccessDenied({
        srId: _srInfo.requestId,
        message: "SR is already cancelled"
      });
    }
  }

  /**
   * @dev Verifies that the caller is the rightful owner of a service request.
   * @param _requestId The ID of the service request.
   * @param uid The expected owner's user ID.
   * @notice Reverts with an SRAccessDenied error if the caller is not the rightful owner.
   */
  function checkForRightOwner(uint256 _requestId, address uid) internal view {
    if (msg.sender != uid) {
      revert Errors.SRAccessDenied({
        srId: _requestId,
        message: "You are not authorized"
      });
    }
  }

  /**
   * @dev Updates the status of a service request stored in an array.
   * @param srInfos Array of service request info structures.
   * @param index Index of the service request in the array to be updated.
   * @param _newStatus New status to set for the service request.
   * @notice Emits an SRStatusUpdated event upon successful status update.
   */
  function updateSRObjectStatus(
    Types.SRInfo[] storage srInfos,
    uint256 index,
    Types.Status _newStatus
  ) internal {
    srInfos[index].status = _newStatus;
    emit Events.SRStatusUpdated(srInfos[index], "SR updated");
  }

  /**
   * @dev Checks for a valid transition between service request statuses.
   * @param current Current status of the service request.
   * @param next Desired next status.
   * @param _requestId ID of the service request undergoing status transition.
   * @notice Reverts with an SRAccessDenied error if the transition is not permitted.
   */
  function requireValidTransition(
    Types.Status current,
    Types.Status next,
    uint256 _requestId
  ) internal pure {
    bool validTransition = (current == Types.Status.READY_FOR_PICKUP &&
      next == Types.Status.PARCEL_PICKED_UP) ||
      (current == Types.Status.PARCEL_PICKED_UP &&
        next == Types.Status.IN_TRANSIT) ||
      (current == Types.Status.IN_TRANSIT && next == Types.Status.DELIVERED);

    if (!validTransition) {
      revert Errors.SRAccessDenied(
        _requestId,
        "Not the right status to update"
      );
    }
  }
}
