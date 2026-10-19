import styles from "../css/statsModal.module.css";
import ManhwaStatus, { statusColor } from "../js/utils/enums";

const STATUS_LABELS = {
  [ManhwaStatus.RELEASING]: "Releasing",
  [ManhwaStatus.FINISHED]: "Finished",
  [ManhwaStatus.HIATUS]: "Hiatus",
  [ManhwaStatus.CANCELLED]: "Cancelled",
  [ManhwaStatus.UNKNOWN]: "Unknown",
};

const STATUS_ORDER = [
  ManhwaStatus.RELEASING,
  ManhwaStatus.FINISHED,
  ManhwaStatus.HIATUS,
  ManhwaStatus.CANCELLED,
  ManhwaStatus.UNKNOWN,
];

const StatsModal = ({ stats, onClose }) => {
  const rows = STATUS_ORDER.map((status) => ({
    key: status,
    label: STATUS_LABELS[status],
    color: statusColor(status),
    count: stats?.byStatus?.[status] ?? 0,
  }));

  const counted = rows.reduce((sum, row) => sum + row.count, 0);
  const otherCount = Math.max(0, (stats?.total ?? 0) - counted);
  const maxCount = Math.max(1, ...rows.map((row) => row.count), otherCount);

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div
        className={styles.statsModal}
        role="dialog"
        aria-modal="true"
        aria-label="Library statistics"
        onClick={(e) => e.stopPropagation()}
      >
        <header className={styles.modalHeader}>
          <h2>Statistics</h2>
          <button
            type="button"
            className={styles.closeBtn}
            aria-label="Close statistics"
            onClick={onClose}
          >
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
              <path d="M18 6 6 18" />
              <path d="m6 6 12 12" />
            </svg>
          </button>
        </header>

        <p className={styles.totalLine}>
          <b>{stats?.total ?? 0}</b>
          {stats?.total === 1 ? " manhwa in your library" : " manhwas in your library"}
        </p>

        <ul className={styles.statsList}>
          {rows.map((row) => (
            <li key={row.key} className={styles.statsRow}>
              <span
                className={styles.rowDot}
                style={{ backgroundColor: row.color }}
                aria-hidden="true"
              />
              <span className={styles.rowLabel}>{row.label}</span>
              <span className={styles.rowBar} aria-hidden="true">
                <span
                  className={styles.rowBarFill}
                  style={{
                    width: `${(row.count / maxCount) * 100}%`,
                    backgroundColor: row.color,
                  }}
                />
              </span>
              <span className={styles.rowCount}>{row.count}</span>
            </li>
          ))}
          {otherCount > 0 && (
            <li className={styles.statsRow}>
              <span
                className={styles.rowDot}
                style={{ backgroundColor: "var(--text-faint)" }}
                aria-hidden="true"
              />
              <span className={styles.rowLabel}>Other</span>
              <span className={styles.rowBar} aria-hidden="true">
                <span
                  className={styles.rowBarFill}
                  style={{
                    width: `${(otherCount / maxCount) * 100}%`,
                    backgroundColor: "var(--text-faint)",
                  }}
                />
              </span>
              <span className={styles.rowCount}>{otherCount}</span>
            </li>
          )}
        </ul>
      </div>
    </div>
  );
};

export default StatsModal;
