const runtime = browser.runtime || chrome.runtime;

// Simple in-memory cache for AniList responses (TTL ~10 min)
const anilistCache = new Map();
const CACHE_TTL = 10 * 60 * 1000;

runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.action === "fetchComicData") {
    const cleanedTitle = msg.title;
    const now = Date.now();

    // Check cache first
    const cached = anilistCache.get(cleanedTitle);
    if (cached && now - cached.ts < CACHE_TTL) {
      sendResponse(cached.value);
      return true;
    }

    // GraphQL with variables (avoids string interpolation issues)
    const query = `
      query ($search: String) {
        Media(search: $search, type: MANGA) {
          chapters
          genres
          coverImage { large }
          status
        }
      }
    `;

    fetch("https://graphql.anilist.co", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({
        query,
        variables: { search: cleanedTitle },
      }),
    })
      .then((res) => res.json())
      .then((json) => {
        let response;
        if (json.errors) {
          console.error("AniList GraphQL errors:", json.errors);
          response = { success: false, error: json.errors.map(e => e.message).join("; ") };
        } else if (!json.data?.Media) {
          response = { success: false, error: "No media found for title" };
        } else {
          response = { success: true, data: json.data.Media };
        }
        // Cache successful responses
        if (response.success) {
          anilistCache.set(cleanedTitle, { ts: now, value: response });
        }
        sendResponse(response);
      })
      .catch((error) => {
        console.error("Background fetch failed:", error);
        sendResponse({ success: false, error: error.message });
      });

    return true;
  }
});
