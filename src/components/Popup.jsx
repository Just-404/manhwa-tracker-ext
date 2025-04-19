import styles from "../css/popup.module.css";
import ManhwaStatus from "../js/utils/enums";

const Popup = () => {
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
          <label for="site">Site: </label>
          <input type="text" id="site" name="site" required />
        </div>
        <div className={styles.inputBox}>
          <label for="title">Title: </label>
          <input type="text" id="title" name="title" required />
        </div>
        <div className={styles.inputBox}>
          <label for="chapter">Chapters: </label>
          <input
            type="number"
            id="chapter"
            name="chapter"
            min="0"
            step="1"
            required
          />
        </div>
        <div className={styles.inputBox}>
          <label className={styles.label} htmlFor="status">
            Status:{" "}
          </label>
          <select id="status" className={styles.select} name="status">
            {Object.values(ManhwaStatus).map((status) => (
              <option key={status} value={status}>
                {status}
              </option>
            ))}
          </select>
        </div>
        <div className={styles.textAreaBox}>
          <label for="comment">
            Comment: <span class={styles.optional}>(optional)</span>
          </label>
          <textarea name="comment" id="comment" maxlength="250"></textarea>
        </div>
        <div className={styles.buttonBox}>
          <button type="submit">Save</button>
        </div>
      </form>
    </>
  );
};

export default Popup;
