import { FormikProps } from "formik";

export interface IDragDropFieldProp {
  name: string;
  onDrop: (files: File[], formik: FormikProps<any>) => void;
  formik: FormikProps<any>;
}
