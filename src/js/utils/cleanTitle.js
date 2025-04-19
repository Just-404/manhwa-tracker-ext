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

export default cleanTitle;
