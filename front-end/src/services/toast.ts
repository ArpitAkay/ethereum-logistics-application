import { ToastOptions, toast } from "react-toastify";

export const showToast = (msg: string, _params?: ToastOptions) => {
  const params = _params || {};
  const toastId = msg.toLowerCase();
  if (msg) {
    toast.dismiss({ id: toastId } as any);
    setTimeout(() => toast(msg, { ...params, toastId: toastId }), 100);
  }
};
