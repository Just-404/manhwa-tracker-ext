import { useState } from "react";
import styles from "../css/editModal.module.css";
import ManhwaStatus from "../js/utils/enums";
import confirmModal from "../js/utils/confirmModal";

const EditModal = ({
  isModalOpen,
  onClose,
  manhwa,
  site,
  onEditSite,
  onEditManhwa,
}) => {
  const [editedManhwa, setEditedManhwa] = useState({ ...manhwa });
  const [editedSite, setEditedSite] = useState({ ...site });

  const handleManhwaChange = (e) => {
    const { name, value } = e.target;
    setEditedManhwa((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSiteChange = (e) => {
    const { name, value } = e.target;
    const parsedValue = name === "isActive" ? value === "true" : value;
    setEditedSite((prev) => ({
      ...prev,
      [name]: parsedValue,
    }));
  };

  const handleManhwaSubmit = async (e) => {
    e.preventDefault();
    const confirmed = await confirmModal(
      "Are you sure you want to change the manhwa info?"
    );
    if (!confirmed) return;
    onEditManhwa(manhwa.idManhwa, editedManhwa);
    handleClose();
  };

  const handleSiteSubmit = async (e) => {
    e.preventDefault();
    const confirmed = await confirmModal(
      "Are you sure you want to change the site info?"
    );
    if (!confirmed) return;

    onEditSite(site.idSite, editedSite);
    handleClose();
  };

  const handleClose = () => {
    onClose();
  };
  if (!isModalOpen) return null;

  return (
    <div className={styles.modalOverlay}>
      <div className={styles.editModal}>
        <form onSubmit={handleSiteSubmit} className={styles.form}>
          <div className={styles.siteContainer}>
            <div>
              <h2>Edit Site</h2>
              <p>
                {" "}
                <strong>Important:</strong> Changing site info will change it
                for every comic!
              </p>
            </div>

            <label className={styles.label}>
              Site name:
              <input
                className={styles.input}
                type="text"
                name="name"
                value={editedSite.name}
                onChange={handleSiteChange}
              />
            </label>
            <label className={styles.label}>
              Base url:
              <input
                className={styles.input}
                type="text"
                name="baseUrl"
                value={editedSite.baseUrl}
                onChange={handleSiteChange}
              />
            </label>
            <label className={styles.label}>
              Active:
              <select
                className={styles.select}
                name="isActive"
                value={editedSite.isActive}
                onChange={handleSiteChange}
              >
                <option value="true">Yes</option>
                <option value="false">No</option>
              </select>
            </label>
          </div>

          <div className={styles.btnBox}>
            <button type="submit" className={styles.submitBtn}>
              Save
            </button>
          </div>
        </form>

        <form onSubmit={handleManhwaSubmit} className={styles.form}>
          <div className={styles.manhwaContainer}>
            <h2>Edit Manhwa</h2>

            <label className={styles.label}>
              Title:{" "}
              <input
                className={styles.input}
                type="text"
                name="title"
                value={editedManhwa.title}
                onChange={handleManhwaChange}
              />{" "}
            </label>
            <label className={styles.label}>
              Chapters:{" "}
              <input
                className={styles.input}
                type="number"
                min={0}
                step={1}
                name="chapters"
                value={editedManhwa.chapters}
                onChange={handleManhwaChange}
              />{" "}
            </label>
            <label className={styles.label}>
              Last read chapter:{" "}
              <input
                className={styles.input}
                type="number"
                min={0}
                step={1}
                name="lastReadChapter"
                value={editedManhwa.lastReadChapter}
                onChange={handleManhwaChange}
              />{" "}
            </label>
            <label className={styles.label}>
              Status:
              <select
                className={styles.select}
                name="status"
                value={editedManhwa.status}
                onChange={handleManhwaChange}
              >
                {Object.values(ManhwaStatus).map((status) => (
                  <option key={status} value={status}>
                    {status}
                  </option>
                ))}
              </select>
            </label>
            <label className={styles.label}>
              Genre/s:
              <textarea
                className={styles.textarea}
                name="genre"
                value={editedManhwa.genre}
                onChange={handleManhwaChange}
              />
            </label>
            <label className={styles.label}>
              Notes:
              <textarea
                className={styles.textarea}
                name="note"
                value={editedManhwa.note}
                onChange={handleManhwaChange}
              />
            </label>
          </div>

          <div className={styles.btnBox}>
            <div className={styles.btnBox}>
              <button type="submit" className={styles.submitBtn}>
                Save
              </button>
              <button
                type="button"
                onClick={handleClose}
                className={styles.cancelBtn}
              >
                Cancel
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditModal;
