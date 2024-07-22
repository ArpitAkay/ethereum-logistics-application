import { PayloadAction, createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import { TUserStore } from "./types";
import { ACTION_CONSTANTS } from "./action";
import { convertBigIntToString } from "../../utilities/helpers";
import { UserService } from "../../repository/services/UserRoleRequest";
import { ERequestStatus, EUserRole } from "../../repository/enum";
import { IDrivingLicenseInfo, IRoleRequest, IUser } from "../../repository/interfaces";
import {
  clearStorage,
  getValueFromLocalStorage,
  saveValueToLocalStorage,
} from "../../services/localStorage";
import { CONSTANTS } from "../../constants";
import { getUserRoleId, mapUserResponse, uploadFile } from "../../services";
import { showToast } from "../../services/toast";
import { AppState } from "..";
import { resetSRData } from "../sr/sr.reducer";
import { DrivingLicenseNFTService } from "../../repository/services/DrivingLicenseNFT";

const initialState: TUserStore = {
  accountId: "",
  roles: [],
  currentRole: NaN,
  profileUpdating: false,
  userProfile: {
    uid: "",
    name: "",
    serviceGeoHash: "",
    phoneNumberWithISO: "",
    role: [],
    ratingStarsInt: 0,
    ratingStarsString: "",
  },
  dl: undefined,
};

const userService = new UserService();
const dlService = new DrivingLicenseNFTService();

export const fetchUserRoles = createAsyncThunk(ACTION_CONSTANTS.FETCH_ROLES, async () => {
  const rolesRes = await userService.getMyRequests();
  const roles: IRoleRequest[] = convertBigIntToString(rolesRes);
  return roles
    .filter((_r) => _r.requestStatus !== ERequestStatus.Rejected)
    .sort((ra, rb) => ra.requestId - rb.requestId);
});

export const fetchAllRoleRequests = createAsyncThunk(
  ACTION_CONSTANTS.FETCH_ALL_ROLE_REQUESTS,
  async (_, { dispatch }) => {
    try {
      const rolesRes = await userService.getMyRegionRequests();
      const roles: IRoleRequest[] = convertBigIntToString(rolesRes);
      const _sortedRolesRequests = roles.sort((ra, rb) => ra.requestId - rb.requestId);
      dispatch(setRoles(_sortedRolesRequests));
    } catch (e) {
      dispatch(setRoles([]));
    }
  }
);

/** Fetch all request roles based on loggedin user role */
export const fetchRoles = createAsyncThunk(
  ACTION_CONSTANTS.FETCH_USER_ROLES,
  async (_, { dispatch, getState }) => {
    const store = getState() as AppState;
    const currentRole = store.users.currentRole;
    currentRole === EUserRole.Admin ? dispatch(fetchAllRoleRequests()) : dispatch(fetchUserRoles());
  }
);

export const updateUserInfo = createAsyncThunk(
  ACTION_CONSTANTS.UPDATE_USER_INFO_ON_CHANGE,
  async (userId: string, { dispatch, getState }) => {
    try {
      const store = getState() as AppState;
      const loggedInUserId = store.users.userProfile.uid;
      const isUserSwitchOperation = loggedInUserId && loggedInUserId !== userId;
      const savedUserId = getValueFromLocalStorage(CONSTANTS.ACCOUNT_ADDRESS);

      // LOGGING OUT
      if (!userId) {
        dispatch(logout());
        return;
      }
      const _userRes = await userService.getUserDetails(userId);
      const userRes = mapUserResponse(_userRes);

      const currentRole = getUserRoleId();
      const user: IUser = convertBigIntToString(userRes);
      dispatch(
        setUserRole(
          (user.role.includes(currentRole) && currentRole) || user.role[0] || EUserRole.None
        )
      );
      saveValueToLocalStorage(CONSTANTS.ACCOUNT_ADDRESS, userId);

      // Rest SR data state
      dispatch(resetSRData());
      // Update user details in store
      dispatch(saveUser(user));

      if (isUserSwitchOperation) {
        showToast(CONSTANTS.USER_SWITCHED, { type: "success" });
      } else {
        if (savedUserId !== userId) {
          showToast(CONSTANTS.LOGIN_SUCCESS, { type: "success" });
        }
      }
    } catch (e) {
      showToast(CONSTANTS.FETCH_USER_FAILED, { type: "error" });
      dispatch(logout());
      return Promise.reject(CONSTANTS.FETCH_USER_FAILED);
    }
  }
);

export const requestNewRole = createAsyncThunk(
  ACTION_CONSTANTS.ADD_NEW_ROLE,
  async (roleId: EUserRole, { dispatch }) => {
    await userService.createNewRoleRequest(roleId);
    dispatch(fetchRoles());
  }
);

export const saveUserProfile = createAsyncThunk(
  ACTION_CONSTANTS.SAVE_USER_INFO,
  async (user: IUser) => {
    try {
      await userService.updateUserDetails(user.name, user.serviceGeoHash, user.phoneNumberWithISO);
      showToast(CONSTANTS.PROFILE_UPDATED, { type: "success" });
      return user;
    } catch (e) {
      showToast(`${CONSTANTS.SOMETHING_WENT_WRONG} Failed saving profile details.`, {
        type: "error",
      });
      return Promise.reject("Could not save profile fetails!");
    }
  }
);

export const fetchUserProfile = createAsyncThunk(
  ACTION_CONSTANTS.GET_USER_INFO,
  async (userId: string): Promise<IUser> => {
    const userRes = await userService.getUserDetails(userId);
    return mapUserResponse(userRes);
  }
);

export const cancelRoleRequest = createAsyncThunk(
  ACTION_CONSTANTS.CANCEL_ROLE_REQUEST,
  async (reqId: string) => {
    console.log("Write logic for cancel role request: ", reqId);
    // Write logic for withdrawing role request
  }
);

export const actOnRoleRequest = createAsyncThunk(
  ACTION_CONSTANTS.ACT_ON_ROLE_REQUEST,
  async (params: { reqId: number; approve: boolean }, { dispatch }) => {
    try {
      await userService.takeActionOnRoleRequests(params.reqId, params.approve);
      dispatch(fetchRoles());
    } catch (err) {
      console.log("Error at actOnRoleRequest: ", err);
    }
  }
);

// DL SERVICE
export const fetchDLInfo = createAsyncThunk(ACTION_CONSTANTS.FETCH_DL, async (_, { dispatch }) => {
  try {
    const dlToken = await dlService.getTokenId();
    if (typeof dlToken !== "number") {
      dispatch(setDLInfo(null));
      return;
    }
    const dlINfo = await dlService.getDLInfo(dlToken);
    console.log("dlINfo: ", dlINfo);
    dispatch(setDLInfo(dlINfo));
  } catch (err) {
    console.log("Error at fetchDLInfo: ", err);
  }
});

export const submitDrivingLicense = createAsyncThunk(
  ACTION_CONSTANTS.SUBMIT_DL,
  async (params: { name: string; dl: string; image: File }, { dispatch }) => {
    try {
      const res = await uploadFile(params.image);
      if (!res) throw Error("Failed uploading DL");
      await dlService.createNewDLNFT(params.name, params.dl, res.IpfsHash);
      dispatch(fetchDLInfo());
    } catch (err) {
      console.log("Error at submitDrivingLicense: ", err);
    }
  }
);

// Qmd7trxu7zmagj5Y67qvCDCAGbyQjyHYDeiUKeRk8FQLRw

const userSlice = createSlice({
  name: "users",
  initialState,
  reducers: {
    saveUser(state: TUserStore, action: PayloadAction<Partial<IUser>>) {
      const pl = action.payload;
      const nState: TUserStore = {
        ...state,
        accountId: pl.uid as string,
        userProfile: { ...state.userProfile, ...pl },
      };
      return nState;
    },
    setUserRole: (state: TUserStore, action: PayloadAction<EUserRole>) => {
      localStorage.setItem(CONSTANTS.ROLE, action?.payload?.toString() || "");
      let currentRole = state.currentRole;
      if (currentRole === 0) {
        currentRole = Number(getValueFromLocalStorage(CONSTANTS.ROLE));
      }
      if (currentRole !== action.payload) {
        showToast(`${CONSTANTS.USER_ROLE_CHANGED} to ${EUserRole[action.payload]}`, {
          type: "info",
        });
      }
      state.currentRole = action.payload;
    },
    setRoles: (state: TUserStore, action: PayloadAction<IRoleRequest[]>) => {
      state.roles = action.payload || [];
    },
    setDLInfo: (state: TUserStore, action: PayloadAction<IDrivingLicenseInfo | null>) => {
      state.dl = action.payload;
    },
    logout() {
      clearStorage();
      return initialState;
    },
  },
  extraReducers: (builder) => {
    builder.addCase(fetchUserRoles.fulfilled, (state, action: any) => {
      state.roles = action.payload;
    });
    builder.addCase(saveUserProfile.pending, (state) => {
      state.profileUpdating = true;
    });
    builder.addCase(saveUserProfile.fulfilled, (state, action) => {
      state.userProfile = { ...state.userProfile, ...action.payload };
      state.profileUpdating = false;
    });
    builder.addCase(saveUserProfile.rejected, (state) => {
      state.profileUpdating = false;
    });
    builder.addCase(requestNewRole.pending, (state) => {
      state.profileUpdating = true;
    });
    builder.addCase(requestNewRole.fulfilled, (state) => {
      state.profileUpdating = false;
    });
    builder.addCase(requestNewRole.rejected, (state) => {
      state.profileUpdating = false;
    });
    builder.addCase(fetchUserProfile.fulfilled, (state, action: any) => {
      state.userProfile = action.payload;
    });
  },
});

export const { saveUser, setUserRole, setRoles, setDLInfo, logout } = userSlice.actions;
export default userSlice.reducer;
