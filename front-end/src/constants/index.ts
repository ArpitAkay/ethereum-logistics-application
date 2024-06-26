import {
  ERequestStatus,
  EStatus,
  EUserRole,
  EWhomToVote,
} from "../repository/enum";

export const CONSTANTS = {
  //Localstorage Keys
  ACCOUNT_ADDRESS: "account_address",
  ROLE: "role",
  DRIVER_UID: "0x0000000000000000000000000000000000000000",
  GEOHASH_REGEX: /^[0123456789bcdefghjkmnpqrstuvwxyz]{1,12}$/,
  DL_REGEX: /^[A-Za-z0-9\- ]{5,20}$/,
  PHONE_ISO_REGEX:
    /^\+(9[976]\d|8[987530]\d|6[987]\d|5[90]\d|42\d|3[875]\d|2[98654321]\d|9[8543210]|8[6421]|6[6543210]|5[87654321]|4[987654310]|3[9643210]|2[70]|7|1)\d{1,14}$/,
  //Messages
  LOGIN_SUCCESS: "Login Successful!",
  USER_SWITCHED: "User has been switched!",
  USER_ROLE_CHANGED: "Role switched",
  LOGOUT_SUCCESS: "You have been logged out!",
  FILL_PROFILE_MSG: "Please fill your profile details!",
  ROLE_ALREADY_REQUESTED: "Selected role has already been requested.",
  SR_CREATE_SUCCESS: "A new Service Request has been created!",
  SR_UPDATE_SUCCESS: "SR has been updated!",
  SR_STATUS_UPDATED: "SR Status has been updated!",
  SR_DELETE_SUCCESS: "SR has been deleted!",
  SOMETHING_WENT_WRONG: "Something went wrong!",
  FETCH_USER_FAILED: "Could not fetch user details!",
  PROFILE_UPDATED: "Profile updated successfully!",
  BID_PLACED: "You Bid has been placed!",
  TEXT_COPIED: "Text copied!",
  PERMISSION_GEOLOCATION: "Please allow location for auto filling you geohash",
  NO_ACTIVE_DL: "You don't have any active Driving License!",

  // VALUES
  HEADER_HEIGHT: 64,
  FOOTER_HEIGHT: 48,
  PINATA_BASE_PATH: "https://ipfs.io/ipfs", // ipfs: Direct view
  IPFS_BASE_URL: "https://apricot-peaceful-marlin-15.mypinata.cloud/ipfs", // ipfs: Src url
  GEO_HASH_WEBSITE: "https://www.movable-type.co.uk/scripts/geohash.html",
};

export const DATE_FORMATS = {
  SHORT_DATE_TIME: "MMMM dd, h:mm a",
};

export const STATUS_COLOR_MAP: Record<
  EStatus,
  { id: EStatus; color: string; name: string; order: number }
> = {
  0: { id: 0, color: "#94a3b8", name: "DRAFT", order: 1 },
  1: { id: 1, color: "#f59e0b", name: "IN AUCTION", order: 3 },
  2: { id: 2, color: "#16a34a", name: "DRIVER ASSIGNED", order: 4 },
  3: { id: 3, color: "#16a34a", name: "READY FOR PICKUP", order: 5 },
  4: { id: 4, color: "#16a34a", name: "PARCEL PICKED UP", order: 6 },
  5: { id: 5, color: "#16a34a", name: "IN TRANSIT", order: 7 },
  6: { id: 6, color: "#16a34a", name: "DELIVERED", order: 8 },
  7: { id: 7, color: "#d97706", name: "CONDITIONALLY ACCEPTED", order: 9 },
  8: { id: 8, color: "#16a34a", name: "UNCONDITIONALLY ACCEPTED", order: 10 },
  9: { id: 9, color: "#e11d48", name: "CANCELLED", order: 2 },
  10: { id: 10, color: "#f73434", name: "REJECTED", order: 11 },
  11: { id: 11, color: "#16a34a", name: "DISPUTE RESOLVED", order: 2 },
};
export const STATUS_OPTIONS = Object.values(STATUS_COLOR_MAP).sort(
  (a, b) => a.order - b.order
);

export const REQUEST_STATUS_MAP: Record<ERequestStatus, string> = {
  [ERequestStatus.Approved]: "#16a34a",
  [ERequestStatus.Pending]: "#f59e0b",
  [ERequestStatus.Rejected]: "#e11d48",
};

export const UserRoleKeys = Object.keys(EUserRole)
  .slice(0, Object.values(EUserRole).length / 2)
  .map((x: string) => parseInt(x)) as never as EUserRole[];

export const WhomToVoteKeys = Object.keys(EWhomToVote)
  .slice(0, Object.values(EWhomToVote).length / 2)
  .map((x: string) => parseInt(x)) as never as EWhomToVote[];
