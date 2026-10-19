import ReactPaginate from "react-paginate";
import ManhwaCard from "./ManhwaCard";
import styles from "../css/library.module.css";

const ChevronIcon = ({ direction }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
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

const ComicsSection = ({
  data,
  onPageCount,
  pageCount,
  onEditSite,
  onEditManhwa,
  onChangeFav,
  onDeleteManhwa,
  forcePage,
}) => {
  const handlePageClick = (e) => {
    let newPage = e.selected + 1;
    onPageCount(newPage);

    setTimeout(() => {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }, 50);
  };
  return !data || data.length === 0 ? (
    <div className={styles.emptyState}>
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
        <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
      </svg>
      <p>No manhwas found</p>
    </div>
  ) : (
    <>
      <section className={styles.manhwaSection}>
        {data.map((manhwaData) => (
          <ManhwaCard
            key={manhwaData.manhwa.idManhwa}
            manhwa={manhwaData.manhwa}
            site={manhwaData.site}
            onEditSite={onEditSite}
            onEditManhwa={onEditManhwa}
            onChangeFav={onChangeFav}
            onDeleteManhwa={onDeleteManhwa}
          />
        ))}
      </section>
      <ReactPaginate
        breakLabel="..."
        nextLabel={<ChevronIcon direction="right" />}
        onPageChange={handlePageClick}
        pageRangeDisplayed={2}
        marginPagesDisplayed={1}
        pageCount={pageCount}
        forcePage={forcePage}
        previousLabel={<ChevronIcon direction="left" />}
        renderOnZeroPageCount={null}
        containerClassName={styles.pagination}
        pageClassName={styles.pageItem}
        pageLinkClassName={styles.pageLink}
        previousClassName={styles.pageItem}
        previousLinkClassName={`${styles.pageLink} ${styles.pageEdge}`}
        nextClassName={styles.pageItem}
        nextLinkClassName={`${styles.pageLink} ${styles.pageEdge}`}
        breakClassName={styles.breakItem}
        breakLinkClassName={styles.pageLink}
        activeLinkClassName={styles.activeLink}
        disabledClassName={styles.disabledItem}
      />
    </>
  );
};

export default ComicsSection;
