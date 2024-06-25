import { format } from "date-fns";
import sparkImage from "/assets/spark.svg";
import arrowUp from "/assets/arrow_up.svg";
import arrowDown from "/assets/arrow_down.svg";
import { TServiceRequest } from "../../types/types";
import { DATE_FORMATS, STATUS_COLOR_MAP, WhomToVoteKeys } from "../../constants";
import { InformationCircleIcon, PencilSquareIcon, TrashIcon } from "@heroicons/react/24/outline";
import { Dialog, DialogPanel, DialogTitle, Transition, TransitionChild } from "@headlessui/react";
import { ClipboardDocumentListIcon, XMarkIcon } from "@heroicons/react/24/outline";
import { useMemo, useState } from "react";
import { cancelSR, placeBid, showSRCreateForm, voteSRDispute } from "../../store/sr/sr.reducer";
import { useDispatch, useSelector } from "react-redux";
import { AppDispatch } from "../../store";
import { EDisputeWinner, EStatus, EUserRole, EWhomToVote } from "../../repository/enum";
import InputBox from "../InputBox";
import { ErrorMessage, Formik, Form } from "formik";
import * as Yup from "yup";
import { showToast } from "../../services/toast";
import { getAuctionStatus } from "./util";
import { getCurrentRole, getUserProfile } from "../../store/users/user.selector";
import { useIntervalCountDown } from "../../hooks/useIntervalCounter";
import Tooltip from "../Tooltip";

type TServiceCard = {
  item: TServiceRequest;
  isShipper?: boolean;
  isReceiver?: boolean;
  isDriver?: boolean;
  onViewDetailPress?: () => void;
};

type TBidForm = { amount: number };

const ServiceCard = (props: TServiceCard) => {
  const dispatch: AppDispatch = useDispatch();
  const { item, isShipper, isDriver, onViewDetailPress } = props;
  const { description, originGeoHash, destGeoHash, serviceFee, status } = item;
  const user = useSelector(getUserProfile);
  const currentRole = useSelector(getCurrentRole);
  const [showDeletePopup, setShowDeletePopup] = useState(false);
  const initialValues: TBidForm = useMemo(() => ({ amount: serviceFee }), [item]);
  const [voteTo, setVoteTo] = useState<EWhomToVote | undefined>();

  const auctionMinsLeft = useIntervalCountDown(item.auctionEndTime * 60, 60);

  const auctionStatus = useMemo(() => {
    return getAuctionStatus(auctionMinsLeft, item.auctionWinner);
  }, [auctionMinsLeft, item.auctionWinner]);

  const validationSchema = useMemo(
    () =>
      Yup.object({
        amount: Yup.number()
          .required("Enter bid amount")
          .min(1, "Bid amount cannot be 0")
          .max(serviceFee, "Bid amount should be less than service fee"),
      } as Record<keyof TBidForm, any>),
    [item.serviceFee]
  );

  const handleSubmitVote = () => {
    if (voteTo !== undefined) {
      dispatch(voteSRDispute({ reqId: item.requestId, voteTo: voteTo }));
    }
  };

  const handlePlaceBid = async (values: TBidForm) => {
    if (isNaN(values.amount)) {
      showToast("Enter a bid amount to place a bid!", { type: "warning" });
      return;
    }
    dispatch(
      placeBid({
        reqId: item.requestId,
        serviceFee: values.amount,
        stake: item.cargoInsurableValue,
      })
    );
  };

  const handleSRDelete = async () => {
    setShowDeletePopup(false);
    dispatch(cancelSR(item.requestId));
  };

  return (
    <>
      <Transition show={showDeletePopup}>
        <Dialog className="relative z-10" onClose={() => setShowDeletePopup(false)}>
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
                          className="text-base ml-2 font-semibold leading-6 text-gray-900"
                        >
                          Are you sure you want to delete SR?
                        </DialogTitle>
                        <p className="px-2 text-teal-800">"{item.description}"</p>
                      </div>
                      <div className="ml-auto cursor-pointer ">
                        <XMarkIcon
                          className="h-6 w-6 text-red-500 hover:text-red-400"
                          onClick={() => setShowDeletePopup(false)}
                        />
                      </div>
                    </div>

                    <div className="flex justify-end">
                      <button
                        className={`ml-3 text-white items-center bg-gray-400 disabled:bg-gray-700 hover:bg-gray-500 focus:ring-4 focus:outline-none focus:ring-teal-300 font-medium rounded-lg text-sm w-full sm:w-auto px-5 text-center flex py-2`}
                        onClick={() => setShowDeletePopup(false)}
                      >
                        Cancel
                      </button>
                      <button
                        className={`ml-3 text-white items-center bg-red-700 disabled:bg-gray-700 hover:bg-red-900 focus:ring-4 focus:outline-none focus:ring-teal-300 font-medium rounded-lg text-sm w-full sm:w-auto px-5 text-center flex py-2`}
                        onClick={handleSRDelete}
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

      <div className="w-full border-1 p-4 pb-1 bg-slate-100 rounded-md">
        <div className="flex justify-between items-center">
          <div className="flex flex-column items-center">
            <div className="bg-gray-200 h-10 w-10 p-2 flex justify-center items-center">
              <img src={sparkImage} alt="" height={20} width={20} />
            </div>
            <div className="ml-3">
              <p className="font-['DarkerGrotesque-Bold'] text-xl">{description}</p>
              <p className="text-xs">{format(new Date(), DATE_FORMATS.SHORT_DATE_TIME)}</p>
            </div>
          </div>
          <div className="flex flex-row">
            <p className="font-semibold">Paid: </p>
            <p className="text-green-800 ml-1">{`${!serviceFee ? 0 : serviceFee} ETH`}</p>
          </div>
        </div>
        <div className="mt-5 flex grid-cols-2 ml-2">
          <div className="flex justify-center items-center flex-col ">
            <img src={arrowUp} alt="arrowUp" className="w-6" />
            <div className="border border-dotted border-black h-[20px] w-[1px]" />
            <img src={arrowDown} alt="arrowDown" className="w-6" />
          </div>
          <div className="ml-5">
            <p className="w-full whitespace-nowrap overflow-hidden text-ellipsis">
              {originGeoHash}
            </p>
            <p className="mt-5 w-full whitespace-nowrap overflow-hidden text-ellipsis">
              {destGeoHash}
            </p>
          </div>
        </div>
        <hr className="mt-8" />
        <div className="px-2 py-2 flex justify-between items-center min-h-24">
          <div className="flex flex-row items-start">
            <div
              className="h-6 w-6 border-4 bg-white rounded-full flex items-center justify-center mt-1"
              style={{ borderColor: STATUS_COLOR_MAP[status as never as EStatus].color }}
            />
            <div className="flex flex-col items-start justify-start ml-3">
              <div
                className="text-gray-70 font-['DarkerGrotesque-Bold'] text-xl"
                style={{ color: STATUS_COLOR_MAP[status as never as EStatus].color }}
              >
                {STATUS_COLOR_MAP[status as never as EStatus].name}

                {item.disputeWinner.trim() && (
                  <p className="text-teal-700">
                    {item.disputeWinner === EDisputeWinner.DRAW
                      ? "Dispute resulted as a DRAW"
                      : `Dispute won by ${item.disputeWinner}`}
                  </p>
                )}
              </div>

              {!item.driverAssigned && (
                <p
                  className={`font-semibold text-xl font-['DarkerGrotesque-Bold'] ${auctionStatus.className}`}
                >
                  {auctionStatus.label}
                </p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-8">
            {isShipper && status === EStatus.DRAFT && (
              <Tooltip id="delete-sr" hintText={"Delete SR"}>
                <TrashIcon
                  className="w-6 h-6 cursor-pointer hover:opacity-60"
                  onClick={() => setShowDeletePopup(true)}
                />
              </Tooltip>
            )}
            {isShipper && status === EStatus.DRAFT && (
              <Tooltip id="edit-sr" hintText={"Edit details"}>
                <PencilSquareIcon
                  className="w-6 h-6 cursor-pointer hover:opacity-60"
                  onClick={() =>
                    dispatch(
                      showSRCreateForm({
                        editMode: true,
                        editValues: item as never,
                      })
                    )
                  }
                />
              </Tooltip>
            )}

            {onViewDetailPress && (
              <Tooltip id="view-sr" hintText={"View details"}>
                <InformationCircleIcon
                  className="w-6 h-6 cursor-pointer hover:opacity-60"
                  onClick={onViewDetailPress}
                />
              </Tooltip>
            )}

            {status === EStatus.DISPUTE &&
              currentRole === EUserRole.Driver &&
              item.driverUID !== user.uid &&
              (!item.disputeVoteGiven ? (
                <div className="flex items-center">
                  <select
                    className="w-28 bg-gray-100 px-2 bg-gray-200 py-2 rounded-md"
                    value={voteTo}
                    aria-placeholder="asdasd"
                    onChange={(e) => {
                      const key = parseInt(e.target.value);
                      setVoteTo(isNaN(key) ? undefined : key);
                    }}
                  >
                    <option value="Vote for" disabled selected>
                      Vote for
                    </option>
                    {[...WhomToVoteKeys].map((key) => {
                      return (
                        <option key={key} value={key}>
                          {EWhomToVote[key]}
                        </option>
                      );
                    })}
                  </select>
                  <button
                    type="submit"
                    disabled={isNaN(Number(voteTo))}
                    onClick={handleSubmitVote}
                    className={`ml-3 border h-fit py-2 items-center text-white bg-teal-700 disabled:bg-gray-400 hover:bg-teal-800 focus:ring-4 focus:outline-none focus:ring-teal-300 font-medium rounded-lg text-sm px-3 text-center`}
                  >
                    Vote
                  </button>
                </div>
              ) : (
                <div className="text-lg text-teal-700 font-semibold">
                  <label> You already voted for dispute. </label>
                </div>
              ))}

            {!item.driverAssigned &&
              !auctionStatus.auctionEnded &&
              isDriver &&
              (item.bidInfo.uid === user.uid ? (
                <div className="text-xl text-teal-700 font-['DarkerGrotesque-Bold']">
                  <label> You placed a Bid - </label>
                  <label className="text-teal-800"> {item.bidInfo.serviceFee} ETH </label>
                </div>
              ) : (
                <div>
                  <Formik
                    initialValues={initialValues}
                    onSubmit={handlePlaceBid}
                    validationSchema={validationSchema}
                    validateOnChange={true}
                  >
                    {({ errors, values, isValid }) => {
                      return (
                        <Form>
                          <div className="flex w-full gap-2 mt-6">
                            <div className="w-40">
                              <InputBox
                                name="amount"
                                type="number"
                                value={values.amount}
                                placeholder=" Amount (ETH)"
                              />
                            </div>
                            <button
                              type="submit"
                              disabled={!isValid}
                              className={`border items-center text-white bg-teal-700 disabled:bg-gray-700 hover:bg-teal-800 focus:ring-4 focus:outline-none focus:ring-teal-300 font-medium rounded-lg text-sm w-full sm:w-auto px-5 text-center flex`}
                            >
                              Place Bid
                            </button>
                          </div>
                          <div className="relative top-1 min-h-6">
                            <ErrorMessage
                              name="amount"
                              component={() => (
                                <div className="text-red-600 text-sm"> {errors.amount}</div>
                              )}
                            />
                          </div>
                        </Form>
                      );
                    }}
                  </Formik>
                </div>
              ))}
          </div>
        </div>
      </div>
    </>
  );
};

export default ServiceCard;
