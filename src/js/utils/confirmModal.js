import { createConfirmation } from "react-confirm";
import ConfirmModal from "../../components/ConfirmModal";

const confirm = createConfirmation(ConfirmModal);

export default function confirmModal(message) {
  return confirm({ confirmation: message });
}
