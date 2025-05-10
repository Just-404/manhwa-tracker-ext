import ReactPaginate from "react-paginate";
import ManhwaCard from "./ManhwaCard";
import styles from "../css/library.module.css";

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
    <div>Data not Found</div>
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
        nextLabel="Next >"
        onPageChange={handlePageClick}
        pageRangeDisplayed={2}
        marginPagesDisplayed={1}
        pageCount={pageCount}
        forcePage={forcePage}
        previousLabel="< Prev"
        renderOnZeroPageCount={null}
        containerClassName={styles.pagination}
        pageLinkClassName="page-num"
        previousLinkClassName="page-num"
        nextLinkClassName="page-num"
        activeLinkClassName={styles.activeLink}
      />
    </>
  );
};

export default ComicsSection;
