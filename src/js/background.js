const runtime = browser.runtime || chrome.runtime;

import { fetchAniList } from "./api/anilist.js";
import { fetchMangaDex } from "./api/mangadex.js";
import { createCircuitBreaker } from "./utils/circuitBreaker.js";

// Circuit breaker: opens after 3 consecutive AniList failures, for 15 min.
const breaker = createCircuitBreaker({ threshold: 3, cooldownMs: 15 * 60 * 1000 });

const mainCache = new Map();
const CACHE_TTL = 10 * 60 * 1000;

runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.action === "fetchComicData") {
    const cleanedTitle = msg.title;
    const now = Date.now();

    // Check main cache first
    const cached = mainCache.get(cleanedTitle);
    if (cached && now - cached.ts < CACHE_TTL) {
      sendResponse({ ...cached.value, cached: true });
      return true;
    }

    const executeFetch = async () => {
      const breakerWasOpen = breaker.isOpen();

      // Try AniList first (unless circuit breaker is open)
      let anilistError = null;
      if (!breakerWasOpen) {
        const anilistResult = await fetchAniList(cleanedTitle);
        if (anilistResult.ok) {
          breaker.recordSuccess();
          const response = { success: true, data: anilistResult.data, source: "anilist" };
          mainCache.set(cleanedTitle, { ts: now, value: response });
          sendResponse(response);
          return;
        }
        // AniList failed - record failure and fall through to MangaDex
        anilistError = anilistResult.error;
        breaker.recordFailure();
        console.warn(
          breaker.isOpen()
            ? "AniList failed repeatedly, circuit breaker opened. Falling back to MangaDex:"
            : "AniList failed, falling back to MangaDex:",
          anilistError
        );
      } else {
        console.log("AniList circuit breaker open, skipping to MangaDex");
      }

      // Try MangaDex
      const mangadexResult = await fetchMangaDex(cleanedTitle);
      if (mangadexResult.ok) {
        const response = { success: true, data: mangadexResult.data, source: "mangadex" };
        mainCache.set(cleanedTitle, { ts: now, value: response });
        sendResponse(response);
        return;
      }

      // Both failed
      const anilistReason = breakerWasOpen
        ? "circuit breaker open"
        : anilistError || "failed";
      sendResponse({
        success: false,
        error: `AniList: ${anilistReason}; MangaDex: ${mangadexResult.error}`,
      });
    };

    executeFetch().catch((error) => {
      console.error("Background fetch failed:", error);
      sendResponse({ success: false, error: error.message });
    });

    return true;
  }
});
