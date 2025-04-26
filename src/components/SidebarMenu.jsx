import { useRef } from "react";
import styles from "../css/sidebarMenu.module.css";
import { useDexie } from "../db/useDexie";
import addToastMessage from "../js/utils/toastify";
const SidebarMenu = ({ onClose, onReload }) => {
  const { importDatabase, exportDataBase } = useDexie();
  const fileInputRef = useRef();

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
        onReload({ sortBy: null });
        addToastMessage("success", result.message);
      }
    } catch (error) {
      addToastMessage("error", error.message);
    }
  };
  return (
    <div className={styles.sidenav}>
      <a href="#" className={styles.closeBtn} onClick={() => onClose()}>
        &times;
      </a>
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
    </div>
  );
};

export default SidebarMenu;
