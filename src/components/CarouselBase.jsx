import { useCallback, useEffect, useState } from "react";
import useEmblaCarousel from "embla-carousel-react";
import styles from "../css/carousel.module.css";

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

/**
 * Carrusel compartido (Embla) usado por FavoritesCarousel y StaleCarousel.
 *
 * - Escritorio: sin arrastre, navegación por flechas.
 * - Móvil (< 601px): arrastre habilitado (Firefox Mobile).
 * - Paginación por grupos (dots + indicador en el header).
 */
const CarouselBase = ({
  title,
  icon,
  count,
  items = [],
  renderItem,
  itemKey,
  page,
  pageCount,
  onPageChange,
  ariaLabel,
  accentColor = "var(--favorite)",
  prevGroupLabel = "Previous group",
  nextGroupLabel = "Next group",
  scrollPrevLabel = "Scroll left",
  scrollNextLabel = "Scroll right",
  dotLabel = (n) => `Go to group ${n}`,
  headerExtra = null,
  emptyState = null,
}) => {
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

  // Recalcula el carrusel cuando cambian las tarjetas (cambio de página o
  // de datos). Se difiere para que los slides ya estén montados.
  useEffect(() => {
    if (!emblaApi) return;
    const timer = setTimeout(() => {
      emblaApi.reInit();
      onSelect();
    }, 0);
    return () => clearTimeout(timer);
  }, [items, emblaApi, onSelect]);

  const scrollPrev = useCallback(() => {
    emblaApi?.scrollPrev();
  }, [emblaApi]);

  const scrollNext = useCallback(() => {
    emblaApi?.scrollNext();
  }, [emblaApi]);

  const hasItems = items.length > 0;

  return (
    <section className={styles.section} aria-label={ariaLabel}>
      <div className={styles.sectionHeader}>
        <h2 className={styles.sectionTitle}>
          {icon && (
            <span className={styles.titleIcon} style={{ color: accentColor }}>
              {icon}
            </span>
          )}
          {title}
          {typeof count === "number" && (
            <span className={styles.sectionCount}>{count}</span>
          )}
        </h2>

        <div className={styles.headerControls}>
          {pageCount > 1 && (
            <div className={styles.navButtons}>
              <button
                type="button"
                className={styles.navBtn}
                aria-label={prevGroupLabel}
                disabled={page === 1}
                onClick={() => onPageChange(Math.max(1, page - 1))}
              >
                <ChevronIcon direction="left" />
              </button>
              <span className={styles.pageIndicator}>
                {page}/{pageCount}
              </span>
              <button
                type="button"
                className={styles.navBtn}
                aria-label={nextGroupLabel}
                disabled={page === pageCount}
                onClick={() => onPageChange(Math.min(pageCount, page + 1))}
              >
                <ChevronIcon direction="right" />
              </button>
            </div>
          )}
        </div>
      </div>

      {headerExtra && <div className={styles.sectionControls}>{headerExtra}</div>}

      {hasItems ? (
        <>
          <div className={styles.carouselWrapper}>
            <button
              type="button"
              className={styles.arrowBtn}
              aria-label={scrollPrevLabel}
              onClick={scrollPrev}
              disabled={!canScrollPrev}
            >
              <ChevronIcon direction="left" />
            </button>

            <div className={styles.embla}>
              <div className={styles.emblaViewport} ref={emblaRef}>
                <div className={styles.emblaContainer}>
                  {items.map((item, index) => (
                    <div
                      className={styles.emblaSlide}
                      key={itemKey(item, index)}
                    >
                      {renderItem(item, index)}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <button
              type="button"
              className={styles.arrowBtn}
              aria-label={scrollNextLabel}
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
                  aria-label={dotLabel(i + 1)}
                  aria-current={i + 1 === page ? "true" : undefined}
                  onClick={() => onPageChange(i + 1)}
                />
              ))}
            </div>
          )}
        </>
      ) : (
        emptyState
      )}
    </section>
  );
};

export default CarouselBase;
