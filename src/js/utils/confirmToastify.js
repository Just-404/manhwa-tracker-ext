import { toast } from "react-toastify";

const confirmToastify = (msg) => {
  return new Promise((resolve) => {
    toast(
      <div>
        <p>{msg}</p>
        <div
          style={{
            marginTop: "10px",
            display: "flex",
            justifyContent: "space-between",
          }}
        >
          <button
            onClick={() => {
              toast.dismiss();
              resolve(true);
            }}
          >
            Yes
          </button>
          <button
            onClick={() => {
              toast.dismiss();
              resolve(false);
            }}
          >
            No
          </button>
        </div>
      </div>,
      {
        position: "bottom-center",
        autoClose: false,
        closeOnClick: false,
        closeButton: false,
        draggable: false,
      }
    );
  });
};

export default confirmToastify;
