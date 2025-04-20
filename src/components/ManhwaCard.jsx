import { useState } from "react";
import styles from "../css/manhwaCard.module.css";
import ManhwaStatus from "../js/utils/enums";
import EditModal from "./EditModal";

const ManhwaCard = ({ manhwa, site }) => {
  const [isFavorite, setIsFavorite] = useState(manhwa.isFavorite);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const toggleFavorite = () => {
    setIsFavorite(!isFavorite);
  };
  return (
    <>
      <div className={styles.manhwaCard}>
        <div className={styles.cardHeader}>
          <div className={styles.comicTitle}>
            <a href={null}>
              <img
                src={"../../icons/icon48.png"}
                alt={`${manhwa.title} front page`}
              />
            </a>
            <h3>
              Title: <em>{manhwa.title}</em>
            </h3>
          </div>

          <div className={styles.siteTitle}>
            <a href={site.baseUrl} target="blank" rel="noopener noreferrer">
              <img src={site.imgUrl} alt={`${site.name} logo`} />
            </a>
            <p>
              <b>On:</b> <i>{site.name}</i>
            </p>
            <div
              className={site.isActive ? styles.isActive : styles.isNotActive}
              aria-label="site status"
            ></div>
            <p>
              <b>
                <i>{site.language}</i>
              </b>
            </p>
          </div>
        </div>

        <div className={styles.cardBody}>
          <div className={styles.chaptersBox}>
            <p>
              <b>Chapters:</b> {manhwa.chapters}
            </p>
            <p>
              <b>{manhwa.status} </b>
            </p>
            <div
              className={
                manhwa.status == ManhwaStatus.COMPLETED
                  ? styles.completed
                  : manhwa.status == ManhwaStatus.DROPPED
                  ? styles.dropped
                  : manhwa.status == ManhwaStatus.HIATUS
                  ? styles.hiatus
                  : styles.onGoing
              }
            ></div>
          </div>
          <div className={styles.genreBox}>
            <p>
              <b>Genres: </b>
            </p>
            <p className={styles.genreP}>{manhwa.genre}</p>
          </div>

          <div>
            <p>
              <b>Last read chapter:</b> {manhwa.lastReadChapter}
            </p>
            <p>
              <b>On: </b>
              <i>{new Date(manhwa.lastTimeRead).toLocaleString()}</i>
            </p>
          </div>
          <p>
            <b>Note: </b> {manhwa.note}
          </p>
        </div>

        <div className={styles.iconsBox}>
          <button
            className={styles.iconBtn}
            aria-label="Favorite"
            onClick={toggleFavorite}
          >
            <svg
              fill={isFavorite ? "red" : "#aaa"}
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
          <button
            className={styles.iconBtn}
            aria-label="Edit"
            onClick={() => setIsModalOpen(true)}
          >
            <svg
              fill="#009ea3"
              height="24px"
              width="24px"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM21.41 
        6.34a1.25 1.25 0 0 0 0-1.77l-2.34-2.34a1.25 1.25 0 0 
        0-1.77 0l-1.83 1.83 3.75 3.75 1.19-1.19z"
              />
            </svg>
          </button>
          <button className={styles.iconBtn} aria-label="Delete">
            <svg
              fill="#e00000"
              height="24px"
              width="24px"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M16 9v10H8V9h8m-1.5-6h-5l-1 
        1H5v2h14V4h-4.5l-1-1zM18 7H6v12c0 
        1.1.9 2 2 2h8c1.1 0 2-.9 
        2-2V7z"
              />
            </svg>
          </button>
        </div>
      </div>

      {isModalOpen && (
        <EditModal
          manhwa={manhwa}
          site={site}
          isModalOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onSave={(updatedManhwa, updatedSiteInfo) => {
            // future update WIP
            setIsModalOpen(false);
          }}
        />
      )}
    </>
  );
};

export default ManhwaCard;
