// Per-site URL parsing patterns.
// Some sites use URL structures the generic heuristics in utils.js can't
// handle (title not at pathname segment 2, non-standard chapter formats).
// For each registered host we extract the raw title slug and the chapter
// number with site-specific regexes. Hosts not in the registry keep using
// the generic logic (contentScript.js applies it as fallback).
//
// All chapter regexes accept fractional chapters (\d+(?:\.\d+)?).

// Exact segments of the pathname, without leading/trailing empty strings.
const segments = (pathname) => pathname.split("/").filter(Boolean);

// comix.to: /title/qqwrm-full-time-awakening/11487838-chapter-166
// The slug starts with a random short token; everything before the first
// dash is site noise (confirmed by the maintainer), so it is dropped.
const comixTitle = (pathname) => {
  const slug = segments(pathname)[1] || "";
  const dashIndex = slug.indexOf("-");
  return dashIndex === -1 ? slug : slug.slice(dashIndex + 1);
};
const comixChapter = (pathname) => {
  const match = segments(pathname).join("/").match(/-chapter-(\d+(?:\.\d+)?)/);
  return match ? parseFloat(match[1]) : null;
};

// asurascans.com: /comics/the-heavenly-demon-wants-a-quiet-life-f212c582/chapter/103
const asuraTitle = (pathname) => {
  const slug = segments(pathname)[1] || "";
  return slug.replace(/-f[0-9a-f]{6,}$/i, "");
};
const asuraChapter = (pathname) => {
  const match = pathname.match(/\/chapter\/(\d+(?:\.\d+)?)/);
  return match ? parseFloat(match[1]) : null;
};

// roliascan.com: /read/the-artist-who-draws-dungeons/ch32-363585
const roliaChapter = (pathname) => {
  const last = segments(pathname).pop() || "";
  const match = last.match(/^ch(\d+(?:\.\d+)?)-\d+/);
  return match ? parseFloat(match[1]) : null;
};

// Generic family: /{category}/{slug}/chapter-N/ (optional trailing slash)
// Sites: toongod.org, manhwatop.com, dragontea.ink, kunmanga.com, manhuatop.org
const genericFamilyTitle = (pathname) => segments(pathname)[1] || "";
const genericFamilyChapter = (pathname) => {
  const match = pathname.match(/chapter-(\d+(?:\.\d+)?)/);
  return match ? parseFloat(match[1]) : null;
};

export const SITE_PATTERNS = [
  {
    name: "comix.to",
    host: /(^|\.)comix\.to$/,
    title: comixTitle,
    chapter: comixChapter,
  },
  {
    name: "asurascans.com",
    host: /(^|\.)asurascans\.com$/,
    title: asuraTitle,
    chapter: asuraChapter,
  },
  {
    name: "roliascan.com",
    host: /(^|\.)roliascan\.com$/,
    title: genericFamilyTitle,
    chapter: roliaChapter,
  },
  {
    name: "generic family",
    host: /(^|\.)(toongod\.org|manhwatop\.com|dragontea\.ink|kunmanga\.com|manhuatop\.org)$/,
    title: genericFamilyTitle,
    chapter: genericFamilyChapter,
  },
];

// Returns { name, title, chapter } for the first pattern whose host matches,
// or null when the site is not registered (caller falls back to the generic
// heuristics). `title` is the raw slug (dashes, no casing); the caller runs
// cleanTitle() on it.
export const matchSitePattern = (hostname, pathname) => {
  if (!hostname || !pathname) return null;

  const pattern = SITE_PATTERNS.find((p) => p.host.test(hostname));
  if (!pattern) return null;

  const title = pattern.title(pathname);
  if (!title) return null;

  return {
    name: pattern.name,
    title,
    chapter: pattern.chapter(pathname),
  };
};
