import { useEffect, useState } from "react";
import styles from "../css/popup.module.css";
import ManhwaStatus from "../js/utils/enums";
import { useDexie } from "../db/useDexie";
const Popup = () => {
  const [site, setSite] = useState({});
  const [manhwa, setManhwa] = useState({});

  useEffect(() => {
    chrome.tabs?.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs[0]?.id) {
        chrome.tabs.sendMessage(
          tabs[0].id,
          { action: "extractInfo" },
          (response) => {
            if (chrome.runtime.lastError) {
              console.log("Error:", chrome.runtime.lastError.message);
            } else if (response) {
              setSite(response.site);
              setManhwa(response.manhwa);
            }
          }
        );
      }
    });
  }, []);
  const handleManhwaInputChange = (e) => {
    const { name, value } = e.target;
    setManhwa((prev) => ({
      ...prev,
      [name]: value,
    }));
  };
  return (
    <>
      <div class={styles.popupHeader}>
        <h1>Information</h1>
        <a href="library.html" target="_blank" rel="noopener noreferrer">
          <button>Go to library</button>
        </a>
      </div>
      <form action="#" id={styles.popupForm}>
        <div className={styles.inputBox}>
          <label htmlFor="site">Site: </label>
          <input
            type="text"
            id="site"
            name="site"
            value={site.name}
            required
            onChange={(e) => (prev) => ({ ...prev, name: e.target.value })}
          />
        </div>
        <div className={styles.inputBox}>
          <label htmlFor="title">Title: </label>
          <input
            type="text"
            id="title"
            name="title"
            value={manhwa.title}
            onChange={handleManhwaInputChange}
            required
          />
        </div>
        <div className={styles.inputBox}>
          <label htmlFor="chapter">Chapters: </label>
          <input
            type="number"
            id="chapter"
            name="chapter"
            min="0"
            step="1"
            value={manhwa.chapters}
            onChange={handleManhwaInputChange}
            required
          />
        </div>
        <div className={styles.inputBox}>
          <label for="lastChapter">Last read chapter: </label>
          <input
            type="number"
            id="lastChapter"
            name="chapter"
            min="0"
            step="1"
            value={manhwa.lastReadChapter}
            onChange={handleManhwaInputChange}
            required
          />
        </div>
        <div className={styles.inputBox}>
          <label className={styles.label} htmlFor="status">
            Status:{" "}
          </label>
          <select
            id="status"
            className={styles.select}
            name="status"
            value={manhwa.status || ManhwaStatus.UNKNOWN}
            onChange={handleManhwaInputChange}
          >
            {Object.values(ManhwaStatus).map((status) => (
              <option key={status} value={status}>
                {status}
              </option>
            ))}
          </select>
        </div>
        <div className={styles.textAreaBox}>
          <label for="note">
            Note: <span class={styles.optional}>(optional)</span>
          </label>
          <textarea
            name="note"
            id="note"
            maxlength="250"
            value={manhwa.note}
            onChange={handleManhwaInputChange}
          ></textarea>
        </div>
        <div className={styles.buttonBox}>
          <button type="submit">Save</button>
        </div>
      </form>
    </>
  );
};

export default Popup;
