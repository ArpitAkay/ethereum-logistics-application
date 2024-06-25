import { Field, Formik, Form } from "formik";
import * as Yup from "yup";
import { useDispatch, useSelector } from "react-redux";
import geohash from "ngeohash";
import {
  getUserProfile,
  isProfileUpdating,
} from "../../store/users/user.selector";
import { useCallback, useEffect, useMemo, useState } from "react";
import { AppDispatch } from "../../store";
import { CONSTANTS } from "../../constants";
import {
  fetchUserProfile,
  saveUserProfile,
} from "../../store/users/user.reducer";
import { getValueFromLocalStorage } from "../../services/localStorage";
import { IUser } from "../../repository/interfaces";
import { getLatLong } from "../../services";
import { MapPinIcon } from "@heroicons/react/24/outline";
import Tooltip from "../../components/Tooltip";
import { showToast } from "../../services/toast";
import * as lodash from "lodash";

// Validation Schema for form
const validationSchema = Yup.object({
  name: Yup.string().required("Name is required"),
  serviceGeoHash: Yup.string()
    .required("Required")
    .matches(CONSTANTS.GEOHASH_REGEX, {
      message: "You have entered an invalid GeoHash",
    })
    .min(5, "Please enter a Geo-hash with minimum 5 characters")
    .max(13, "Geo-hash should not exceed 13 characters"),
  phoneNumberWithISO: Yup.string()
    .required("PhoneNumber is required")
    .matches(CONSTANTS.PHONE_ISO_REGEX, {
      message: "Invalid phone number format",
    }),
});

type TProfileForm = Pick<
  IUser,
  "name" | "serviceGeoHash" | "phoneNumberWithISO"
>;

const Profile = () => {
  const dispatch: AppDispatch = useDispatch();
  const profile = useSelector(getUserProfile);
  const profileUpdating = useSelector(isProfileUpdating);
  const [userGeohash, setUserGeohash] = useState("");
  const [profileHasChanges, setprofileHasChanges] = useState(false);
  const iValues = useMemo(
    () => ({
      name: profile.name,
      serviceGeoHash: userGeohash || profile.serviceGeoHash,
      phoneNumberWithISO: profile.phoneNumberWithISO,
    }),
    [profile, userGeohash]
  );

  const checkChanges = useCallback((iv: IUser, fv: IUser) => {
    const hasNoChanges = lodash.isEqual(
      {
        name: iv.name,
        phoneNumberWithISO: iv.phoneNumberWithISO,
        serviceGeoHash: iv.serviceGeoHash,
      },
      {
        name: fv.name,
        phoneNumberWithISO: fv.phoneNumberWithISO,
        serviceGeoHash: fv.serviceGeoHash,
      }
    );
    setprofileHasChanges(!hasNoChanges);
  }, []);

  const [loadingLocation, setLoadingLocation] = useState(false);

  const updateProfile = (values: TProfileForm) => {
    const uProfile = { ...profile, ...values };
    dispatch(saveUserProfile(uProfile));
  };

  const autoFillGeoHash = async (manual?: boolean) => {
    const loadExitId = setTimeout(() => {
      setLoadingLocation(false);
    }, 5000);
    setLoadingLocation(true);
    const loc = await getLatLong();
    if (!loc) return;
    const _geohash = geohash.encode(loc.lat, loc.long);
    setUserGeohash(_geohash);
    setLoadingLocation(false);
    if (manual) showToast("Geohash has been autofilled!", { type: "info" });
    clearTimeout(loadExitId);
  };

  useEffect(() => {
    dispatch(
      fetchUserProfile(getValueFromLocalStorage(CONSTANTS.ACCOUNT_ADDRESS))
    );
  }, []);

  return (
    <div className="border h-fit w-full md:w-full lg:w-2/5 mx-auto rounded-md">
      <div className="flex h-24 bg-gray-200 items-center pl-5">
        <h2 className="text-teal-800 text-2xl font-['PoetsenOne']">
          Update Profile
        </h2>
      </div>
      <div className="mx-5">
        <Formik
          initialValues={iValues}
          validationSchema={validationSchema}
          onSubmit={updateProfile}
          enableReinitialize
        >
          {({ errors, touched, values }) => {
            checkChanges(profile, values as IUser);
            return (
              <Form className="max-w-1/2 mx-auto my-5">
                <div className="mt-2">
                  <label className="block mb-1 text-sm font-medium text-gray-900">
                    Your Name
                  </label>
                  <Field
                    name="name"
                    id="name"
                    value={values.name}
                    aria-describedby="helper-text-explanation"
                    className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 "
                    placeholder="eg: John Doe"
                  />
                  {errors.name && touched.name && (
                    <span className="text-red-600 text-sm">{errors.name}</span>
                  )}
                </div>
                <div className="mt-4">
                  <label className="block flex items-center mb-1 text-sm font-medium text-gray-900 dark:text-white">
                    Service location Geo-hash
                  </label>
                  <div className="flex">
                    <Field
                      name="serviceGeoHash"
                      type="text"
                      id="serviceGeoHash"
                      disabled={loadingLocation}
                      value={
                        loadingLocation
                          ? "Autofilling geohash..."
                          : values.serviceGeoHash
                      }
                      aria-describedby="helper-text-explanation"
                      className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-l-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 disabled:text-gray-500"
                      placeholder="eg: tttbd"
                    />
                    <Tooltip
                      id="map-geohash"
                      hintText="fill current location"
                      className="flex justify-center items-center bg-gray-50 border rounded-r-lg w-10 border-gray-300 text-teal-900 hover:text-teal-700"
                      onChildClick={() => autoFillGeoHash(true)}
                    >
                      <MapPinIcon className="w-5 h-5 cursor-pointer" />
                    </Tooltip>
                  </div>
                  {errors.serviceGeoHash && touched.serviceGeoHash && (
                    <span className="text-red-600 text-sm">
                      {errors.serviceGeoHash}
                    </span>
                  )}
                </div>
                <div className="mt-4">
                  <label className="block mb-1 text-sm font-medium text-gray-900 dark:text-white">
                    PhoneNumber
                  </label>
                  <Field
                    name="phoneNumberWithISO"
                    type="text"
                    id="phoneNumberWithISO"
                    value={values.phoneNumberWithISO}
                    aria-describedby="helper-text-explanation"
                    className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5  "
                    placeholder="eg: +919999999999"
                  />
                  {errors.phoneNumberWithISO && touched.phoneNumberWithISO && (
                    <span className="text-red-600 text-sm">
                      {errors.phoneNumberWithISO}
                    </span>
                  )}
                </div>
                <div className="flex justify-end mt-6">
                  <button
                    type="submit"
                    disabled={!profileHasChanges || profileUpdating}
                    className={`text-white bg-teal-700 disabled:bg-gray-700 hover:bg-teal-800 focus:ring-4 focus:outline-none focus:ring-teal-300 font-medium rounded-lg text-sm w-full sm:w-auto px-5 py-2.5 text-center flex `}
                  >
                    {profileUpdating ? "Updating..." : "Update"}
                  </button>
                </div>
              </Form>
            );
          }}
        </Formik>
      </div>
    </div>
  );
};

export default Profile;
