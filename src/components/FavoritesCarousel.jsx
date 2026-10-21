import { useCallback, useEffect, useState } from "react";
import CarouselBase from "./CarouselBase";
import styles from "../css/carousel.module.css";
import { useDexie } from "../db/useDexie";
import addToastMessage from "../js/utils/toastify";
import { statusColor } from "../js/utils/enums";

const FAVORITES_CHUNK = 12;

const HeartIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="18"
    height="18"
    viewBox="0 0 24 24"
    fill="currentColor"
    aria-hidden="true"
  >
    <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41 0.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
  </svg>
);

const FavoritesCarousel = ({ refreshKey }) => {
  const { getFavoriteManhwas } = useDexie();
  const [page, setPage] = useState(1);
  const [pageCount, setPageCount] = useState(1);
  const [total, setTotal] = useState(0);
  const [favorites, setFavorites] = useState([]);

  useEffect(() => {
    let cancelled = false;

    const loadFavorites = async () => {
      try {
        const { manhwasAndSite, total: favTotal } = await getFavoriteManhwas(
          page,
          FAVORITES_CHUNK
        );
        if (cancelled) return;

        const nextPageCount = Math.max(1, Math.ceil(favTotal / FAVORITES_CHUNK));
        setTotal(favTotal);
        setPageCount(nextPageCount);
        setFavorites(manhwasAndSite);
        if (page > nextPageCount) setPage(nextPageCount);
      } catch (error) {
        addToastMessage("error", "Error getting favorites!");
        console.log("Error getting favorites", error.message);
      }
    };

    loadFavorites();
    return () => {
      cancelled = true;
    };
  }, [page, refreshKey, getFavoriteManhwas]);

  const renderFavorite = useCallback(({ manhwa, site }) => {
    const href = manhwa.currentChapterUrl || `https://${site?.baseUrl}`;
    return (
      <article className={styles.item}>
        <a
          className={styles.coverLink}
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          title={manhwa.title}
        >
          <img
            src={manhwa.imgUrl || "../../icons/icon48.png"}
            alt={`${manhwa.title} cover`}
            loading="lazy"
            decoding="async"
            draggable={false}
          />
        </a>
        <p className={styles.itemTitle}>{manhwa.title}</p>
        <p className={styles.itemMeta}>
          <span
            className={styles.statusDot}
            style={{ backgroundColor: statusColor(manhwa.status) }}
            aria-hidden="true"
          />
          <span>
            {manhwa.lastReadChapter}/{manhwa.chapters ?? "—"}
          </span>
        </p>
      </article>
    );
  }, []);

  if (total === 0) return null;

  return (
    <CarouselBase
      title="Favorites"
      icon={<HeartIcon />}
      count={total}
      items={favorites}
      renderItem={renderFavorite}
      itemKey={({ manhwa }) => manhwa.idManhwa}
      page={page}
      pageCount={pageCount}
      onPageChange={setPage}
      ariaLabel="Favorites"
      accentColor="var(--favorite)"
      prevGroupLabel="Previous favorites group"
      nextGroupLabel="Next favorites group"
      scrollPrevLabel="Scroll favorites left"
      scrollNextLabel="Scroll favorites right"
      dotLabel={(n) => `Go to favorites group ${n}`}
    />
  );
};

export default FavoritesCarousel;
