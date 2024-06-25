import { useEffect, useMemo, useState } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { ethers } from "ethers";
import logo from "/assets/logo.svg";
import { useDispatch, useSelector } from "react-redux";
import { logout, setUserRole, updateUserInfo } from "../../store/users/user.reducer";
import { CONSTANTS } from "../../constants";
import { getValueFromLocalStorage } from "../../services/localStorage";
import { AppDispatch } from "../../store";
import { getCurrentRole, getUserProfile } from "../../store/users/user.selector";
import { getShortenAddress } from "../../utilities/helpers";
import { HEADER_PATHS } from "./constants";
import avatarIcon from "/assets/avatar.svg";
import { ChevronDoubleRightIcon, UserIcon, CheckIcon } from "@heroicons/react/24/outline";
import { ROUTES } from "../../router/routes";
import { shouldUserUpdateProfile } from "../../services";
import { EUserRole } from "../../repository/enum";
import { showToast } from "../../services/toast";

const Header = () => {
  const [showPopup, setshowPopup] = useState<boolean>(false);
  const dispatch: AppDispatch = useDispatch();
  const navigation = useNavigate();
  const user = useSelector(getUserProfile);
  const currentRole = useSelector(getCurrentRole);
  const forceToFillProfile = useMemo(() => shouldUserUpdateProfile(user), [user]);

  const menuItems: typeof HEADER_PATHS = useMemo(() => {
    return HEADER_PATHS.filter((item) => item.access.includes(currentRole) || item.path == "/");
  }, [user.role]);

  const onUserDetailsFillRequired = () => {
    navigation(ROUTES.profile.path, { replace: true });
  };

  const onLinkClick = (e: any, route: string) => {
    if (forceToFillProfile) {
      showToast(CONSTANTS.FILL_PROFILE_MSG, { type: "info" });
      e.preventDefault();
    } else navigation(route);
  };

  const handleAccountsChanged = (accounts: string[]) => {
    if (accounts.length > 0) {
      const newAddress = accounts[0];
      dispatch(updateUserInfo(newAddress));
    } else {
      showToast("No accounts found, Logging out!");
      dispatch(updateUserInfo(""));
    }
  };

  const connectMetamask = async () => {
    if (user.uid) return;
    try {
      const provider = new ethers.BrowserProvider((window as any)?.ethereum);
      await provider.send("eth_requestAccounts", []);
      const signer = await provider.getSigner();
      if (!signer.address) {
        showToast(`${CONSTANTS.SOMETHING_WENT_WRONG} Make sure metamask in running.`, {
          type: "error",
        });
        return;
      }
      dispatch(updateUserInfo(signer.address));
    } catch (error) {
      showToast("Error Connecting with Metamask", { type: "error" });
    }
  };

  const switchCurrentRole = (roleId: EUserRole) => {
    if (roleId !== currentRole) dispatch(setUserRole(roleId));
  };

  const processLogout = () => {
    setshowPopup(false);
    navigation(ROUTES.home.path, { replace: true });
    dispatch(logout());
    showToast(CONSTANTS.LOGOUT_SUCCESS, { type: "success" });
  };

  useEffect(() => {
    const userAccountId = getValueFromLocalStorage(CONSTANTS.ACCOUNT_ADDRESS);
    if (userAccountId && !forceToFillProfile) {
      connectMetamask();
    }
  }, []);

  useEffect(() => {
    if (shouldUserUpdateProfile(user)) {
      showToast(CONSTANTS.FILL_PROFILE_MSG, {
        toastId: CONSTANTS.FILL_PROFILE_MSG,
        type: "info",
      });
      onUserDetailsFillRequired();
    }
  }, [user]);

  useEffect(() => {
    if (window.ethereum) {
      window.ethereum.on("accountsChanged", handleAccountsChanged);
      return () => {
        window.ethereum.removeListener("accountsChanged", handleAccountsChanged);
      };
    }
  }, []);

  return (
    <header
      className="py-2 px-6 w-full fixed top-0 z-8 flex justify-between items-center border-b border-grey-900 bg-gray-50"
      style={{ height: CONSTANTS.HEADER_HEIGHT }}
    >
      <div className="flex gap-3 sm:gap-8 items-center">
        <Link
          to="/"
          onClick={(x) => onLinkClick(x, "/")}
          className="w-14 h-14 sm:w-14 sm:h-14 flex items-center mt-1"
        >
          <img src={logo} alt="Avatar" className="w-full h-auto" />
        </Link>
        {menuItems.map((item, key) => (
          <NavLink
            to={item.path}
            onClick={(x) => onLinkClick(x, item.path)}
            key={key}
            className={({ isActive }) => {
              return `font-['DarkerGrotesque-Bold'] text-xl hover:text-teal-500 ${
                isActive ? "text-teal-700" : ""
              }`;
            }}
          >
            {item.title}
          </NavLink>
        ))}
      </div>

      <div className="relative" onClick={user.uid ? () => setshowPopup(!showPopup) : undefined}>
        <button
          className="flex items-center space-x-2 focus:outline-none"
          onClick={connectMetamask}
        >
          <img src={avatarIcon} alt="Avatar" className="rounded-full w-8 h-8" />
          <span className="text-lg font-['DarkerGrotesque-Bold']">
            {user.uid ? user.name || getShortenAddress(user.uid) : "Login"}
          </span>
          <svg
            className={`h-5 w-5 text-gray-400 ${!user.uid ? "hidden" : ""}`}
            viewBox="0 0 20 20"
            fill="currentColor"
            onClick={() => setshowPopup(!showPopup)}
          >
            <path
              fillRule="evenodd"
              d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
              clipRule="evenodd"
            />
          </svg>
        </button>
        <div
          className={`absolute right-0 mt-2 w-48 bg-white rounded-md shadow-xl z-10 ${
            !showPopup && "hidden"
          }`}
        >
          <div className="border border-gray-100">
            <Link
              to="/profile"
              className="flex flex-1 items-center gap-2 px-4 py-2 hover:bg-gray-100 cursor-pointer"
              onClick={() => setshowPopup(false)}
            >
              <UserIcon className="w-4 h-4 text-teal-700" />
              <span className="flex-1 text-gray-800">Profile</span>
            </Link>

            {user.role.length > 1 && (
              <div className="w-full border-gray-200 pt-1" style={{ borderTopWidth: 0.5 }}>
                <div className="px-4 text-gray-500 text-xs">Switch Role</div>
                {user.role.map((roleId) => (
                  <div
                    key={roleId}
                    className="flex items-center gap-2 hover:bg-gray-100 cursor-pointer p-4 py-2"
                    onClick={() => switchCurrentRole(roleId)}
                  >
                    <div className="w-5">
                      {currentRole === roleId && <CheckIcon className="w-4 h-4 text-green-600" />}
                    </div>

                    {EUserRole[roleId]}
                  </div>
                ))}
              </div>
            )}

            <div
              className="flex items-center gap-2 px-4 py-2 hover:bg-gray-100 cursor-pointer border-gray-200"
              style={{ borderTopWidth: 0.5 }}
              onClick={processLogout}
            >
              <ChevronDoubleRightIcon className="w-4 h-4 text-red-600" />
              <div className="flex-1 text-gray-800">Logout</div>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
