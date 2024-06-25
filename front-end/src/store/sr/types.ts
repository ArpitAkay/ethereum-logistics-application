import { TSRFormParams } from "../../components/AddServiceForm/types";
import { TServiceRequest } from "../../types/types";

export type TSRStore = {
  serviceRequests: Array<TServiceRequest>;
  disputes: Array<TServiceRequest>;
  auctions: Array<TServiceRequest>;
  srDetails?: TServiceRequest;
  isSRDetailsVisible: boolean;
  isProcessing: boolean;
  isCreateFormVisible: boolean;
  disputeResolutionInProgress: boolean;
  srEdit: {
    active: boolean;
    values?: TSRFormParams;
  };
};
