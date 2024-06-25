import { AppState } from "..";

export const getSRList = (state: AppState) => state.sr.serviceRequests;
export const getAuctionsList = (state: AppState) => state.sr.auctions;
export const getDisputesList = (state: AppState) => state.sr.disputes;
export const getSRDetails = (state: AppState) => state.sr.srDetails;
export const isSRDetailsVisible = (state: AppState) => state.sr.isSRDetailsVisible;
export const isCreateFormVisible = (state: AppState) => state.sr.isCreateFormVisible;
export const getSREditProps = (state: AppState) => state.sr.srEdit;
export const isFormProcessing = (state: AppState) => state.sr.isProcessing;
export const isDisputeResolutionInProgress = (state: AppState) =>
  state.sr.disputeResolutionInProgress;
