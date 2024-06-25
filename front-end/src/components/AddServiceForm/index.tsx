import { FC, Fragment, useEffect, useMemo, useRef, useState } from "react";
import { Dialog, DialogPanel, DialogTitle, Transition, TransitionChild } from "@headlessui/react";
import { XMarkIcon, PlusIcon, PencilSquareIcon } from "@heroicons/react/24/outline";
import geohash from "ngeohash";
import InputBox from "../InputBox";
import { TSRFormParams, TServiceForm } from "./types";
import { CONSTANTS, STATUS_OPTIONS } from "../../constants";
import * as Yup from "yup";
import { ErrorMessage, Field, Form, Formik } from "formik";
import { AppDispatch } from "../../store";
import { useDispatch, useSelector } from "react-redux";
import { addNewServiceRequest, updateSR } from "../../store/sr/sr.reducer";
import { getSREditProps, isFormProcessing } from "../../store/sr/sr.selector";
import { EDisputeWinner, EStatus } from "../../repository/enum";
import { ISRInfo } from "../../repository/interfaces";
import { getLatLong, getUserAccountId } from "../../services";

// Validation Schema for form
const validationSchema = Yup.object({
  description: Yup.string().required("Required"),
  receiverUID: Yup.string().required("Required"),
  originGeoHash: Yup.string()
    .matches(CONSTANTS.GEOHASH_REGEX, { message: "You have entered an invalid GeoHash" })
    .min(5, "Please enter a Geo-hash with minimum 5 characters")
    .max(13, "Geo-hash should not exceed 13 characters"),
  destGeoHash: Yup.string()
    .required("Required")
    .matches(CONSTANTS.GEOHASH_REGEX, { message: "You have entered an invalid GeoHash" })
    .min(5, "Please enter a Geo-hash with minimum 5 characters")
    .max(13, "Geo-hash should not exceed 13 characters"),
  cargoInsurableValue: Yup.number().required("Required"),
  serviceFee: Yup.number().required("Required"),
  requestedPickupTime: Yup.string().required("Required"),
  requestedDeliveryTime: Yup.string().required("Required"),
  auctionEndTime: Yup.number().required("Required"),
  status: Yup.number().required("Required"),
} as Record<keyof TSRFormParams, any>);

const initialValues: TSRFormParams = {
  requestId: 1,
  description: "",
  shipperUID: "",
  receiverUID: "",
  originGeoHash: "",
  destGeoHash: "",
  cargoInsurableValue: 0,
  serviceFee: 0,
  requestedPickupTime: "",
  requestedDeliveryTime: "",
  auctionEndTime: 10,
  driverUID: CONSTANTS.DRIVER_UID,
  status: EStatus.READY_FOR_AUCTION,
  disputeWinner: EDisputeWinner.NONE,
  bidInfo: { uid: CONSTANTS.DRIVER_UID, serviceFee: 0 },
  disputeVoteGiven: false,
};

const ServiceForm: FC<TServiceForm> = (props) => {
  const dispatch: AppDispatch = useDispatch();
  const { open, onClose } = props;
  const initalInputRef = useRef<HTMLInputElement>(null);
  const isProcessing = useSelector(isFormProcessing);
  const edit = useSelector(getSREditProps);
  const fieldDisabled = useMemo(() => edit.active, [edit.active]);
  const [userGeohash, setUserGeohash] = useState("");
  const presetValues = useMemo(
    () =>
      edit.active
        ? { ...initialValues, ...edit.values, originGeoHash: userGeohash }
        : { ...initialValues, originGeoHash: userGeohash },
    [edit, userGeohash]
  );

  const handleFormSubmit = async (values: TSRFormParams) => {
    const srInfo: ISRInfo = {
      ...values,
      shipperUID: getUserAccountId(),
      status: Number(values.status),
      requestedDeliveryTime: new Date(values.requestedDeliveryTime).getTime(),
      requestedPickupTime: new Date(values.requestedPickupTime).getTime(),
    };
    edit.active ? dispatch(updateSR(srInfo)) : dispatch(addNewServiceRequest(srInfo));
  };

  const autoFillGeoHash = async () => {
    const loc = await getLatLong();
    if (!loc) return;
    const _geohash = geohash.encode(loc.lat, loc.long);
    setUserGeohash(_geohash);
  };

  useEffect(() => {
    autoFillGeoHash();
  }, []);

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
          <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
            <TransitionChild
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
              enterTo="opacity-100 translate-y-0 sm:scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 translate-y-0 sm:scale-100"
              leaveTo="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
            >
              <DialogPanel className="relative transform overflow-hidden rounded-lg bg-white text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-lg">
                <Formik
                  initialValues={presetValues}
                  validationSchema={validationSchema}
                  onSubmit={handleFormSubmit}
                  enableReinitialize
                >
                  {({ errors, values }) => (
                    <Form>
                      <div className="bg-white px-4 sm:px-6 pt-6 sm:pt-6 pb-2">
                        <div className="flex sm:flex items-center mb-4">
                          <div className="mx-auto flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-green-100 sm:mx-0 sm:h-10 sm:w-10">
                            {edit.active ? (
                              <PencilSquareIcon
                                className="h-5 w-5 text-green-600"
                                aria-hidden="true"
                              />
                            ) : (
                              <PlusIcon className="h-6 w-6 text-green-600" aria-hidden="true" />
                            )}
                          </div>
                          <div className="flex w-full items-center justify-between">
                            <DialogTitle
                              as="h3"
                              className="text-base ml-2 font-semibold leading-6 text-gray-900"
                            >
                              {edit.active ? "Edit Service Request" : "Create Service Request"}
                            </DialogTitle>
                            <div className="ml-auto cursor-pointer self-start">
                              <XMarkIcon
                                className="h-6 w-6 text-red-500 hover:text-red-400"
                                onClick={() => onClose(false)}
                              />
                            </div>
                          </div>
                        </div>
                        <div>
                          <div className="h-96 overflow-scroll text-center sm:mt-0 sm:text-left pb-4 pt-4">
                            <div className="w-full mb-4">
                              <InputBox
                                name="description"
                                value={values.description}
                                title="Description"
                                placeholder="Description of Product"
                                disabled={fieldDisabled}
                              />
                              <ErrorMessage
                                name="description"
                                component={() => (
                                  <div className="text-red-600 text-sm">{errors.description}</div>
                                )}
                              />
                            </div>
                            <div className="w-full mb-4">
                              <InputBox
                                name="receiverUID"
                                value={values.receiverUID}
                                title="Receiver wallet Address"
                                placeholder="0x9a58790419F691F62fC8e9157F192131f38250Bf"
                                disabled={fieldDisabled}
                              />
                              <ErrorMessage
                                name="receiverUID"
                                component={() => (
                                  <div className="text-red-600 text-sm">{errors.receiverUID}</div>
                                )}
                              />
                            </div>
                            <div className="w-full mb-4">
                              <InputBox
                                name="originGeoHash"
                                value={values.originGeoHash}
                                title={
                                  <div>
                                    Origin geo hash
                                    <a
                                      href={CONSTANTS.GEO_HASH_WEBSITE}
                                      target="_blank"
                                      className="text-xs text-teal-700"
                                    >
                                      (get geohash)
                                    </a>
                                  </div>
                                }
                                placeholder="tttbd"
                                disabled={fieldDisabled}
                              />
                              <ErrorMessage
                                name="originGeoHash"
                                component={() => (
                                  <div className="text-red-600 text-sm">{errors.originGeoHash}</div>
                                )}
                              />
                            </div>
                            <div className="w-full mb-4">
                              <InputBox
                                name="destGeoHash"
                                value={values.destGeoHash}
                                title={
                                  <div>
                                    Destination geo hash
                                    <a
                                      href={CONSTANTS.GEO_HASH_WEBSITE}
                                      target="_blank"
                                      className="text-xs text-teal-700"
                                    >
                                      (get geohash)
                                    </a>
                                  </div>
                                }
                                placeholder="qwerty"
                                disabled={fieldDisabled}
                              />
                              <ErrorMessage
                                name="destGeoHash"
                                component={() => (
                                  <div className="text-red-600 text-sm">{errors.destGeoHash}</div>
                                )}
                              />
                            </div>
                            <div className="w-full mb-4">
                              <InputBox
                                name="serviceFee"
                                value={values.serviceFee}
                                type="number"
                                title="Service Value"
                                placeholder="Service fee for product"
                                disabled={fieldDisabled}
                              />
                              <ErrorMessage
                                name="serviceFee"
                                component={() => (
                                  <div className="text-red-600 text-sm">{errors.serviceFee}</div>
                                )}
                              />
                            </div>
                            <div className="w-full mb-4">
                              <InputBox
                                name="cargoInsurableValue"
                                value={values.cargoInsurableValue}
                                type="number"
                                title="Insurance Value"
                                placeholder="Insurance value of product"
                                disabled={fieldDisabled}
                              />
                              <ErrorMessage
                                name="cargoInsurableValue"
                                component={() => (
                                  <div className="text-red-600 text-sm">
                                    {errors.cargoInsurableValue}
                                  </div>
                                )}
                              />
                            </div>
                            <div className="w-full mb-4">
                              <InputBox
                                name="requestedPickupTime"
                                title="Pickup Time"
                                type="datetime-local"
                                value={values.requestedPickupTime}
                                placeholder="Pickup Time"
                                allowOnlyFutureDateSelection={true}
                              />
                              <ErrorMessage
                                name="requestedPickupTime"
                                component={() => (
                                  <div className="text-red-600 text-sm">
                                    {errors.requestedPickupTime}
                                  </div>
                                )}
                              />
                            </div>
                            <div className="w-full mb-4">
                              <InputBox
                                name="requestedDeliveryTime"
                                title="Delivery Time"
                                type="datetime-local"
                                value={values.requestedDeliveryTime}
                                placeholder="Enter Delivery Time"
                                allowOnlyFutureDateSelection={true}
                              />
                              <ErrorMessage
                                name="requestedDeliveryTime"
                                component={() => (
                                  <div className="text-red-600 text-sm">
                                    {errors.requestedDeliveryTime}
                                  </div>
                                )}
                              />
                            </div>
                            <div className="w-full mb-4">
                              <InputBox
                                name="auctionEndTime"
                                value={values.auctionEndTime}
                                title="Auction End Time (Allow auction till x mins)"
                                placeholder="Auction time"
                                type="number"
                              />
                              <ErrorMessage
                                name="auctionEndTime"
                                component={() => (
                                  <div className="text-red-600 text-sm">
                                    {errors.auctionEndTime}
                                  </div>
                                )}
                              />
                            </div>
                            <div className="w-full mb-4">
                              <label className="block mb-1 mt-3 text-sm font-medium text-gray-900 dark:text-white">
                                Select Status
                              </label>
                              <Field
                                as="select"
                                id="status"
                                value={values.status}
                                className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
                              >
                                {STATUS_OPTIONS.map((opt) => (
                                  <option
                                    key={opt.id}
                                    value={opt.id}
                                    disabled={
                                      ![EStatus.DRAFT, EStatus.READY_FOR_AUCTION].includes(opt.id)
                                    }
                                  >
                                    {opt.name}
                                  </option>
                                ))}
                              </Field>
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="px-4 py-3 sm:flex sm:flex-row-reverse sm:px-6 border-t border-gray-100">
                        <button
                          type="submit"
                          disabled={isProcessing}
                          className={`py-2 ml-3 text-white bg-teal-700 disabled:bg-gray-700 hover:bg-teal-800 focus:ring-4 focus:outline-none focus:ring-teal-300 font-medium rounded-lg text-sm w-full sm:w-auto px-5 text-center flex`}
                        >
                          {isProcessing ? "Processing..." : "Submit"}
                        </button>
                        <button
                          type="button"
                          disabled={isProcessing}
                          onClick={() => onClose(false)}
                          className="py-2 inline-flex w-full items-center justify-center rounded-md bg-red-600 disabled:bg-gray-600 px-3 text-sm font-semibold text-white shadow-sm hover:bg-red-500 sm:ml-3 sm:w-auto"
                        >
                          Cancel
                        </button>
                      </div>
                    </Form>
                  )}
                </Formik>
              </DialogPanel>
            </TransitionChild>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
};

export default ServiceForm;
