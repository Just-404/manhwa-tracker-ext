const runtime = browser.runtime || chrome.runtime;

import { fetchAniList } from "./api/anilist.js";
import { fetchMangaDex } from "./api/mangadex.js";

// Circuit breaker state
const circuitBreaker = {
  anilistDown: false,
  anilistDownUntil: 0,
  ANILIST_COOLDOWN: 15 * 60 * 1000, // 15 min
};

const mainCache = new Map();
const CACHE_TTL = 10 * 60 * 1000;

const checkCircuitBreaker = () => {
  const now = Date.now();
  if (circuitBreaker.anilistDown && now >= circuitBreaker.anilistDownUntil) {
    circuitBreaker.anilistDown = false;
  }
};

const recordAniListFailure = () => {
  circuitBreaker.anilistDown = true;
  circuitBreaker.anilistDownUntil = Date.now() + circuitBreaker.ANILIST_COOLDOWN;
};

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
      checkCircuitBreaker();

      // Try AniList first (unless circuit breaker is open)
      if (!circuitBreaker.anilistDown) {
        const anilistResult = await fetchAniList(cleanedTitle);
        if (anilistResult.ok) {
          const response = { success: true, data: anilistResult.data, source: "anilist" };
          mainCache.set(cleanedTitle, { ts: now, value: response });
          sendResponse(response);
          return;
        }
        // AniList failed - record failure and fall through to MangaDex
        console.warn("AniList failed, falling back to MangaDex:", anilistResult.error);
        recordAniListFailure();
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
      sendResponse({
        success: false,
        error: `AniList: ${circuitBreaker.anilistDown ? "circuit breaker open" : "failed"}; MangaDex: ${mangadexResult.error}`,
      });
    };

    executeFetch().catch((error) => {
      console.error("Background fetch failed:", error);
      sendResponse({ success: false, error: error.message });
    });

    return true;
  }
});
