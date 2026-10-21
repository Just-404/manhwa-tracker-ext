import { useEffect, useState } from "react";
import { useProxiedImage } from "../js/hooks/useProxiedImage";
import CarouselBase from "./CarouselBase";
import styles from "../css/carousel.module.css";
import staleStyles from "../css/staleCarousel.module.css";
import { useDexie } from "../db/useDexie";
import addToastMessage from "../js/utils/toastify";
import { statusColor } from "../js/utils/enums";
import { formatTimeAgo } from "../js/utils/utils";
import {
  STALE_THRESHOLDS,
  getStaleThreshold,
  setStaleThreshold,
} from "../js/utils/settings";

const STALE_CHUNK = 12;

const ClockIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="18"
    height="18"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.2"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <circle cx="12" cy="12" r="9" />
    <path d="M12 7v5l3 2" />
  </svg>
);

const StaleItem = ({ manhwa, site }) => {
  const href = manhwa.currentChapterUrl || `https://${site?.baseUrl}`;
  const { src: proxiedCover, error: coverError } = useProxiedImage(manhwa.imgUrl);

  const placeholderSvg = `data:image/svg+xml,${encodeURIComponent(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 2 3" width="100%" height="100%" preserveAspectRatio="none">
      <rect width="2" height="3" fill="var(--surface-2)"/>
      <text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" 
            font-family="system-ui, sans-serif" font-size="0.15" fill="var(--text-faint)">
        Sin portada
      </text>
    </svg>
  `)}`;
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
          src={coverError ? placeholderSvg : (proxiedCover ?? placeholderSvg)}
          alt={`${manhwa.title} cover`}
          loading="lazy"
          decoding="async"
          draggable={false}
        />
        <span className={staleStyles.badge}>
          {formatTimeAgo(manhwa.lastTimeRead)}
        </span>
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
};

const StaleCarousel = ({ refreshKey }) => {
  const { getStaleManhwas } = useDexie();
  const [page, setPage] = useState(1);
  const [pageCount, setPageCount] = useState(1);
  const [total, setTotal] = useState(0);
  const [items, setItems] = useState([]);
  const [threshold, setThreshold] = useState(() => getStaleThreshold());

  useEffect(() => {
    let cancelled = false;

    const loadStale = async () => {
      try {
        const { manhwasAndSite, total: staleTotal } = await getStaleManhwas(
          page,
          STALE_CHUNK,
          threshold
        );
        if (cancelled) return;

        const nextPageCount = Math.max(1, Math.ceil(staleTotal / STALE_CHUNK));
        setTotal(staleTotal);
        setPageCount(nextPageCount);
        setItems(manhwasAndSite);
        if (page > nextPageCount) setPage(nextPageCount);
      } catch (error) {
        addToastMessage("error", "Error getting pending manhwas!");
        console.log("Error getting pending manhwas", error.message);
      }
    };

    loadStale();
    return () => {
      cancelled = true;
    };
  }, [page, refreshKey, threshold, getStaleManhwas]);

  const handleThresholdChange = (event) => {
    const nextThreshold = Number(event.target.value);
    setStaleThreshold(nextThreshold);
    setThreshold(nextThreshold);
    setPage(1);
  };

  const thresholdControl = (
    <label className={staleStyles.thresholdControl}>
      <span className={staleStyles.thresholdLabel}>Unread for</span>
      <select
        className={staleStyles.thresholdSelect}
        value={threshold}
        onChange={handleThresholdChange}
        aria-label="Time unread range filter"
      >
        {STALE_THRESHOLDS.map(({ value, label }) => (
          <option key={value} value={value}>
            {label}
          </option>
        ))}
      </select>
    </label>
  );

  const emptyState = (
    <div className={staleStyles.emptyState}>
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <path d="M20 6 9 17l-5-5" />
      </svg>
      <p className={staleStyles.emptyStateTitle}>You're all caught up!</p>
      <p className={staleStyles.emptyStateText}>
        No series pending to continue.
      </p>
    </div>
  );

  return (
    <CarouselBase
      title="Continue reading"
      icon={<ClockIcon />}
      count={total}
      items={items}
      renderItem={(item) => <StaleItem manhwa={item.manhwa} site={item.site} />}
      itemKey={({ manhwa }) => manhwa.idManhwa}
      page={page}
      pageCount={pageCount}
      onPageChange={setPage}
      ariaLabel="Series not read recently"
      accentColor="var(--status-hiatus)"
      prevGroupLabel="Previous pending group"
      nextGroupLabel="Next pending group"
      scrollPrevLabel="Scroll pending left"
      scrollNextLabel="Scroll pending right"
      dotLabel={(n) => `Go to pending group ${n}`}
      headerExtra={thresholdControl}
      emptyState={emptyState}
    />
  );
};

export default StaleCarousel;