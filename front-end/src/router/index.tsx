import { createBrowserRouter } from "react-router-dom";
import Home from "../pages/Home";
import ServiceRequests from "../pages/ServiceRequests";
import UnauthorizedPage from "../pages/404";
import Auctions from "../pages/Auctions";
import ProtectedRoute from "./Protected";
import Disputes from "../pages/Disputes";
import Profile from "../pages/Profile";
import ProfileOutlet from "../pages/Profile/Outlet";
import Roles from "../pages/Profile/Roles";
import { EUserRole } from "../repository/enum";
import { ROUTES } from "./routes";
import DrivingLicense from "../pages/Profile/DrivingLicense";

const router = createBrowserRouter([
  {
    path: ROUTES.home.path,
    element: <Home />,
  },
  {
    path: ROUTES.dashboard.path,
    element: (
      <ProtectedRoute
        accessTo={[EUserRole.Admin, EUserRole.Driver, EUserRole.Receiver, EUserRole.Shipper]}
      >
        <ServiceRequests />
      </ProtectedRoute>
    ),
  },
  {
    path: ROUTES.auctions.path,
    element: (
      <ProtectedRoute accessTo={[EUserRole.Admin, EUserRole.Driver]}>
        <Auctions />
      </ProtectedRoute>
    ),
  },
  {
    path: ROUTES.disputes.path,
    element: (
      <ProtectedRoute
        accessTo={[EUserRole.Admin, EUserRole.Driver, EUserRole.Receiver, EUserRole.Shipper]}
      >
        <Disputes />
      </ProtectedRoute>
    ),
  },
  {
    path: ROUTES.profile.path,
    children: [
      {
        index: true,
        element: <Profile />,
      },
      {
        path: ROUTES.profile_roles.path,
        element: <Roles />,
      },
      {
        path: ROUTES.profile_dl.path,
        element: <DrivingLicense />,
      },
    ],
    element: (
      <ProtectedRoute
        accessTo={[
          EUserRole.None,
          EUserRole.Admin,
          EUserRole.Driver,
          EUserRole.Receiver,
          EUserRole.Shipper,
        ]}
      >
        <ProfileOutlet />
      </ProtectedRoute>
    ),
  },
  {
    path: ROUTES[404].path,
    element: <UnauthorizedPage />,
  },
  {
    path: "*",
    element: <UnauthorizedPage />,
  },
]);

export default router;
