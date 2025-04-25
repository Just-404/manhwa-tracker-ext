import { useEffect, useState, useCallback } from "react";
import { ToastContainer } from "react-toastify";
import styles from "../css/library.module.css";
import ComicsContainer from "./ComicsContainer";
import { useDexie } from "../db/useDexie";
import addToastMessage from "../js/utils/toastify";

const Library = () => {
  const { getManhwas, updateSite, updateMahwa, updateFavorite, deleteManhwa } =
    useDexie();
  const [comics, setComics] = useState();
  const [pageCount, setPageCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);

  const fetchManhwas = useCallback(
    async (page = 1, limit = 20, sortBy = "title") => {
      try {
        const { manhwasAndSite, total } = await getManhwas(page, limit, sortBy);
        setComics(manhwasAndSite);
        setPageCount(Math.ceil(total / limit));
        console.log(manhwasAndSite);
      } catch (error) {
        addToastMessage("error", "Error getting manhwas!");
        console.log("Error getting data", error);
      }
    },
    [getManhwas]
  );

  useEffect(() => {
    fetchManhwas();
  }, [currentPage, fetchManhwas]);

  const handleSiteEdit = async (id, editedSite) => {
    try {
      console.log(id, editedSite);

      const data = await updateSite(id, editedSite);
      if (!data) return;
      addToastMessage("success", "Site updated!");
      fetchManhwas(currentPage);
    } catch (error) {
      addToastMessage("error", error.message);
      console.log(error);
    }
  };
  const handleManhwaEdit = async (id, editedManhwa) => {
    try {
      const data = await updateMahwa(id, editedManhwa);
      if (!data) return;
      addToastMessage("success", "Manhwa updated!");
      fetchManhwas(currentPage);
    } catch (error) {
      addToastMessage("error", error.message);
      console.log(error);
    }
  };
  const handleChangeFav = async (idManhwa, fav) => {
    try {
      const data = await updateFavorite(idManhwa, fav);
      if (!data) return;
      addToastMessage("success", "Favorite updated!");
      fetchManhwas(currentPage);
    } catch (error) {
      addToastMessage("error", error.message);
      console.log(error);
    }
  };
  const handleDeleteManhwa = async (idManhwa) => {
    try {
      await deleteManhwa(idManhwa);

      addToastMessage("success", "Deleted successfully!");
      fetchManhwas(currentPage);
    } catch (error) {
      addToastMessage("error", error.message);
      console.log(error);
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
        toastStyle={{ zIndex: 9999 }}
        toastContainerStyle={{ zIndex: 2000 }}
      />
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
              onPageCount={(page) => setCurrentPage(page)}
              pageCount={pageCount}
              onEditSite={handleSiteEdit}
              onEditManhwa={handleManhwaEdit}
              onChangeFav={handleChangeFav}
              onDeleteManhwa={handleDeleteManhwa}
            />
          }
        </main>
        <footer className={styles.libraryFooter}>
          <p>Created by: Just-404</p>
        </footer>
      </div>
    </>
  );
};

export default Library;
