import { ERequestStatus, EUserRole, EStatus, EDisputeWinner } from "./enum";

// Interfaces
export interface IRoleRequest {
  requestId: number;
  applicantUID: string;
  requestedRole: EUserRole;
  requestStatus: ERequestStatus;
  approverUID: string;
}

export interface IUser {
  name: string;
  uid: string;
  phoneNumberWithISO: string;
  serviceGeoHash: string;
  ratingStarsInt: number;
  ratingStarsString: string;
  role: EUserRole[];
}

export interface IRoleRequestWithIndexDto {
  roleRequest: IRoleRequest;
  index: number;
}

export interface IDrivingLicenseInfo {
  name: string;
  id: string;
  image: string;
}

export interface IDriverInfo {
  driverUID: string;
  serviceFee: number;
  cargoInsuranceValue: number;
  cargoValueRefunded: boolean;
  serviceFeeRefunded: boolean;
}

export interface IVoteCount {
  driver: number;
  receiver: number;
  total: number;
}

export interface IBidInfo {
  uid: string;
  serviceFee: number;
}

export interface ISRInfo {
  requestId: number;
  description: string;
  shipperUID: string;
  receiverUID: string;
  originGeoHash: string;
  destGeoHash: string;
  cargoInsurableValue: number;
  serviceFee: number;
  requestedPickupTime: number; // timestamp epoch in seconds
  requestedDeliveryTime: number; // timestamp epoch in seconds
  auctionEndTime: number; // In Minutes
  driverUID: string;
  status: EStatus;
  disputeWinner: EDisputeWinner; // Assuming disputeWinner could be 'DRAW' | 'DRIVER' | 'RECEIVER' | ''
  bidInfo: IBidInfo;
  disputeVoteGiven: boolean;
}

export interface ISRResult {
  sr: ISRInfo;
  index: number;
}
