import { FC, Fragment, useMemo, useRef } from "react";
import { Dialog, DialogPanel, DialogTitle, Transition, TransitionChild } from "@headlessui/react";
import {
  CircleStackIcon,
  ClipboardDocumentListIcon,
  InformationCircleIcon,
  PhoneArrowUpRightIcon,
  UsersIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";
import { format } from "date-fns";
import { TServiceDetails } from "./types";
import { useDispatch, useSelector } from "react-redux";
import { getSRDetails, isDisputeResolutionInProgress } from "../../store/sr/sr.selector";
import { CONSTANTS, DATE_FORMATS, STATUS_COLOR_MAP, STATUS_OPTIONS } from "../../constants";
import { checkAuctionWinner, checkDisputeWinner, updateSRStatus } from "../../store/sr/sr.reducer";
import { AppDispatch } from "../../store";
import { getValueFromLocalStorage } from "../../services/localStorage";
import { EDisputeWinner, EStatus, EUserRole } from "../../repository/enum";
import { TServiceRequest } from "../../types/types";
import { getStatusOptions } from "../../services";
import { useCountDownTimer } from "../../hooks/useCountDownTimer";
import { IUser } from "../../repository/interfaces";
import Tooltip from "../Tooltip";

const ServiceDetails: FC<TServiceDetails> = (props) => {
  const { open, onClose } = props;
  const initalInputRef = useRef<HTMLInputElement>(null);
  const sr = useSelector(getSRDetails) as TServiceRequest;
  const dispatch: AppDispatch = useDispatch();
  const isDisputeInProgress = useSelector(isDisputeResolutionInProgress);
  const userRole: EUserRole | null = useMemo(() => {
    const userAccountAddress = getValueFromLocalStorage(CONSTANTS.ACCOUNT_ADDRESS).toLowerCase();
    if (userAccountAddress === sr?.shipperUID.toLowerCase()) return EUserRole.Shipper;
    else if (userAccountAddress === sr?.receiverUID.toLowerCase()) return EUserRole.Receiver;
    else if (userAccountAddress === sr?.driverUID.toLowerCase()) return EUserRole.Driver;
    else return null;
  }, [sr?.driverUID, sr?.receiverUID, sr?.shipperUID]);

  const disputeWinner: IUser | null = useMemo(() => {
    if (sr?.disputeWinner === EDisputeWinner.DRIVER) return sr?.driver as IUser;
    if (sr?.disputeWinner === EDisputeWinner.RECEIVER) return sr?.receiver as IUser;
    else return null;
  }, [sr?.disputeWinner]);

  const shouldShowCheckWinnerButton = useMemo(() => {
    return (
      sr?.status !== EStatus.DRAFT &&
      (sr?.status === EStatus.READY_FOR_AUCTION || sr?.status === EStatus.DISPUTE)
    );
  }, [sr?.status]);

  const auctionTimedOut = useCountDownTimer(sr?.auctionEndTime * 60);

  const canCheckForWinner = useMemo(() => {
    if (sr?.status === EStatus.DRAFT) return false;
    return !(sr?.status === EStatus.READY_FOR_AUCTION
      ? !auctionTimedOut
      : sr?.status === EStatus.DISPUTE
      ? false
      : true);
  }, [sr?.status, auctionTimedOut]);

  const allowedStatusOptions = useMemo(
    () => getStatusOptions(sr?.status as EStatus, userRole as EUserRole),
    [sr?.status, userRole]
  );

  const onStatusChange = (updatedStatus: EStatus) => {
    dispatch(updateSRStatus({ requestId: sr?.requestId, code: Number(updatedStatus) }));
  };

  const handleCheckWinner = () => {
    if (sr?.status === EStatus.READY_FOR_AUCTION) {
      dispatch(checkAuctionWinner(sr?.requestId));
    } else if (sr?.status === EStatus.DISPUTE) {
      dispatch(checkDisputeWinner(sr?.requestId));
    }
  };

  return (
    <Transition show={open} as={Fragment}>
      <Dialog className="relative z-10" initialFocus={initalInputRef} onClose={() => {}}>
        <TransitionChild
          as={Fragment}
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
          <div className="flex min-h-full items-center justify-center p-4 text-center sm:items-center sm:p-0">
            <TransitionChild
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
              enterTo="opacity-100 translate-y-0 sm:scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 translate-y-0 sm:scale-100"
              leaveTo="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
            >
              <DialogPanel className="h-auto transform overflow-hidden rounded-lg bg-white text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-xl">
                <div className="bg-white">
                  <div className="flex sm:flex items-center px-6 py-4 bg-teal-600">
                    <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-gray-100 sm:mx-0 sm:h-10 sm:w-10">
                      <ClipboardDocumentListIcon className="w-6 h-6 text-teal-600 stroke-2" />
                    </div>
                    <div className="flex-1 ml-4">
                      <DialogTitle className="text-xl font-semibold leading-6 text-gray-100">
                        Service Request
                      </DialogTitle>
                    </div>

                    <div className="ml-auto cursor-pointer">
                      <XMarkIcon
                        className="h-6 w-6 text-gray-200 stroke-2"
                        onClick={() => onClose(false)}
                      />
                    </div>
                  </div>

                  <div
                    className="overflow-scroll text-center sm:mt-0 sm:text-left pb-8 self-center"
                    style={{ height: "80vh" }}
                  >
                    <div className="w-full">
                      <div className="">
                        <BlockHeader
                          label="Order Details"
                          prefixIcon={
                            <InformationCircleIcon
                              className="h-6 w-6 text-teal-600 "
                              aria-hidden="true"
                            />
                          }
                        />
                        <div className="px-8 py-4">
                          <div className="mb-2 flex items-center">
                            <label className="block min-w-16 text-black text-left text-base font-light">
                              Id
                            </label>
                            <label> : </label>
                            <span className="ml-2 text-gray-900 text-base">#{sr?.requestId}</span>
                          </div>

                          <div className="mb-2 flex items-start sm:items-center">
                            <label className="block min-w-16 text-black text-left text-base font-light">
                              Status
                            </label>
                            <label className=""> : </label>

                            <div className="flex flex-0 sm:flex-1 flex-col sm:flex-row flex-wrap">
                              <div
                                className="ml-2 flex items-center"
                                style={{ color: STATUS_COLOR_MAP[sr?.status as EStatus]?.color }}
                              >
                                <div
                                  className="bg-white w-4 h-4 mr-2 rounded-full border-2"
                                  style={{
                                    borderColor: STATUS_COLOR_MAP[sr?.status]?.color,
                                  }}
                                />
                                {STATUS_COLOR_MAP[sr?.status as EStatus]?.name}
                                {sr?.status !== EStatus.DISPUTE_RESOLVED}
                              </div>
                              {allowedStatusOptions.length > 0 ? (
                                <select
                                  onChange={(e) => onStatusChange(e.target.value as never)}
                                  name="status"
                                  className="block max-w-56 px-2 py-2 bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg ml-2 mt-2 sm:ml-auto sm:mt-0"
                                >
                                  {STATUS_OPTIONS.map((opt) => {
                                    return (
                                      <option
                                        key={opt.id}
                                        value={opt.id}
                                        disabled={!allowedStatusOptions.includes(opt.id)}
                                      >
                                        {opt?.name}
                                      </option>
                                    );
                                  })}
                                </select>
                              ) : (
                                shouldShowCheckWinnerButton && (
                                  <>
                                    <Tooltip
                                      id="voting_active"
                                      hintText="Voting window is still open."
                                      className="ml-2 mt-2 sm:ml-auto sm:mt-0"
                                      disabled={canCheckForWinner}
                                    >
                                      <button
                                        disabled={!canCheckForWinner || isDisputeInProgress}
                                        className="block max-w-56 px-3 py-1 bg-teal-600 border text-white text-sm rounded-md  hover:bg-teal-700 disabled:bg-gray-300 ml-2 mt-2 sm:ml-auto sm:mt-0"
                                        onClick={handleCheckWinner}
                                      >
                                        Check winner
                                      </button>
                                    </Tooltip>
                                  </>
                                )
                              )}
                            </div>
                          </div>

                          {isDisputeInProgress && (
                            <div className="ml-auto text-right text-orange-400">
                              Dispute voting is still in progress
                            </div>
                          )}

                          {sr?.status === EStatus.DISPUTE_RESOLVED && (
                            <div className="mb-2 flex items-start sm:items-center">
                              <label className="block min-w-16 text-black text-left text-base font-light" />
                              <div className="ml-3 text-left font-medium break-all">
                                {disputeWinner ? (
                                  <>
                                    <p className="text-teal-700">
                                      Dispute won by {disputeWinner?.name}
                                    </p>
                                    <p className="text-xs text-gray-400">{disputeWinner?.uid}</p>
                                  </>
                                ) : (
                                  <p className="text-teal-700">Dispute resulted as a DRAW</p>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>

                      <div>
                        <BlockHeader
                          label="Customer Details"
                          prefixIcon={<UsersIcon className="w-6 h-6 text-teal-600" />}
                        />
                        <div className="px-8 py-4">
                          <LabelValue
                            label="Shipper"
                            value={sr?.shipper?.name}
                            subValues={[<div>{sr?.shipper?.uid}</div>]}
                            suffixItem={
                              <a
                                className="self-center"
                                href={`tel:${sr?.shipper?.phoneNumberWithISO}`}
                              >
                                <Tooltip id="call-shipper" hintText={"Call Shipper"}>
                                  <PhoneArrowUpRightIcon className="w-4 h-4 text-teal-600" />
                                </Tooltip>
                              </a>
                            }
                          />
                          <LabelValue
                            label="Receiver"
                            value={sr?.receiver?.name}
                            subValues={[<div>{sr?.receiver?.uid}</div>]}
                            suffixItem={
                              <a
                                className="self-center"
                                href={`tel:${sr?.receiver?.phoneNumberWithISO}`}
                              >
                                <Tooltip id="call-receiver" hintText={"Call Receiver"}>
                                  <PhoneArrowUpRightIcon className="w-4 h-4 text-teal-600" />
                                </Tooltip>
                              </a>
                            }
                          />
                          <LabelValue
                            label="Driver"
                            value={
                              sr?.driver?.uid === CONSTANTS.DRIVER_UID ? "NA" : sr?.driver?.name
                            }
                            subValues={[
                              sr?.driver?.uid === CONSTANTS.DRIVER_UID ? null : (
                                <div>{sr?.driver?.uid}</div>
                              ),
                            ]}
                            suffixItem={
                              sr?.driver?.uid === CONSTANTS.DRIVER_UID ? null : (
                                <a
                                  className="self-center"
                                  href={`tel:${sr?.driver?.phoneNumberWithISO}`}
                                >
                                  <Tooltip id="call-driver" hintText={"Call Driver"}>
                                    <PhoneArrowUpRightIcon className="w-4 h-4 text-teal-600" />
                                  </Tooltip>
                                </a>
                              )
                            }
                          />
                        </div>
                      </div>

                      <div>
                        <BlockHeader
                          label="Miscellaneous"
                          prefixIcon={<CircleStackIcon className="w-6 h-6 text-teal-600" />}
                        />
                        <div className="px-8 py-4">
                          <LabelValue label="Pickup location" value={sr?.destGeoHash} />
                          <LabelValue label="Drop location" value={sr?.originGeoHash} />
                          <LabelValue
                            label="Requested pickup time"
                            value={format(sr?.requestedPickupTime, DATE_FORMATS.SHORT_DATE_TIME)}
                          />
                          <LabelValue
                            label="Requested delivery time"
                            value={format(sr?.requestedDeliveryTime, DATE_FORMATS.SHORT_DATE_TIME)}
                          />
                          <LabelValue
                            label="Auction end time"
                            value={format(sr?.auctionEndTime, DATE_FORMATS.SHORT_DATE_TIME)}
                          />
                        </div>
                      </div>

                      <div>
                        <BlockHeader
                          label="Invoice"
                          prefixIcon={
                            <ClipboardDocumentListIcon className="w-6 h-6 text-teal-600" />
                          }
                        />

                        <div className="px-8 py-2">
                          <LabelValue
                            label="Cargo Insured value"
                            value={`${sr?.cargoInsurableValue} ETH`}
                          />
                          <LabelValue label="Service fee" value={`${sr?.serviceFee} ETH`} />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </DialogPanel>
            </TransitionChild>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
};

export default ServiceDetails;

const BlockHeader = (props: { label: string; prefixIcon?: any }) => {
  return (
    <h1 className="flex gap-2 items-center px-4 py-2 pt-3 bg-gray-100 text-lg font-medium ">
      {props.prefixIcon}
      {props.label}
    </h1>
  );
};
const LabelValue = (props: {
  label: string;
  value?: string;
  subValues?: any[];
  suffixItem?: any;
}) => {
  return (
    <div className="mb-2 flex items-start">
      <label className="text-left block flex-1 text-black text-base font-light">
        {props.label}
      </label>
      <span className="flex items-start text-left flex-1 ml-2 text-gray-900 text-base">
        <div>
          {props.value}
          {Array.isArray(props.subValues) &&
            props.subValues.map((vText, index) => (
              <div
                key={index}
                className="flex-1 italic text-gray-500 text-xs w-5/6"
                style={{ wordBreak: "break-all" }}
              >
                {vText}
              </div>
            ))}
        </div>
        {props.suffixItem}
      </span>
    </div>
  );
};
