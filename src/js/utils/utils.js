const cleanTitle = (title) => {
  const parts = title.split("-");
  const lastPart = parts[parts.length - 1];

  if (/^[a-z0-9]{6,}$/.test(lastPart)) {
    parts.pop();
  }

  return parts
    .join(" ")
    .replace(/\b\w/g, (char) => char.toUpperCase())
    .trim();
};

const extractChapterFromUrl = (url) => {
  const lUrl = url.toLowerCase();
  const match = lUrl.match(/\/chapter[-/](\d+(\.\d+)?)/);

  return match ? parseFloat(match[1]) : null;
};
const getDomainName = (hostname) => {
  const parts = hostname.split(".");
  if (parts.length <= 2) return parts[0];
  if (parts[0] === "www") parts.shift();
  return parts[parts.length - 2];
};

// Tiempo relativo corto (en inglés) para las tarjetas del carrusel: "Today",
// "5d ago", "3w ago", "2mo ago", "1y ago".
const formatTimeAgo = (isoString) => {
  if (!isoString) return "";
  const then = new Date(isoString).getTime();
  if (Number.isNaN(then)) return "";

  const days = Math.floor((Date.now() - then) / 86400000);

  if (days < 1) return "Today";
  if (days < 7) return `${days}d ago`;

  const weeks = Math.floor(days / 7);
  if (days < 30) return `${weeks}w ago`;

  const months = Math.floor(days / 30);
  if (days < 365) return `${months}mo ago`;

  const years = Math.floor(days / 365);
  return `${years}y ago`;
};

export { cleanTitle, extractChapterFromUrl, getDomainName, formatTimeAgo };
