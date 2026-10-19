import { useEffect, useRef } from "react";
import styles from "../css/sidebarMenu.module.css";
import { useDexie } from "../db/useDexie";
import addToastMessage from "../js/utils/toastify";

const SidebarMenu = ({ open, onClose, onReload }) => {
  const { importDatabase, exportDataBase } = useDexie();
  const fileInputRef = useRef();

  // Escape closes the open panel, like any other dismissible overlay
  useEffect(() => {
    if (!open) return;

    const handleKeyDown = (e) => {
      if (e.key === "Escape") onClose();
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [open, onClose]);

  const handleExport = async () => {
    try {
      const result = await exportDataBase();
      addToastMessage("success", result.message);
    } catch (error) {
      addToastMessage("error", error.message);
    }
  };

  const handleImportFile = () => {
    fileInputRef.current.click();
  };

  const handleFileChange = async (e) => {
    try {
      const file = e.target.files[0];
      if (file) {
        const result = await importDatabase(file);
        onReload();
        addToastMessage("success", result.message);
      }
    } catch (error) {
      addToastMessage("error", error.message);
    }
  };

  return (
    <>
      <div
        className={`${styles.backdrop} ${open ? styles.backdropVisible : ""}`}
        onClick={onClose}
        aria-hidden="true"
      />
      <aside
        className={`${styles.sidenav} ${open ? styles.open : ""}`}
        aria-label="Library menu"
        aria-hidden={!open}
        inert={!open}
      >
        <button
          type="button"
          className={styles.closeBtn}
          aria-label="Close menu"
          onClick={onClose}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="22"
            height="22"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="M18 6 6 18" />
            <path d="m6 6 12 12" />
          </svg>
        </button>
        <ul className={styles.linksDiv}>
          <li>
            <a href="#" onClick={handleImportFile}>
              Import
            </a>
          </li>
          <li>
            <a href="#" onClick={handleExport}>
              Export
            </a>
          </li>
        </ul>

        <input
          type="file"
          accept=".json"
          ref={fileInputRef}
          style={{ display: "none" }}
          onChange={handleFileChange}
        ></input>
      </aside>
    </>
  );
};

export default SidebarMenu;
