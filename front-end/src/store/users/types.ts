import { EUserRole } from "../../repository/enum";
import { IDrivingLicenseInfo, IRoleRequest, IUser } from "../../repository/interfaces";

export type TUserStore = {
  accountId: string;
  roles: IRoleRequest[];
  currentRole: EUserRole;
  profileUpdating: boolean;
  userProfile: IUser;
  dl?: IDrivingLicenseInfo | null;
};
