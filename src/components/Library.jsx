import { useEffect, useState, useCallback } from "react";
import { ToastContainer } from "react-toastify";
import styles from "../css/library.module.css";
import ComicsContainer from "./ComicsContainer";
import SidebarMenu from "./SidebarMenu";
import FavoritesCarousel from "./FavoritesCarousel";
import StaleCarousel from "./StaleCarousel";
import StatsModal from "./StatsModal";
import { useDexie } from "../db/useDexie";
import addToastMessage from "../js/utils/toastify";
import ManhwaStatus from "../js/utils/enums";

const Library = () => {
  const {
    getManhwas,
    getFavoriteManhwas,
    getLibraryStats,
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
  const [activeSearchTerm, setActiveSearchTerm] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [openMenu, setOpenMenu] = useState(false);
  const [favoriteSelected, setFavoriteSelected] = useState(false);
  const [stats, setStats] = useState(null);
  const [showStats, setShowStats] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const refreshData = useCallback(() => setRefreshKey((key) => key + 1), []);

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

  // Loads whichever list the current view (search / favorites / status) shows
  const loadCurrentView = useCallback(
    async (page = currentPage) => {
      const limit = 20;

      if (activeSearchTerm) {
        return await fetchManhwasByName({
          currentPage: page,
          limit,
          searchTerm: activeSearchTerm,
        });
      }
      if (favoriteSelected) {
        return await fetchFavoriteManhwas({ currentPage: page, limit });
      }
      return await fetchManhwas({ currentPage: page, sortBy });
    },
    [
      activeSearchTerm,
      favoriteSelected,
      fetchManhwas,
      fetchManhwasByName,
      fetchFavoriteManhwas,
      sortBy,
      currentPage,
    ]
  );

  const fetchStats = useCallback(async () => {
    try {
      setStats(await getLibraryStats());
    } catch (error) {
      addToastMessage("error", "Error getting statistics!");
      console.log("Error getting statistics", error.message);
    }
  }, [getLibraryStats]);

  useEffect(() => {
    loadCurrentView();
  }, [loadCurrentView, refreshKey]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats, refreshKey]);

  const handleSearch = () => {
    if (!searchTerm.trim()) return;
    setActiveSearchTerm(searchTerm.trim());
    setCurrentPage(1);
  };

  const handleSiteEdit = async (id, editedSite) => {
    try {
      const data = await updateSite(id, editedSite);
      if (!data) return;
      addToastMessage("success", "Site updated!");
      refreshData();
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
      refreshData();
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
      refreshData();
    } catch (error) {
      addToastMessage("error", error.message);
      console.log(error);
    }
  };
  const handleDeleteManhwa = async (idManhwa) => {
    try {
      await deleteManhwa(idManhwa);

      addToastMessage("success", "Deleted successfully!");

      // If the current page is now empty and not the first page, go back a page
      if (comics?.length === 1 && currentPage > 1) {
        setCurrentPage(currentPage - 1);
      }

      refreshData();
    } catch (error) {
      addToastMessage("error", error.message);
      console.log(error);
    }
  };

  const handleClearSearchInput = () => {
    setSearchTerm("");
    setActiveSearchTerm("");
    setFavoriteSelected(false);
    setCurrentPage(1);
  };

  // The favorites filter and the search are mutually exclusive views; clearing
  // the search here keeps a leftover term from taking over the favorites list.
  const handleToggleFavoriteFilter = () => {
    setSearchTerm("");
    setActiveSearchTerm("");
    setFavoriteSelected((prev) => !prev);
    setCurrentPage(1);
  };

  const handleReload = () => {
    setSearchTerm("");
    setActiveSearchTerm("");
    setFavoriteSelected(false);
    setSortBy(null);
    setCurrentPage(1);
    refreshData();
  };

  const handleCloseMenu = () => {
    setOpenMenu(false);
  };
  const clearFiltersButton = (
    <button type="button" className={styles.clearBtn} onClick={handleClearSearchInput}>
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <path d="M3 12a9 9 0 1 0 3-6.7L3 8" />
        <path d="M3 3v5h5" />
      </svg>
      Clear filters
    </button>
  );
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
        toastStyle={{ zIndex: 9999 }}
        toastContainerStyle={{ zIndex: 2000 }}
      />

      <SidebarMenu
        open={openMenu}
        onClose={handleCloseMenu}
        onReload={handleReload}
      />

      {showStats && <StatsModal stats={stats} onClose={() => setShowStats(false)} />}

      <div className={styles.libraryContainer}>
        <header className={styles.libraryHeader}>
          <div className={styles.headerTitle}>
            <h1>My library</h1>
            <p className={styles.headerCount}>
              {stats
                ? `${stats.total} ${stats.total === 1 ? "manhwa" : "manhwas"}`
                : "Loading…"}
            </p>
          </div>
          <div className={styles.headerActions}>
            <button
              type="button"
              className={styles.iconBtn}
              aria-label="Library statistics"
              title="Statistics"
              onClick={() => setShowStats(true)}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="M3 3v18h18" />
                <path d="M18 17V9" />
                <path d="M13 17V5" />
                <path d="M8 17v-3" />
              </svg>
            </button>
            <button
              type="button"
              className={styles.iconBtn}
              aria-label="Open menu"
              title="Menu"
              onClick={() => setOpenMenu(true)}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="M4 6h16" />
                <path d="M4 12h16" />
                <path d="M4 18h16" />
              </svg>
            </button>
          </div>
        </header>

        <main className={styles.libraryMain}>
          {!activeSearchTerm && !favoriteSelected && (
            <>
              {(stats?.total ?? 0) > 0 && (
                <StaleCarousel refreshKey={refreshKey} />
              )}
              <FavoritesCarousel refreshKey={refreshKey} />
            </>
          )}

          <div className={styles.filterDiv}>
            <div className={styles.searchSection}>
              <input
                type="search"
                value={searchTerm}
                placeholder="Search by title…"
                aria-label="Search by title"
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              <button className={styles.searchButton} onClick={handleSearch}>
                Search
              </button>
            </div>
            {searchTerm === "" ? (
              <div className={styles.sortDiv}>
                {!favoriteSelected && (
                  <>
                    <h2 className={styles.sortLabel}>Status</h2>
                    <select
                      id="sortBy"
                      name="sortBy"
                      className={styles.sortSelect}
                      value={sortBy ?? ""}
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
                  </>
                )}
                <button
                  type="button"
                  className={`${styles.iconBtn} ${
                    favoriteSelected ? styles.favFilterActive : ""
                  }`}
                  aria-label="Show only favorites"
                  aria-pressed={favoriteSelected}
                  onClick={handleToggleFavoriteFilter}
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                    aria-hidden="true"
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
                {favoriteSelected && clearFiltersButton}
              </div>
            ) : (
              <div>{clearFiltersButton}</div>
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
              forcePage={currentPage - 1}
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
