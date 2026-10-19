import { useCallback, useEffect, useState } from "react";
import useEmblaCarousel from "embla-carousel-react";
import styles from "../css/favoritesCarousel.module.css";
import { useDexie } from "../db/useDexie";
import addToastMessage from "../js/utils/toastify";
import { statusColor } from "../js/utils/enums";

const FAVORITES_CHUNK = 12;

const ChevronIcon = ({ direction }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="18"
    height="18"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.4"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    {direction === "left" ? (
      <path d="m15 18-6-6 6-6" />
    ) : (
      <path d="m9 18 6-6-6-6" />
    )}
  </svg>
);

const FavoritesCarousel = ({ refreshKey }) => {
  const { getFavoriteManhwas } = useDexie();
  const [page, setPage] = useState(1);
  const [pageCount, setPageCount] = useState(1);
  const [total, setTotal] = useState(0);
  const [favorites, setFavorites] = useState([]);
  const [canScrollPrev, setCanScrollPrev] = useState(false);
  const [canScrollNext, setCanScrollNext] = useState(false);
  const [emblaRef, emblaApi] = useEmblaCarousel({
    loop: false,
    align: "start",
    containScroll: "trimSnaps",
    // En escritorio se navega con las flechas; el arrastre solo se
    // habilita en pantallas táctiles/pequeñas (Firefox Mobile).
    breakpoints: {
      "(min-width: 601px)": {
        watchDrag: false,
      },
    },
  });

  const onSelect = useCallback(() => {
    if (!emblaApi) return;
    setCanScrollPrev(emblaApi.canScrollPrev());
    setCanScrollNext(emblaApi.canScrollNext());
  }, [emblaApi]);

  useEffect(() => {
    if (!emblaApi) return;
    emblaApi.on("select", onSelect);
    emblaApi.on("reInit", onSelect);
    onSelect();
    return () => {
      emblaApi.off("select", onSelect);
      emblaApi.off("reInit", onSelect);
    };
  }, [emblaApi, onSelect]);

  const scrollPrev = useCallback(() => {
    emblaApi?.scrollPrev();
  }, [emblaApi]);

  const scrollNext = useCallback(() => {
    emblaApi?.scrollNext();
  }, [emblaApi]);

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

        setTimeout(() => {
          emblaApi?.reInit();
          setCanScrollPrev(emblaApi?.canScrollPrev() ?? false);
          setCanScrollNext(emblaApi?.canScrollNext() ?? false);
        }, 0);
      } catch (error) {
        addToastMessage("error", "Error getting favorites!");
        console.log("Error getting favorites", error.message);
      }
    };

    loadFavorites();
    return () => {
      cancelled = true;
    };
  }, [page, refreshKey, getFavoriteManhwas, emblaApi]);

  useEffect(() => {
    emblaApi?.reInit();
    onSelect();
  }, [favorites, emblaApi, onSelect]);

  if (total === 0) return null;

  return (
    <section className={styles.favoritesSection} aria-label="Favorites">
      <div className={styles.sectionHeader}>
        <h2 className={styles.sectionTitle}>
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
          Favorites
          <span className={styles.sectionCount}>{total}</span>
        </h2>

        {pageCount > 1 && (
          <div className={styles.navButtons}>
            <button
              type="button"
              className={styles.navBtn}
              aria-label="Previous favorites group"
              disabled={page === 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
            >
              <ChevronIcon direction="left" />
            </button>
            <span className={styles.pageIndicator}>
              {page}/{pageCount}
            </span>
            <button
              type="button"
              className={styles.navBtn}
              aria-label="Next favorites group"
              disabled={page === pageCount}
              onClick={() => setPage((p) => Math.min(pageCount, p + 1))}
            >
              <ChevronIcon direction="right" />
            </button>
          </div>
        )}
      </div>

      <div className={styles.carouselWrapper}>
        <button
          type="button"
          className={`${styles.arrowBtn} ${styles.arrowLeft}`}
          aria-label="Scroll favorites left"
          onClick={scrollPrev}
          disabled={!canScrollPrev}
        >
          <ChevronIcon direction="left" />
        </button>

        <div className={styles.embla}>
          <div className={styles.emblaViewport} ref={emblaRef}>
            <div className={styles.emblaContainer}>
              {favorites.map(({ manhwa, site }) => {
                const href = manhwa.currentChapterUrl || `https://${site?.baseUrl}`;
                return (
                  <div className={styles.emblaSlide} key={manhwa.idManhwa}>
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
                        <span className={styles.itemProgress}>
                          {manhwa.lastReadChapter}/{manhwa.chapters ?? "—"}
                        </span>
                      </p>
                    </article>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <button
          type="button"
          className={`${styles.arrowBtn} ${styles.arrowRight}`}
          aria-label="Scroll favorites right"
          onClick={scrollNext}
          disabled={!canScrollNext}
        >
          <ChevronIcon direction="right" />
        </button>
      </div>

      {pageCount > 1 && (
        <div className={styles.dots}>
          {Array.from({ length: Math.min(12, pageCount) }, (_, i) => (
            <button
              key={i}
              type="button"
              className={i + 1 === page ? styles.dotActive : styles.dot}
              aria-label={`Go to favorites group ${i + 1}`}
              aria-current={i + 1 === page ? "true" : undefined}
              onClick={() => setPage(i + 1)}
            />
          ))}
        </div>
      )}
    </section>
  );
};

export default FavoritesCarousel;
