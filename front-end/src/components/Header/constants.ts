import { EUserRole } from "../../repository/enum";
import { ROUTES } from "../../router/routes";

export const HEADER_PATHS = [
  {
    title: "Dashboard",
    path: ROUTES.dashboard.path,
    access: [EUserRole.Admin, EUserRole.Shipper, EUserRole.Receiver, EUserRole.Driver],
  },
  {
    title: "Auctions",
    path: ROUTES.auctions.path,
    access: [EUserRole.Admin, EUserRole.Driver],
  },
  {
    title: "Disputes",
    path: ROUTES.disputes.path,
    access: [EUserRole.Admin, EUserRole.Shipper, EUserRole.Receiver, EUserRole.Driver],
  },
];
