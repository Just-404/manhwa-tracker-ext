const Popup = () => {
  return (
    <>
      <div class="popup-header">
        <h1>Info:</h1>
        <a href="library.html" target="_blank" rel="noopener noreferrer">
          <button>Go to library</button>
        </a>
      </div>
      <form action="#">
        <div class="input-box">
          <label for="site">Site: </label>
          <input type="text" id="site" name="site" required />
        </div>
        <div class="input-box">
          <label for="title">Title: </label>
          <input type="text" id="title" name="title" required />
        </div>
        <div class="input-box">
          <label for="chapter">Chapter: </label>
          <input
            type="number"
            id="chapter"
            name="chapter"
            min="1"
            step="1"
            required
          />
        </div>
        <div class="input-box">
          <label for="comment">
            Comment: <span class="optional">(optional)</span>
          </label>
          <textarea name="comment" id="comment" maxlength="250"></textarea>
        </div>
        <button type="submit">Save</button>
      </form>
    </>
  );
};

export default Popup;
