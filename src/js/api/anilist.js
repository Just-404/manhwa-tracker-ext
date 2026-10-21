const anilistCache = new Map();
const CACHE_TTL = 10 * 60 * 1000;

const QUERY = `
  query ($search: String) {
    Media(search: $search, type: MANGA) {
      chapters
      genres
      coverImage { large }
      status
    }
  }
`;

export const fetchAniList = async (title) => {
  const now = Date.now();

  // Check cache first
  const cached = anilistCache.get(title);
  if (cached && now - cached.ts < CACHE_TTL) {
    return { ok: true, data: cached.value, source: "anilist" };
  }

  try {
    const response = await fetch("https://graphql.anilist.co", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({
        query: QUERY,
        variables: { search: title },
      }),
    });

    const json = await response.json();

    if (json.errors) {
      console.error("AniList GraphQL errors:", json.errors);
      return { ok: false, error: json.errors.map((e) => e.message).join("; ") };
    }

    if (!json.data?.Media) {
      return { ok: false, error: "No media found for title" };
    }

    const data = {
      chapters: json.data.Media.chapters,
      genres: json.data.Media.genres,
      coverImage: { large: json.data.Media.coverImage.large },
      status: json.data.Media.status,
    };

    // Cache successful response
    anilistCache.set(title, { ts: now, value: data });

    return { ok: true, data, source: "anilist" };
  } catch (error) {
    console.error("AniList fetch failed:", error);
    return { ok: false, error: error.message };
  }
};