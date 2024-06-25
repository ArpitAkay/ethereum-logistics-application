import { CONSTANTS } from "../constants";
import { EStatus, EUserRole } from "../repository/enum";
import { IUser } from "../repository/interfaces";
import { UserService } from "../repository/services/UserRoleRequest";
import { convertBigIntToString } from "../utilities/helpers";
import { getValueFromLocalStorage } from "./localStorage";
import { showToast } from "./toast";

const token =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySW5mb3JtYXRpb24iOnsiaWQiOiJiN2RkNWM2YS1iMTE2LTQ5OGMtOTBjNy1mNjNkMmMwZjYxZjIiLCJlbWFpbCI6InN1cmVzaEBnZWVreWFudHMuY29tIiwiZW1haWxfdmVyaWZpZWQiOnRydWUsInBpbl9wb2xpY3kiOnsicmVnaW9ucyI6W3siaWQiOiJGUkExIiwiZGVzaXJlZFJlcGxpY2F0aW9uQ291bnQiOjF9LHsiaWQiOiJOWUMxIiwiZGVzaXJlZFJlcGxpY2F0aW9uQ291bnQiOjF9XSwidmVyc2lvbiI6MX0sIm1mYV9lbmFibGVkIjpmYWxzZSwic3RhdHVzIjoiQUNUSVZFIn0sImF1dGhlbnRpY2F0aW9uVHlwZSI6InNjb3BlZEtleSIsInNjb3BlZEtleUtleSI6ImJmMWM2MjBiOGZmYWZlZmZmNzkwIiwic2NvcGVkS2V5U2VjcmV0IjoiMTIyZWNiZTU1OWUzM2Q4NTAzNDFiZDI1ZGVmZDFiZDUxNGE1OGY5NGE4MjJhMGUwZDM5YTcxMTAyY2NhYmQ0YiIsImlhdCI6MTcxNjk2MzIwMX0.cV5yjop-1BKRlfwBvFmyt60S-OWEzq44Q7sA45Xnh_A";

export const getUserAccountId = (): string => {
  return UserService.accountId;
};

export const getUserRoleId = () => {
  return parseInt(getValueFromLocalStorage(CONSTANTS.ROLE)) as EUserRole;
};

export const getStatusOptions = (status: EStatus, role: EUserRole) => {
  if (role === EUserRole.Shipper) {
    if (status === EStatus.DRAFT) return [EStatus.DRAFT, EStatus.READY_FOR_PICKUP];
    else if (status === EStatus.DRIVER_ASSIGNED)
      return [EStatus.DRIVER_ASSIGNED, EStatus.READY_FOR_PICKUP];
  } else if (role === EUserRole.Receiver) {
    if (status === EStatus.DELIVERED)
      return [
        EStatus.DELIVERED,
        EStatus.CONDITIONALLY_ACCEPTED,
        EStatus.UNCONDITIONALLY_ACCEPTED,
        EStatus.DISPUTE,
      ];
  } else if (role === EUserRole.Driver) {
    if (status === EStatus.READY_FOR_PICKUP)
      return [EStatus.READY_FOR_PICKUP, EStatus.PARCEL_PICKED_UP];
    else if (status === EStatus.PARCEL_PICKED_UP)
      return [EStatus.PARCEL_PICKED_UP, EStatus.IN_TRANSIT];
    else if (status === EStatus.IN_TRANSIT) return [EStatus.IN_TRANSIT, EStatus.DELIVERED];
  }
  return [];
};

export const shouldUserUpdateProfile = (user: IUser) => {
  if (user.uid && (!user.name || !user.phoneNumberWithISO || !user.serviceGeoHash)) return true;
  else return false;
};

/** Formats user data in UI compatible format */
export const mapUserResponse = (_user: IUser): IUser => {
  const user: IUser = convertBigIntToString(_user);
  return {
    ...user,
    name: user.name.trim(),
    phoneNumberWithISO: user.phoneNumberWithISO.trim(),
    uid: user.uid.trim().toLowerCase(),
  };
};

export const uploadFile = async (
  file: File
): Promise<{
  IpfsHash: string;
  PinSize: number;
  Timestamp: string;
  isDuplicate: boolean;
} | null> => {
  const formData = new FormData();
  formData.append("file", file);
  try {
    const res = await fetch("https://api.pinata.cloud/pinning/pinFileToIPFS", {
      method: "POST",
      body: formData,
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    if (!res.ok) {
      throw new Error(`HTTP error! Status: ${res.status}`);
    }
    return await res.json();
  } catch (err) {
    console.log("Error at uploadFile: ", err);
    return null;
  }
};

export const getLatLong = async () => {
  let geoLoc: GeolocationPosition | undefined = undefined;
  const geoLocPermission = await window.navigator.permissions.query({ name: "geolocation" });

  if (geoLocPermission.state === "granted" || geoLocPermission.state === "prompt") {
    window.navigator.geolocation.getCurrentPosition((gl) => {
      geoLoc = gl;
    });
  } else {
    showToast(CONSTANTS.PERMISSION_GEOLOCATION, { type: "warning" });
    return null;
  }
  await new Promise((res) => setTimeout(() => res(true), 1000));
  if (geoLoc) {
    const _gl = geoLoc as GeolocationPosition;
    return { lat: _gl.coords.latitude, long: _gl.coords.longitude };
  } else return null;
};
