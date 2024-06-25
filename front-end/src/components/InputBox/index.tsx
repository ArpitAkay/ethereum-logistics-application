import { Field } from "formik";
import { FC, Ref, RefAttributes, forwardRef } from "react";
import { getTomorrowStartTime } from "../../utilities/helpers";

type TInputProps = {
  type?: "text" | "datetime-local" | "number";
  name?: string;
  title?: string | React.ReactNode;
  value: string | number;
  placeholder?: string;
  disabled?: boolean;
  allowOnlyFutureDateSelection?: boolean;
  onChange?: (text: string) => void;
};

const InputBox: FC<TInputProps & RefAttributes<HTMLInputElement>> = forwardRef(
  (props, ref: Ref<HTMLInputElement>) => {
    const {
      title,
      type = "text",
      name,
      value,
      placeholder,
      disabled,
      allowOnlyFutureDateSelection,
    } = props;
    return (
      <div className={`${disabled ? "pointer-events-none" : ""}`}>
        {title && (
          <label className="block mb-1 text-sm font-medium text-gray-900 dark:text-white">
            {title}
          </label>
        )}
        <div className="relative">
          <Field
            ref={ref}
            value={value}
            type={type}
            name={name}
            id={name}
            disabled={disabled}
            min={
              type === "datetime-local" && allowOnlyFutureDateSelection
                ? getTomorrowStartTime()
                : null
            }
            className={`w-full bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block p-2.5 dark:bg-gray-600 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500 disabled:bg-yellow-50 disabled:bg-yellow-50 disabled:text-gray-500 disabled:dark:bg-gray-700 disabled:dark:text-yellow-500`}
            placeholder={placeholder}
          />
        </div>
      </div>
    );
  }
);
export default InputBox;
