import { useEffect, useState } from "react";
import { ToastContainer } from "react-toastify";
import addToastMessage from "../js/utils/toastify";
import confirmModal from "../js/utils/confirmModal";
import styles from "../css/popup.module.css";
import ManhwaStatus from "../js/utils/enums";
import { useDexie } from "../db/useDexie";

const Popup = () => {
  const [site, setSite] = useState({});
  const [manhwa, setManhwa] = useState({});
  const { addManhwaWithSite } = useDexie();

  useEffect(() => {
    chrome.tabs?.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs[0]?.id) {
        const tabId = tabs[0].id;

        chrome.tabs.executeScript(tabId, { file: "contentScript.js" }, () => {
          if (chrome.runtime.lastError) {
            console.log(
              "Error injecting content script:",
              chrome.runtime.lastError.message
            );
            return;
          }
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
        });
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const result = await addManhwaWithSite(
        site,
        manhwa,
        async (existing, currentCh) => {
          return await confirmModal(
            `You already saved "${existing.title}" on this site. Last read chapter [${existing.lastReadChapter}]. Update it to [${currentCh}]?`
          );
        }
      );

      if (result.added) addToastMessage("success", "Manhwa saved!");
      if (result.updated)
        addToastMessage("success", "Last read chapter updated!");
      if (result.skipped) addToastMessage("warning", "Skipped update.");

      resetForm();
    } catch (error) {
      alert("Error saving");
      console.log("Error saving data!", error);
    }
  };
  const resetForm = () => {
    setSite({ name: "" });
    setManhwa({
      title: "",
      chapters: 0,
      lastReadChapter: 0,
      status: ManhwaStatus.UNKNOWN,
      note: "",
    });
  };

  const openLibraryTab = () => {
    const tabs = window.browser?.tabs || window.chrome?.tabs;

    tabs.create({
      url: (window.browser || window.chrome).runtime.getURL("library.html"),
    });

    const isFirefoxMobile = /Fennec|Android.*Firefox/.test(navigator.userAgent);

    if (isFirefoxMobile) {
      window.close();
    }
  };
  return (
    <>
      <ToastContainer
        position="top-right"
        autoClose={5000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick={false}
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="light"
      />
      <div className={styles.popupHeader}>
        <h1>Information</h1>

        <button onClick={openLibraryTab}>Go to library</button>
      </div>
      <form action="#" id={styles.popupForm} onSubmit={handleSubmit}>
        <div className={styles.inputBox}>
          <label htmlFor="site">Site: </label>
          <input
            type="text"
            id="site"
            name="site"
            value={site.name}
            required
            onChange={(e) =>
              setSite((prev) => ({ ...prev, name: e.target.value }))
            }
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
        {manhwa.chapters != null && (
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
        )}
        <div className={styles.inputBox}>
          <label htmlFor="lastChapter">Current chapter: </label>
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
          <label htmlFor="note">
            Note: <span className={styles.optional}>(optional)</span>
          </label>
          <textarea
            name="note"
            id="note"
            maxLength="250"
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
