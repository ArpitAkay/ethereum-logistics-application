import { useDropzone } from "react-dropzone";
import { IDragDropFieldProp } from "./types";

export const DragDropField = (props: IDragDropFieldProp) => {
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop: (files) => props.onDrop(files, props.formik),
  });

  return (
    <div
      {...getRootProps()}
      className={`border-2 border-dashed rounded-lg p-4 cursor-pointer ${
        isDragActive ? "border-blue-600" : "border-gray-300"
      }`}
    >
      <input {...getInputProps()} />
      {isDragActive ? (
        <p className="text-gray-600 text-center">Drop the files here ...</p>
      ) : (
        <p className="text-gray-600 text-center">Click OR Drag/Drop image</p>
      )}
    </div>
  );
};
