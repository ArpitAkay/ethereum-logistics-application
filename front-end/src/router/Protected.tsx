import { Navigate, Outlet } from "react-router-dom";
import { EUserRole } from "../repository/enum";
import { getCurrentRole } from "../store/users/user.selector";
import { useSelector } from "react-redux";

const ProtectedRoute = ({
  children,
  accessTo,
}: {
  children: React.ReactNode;
  accessTo: Array<EUserRole>;
}) => {
  const userRole = useSelector(getCurrentRole);
  if (isNaN(userRole) || !accessTo.includes(userRole)) {
    return <Navigate to="/404" />;
  }
  return children ? children : <Outlet />;
};

export default ProtectedRoute;
