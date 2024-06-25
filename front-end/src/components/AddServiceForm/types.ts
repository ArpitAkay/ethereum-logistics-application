import { EStatus } from "../../repository/enum";
import { ISRInfo } from "../../repository/interfaces";

export type TServiceForm = {
  open: boolean;
  onClose: (value: boolean) => void;
};

export type TSRFormParams = Omit<
  ISRInfo,
  "status" | "requestedPickupTime" | "requestedDeliveryTime"
> & { status: EStatus; requestedPickupTime: string; requestedDeliveryTime: string };
