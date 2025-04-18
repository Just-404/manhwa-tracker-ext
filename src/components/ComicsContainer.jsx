import ReactPaginate from "react-paginate";
import ManhwaCard from "./ManhwaCard";
import styles from "../css/library.module.css";

const ComicsSection = ({ data, onPageCount, pageCount }) => {
  const handlePageClick = (e) => {
    let newPage = e.selected + 1;
    onPageCount(newPage);
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
          />
        ))}
      </section>
      <ReactPaginate
        breakLabel="..."
        nextLabel="Next >"
        onPageChange={handlePageClick}
        pageRangeDisplayed={5}
        pageCount={pageCount}
        previousLabel="< Prev"
        renderOnZeroPageCount={null}
        containerClassName={styles.pagination}
        pageLinkClassName="page-num"
        previousLinkClassName="page-num"
        nextLinkClassName="page-num"
        activeLinkClassName="active-link"
      />
    </>
  );
};

export default ComicsSection;
