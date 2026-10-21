// MangaDex API v5 adapter
// Maps MangaDex response to the same contract AniList uses:
// { chapters, genres, coverImage: { large }, status }

const mangadexCache = new Map();
const CACHE_TTL = 10 * 60 * 1000;

const MANGADEX_API = "https://api.mangadex.org";
const COVER_BASE = "https://uploads.mangadex.org/covers";

// Status mapping from MangaDex to our enum
export const mapStatus = (mdStatus) => {
  switch (mdStatus) {
    case "completed":
      return "FINISHED";
    case "ongoing":
      return "RELEASING";
    case "hiatus":
      return "HIATUS";
    case "cancelled":
      return "CANCELLED";
    default:
      return "UNKNOWN";
  }
};

// Extract genre/theme tags, ignore format tags
export const extractGenres = (tags) => {
  if (!Array.isArray(tags)) return [];
  return tags
    .filter((t) => t.attributes?.group === "genre" || t.attributes?.group === "theme")
    .map((t) => t.attributes?.name?.en)
    .filter(Boolean);
};

// Score a candidate by title similarity and chapter count
export const scoreCandidate = (candidate, searchTitle) => {
  const attrs = candidate.attributes;
  const titles = [
    attrs.title?.en,
    ...(attrs.altTitles || []).map((t) => Object.values(t)[0]),
  ].filter(Boolean);

  const norm = (s) => s.toLowerCase().replace(/[^a-z0-9]/g, "");
  const searchNorm = norm(searchTitle);

  let bestScore = 0;
  for (const t of titles) {
    const tNorm = norm(t);
    if (tNorm === searchNorm) {
      bestScore = Math.max(bestScore, 100);
    } else if (tNorm.includes(searchNorm) || searchNorm.includes(tNorm)) {
      bestScore = Math.max(bestScore, 70);
    } else {
      // Simple word overlap
      const sw = new Set(searchNorm.split(/\s+/).filter(Boolean));
      const tw = new Set(tNorm.split(/\s+/).filter(Boolean));
      const overlap = [...sw].filter((w) => tw.has(w)).length;
      bestScore = Math.max(bestScore, overlap * 10);
    }
  }

  // Bonus for having chapters
  const chapterCount = attrs.chapters ? parseFloat(attrs.chapters) || 0 : 0;
  if (chapterCount > 0) bestScore += Math.min(chapterCount, 20);

  return bestScore;
};

// Pick best candidate from search results
export const pickBestCandidate = (results, searchTitle) => {
  if (!results?.length) return null;

  const scored = results
    .map((r) => ({ ...r, _score: scoreCandidate(r, searchTitle) }))
    .sort((a, b) => b._score - a._score);

  return scored[0] || null;
};

// Build cover URL from manga ID and cover relationship
export const buildCoverUrl = (mangaId, coverRelationship) => {
  if (!coverRelationship?.attributes?.fileName) return null;
  return `${COVER_BASE}/${mangaId}/${coverRelationship.attributes.fileName}`;
};

// Fetch chapter count via aggregate if not in attributes
const fetchAggregate = async (mangaId) => {
  try {
    const res = await fetch(`${MANGADEX_API}/manga/${mangaId}/aggregate`, {
      method: "GET",
    });
    const json = await res.json();
    if (json.result === "ok" && json.chapters) {
      const volumes = Object.values(json.chapters);
      let total = 0;
      for (const vol of volumes) {
        total += Object.values(vol).length;
      }
      return total || null;
    }
  } catch {
    // ignore
  }
  return null;
};

// Main fetch function
export const fetchMangaDex = async (title) => {
  const now = Date.now();

  // Check cache
  const cached = mangadexCache.get(title);
  if (cached && now - cached.ts < CACHE_TTL) {
    return { ok: true, data: cached.value, source: "mangadex" };
  }

  try {
    // Search for manga
    const searchRes = await fetch(
      `${MANGADEX_API}/manga?title=${encodeURIComponent(title)}&limit=5&includes[]=cover_art&includes[]=tags`
    );
    const searchJson = await searchRes.json();

    if (searchJson.result !== "ok" || !searchJson.data?.length) {
      return { ok: false, error: "No manga found on MangaDex" };
    }

    const candidate = pickBestCandidate(searchJson.data, title);
    if (!candidate) {
      return { ok: false, error: "No suitable manga match" };
    }

    const attrs = candidate.attributes;
    const mangaId = candidate.id;

    // Get cover relationship
    const coverRel = (candidate.relationships || []).find(
      (r) => r.type === "cover_art"
    );

    // Build cover URL
    const coverUrl = buildCoverUrl(mangaId, coverRel);

    // Get chapter count (fallback to aggregate if null)
    let chapters = attrs.chapters ? parseFloat(attrs.chapters) : null;
    if (chapters == null) {
      chapters = await fetchAggregate(mangaId);
    }

    // Extract genres from tags
    const genres = extractGenres(attrs.tags || []);

    // Map status
    const status = mapStatus(attrs.status);

    const data = {
      chapters: chapters || 0,
      genres,
      coverImage: { large: coverUrl },
      status,
    };

    // Cache successful response
    mangadexCache.set(title, { ts: now, value: data });

    return { ok: true, data, source: "mangadex" };
  } catch (error) {
    console.error("MangaDex fetch failed:", error);
    return { ok: false, error: error.message };
  }
};

// Export cache for testing
export { mangadexCache };