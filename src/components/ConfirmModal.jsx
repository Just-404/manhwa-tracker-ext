import style from "../css/confirmModal.module.css";
import { confirmable } from "react-confirm";

const ConfirmModal = ({ show, proceed, confirmation }) => {
  if (!show) return null;
  return (
    <div className={style.modalOverlay}>
      <div className={style.modalBox}>
        <h2>Confirm</h2>
        <p>{confirmation}</p>
        <div className={style.modalButtons}>
          <button onClick={() => proceed(true)}>Yes</button>
          <button onClick={() => proceed(false)}>No</button>
        </div>
      </div>
    </div>
  );
};

export default confirmable(ConfirmModal);
