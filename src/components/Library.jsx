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
    getFavoriteManhwas,
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
  const [favoriteSelected, setFavoriteSelected] = useState(false);

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
  const fetchFavoriteManhwas = useCallback(
    async ({ currentPage = 1, limit = 20 }) => {
      try {
        const { manhwasAndSite, total } = await getFavoriteManhwas(
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
    [getFavoriteManhwas]
  );
  useEffect(() => {
    if (favoriteSelected) {
      fetchFavoriteManhwas({ currentPage, limit: 20 });
      return;
    }
    fetchManhwas({ currentPage, sortBy });
  }, [
    currentPage,
    fetchManhwas,
    sortBy,
    favoriteSelected,
    fetchFavoriteManhwas,
  ]);

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
    setFavoriteSelected(false);
    setCurrentPage(1);

    fetchManhwas({ currentPage: 1, sortBy });
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
            {searchTerm === "" && !favoriteSelected ? (
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
                <button
                  className={styles.iconBtn}
                  aria-label="Favorite"
                  onClick={() => setFavoriteSelected(!favoriteSelected)}
                >
                  <svg
                    fill={favoriteSelected ? "red" : "#aaa"}
                    height="24px"
                    width="24px"
                    viewBox="0 0 24 24"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 
                    2 5.42 4.42 3 7.5 3c1.74 0 3.41 0.81 
                    4.5 2.09C13.09 3.81 14.76 3 16.5 3 
                    19.58 3 22 5.42 22 8.5c0 3.78-3.4 
                    6.86-8.55 11.54L12 21.35z"
                    />
                  </svg>
                </button>
              </div>
            ) : (
              <div>
                <button onClick={handleClearSearchInput} style={{}}>
                  &#8635;
                </button>
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
