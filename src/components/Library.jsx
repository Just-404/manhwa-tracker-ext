import { useState } from "react";
import styles from "../css/library.module.css";
import ComicsContainer from "./ComicsContainer";

const Library = () => {
  // The initial state is for testing purpose
  const [comics, setComics] = useState([
    {
      manhwa: { idManhwa: 0, title: "testing" },
      site: { id: 0, name: "site1", isActive: true },
    },
    {
      manhwa: {
        idManhwa: 1,
        title: "testing",
        chapters: "65",
        status: "Completed",
        lastReadChapter: "34",
        lastTimeRead: "Wed Oct 05 2011 16:48:00 GMT+0200 (CEST)",
        genre: ["Shonen", "slice of life", "dungeon"],
        note: "This is another comment.",
      },
      site: {
        id: 0,
        name: "Asurascans",
        isActive: false,
        baseUrl: "https://asuracomic.net/",
        language: "en",
      },
    },
    {
      manhwa: { idManhwa: 2, title: "testing" },
      site: { id: 0, name: "site1" },
    },
    {
      manhwa: { idManhwa: 3, title: "testing" },
      site: { id: 0, name: "site1" },
    },
    {
      manhwa: { idManhwa: 4, title: "testing" },
      site: { id: 0, name: "site1" },
    },
    {
      manhwa: { idManhwa: 5, title: "testing" },
      site: { id: 0, name: "site1" },
    },
    {
      manhwa: { idManhwa: 6, title: "testing" },
      site: { id: 0, name: "site1" },
    },
    {
      manhwa: { idManhwa: 7, title: "testing" },
      site: { id: 0, name: "site1" },
    },
    {
      manhwa: { idManhwa: 8, title: "testing" },
      site: { id: 0, name: "site1" },
    },
    {
      manhwa: { idManhwa: 9, title: "testing" },
      site: { id: 0, name: "site1" },
    },
    {
      manhwa: { idManhwa: 10, title: "testing" },
      site: { id: 0, name: "site1" },
    },
  ]);
  const [pageCount, setPageCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);

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
        {
          <ComicsContainer
            data={comics}
            onPageCount={setPageCount}
            pageCount={pageCount}
          />
        }
      </main>
      <footer className={styles.libraryFooter}>
        <p>Created by: Just-404</p>
      </footer>
    </div>
  );
};

export default Library;
