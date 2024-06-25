// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

import "./Types.sol";

/**
 * @title Refund Library
 * @author Suresh Konakanchi
 * @dev Handles refund and payment transactions related to cargo insurance and service fees in a logistics application.
 */
library Refund {
  /**
   * @notice Refunds cargo insurance value to all drivers except the winner.
   * @dev Iterates over all bidders for a particular service request and refunds the cargo insurance value to those who did not win.
   * @param peopleWhoAlreadyBidded Mapping from request IDs to arrays of DriverInfo, tracking all bidders.
   * @param _requestId The ID of the service request being processed.
   * @param _winnerAddress Address of the winning driver, who should not receive a refund.
   */
  function cargoValueToDriversExceptWinner(
    mapping(uint256 => Types.DriverInfo[]) storage peopleWhoAlreadyBidded,
    uint256 _requestId,
    address _winnerAddress
  ) internal {
    Types.DriverInfo[]
      memory driversWhoBiddedForServiceRequest = peopleWhoAlreadyBidded[
        _requestId
      ];

    for (uint256 i = 0; i < driversWhoBiddedForServiceRequest.length; i++) {
      if (
        !driversWhoBiddedForServiceRequest[i].cargoValueRefunded &&
        driversWhoBiddedForServiceRequest[i].driverUID != _winnerAddress
      ) {
        uint256 cargoValue = driversWhoBiddedForServiceRequest[i]
          .cargoInsuranceValue;
        if (
          address(this).balance >= cargoValue &&
          driversWhoBiddedForServiceRequest[i].driverUID != address(0)
        ) {
          peopleWhoAlreadyBidded[_requestId][i].cargoValueRefunded = true;
          payable(driversWhoBiddedForServiceRequest[i].driverUID).transfer(
            cargoValue
          );
        }
      }
    }
  }

  /**
   * @notice Refunds the cargo insurance value to the winning driver.
   * @param winnerInfo Mapping from request IDs to DriverInfo, specifically for tracking the winner's info.
   * @param _requestId The ID of the service request.
   */
  function cargoValueToWinningDriver(
    mapping(uint256 => Types.DriverInfo) storage winnerInfo,
    uint256 _requestId
  ) internal {
    Types.DriverInfo memory winnerDriverInfo = winnerInfo[_requestId];

    if (!winnerDriverInfo.cargoValueRefunded) {
      if (
        address(this).balance >= winnerDriverInfo.cargoInsuranceValue &&
        winnerDriverInfo.driverUID != address(0)
      ) {
        winnerInfo[_requestId].cargoValueRefunded = true;
        payable(winnerDriverInfo.driverUID).transfer(
          winnerDriverInfo.cargoInsuranceValue
        );
      }
    }
  }

  /**
   * @notice Transfers the service fee to the winning driver and any remaining difference back to the shipper.
   * @param winnerInfo Mapping from request IDs to DriverInfo for the winning drivers.
   * @param _srInfo The service request information.
   */
  function serviceFeeToShipperAndWinningDriver(
    mapping(uint256 => Types.DriverInfo) storage winnerInfo,
    Types.SRInfo memory _srInfo
  ) internal {
    Types.DriverInfo memory winnerDriverInfo = winnerInfo[_srInfo.requestId];

    if (
      address(this).balance >= _srInfo.serviceFee &&
      !winnerDriverInfo.serviceFeeRefunded
    ) {
      winnerInfo[_srInfo.requestId].serviceFeeRefunded = true;
      if (winnerDriverInfo.driverUID != address(0)) {
        payable(winnerDriverInfo.driverUID).transfer(
          winnerDriverInfo.serviceFee
        );
      }
      if (
        _srInfo.serviceFee - winnerDriverInfo.serviceFee > 0 &&
        _srInfo.shipperUID != address(0)
      ) {
        payable(_srInfo.shipperUID).transfer(
          _srInfo.serviceFee - winnerDriverInfo.serviceFee
        );
      }
    }
  }

  /**
   * @notice Refunds the cargo insurance value to the receiver if the driver is found guilty in a dispute.
   * @param _receiverAddr Address of the receiver to whom the refund should be made.
   * @param _cargoValue The amount of cargo insurance to be refunded.
   * @dev Dispute Contract will call this function
   */
  function refundCargoValueToReceiver(
    address _receiverAddr,
    uint256 _cargoValue
  ) internal {
    if (address(this).balance >= _cargoValue && _receiverAddr != address(0)) {
      payable(_receiverAddr).transfer(_cargoValue);
    }
  }

  /**
   * @notice Refunds the service fee to the shipper if the driver is found guilty in a dispute.
   * @param shipperUID Address of the shipper to whom the service fee should be refunded.
   * @param serviceFee The amount of the service fee to be refunded.
   */
  function serviceFeeToShipper(
    address shipperUID,
    uint256 serviceFee
  ) internal {
    if (address(this).balance >= serviceFee && shipperUID != address(0)) {
      payable(shipperUID).transfer(serviceFee);
    }
  }
}
