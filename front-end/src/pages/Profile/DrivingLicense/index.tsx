import { useState, useCallback, useEffect } from "react";
import { Form, Formik, FormikProps } from "formik";
import * as Yup from "yup";
import { AppDispatch } from "../../../store";
import { useDispatch, useSelector } from "react-redux";
import { fetchDLInfo, submitDrivingLicense } from "../../../store/users/user.reducer";
import { getCurrentRole, getDLInfo, getUserProfile } from "../../../store/users/user.selector";
import { CONSTANTS } from "../../../constants";
import InputBox from "../../../components/InputBox";
import noImage from "/assets/noImage.png";
import { DragDropField } from "../../../components/DragDropField";

type TDLForm = {
  name: string;
  dlNumber: string;
  image: any;
};

const validationSchema = Yup.object({
  name: Yup.string().required("Name is required"),
  dlNumber: Yup.string().required("Driving License is required"),
  image: Yup.mixed().required("Driving License image is required"),
} as Record<keyof TDLForm, any>);

const DrivingLicense = () => {
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const dispatch: AppDispatch = useDispatch();
  const dl = useSelector(getDLInfo);
  const user = useSelector(getUserProfile);
  const currentRole = useSelector(getCurrentRole);

  const handleDLSubmit = useCallback((form: TDLForm) => {
    dispatch(submitDrivingLicense({ name: form.name, dl: form.dlNumber, image: form.image }));
  }, []);

  const onDrop = useCallback((acceptedFiles: File[], formik: FormikProps<TDLForm>) => {
    const file = acceptedFiles[0];
    formik?.setFieldValue("image", file);
    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  }, []);

  useEffect(() => {
    dispatch(fetchDLInfo());
  }, [user, currentRole]);

  return (
    <div className="border h-fit w-full md:w-full lg:w-2/5 mx-auto rounded-md">
      <div className="flex h-24 bg-gray-200 items-center pl-5">
        <h2 className="text-teal-800 text-2xl font-['PoetsenOne']">Driving License Form</h2>
      </div>
      <Formik
        initialValues={{ name: dl?.name || "", dlNumber: dl?.id || "", image: dl?.image }}
        validationSchema={validationSchema}
        onSubmit={handleDLSubmit}
        enableReinitialize={true}
      >
        {(formik) => {
          const { values, errors, touched, ...rest } = formik;
          return (
            <Form className="p-5">
              <div className="mb-4">
                <label className="block mb-2 text-sm font-medium text-gray-900">Name</label>
                <InputBox
                  type="text"
                  name="name"
                  placeholder="Name as per Govt. ID"
                  value={values.name}
                  disabled={!!dl}
                  {...rest}
                />
                {touched.name && errors.name ? (
                  <div className="text-red-600 text-sm mt-1">{errors.name}</div>
                ) : null}
              </div>

              <div className="mb-4">
                <label className="block mb-2 text-sm font-medium text-gray-900">
                  Driving License
                </label>

                <InputBox
                  type="text"
                  name="dlNumber"
                  placeholder="Valid driving licence number"
                  value={values.dlNumber}
                  disabled={!!dl}
                  {...rest}
                />

                {touched.dlNumber && errors.dlNumber ? (
                  <div className="text-red-600 text-sm mt-1">{errors.dlNumber}</div>
                ) : null}
              </div>

              <div className="mb-4">
                {dl ? (
                  <div>
                    <label className="block text-sm font-medium text-gray-900">
                      Uploaded Driving License
                    </label>
                    <div className="w-full flex justify-center w-full h-auto border-2 border-dotted rounded-lg mt-3">
                      <img
                        src={`${CONSTANTS.PINATA_BASE_PATH}/${formik.values.image}`}
                        alt="Preview"
                        className="object-cover rounded-lg"
                        onError={(e) => {
                          if (e.currentTarget.src.search(noImage) !== -1) return;
                          e.currentTarget.src = noImage;
                        }}
                      />
                    </div>
                    <a
                      href={`${CONSTANTS.IPFS_BASE_URL}/${dl.image}`}
                      target="_blank"
                      className="block mt-2 text-right text-sm font-medium text-gray-900 underline text-teal-800"
                    >
                      View source image
                    </a>
                  </div>
                ) : (
                  <div>
                    <label className="block mb-2 text-sm font-medium text-gray-900">
                      Upload Image
                    </label>
                    <DragDropField name="image" formik={formik} onDrop={onDrop} />
                    {formik.touched.image && formik.errors.image ? (
                      <div className="text-red-600 text-sm mt-1">
                        {formik.errors.image as string}
                      </div>
                    ) : null}
                    {imagePreview && (
                      <img
                        src={imagePreview}
                        alt="Preview"
                        className="mt-4 w-full h-fit max-h-96 object-cover rounded-lg"
                      />
                    )}

                    {!imagePreview && formik.values.image && (
                      <img
                        src={`${CONSTANTS.PINATA_BASE_PATH}/${formik.values.image}`}
                        alt="Preview"
                        className="mt-4 w-full h-fit max-h-96 object-cover rounded-lg"
                      />
                    )}
                  </div>
                )}
              </div>

              {!dl && (
                <div className="flex justify-end mt-4">
                  <button
                    type="submit"
                    className="text-white bg-teal-700 hover:bg-teal-800 focus:ring-4 focus:outline-none focus:ring-teal-300 font-medium rounded-lg text-sm w-full sm:w-auto px-5 py-2.5 text-center"
                  >
                    Submit
                  </button>
                </div>
              )}
            </Form>
          );
        }}
      </Formik>
    </div>
  );
};

export default DrivingLicense;
