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

export { cleanTitle, extractChapterFromUrl };
