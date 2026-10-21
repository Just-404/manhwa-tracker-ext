const ManhwaStatus = Object.freeze({
  FINISHED: "FINISHED",
  HIATUS: "HIATUS",
  RELEASING: "RELEASING",
  CANCELLED: "CANCELLED",
  NOT_YET_RELEASED: "NOT_YET_RELEASED",
  DISCONTINUED: "DISCONTINUED",
  UNKNOWN: "UNKNOWN",
});

export const statusColor = (status) => {
  switch (status) {
    case ManhwaStatus.FINISHED:
      return "var(--status-finished)";
    case ManhwaStatus.RELEASING:
      return "var(--status-releasing)";
    case ManhwaStatus.HIATUS:
      return "var(--status-hiatus)";
    case ManhwaStatus.CANCELLED:
      return "var(--status-cancelled)";
    case ManhwaStatus.NOT_YET_RELEASED:
      return "var(--status-hiatus)";
    case ManhwaStatus.DISCONTINUED:
      return "var(--status-cancelled)";
    default:
      return "var(--status-unknown)";
  }
};

export default ManhwaStatus;
