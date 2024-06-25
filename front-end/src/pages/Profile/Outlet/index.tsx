import { Link, Outlet, useLocation } from "react-router-dom";
import {
  IdentificationIcon,
  UserIcon,
  ChevronRightIcon,
  CreditCardIcon,
} from "@heroicons/react/24/outline";
import { useCallback } from "react";
import { ContentWrapper } from "../../../components/ContentWrapper";

const profileRoutes = [
  {
    label: "Personal Information",
    path: "/profile",
    prefixIcon: <IdentificationIcon className="w-5 h-5" />,
    suffixIcon: <ChevronRightIcon className="w-5 h-5 hidden sm:block" />,
  },
  {
    label: "Roles",
    path: "/profile/roles",
    prefixIcon: <UserIcon className="w-5 h-5" />,
    suffixIcon: <ChevronRightIcon className="w-5 h-5 hidden sm:block" />,
  },
  {
    label: "Driving License",
    path: "/profile/drivingLicense",
    prefixIcon: <CreditCardIcon className="w-5 h-5" />,
    suffixIcon: <ChevronRightIcon className="w-5 h-5 hidden sm:block" />,
  },
];

const SidebarOutlet = () => {
  const route = useLocation();

  const getActivePathClass = useCallback(
    (path: string) => {
      return route.pathname === path ? " bg-teal-100" : "";
    },
    [route]
  );

  return (
    <ContentWrapper className="flex flex-row">
      <div className="w-16 sm:w-80 border-r h-full">
        {profileRoutes.map((_route) => {
          return (
            <Link
              key={_route.path}
              className={`text-xl font-['DarkerGrotesque-Bold'] flex flex-row justify-between items-center pl-2 pr-2 py-4 border-b border-b-1 ${getActivePathClass(
                _route.path
              )}`}
              to={_route.path}
            >
              <div className="flex row items-center gap-4 ml-4">
                {_route.prefixIcon}
                <p className="hidden sm:block">{_route.label}</p>
              </div>
              {_route.suffixIcon}
            </Link>
          );
        })}
      </div>
      <div className="flex-1 flex px-4 py-16 overflow-scroll ">
        <Outlet />
      </div>
    </ContentWrapper>
  );
};

export default SidebarOutlet;
