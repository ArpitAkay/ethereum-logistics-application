import { PayloadAction, createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import { TSRStore } from "./types";
import { ACTION_CONSTANTS } from "./action";
import { TServiceRequest } from "../../types/types";
import {
  convertBigIntToString,
  getCurrentAuctionTime,
  getDateTimeString,
  weiToEther,
} from "../../utilities/helpers";
import { TSRFormParams } from "../../components/AddServiceForm/types";
import { ServiceRequestService } from "../../repository/services/ServiceRequest";
import { ISRInfo } from "../../repository/interfaces";
import { DisputeSRService } from "../../repository/services/DisputedServiceRequest";
import { EDisputeWinner, EStatus, EUserRole, EWhomToVote } from "../../repository/enum";
import { showToast } from "../../services/toast";
import { CONSTANTS } from "../../constants";
import { AppState } from "..";
import { UserService } from "../../repository/services/UserRoleRequest";
import { mapUserResponse } from "../../services";

const srService = new ServiceRequestService();
const userService = new UserService();
const disputeService = new DisputeSRService();

const initialState: TSRStore = {
  serviceRequests: [],
  disputes: [],
  auctions: [],
  srDetails: undefined,
  isSRDetailsVisible: false,
  isProcessing: false,
  isCreateFormVisible: false,
  disputeResolutionInProgress: false,
  srEdit: { active: false, values: undefined },
};

/** Converts SR response into UI supported */
const mapSR = (_sr: ISRInfo): TServiceRequest => {
  const sr: ISRInfo = convertBigIntToString(_sr);
  return {
    ...sr,
    requestedPickupTime: getDateTimeString(sr.requestedPickupTime),
    requestedDeliveryTime: getDateTimeString(sr.requestedDeliveryTime),
    auctionEndTime: getCurrentAuctionTime(sr.auctionEndTime * 1000),
    shipperUID: sr.shipperUID.toLowerCase(),
    receiverUID: sr.receiverUID.toLowerCase(),
    driverUID: sr.driverUID.toLowerCase(),
    cargoInsurableValue: weiToEther(sr.cargoInsurableValue),
    serviceFee: weiToEther(sr.serviceFee),
    driverAssigned: sr.driverUID !== CONSTANTS.DRIVER_UID,
    bidInfo: { ...sr.bidInfo, uid: sr.bidInfo.uid.toLowerCase() },
  };
};

const attachUsersToSR = async (sr: TServiceRequest): Promise<TServiceRequest> => {
  const shipper = await userService.getUserDetails(sr.shipperUID);
  const receiver = await userService.getUserDetails(sr.receiverUID);
  const driver = await userService.getUserDetails(sr.driverUID);
  return {
    ...sr,
    shipper: mapUserResponse(shipper),
    receiver: mapUserResponse(receiver),
    driver: mapUserResponse(driver),
  };
};

// ---- SERVICE REQUEST -------------------
export const addNewServiceRequest = createAsyncThunk(
  ACTION_CONSTANTS.ADD_NEW_SERVICE,
  async (params: ISRInfo, { dispatch, getState }) => {
    try {
      const srInfo: ISRInfo = {
        requestId: params.requestId,
        description: params.description,
        status: params.status,
        serviceFee: params.serviceFee,
        shipperUID: params.shipperUID,
        receiverUID: params.receiverUID,
        driverUID: params.driverUID,
        requestedPickupTime: new Date(params.requestedPickupTime).valueOf(),
        requestedDeliveryTime: new Date(params.requestedDeliveryTime).valueOf(),
        auctionEndTime: params.auctionEndTime,
        originGeoHash: params.originGeoHash,
        destGeoHash: params.destGeoHash,
        cargoInsurableValue: params.cargoInsurableValue,
        disputeWinner: EDisputeWinner.NONE,
        bidInfo: { uid: CONSTANTS.DRIVER_UID, serviceFee: 0 },
        disputeVoteGiven: false,
      };
      const phoneNumberWithISO = (getState() as AppState).users.userProfile.phoneNumberWithISO;
      await srService.addNewServiceRequest(srInfo, phoneNumberWithISO);
      dispatch(fetchServiceRequests());
      dispatch(hideSRCreateForm());
      showToast(CONSTANTS.SR_CREATE_SUCCESS, { type: "success" });
    } catch (err) {
      showToast(CONSTANTS.SOMETHING_WENT_WRONG, { type: "warning" });
      console.log("err", err);
    }
  }
);

export const fetchServiceRequests = createAsyncThunk(
  ACTION_CONSTANTS.FETCH_SERVICE_REQUESTS,
  async (_, { getState }) => {
    try {
      const store = getState() as AppState;
      const currentRole = store.users.currentRole;
      const srList: ISRInfo[] =
        currentRole === EUserRole.Admin
          ? await srService.getSRList()
          : await srService.getMySRList();
      const enrichedSrList = srList.map(async (sr): Promise<TServiceRequest> => {
        // Appending shipper, receiver and driver details
        return attachUsersToSR(mapSR(sr));
      });
      // Filter SRs that only belongs to the current user
      const allSRs: TServiceRequest[] = await Promise.all(enrichedSrList);
      return allSRs.sort((a, b) => b.requestId - a.requestId);
    } catch (e) {
      console.log("ERROR at fetchServiceRequests: ", e);
      return [];
    }
  }
);

export const updateSRStatus = createAsyncThunk(
  ACTION_CONSTANTS.UPDATE_SR_STATUS,
  async (params: { requestId: number; code: EStatus }, { dispatch }) => {
    try {
      await srService.updateStatus(params.requestId, params.code);
      showToast(CONSTANTS.SR_STATUS_UPDATED, { type: "success" });
      dispatch(hideSRDetails());
      dispatch(fetchServiceRequests());
    } catch (err) {
      console.log("err at updateSRStatus", err);
    }
  }
);

export const updateSR = createAsyncThunk(
  ACTION_CONSTANTS.UPDATE_SR,
  async (pl: ISRInfo, { dispatch }) => {
    try {
      await srService.editServiceRequest(
        pl.requestId,
        pl.status,
        pl.requestedPickupTime,
        pl.requestedDeliveryTime,
        pl.auctionEndTime
      );
      showToast(CONSTANTS.SR_UPDATE_SUCCESS, { type: "success" });
      dispatch(hideSRCreateForm());
      dispatch(fetchServiceRequests());
    } catch (err) {
      showToast(CONSTANTS.SOMETHING_WENT_WRONG, { type: "warning" });
      console.log("err at updateSR", err);
    }
  }
);

export const cancelSR = createAsyncThunk(
  ACTION_CONSTANTS.CANCEL_SR,
  async (requestId: number, { dispatch }) => {
    try {
      await srService.cancelServiceRequest(requestId);
      dispatch(fetchServiceRequests());
    } catch (err) {
      console.log("err at cancelSR", err);
    }
  }
);

// ---- AUCTION -------------------
export const fetchAuctions = createAsyncThunk(ACTION_CONSTANTS.FETCH_AUCTIONS, async () => {
  try {
    const _auctionsRes = await srService.getAuctionsInDriverRegion();
    const _auctionsPromises: Promise<TServiceRequest>[] = _auctionsRes.map(
      async (auction): Promise<TServiceRequest> => attachUsersToSR(mapSR(auction))
    );
    const auctions: TServiceRequest[] = await Promise.all(_auctionsPromises);
    return auctions.sort((a, b) => b.requestId - a.requestId);
  } catch (e) {
    showToast("Failed fetching auctions. Please try again!", { type: "warning" });
    return [];
  }
});

export const placeBid = createAsyncThunk(
  ACTION_CONSTANTS.PLACE_BID,
  async (params: { reqId: number; serviceFee: number; stake: number }, { dispatch }) => {
    try {
      const { reqId, serviceFee, stake } = params;
      await srService.addBidEntry(reqId, serviceFee, stake);
      showToast(CONSTANTS.BID_PLACED, { type: "success" });
      dispatch(fetchAuctions());
    } catch (err) {
      console.log("Error at placeBid", err);
    }
  }
);

export const checkAuctionWinner = createAsyncThunk(
  ACTION_CONSTANTS.CHECK_AUCTION_WINNER,
  async (reqId: number, { dispatch }) => {
    try {
      await srService.checkForAuctionWinner(reqId);
      dispatch(hideSRDetails());
      dispatch(fetchAuctions());
    } catch (err) {
      dispatch(hideSRDetails());
      showToast(CONSTANTS.SOMETHING_WENT_WRONG, { type: "error" });
      console.log("Error at checkAuctionWinner", err);
    }
  }
);

// ---- DISPUTE -------------------
export const fetchDisputes = createAsyncThunk(ACTION_CONSTANTS.FETCH_DISPUTES, async () => {
  try {
    const _disputeRes = await disputeService.getDisputesSRInDriverRegion();
    const _disputePromises: Promise<TServiceRequest>[] = _disputeRes.map(
      async (dispute): Promise<TServiceRequest> => attachUsersToSR(mapSR(dispute))
    );
    const disputes: TServiceRequest[] = await Promise.all(_disputePromises);
    return disputes.sort((a, b) => b.requestId - a.requestId);
  } catch (e) {
    showToast("Failed fetching disputes. Please try again!", { type: "warning" });
    return [];
  }
});

export const voteSRDispute = createAsyncThunk(
  ACTION_CONSTANTS.VOTE_DISPUTE,
  async (params: { reqId: number; voteTo: EWhomToVote }, { dispatch }) => {
    try {
      const { reqId, voteTo } = params;
      await disputeService.voteOnDispute(reqId, voteTo);
      dispatch(fetchDisputes());
    } catch (err) {
      console.log("Error at voteSRDispute", err);
    }
  }
);

export const checkDisputeWinner = createAsyncThunk(
  ACTION_CONSTANTS.CHECK_DISPUTE_WINNER,
  async (reqId: number, { dispatch, getState }) => {
    try {
      await srService.checkWinnerForDispute(reqId);
      dispatch(fetchDisputes());
      setTimeout(() => {
        showToast("SR status updated!", { type: "info" });
        const store = getState() as AppState;
        const dispute = store.sr.disputes.find((a) => a.requestId === reqId) as TServiceRequest;
        if (dispute) dispatch(showSRDetails(dispute));
        else dispatch(hideSRDetails());
      }, 2000);
      dispatch(setDisputeResolutionInProgress(false));
    } catch (err) {
      dispatch(setDisputeResolutionInProgress(true));
      console.log("Error at checkAuctionWinner", err);
    }
  }
);

const srSlice = createSlice({
  name: "serviceRequests",
  initialState,
  reducers: {
    showSRDetails: (state: TSRStore, action: PayloadAction<TServiceRequest>) => {
      return {
        ...state,
        srDetails: action.payload,
        isSRDetailsVisible: true,
        disputeResolutionInProgress: false,
      };
    },
    hideSRDetails: (state: TSRStore) => {
      return { ...state, srDetails: undefined, isSRDetailsVisible: false };
    },
    showSRCreateForm: (
      state: TSRStore,
      action: PayloadAction<{ editMode?: boolean; editValues?: TSRFormParams }>
    ) => {
      return {
        ...state,
        isCreateFormVisible: true,
        srEdit: {
          active: Boolean(action.payload.editMode),
          values: action.payload.editValues || undefined,
        },
      };
    },
    hideSRCreateForm: (state: TSRStore) => {
      return { ...state, isCreateFormVisible: false, srEdit: { active: false, values: undefined } };
    },
    setDisputeResolutionInProgress: (state: TSRStore, action: PayloadAction<boolean>) => {
      state.disputeResolutionInProgress = action.payload;
    },
    resetSRData: () => {
      return initialState;
    },
  },
  extraReducers: (builder) => {
    builder.addCase(fetchServiceRequests.fulfilled, (state, action: PayloadAction<any>) => {
      state.serviceRequests = action.payload;
    });
    builder.addCase(fetchAuctions.fulfilled, (state, action: PayloadAction<any>) => {
      state.auctions = action.payload;
    });
    builder.addCase(fetchDisputes.fulfilled, (state, action: PayloadAction<any>) => {
      state.disputes = action.payload;
    });
    builder.addCase(addNewServiceRequest.pending, (state) => {
      state.isProcessing = true;
    });
    builder.addCase(addNewServiceRequest.fulfilled, (state) => {
      state.isProcessing = false;
    });
  },
});

export const {
  showSRDetails,
  hideSRDetails,
  showSRCreateForm,
  hideSRCreateForm,
  resetSRData,
  setDisputeResolutionInProgress,
} = srSlice.actions;
export default srSlice.reducer;
