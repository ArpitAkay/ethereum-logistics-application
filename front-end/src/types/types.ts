import { ISRInfo, IUser } from "../repository/interfaces";

export type TServiceRequest = Omit<
  ISRInfo,
  "requestedPickupTime" | "requestedDeliveryTime"
> & {
  auctionWinner?: IUser;
  requestedPickupTime: string;
  requestedDeliveryTime: string;
  driverAssigned: boolean;
  shipper?: IUser;
  receiver?: IUser;
  driver?: IUser;
  totalDisputeVotes?: number;
};
