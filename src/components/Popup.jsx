import { useEffect, useState } from "react";
import { ToastContainer } from "react-toastify";
import addToastMessage from "../js/utils/toastify";
import confirmModal from "../js/utils/confirmModal";
import styles from "../css/popup.module.css";
import ManhwaStatus, { statusColor } from "../js/utils/enums";
import { useDexie } from "../db/useDexie";

const Popup = () => {
  const [site, setSite] = useState({ name: "" });
  const [manhwa, setManhwa] = useState({
    title: "",
    status: ManhwaStatus.UNKNOWN,
    note: "",
  });
  const [isExtracting, setIsExtracting] = useState(true);
  const [isFetchingInfo, setIsFetchingInfo] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
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
            setIsExtracting(false);
            return;
          }
          chrome.tabs.sendMessage(
            tabs[0].id,
            { action: "extractInfo" },
            (response) => {
              setIsExtracting(false);
              if (chrome.runtime.lastError) {
                console.log("Error:", chrome.runtime.lastError.message);
              } else if (response) {
                setSite(response.site);
                setManhwa(response.manhwa);
              }
            }
          );
        });
      } else {
        setIsExtracting(false);
      }
    });
  }, []);

  const fetchComicInfo = async (title) => {
    if (!title) return;
    const runtime = browser.runtime || chrome.runtime;

    setIsFetchingInfo(true);
    runtime.sendMessage({ action: "fetchComicData", title }, (response) => {
      setIsFetchingInfo(false);
      if (response?.success && response.data) {
        const media = response.data;
        setManhwa((prev) => ({
          ...prev,
          chapters: media.chapters,
          genre: media.genres.join(", "),
          imgUrl: media.coverImage.large,
          status: media.status || prev.status,
        }));
      } else {
        console.warn("Anilist fetch failed or returned no data");
      }
    });
  };

  const handleManhwaInputChange = (e) => {
    const { name, value } = e.target;
    setManhwa((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSaving(true);
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
      addToastMessage("error", "Could not save the manhwa. Try again.");
      console.log("Error saving data!", error);
    } finally {
      setIsSaving(false);
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

  const contextClass = isExtracting
    ? `${styles.contextRow} ${styles.contextLoading}`
    : site?.name
    ? `${styles.contextRow} ${styles.contextDetected}`
    : styles.contextRow;

  const contextText = isExtracting
    ? "Detecting page…"
    : site?.name
    ? `Detected on: ${site.name}`
    : "No page detected — fill in the form manually";

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
        theme="dark"
      />
      <div className={styles.popup}>
        <header className={styles.popupHeader}>
          <div className={styles.brand}>
            <span className={styles.brandMark} aria-hidden="true">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
                <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
              </svg>
            </span>
            <div className={styles.brandText}>
              <h1>Manhwa Tracker</h1>
              <p>Save your reading progress</p>
            </div>
          </div>
          <button type="button" className={styles.headerBtn} onClick={openLibraryTab}>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="m16 6 4 14" />
              <path d="M12 6v14" />
              <path d="M8 8v12" />
              <path d="M4 4v16" />
            </svg>
            Library
          </button>
        </header>

        <p className={contextClass}>
          <span className={styles.contextDot} aria-hidden="true" />
          {contextText}
        </p>

        <form className={styles.form} action="#" onSubmit={handleSubmit}>
          {manhwa.imgUrl && (
            <div className={styles.previewCard}>
              <img src={manhwa.imgUrl} alt={`${manhwa.title} cover`} />
              <div className={styles.previewInfo}>
                <p className={styles.previewTitle}>{manhwa.title}</p>
                <p className={styles.previewMeta}>
                  <span
                    className={styles.statusDot}
                    style={{ backgroundColor: statusColor(manhwa.status) }}
                    aria-hidden="true"
                  />
                  {manhwa.status ?? ManhwaStatus.UNKNOWN}
                </p>
                {manhwa.genre && (
                  <p className={styles.previewGenres}>{manhwa.genre}</p>
                )}
              </div>
            </div>
          )}

          <div className={styles.inputBox}>
            <label htmlFor="site">Site</label>
            <input
              className={styles.input}
              type="text"
              id="site"
              name="site"
              value={site.name ?? ""}
              required
              onChange={(e) =>
                setSite((prev) => ({ ...prev, name: e.target.value }))
              }
            />
          </div>
          <div className={styles.inputBox}>
            <label htmlFor="title">Title</label>
            <div className={styles.searchManuallyBox}>
              <input
                className={styles.input}
                type="text"
                id="title"
                name="title"
                value={manhwa.title ?? ""}
                onChange={handleManhwaInputChange}
                required
              />

              <button
                type="button"
                className={styles.searchIconBtn}
                aria-label="Search on AniList"
                title="Search on AniList"
                disabled={isFetchingInfo}
                onClick={() => fetchComicInfo(manhwa.title)}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <circle cx="11" cy="11" r="8" />
                  <line x1="21" y1="21" x2="16.65" y2="16.65" />
                </svg>
              </button>
            </div>
          </div>

          <div
            className={
              manhwa.chapters != null ? styles.fieldRow : styles.inputBox
            }
          >
            {manhwa.chapters != null && (
              <div className={styles.inputBox}>
                <label htmlFor="chapter">Chapters</label>
                <input
                  className={styles.input}
                  type="number"
                  id="chapter"
                  name="chapters"
                  min="0"
                  step="1"
                  inputMode="numeric"
                  value={manhwa.chapters ?? 0}
                  onChange={handleManhwaInputChange}
                  required
                />
              </div>
            )}
            <div className={styles.inputBox}>
              <label htmlFor="lastChapter">Current chapter</label>
              <input
                className={styles.input}
                type="number"
                id="lastChapter"
                name="lastReadChapter"
                min="0"
                step="1"
                inputMode="numeric"
                value={manhwa.lastReadChapter ?? ""}
                onChange={handleManhwaInputChange}
                required
              />
            </div>
          </div>

          <div className={styles.inputBox}>
            <label htmlFor="status">
              Status
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
              Note <span className={styles.optional}>(optional)</span>
            </label>
            <textarea
              className={styles.textarea}
              name="note"
              id="note"
              maxLength="250"
              value={manhwa.note ?? ""}
              onChange={handleManhwaInputChange}
            ></textarea>
          </div>

          <div className={styles.buttonBox}>
            <button type="submit" className={styles.submitBtn} disabled={isSaving}>
              {isSaving ? "Saving…" : "Save"}
            </button>
          </div>
        </form>
      </div>
    </>
  );
};

export default Popup;
