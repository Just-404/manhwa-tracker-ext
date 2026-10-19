const ManhwaStatus = Object.freeze({
  FINISHED: "FINISHED",
  HIATUS: "HIATUS",
  RELEASING: "RELEASING",
  CANCELLED: "CANCELLED",
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
    default:
      return "var(--status-unknown)";
  }
};

export default ManhwaStatus;
