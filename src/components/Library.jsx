import styles from "../css/library.module.css";
const Library = () => {
  return (
    <div className={styles.libraryContainer}>
      <header className={styles.libraryHeader}>
        <h1>My library</h1>
        <div className="searchSection">
          <input type="search" />
          <button className="searchButton">Search</button>
        </div>
      </header>

      <main className={styles.libraryMain}>
        <div className={styles.filterDiv}>
          <h2>Sort by:</h2>
          <select id="sortBy" name="sortBy">
            <option value="site">Site</option>
            <option value="title">Title</option>
            <option value="chapter">Chapter</option>
          </select>
        </div>
        <section className={styles.manhwaSection}>
          <div className="manhwaCard">
            <h3>Title</h3>
            <p>Site: Site Name</p>
            <p>Chapter: 1</p>
            <p>Comment: This is a comment.</p>
            <button className="deleteButton">Delete</button>
          </div>

          <div className="manhwaCard">
            <h3>Title</h3>
            <p>Site: Site Name</p>
            <p>Chapter: 2</p>
            <p>Comment: This is another comment.</p>
            <button className="deleteButton">Delete</button>
          </div>
        </section>
        <div>1 ... 2 ... 3 ... 4</div>
      </main>
      <footer className={styles.libraryFooter}>
        <p>Created by: Just-404</p>
      </footer>
    </div>
  );
};

export default Library;
