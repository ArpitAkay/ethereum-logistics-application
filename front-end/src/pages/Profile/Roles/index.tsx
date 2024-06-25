import { useCallback, useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  actOnRoleRequest,
  cancelRoleRequest,
  fetchRoles,
  requestNewRole,
} from "../../../store/users/user.reducer";
import { AppDispatch } from "../../../store";
import {
  getCurrentRole,
  getUserProfile,
  getUserRoles,
  isProfileUpdating,
} from "../../../store/users/user.selector";
import { CONSTANTS, REQUEST_STATUS_MAP, UserRoleKeys } from "../../../constants";
import { ERequestStatus, EUserRole } from "../../../repository/enum";
import {
  CheckIcon,
  ClipboardDocumentListIcon,
  NoSymbolIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";
import { Dialog, DialogPanel, DialogTitle, Transition, TransitionChild } from "@headlessui/react";
import { IRoleRequest } from "../../../repository/interfaces";
import { showToast } from "../../../services/toast";

const roleIdOptions = UserRoleKeys.filter(
  (roleId) => ![EUserRole.None, EUserRole.Admin].includes(roleId)
);

const getAllowwedAction = (
  userId: string,
  userRole: EUserRole,
  roleRequest: IRoleRequest
): { canApprove: boolean; canWithdraw: boolean } => {
  const _state = { canApprove: false, canWithdraw: false };
  if (userRole === EUserRole.Admin) return { canApprove: true, canWithdraw: false };
  else if (userRole === EUserRole.Shipper && roleRequest.requestedRole === EUserRole.Shipper) {
    _state.canApprove = true;
  } else if (userRole === EUserRole.Receiver && roleRequest.requestedRole === EUserRole.Receiver) {
    _state.canApprove = true;
  } else if (userRole === EUserRole.Driver && roleRequest.requestedRole === EUserRole.Driver) {
    _state.canApprove = true;
  }
  if (userId === roleRequest.applicantUID) {
    _state.canApprove = false;
    _state.canWithdraw = true;
  }
  return _state;
};

const Roles = () => {
  const dispatch: AppDispatch = useDispatch();
  const user = useSelector(getUserProfile);
  const currentRole = useSelector(getCurrentRole);
  const roles = useSelector(getUserRoles);
  const profileUpdating = useSelector(isProfileUpdating);
  const [selectedRole, setSelectedRole] = useState(EUserRole.Shipper);

  const [canRequestPopup, setCanRequestPopup] = useState({
    role: {} as IRoleRequest | undefined,
    show: false,
  });

  const activeRoles = useMemo(
    () =>
      roles.filter((role) =>
        [ERequestStatus.Approved, ERequestStatus.Pending].includes(role.requestStatus)
      ),
    [currentRole, roles]
  );
  const activeRoleIds = useMemo(() => activeRoles.map((role) => role.requestedRole), [activeRoles]);

  const isRoleAlreadyAvailable = useMemo(
    () => activeRoleIds.includes(selectedRole),
    [activeRoleIds, selectedRole]
  );

  const disableSubmitButton = useMemo(
    () => isRoleAlreadyAvailable || profileUpdating,
    [profileUpdating, isRoleAlreadyAvailable]
  );

  const handleRoleRequest = (roleId: EUserRole) => {
    const isAlreadyRequested = roles.some(
      (role) => role.requestedRole === roleId && role.requestStatus !== ERequestStatus.Rejected
    );

    if (isAlreadyRequested) showToast(CONSTANTS.ROLE_ALREADY_REQUESTED, { type: "error" });
    else dispatch(requestNewRole(roleId));
  };

  const allRolesFilled = useMemo(
    () => roleIdOptions.every((roleId) => activeRoleIds.includes(roleId)),
    [roleIdOptions, activeRoleIds]
  );

  const handleCancelRoleRequest = async () => {
    setCanRequestPopup({ ...canRequestPopup, show: false });
    dispatch(cancelRoleRequest(canRequestPopup.role?.requestId as never));
  };

  const handleRequestApproval = (reqId: number, approve: boolean) => {
    dispatch(actOnRoleRequest({ reqId: reqId, approve: approve }));
  };

  useEffect(() => {
    dispatch(fetchRoles());
  }, [user]);

  const renderCurrentRoles = useCallback(
    () => (
      <>
        <span className="text-2xl font-['DarkerGrotesque-Bold'] ml-2 italic">Current Roles</span>
        <div className="mx-2">
          <table className="w-full divide-y border divide-gray-200 mt-2 mb-5">
            <thead className="bg-gray-800">
              <tr>
                <th
                  scope="col"
                  className="px-4 py-3 text-left text-xs font-medium text-white uppercase tracking-wider"
                >
                  Sr. No.
                </th>
                <th
                  scope="col"
                  className="px-4 py-3 text-left text-xs font-medium text-white uppercase tracking-wider"
                >
                  Role
                </th>
                <th
                  scope="col"
                  className="px-4 py-3 text-left text-xs font-medium text-white uppercase tracking-wider"
                >
                  Status
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {roles.map((role, index) => {
                const actions = getAllowwedAction(user.uid, currentRole, role);
                return (
                  <tr key={index}>
                    <td className="px-4 py-4 whitespace-nowrap">{role.requestId}</td>
                    <td className="px-4 py-4 whitespace-nowrap">{EUserRole[role.requestedRole]}</td>
                    <td className="flex items-center px-4 py-4 whitespace-nowrap">
                      <span
                        className="text-bold"
                        style={{ color: REQUEST_STATUS_MAP[role.requestStatus] }}
                      >
                        {ERequestStatus[role.requestStatus]}
                      </span>

                      {role.requestStatus === ERequestStatus.Pending && (
                        <div
                          className="flex gap-2 items-center pl-4 ml-auto"
                          onClick={() => {
                            if (
                              user.uid === role.applicantUID &&
                              role.requestStatus === ERequestStatus.Pending
                            ) {
                              setCanRequestPopup({ show: true, role: role });
                            }
                          }}
                        >
                          {actions.canApprove && (
                            <>
                              <div
                                className="p-1 rounded-lg bg-red-50 border border-red-200 hover:bg-red-100"
                                onClick={() => handleRequestApproval(role.requestId, false)}
                              >
                                <XMarkIcon className="w-5 h-5 ml-auto text-red-500 stroke-2" />
                              </div>
                              <div
                                className="p-1 rounded-lg bg-green-50 border border-green-200 hover:bg-green-100"
                                onClick={() => handleRequestApproval(role.requestId, true)}
                              >
                                <CheckIcon className="w-5 h-5 ml-auto text-green-500 stroke-2" />
                              </div>
                            </>
                          )}
                          {actions.canWithdraw && (
                            <div className="p-1 rounded-lg bg-red-50 border border-red-200 hover:bg-red-100">
                              <NoSymbolIcon className="w-5 h-5 ml-auto text-red-500 stroke-2" />
                            </div>
                          )}
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </>
    ),
    [roles]
  );

  return (
    <>
      <div className="border h-fit w-full md:w-full lg:w-2/5 mx-auto rounded-md">
        <div className="flex h-24 bg-gray-200 items-center pl-5">
          <h2 className="text-teal-800 text-2xl font-['PoetsenOne']">Manage Roles</h2>
        </div>
        <div className="">
          {roles.length > 0 ? renderCurrentRoles() : null}

          {allRolesFilled ? (
            <div className="mx-2 my-2 bg-gray-100 p-2 rounded-lg mb-2 text-center border">
              You have all available roles!
            </div>
          ) : (
            <div className="mx-2 my-2 bg-gray-100 p-2 rounded-lg mb-2 border">
              <span className="text-2xl font-['DarkerGrotesque-Bold'] italic">
                Want other role?
              </span>
              <div className="mt-3">
                <label className="block mb-1 text-sm font-medium text-gray-900 dark:text-white">
                  Select a new Role
                </label>
                <select
                  name="role"
                  value={selectedRole}
                  onChange={(e) => setSelectedRole(Number(e.currentTarget.value))}
                  className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
                >
                  {roleIdOptions.map((roleId) => {
                    return (
                      <option key={roleId} value={roleId} disabled={activeRoleIds.includes(roleId)}>
                        {EUserRole[roleId]}
                      </option>
                    );
                  })}
                </select>
              </div>
              <div className="flex justify-end mt-4">
                <button
                  type="submit"
                  disabled={disableSubmitButton}
                  onClick={() => handleRoleRequest(selectedRole)}
                  className={`text-white ${
                    disableSubmitButton ? "bg-gray-400" : "bg-teal-700"
                  } hover:${
                    disableSubmitButton ? "bg-gray-700" : "bg-teal-800"
                  } focus:ring-4 focus:outline-none focus:${
                    disableSubmitButton ? "bg-gray-700" : "ring-teal-300"
                  } font-medium rounded-lg text-sm w-full sm:w-auto px-5 py-2.5 text-center flex`}
                >
                  {profileUpdating ? "Submitting..." : "Submit"}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      <Transition show={canRequestPopup.show}>
        <Dialog
          className="relative z-10"
          onClose={() => setCanRequestPopup({ ...canRequestPopup, show: false })}
        >
          <TransitionChild
            enter="ease-out duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" />
          </TransitionChild>

          <div className="fixed inset-0 z-10 w-screen overflow-y-auto">
            <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
              <TransitionChild
                enter="ease-out duration-300"
                enterFrom="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
                enterTo="opacity-100 translate-y-0 sm:scale-100"
                leave="ease-in duration-200"
                leaveFrom="opacity-100 translate-y-0 sm:scale-100"
                leaveTo="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
              >
                <DialogPanel className="relative transform overflow-hidden rounded-lg bg-white text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-lg pb-4">
                  <div className="bg-white px-4 sm:px-6 pt-6 sm:pt-6 pb-2">
                    <div className="flex sm:flex items-center mb-8">
                      <div className="mx-auto flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-green-100 sm:mx-0 sm:h-10 sm:w-10">
                        <ClipboardDocumentListIcon
                          className="h-6 w-6 text-green-400"
                          aria-hidden="true"
                        />
                      </div>
                      <div>
                        <DialogTitle
                          as="h3"
                          className="text-base ml-2 font-base leading-6 text-gray-900"
                        >
                          Are you sure you want to withdraw
                          <span className="font-bold">
                            {" "}
                            '{EUserRole[canRequestPopup.role?.requestedRole as never]}'{" "}
                          </span>
                          role request?
                        </DialogTitle>
                      </div>
                      <div className="ml-auto cursor-pointer self-start">
                        <XMarkIcon
                          className="h-6 w-6 text-red-500 hover:text-red-400"
                          onClick={() => setCanRequestPopup({ ...canRequestPopup, show: false })}
                        />
                      </div>
                    </div>

                    <div className="flex justify-end">
                      <button
                        className={`ml-3 text-white items-center bg-gray-400 disabled:bg-gray-700 hover:bg-gray-500 focus:ring-4 focus:outline-none focus:ring-teal-300 font-medium rounded-lg text-sm w-full sm:w-auto px-5 text-center flex py-2`}
                        onClick={() => setCanRequestPopup({ ...canRequestPopup, show: false })}
                      >
                        Cancel
                      </button>
                      <button
                        className={`ml-3 text-white items-center bg-red-700 disabled:bg-gray-700 hover:bg-red-900 focus:ring-4 focus:outline-none focus:ring-teal-300 font-medium rounded-lg text-sm w-full sm:w-auto px-5 text-center flex py-2`}
                        onClick={handleCancelRoleRequest}
                      >
                        Proceed
                      </button>
                    </div>
                  </div>
                </DialogPanel>
              </TransitionChild>
            </div>
          </div>
        </Dialog>
      </Transition>
    </>
  );
};

export default Roles;
