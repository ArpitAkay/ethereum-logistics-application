import { AppState } from "..";
import { CONSTANTS } from "../../constants";
import { getValueFromLocalStorage } from "../../services/localStorage";

export const getUserAccount = (state: AppState) => state.users.accountId;
export const getUserRoles = (state: AppState) => state.users.roles;
export const getUserProfile = (state: AppState) => state.users.userProfile;
export const getCurrentRole = (state: AppState) => {
  const savedRole = Number(parseInt(getValueFromLocalStorage(CONSTANTS.ROLE)));
  if (!isNaN(savedRole)) return savedRole;
  return state.users.currentRole;
};
export const isProfileUpdating = (state: AppState) => state.users.profileUpdating;
export const getDLInfo = (state: AppState) => state.users.dl;
