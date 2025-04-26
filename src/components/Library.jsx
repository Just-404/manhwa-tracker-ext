import { useEffect, useState, useCallback } from "react";
import { ToastContainer } from "react-toastify";
import styles from "../css/library.module.css";
import ComicsContainer from "./ComicsContainer";
import SidebarMenu from "./SidebarMenu";
import { useDexie } from "../db/useDexie";
import addToastMessage from "../js/utils/toastify";
import ManhwaStatus from "../js/utils/enums";

const Library = () => {
  const {
    getManhwas,
    updateSite,
    searchByName,
    updateMahwa,
    updateFavorite,
    deleteManhwa,
  } = useDexie();
  const [comics, setComics] = useState();
  const [pageCount, setPageCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [sortBy, setSortBy] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [openMenu, setOpenMenu] = useState(false);

  const fetchManhwas = useCallback(
    async ({ currentPage = 1, limit = 20, sortBy = null }) => {
      try {
        const { manhwasAndSite, total } = await getManhwas(
          currentPage,
          limit,
          sortBy
        );
        setComics(manhwasAndSite);
        setPageCount(Math.ceil(total / limit));
      } catch (error) {
        addToastMessage("error", "Error getting data!");
        console.log("Error getting data", error.message);
      }
    },
    [getManhwas]
  );
  const fetchManhwasByName = useCallback(
    async ({ currentPage = 1, limit = 20, searchTerm }) => {
      try {
        const { manhwasAndSite, total } = await searchByName(
          searchTerm,
          currentPage,
          limit
        );
        setComics(manhwasAndSite);
        setPageCount(Math.ceil(total / limit));
      } catch (error) {
        addToastMessage("error", "Error getting data!");
        console.log("Error getting data", error.message);
      }
    },
    [searchByName]
  );
  useEffect(() => {
    fetchManhwas({ currentPage, sortBy });
  }, [currentPage, fetchManhwas, sortBy]);

  const handleSearch = () => {
    if (!searchTerm.trim()) return;

    fetchManhwasByName({ currentPage, searchTerm });
  };

  const handleSiteEdit = async (id, editedSite) => {
    try {
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

  const handleClearSearchInput = () => {
    setSearchTerm("");
    fetchManhwas({ page: 1, sortBy });
    setCurrentPage(1);
  };

  const handleCloseMenu = () => {
    setOpenMenu(!openMenu);
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

      {openMenu && (
        <SidebarMenu onClose={handleCloseMenu} onReload={fetchManhwas} />
      )}

      <div className={styles.libraryContainer}>
        <header className={styles.libraryHeader}>
          <h1>My library</h1>
          <span
            style={{ fontSize: "30px", cursor: "pointer" }}
            onClick={() => setOpenMenu(true)}
          >
            &#9776;
          </span>
        </header>

        <main className={styles.libraryMain}>
          <div className={styles.filterDiv}>
            <div className={styles.searchSection}>
              <input
                type="search"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              <button className={styles.searchButton} onClick={handleSearch}>
                Search
              </button>
            </div>
            {searchTerm === "" ? (
              <div className={styles.sortDiv}>
                <h2>Status:</h2>
                <select
                  id="sortBy"
                  name="sortBy"
                  className={styles.sortSelect}
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                >
                  <option key={"all"} value="">
                    ALL
                  </option>
                  {Object.entries(ManhwaStatus).map(([key, value]) => (
                    <option key={key} value={value}>
                      {value}
                    </option>
                  ))}
                </select>
              </div>
            ) : (
              <div>
                <button onClick={handleClearSearchInput}>Clear</button>
              </div>
            )}
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
