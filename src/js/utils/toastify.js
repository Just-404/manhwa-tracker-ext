import { toast } from "react-toastify";
const addToastMessage = (
  type,
  msg,
  position = "top-right",
  autoClose = 5000,
  theme = "light"
) => {
  toast[type](msg, {
    position,
    autoClose,
    hideProgressBar: false,
    closeOnClick: false,
    pauseOnHover: true,
    draggable: true,
    progress: undefined,
    theme,
    style: { width: "80%" },
  });
};
export default addToastMessage;
