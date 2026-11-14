import {
  cleanTitle,
  extractChapterFromUrl,
  getDomainName,
} from "./utils/utils";
import { matchSitePattern } from "./utils/sitePatterns";

if (!window.__MY_CONTENT_SCRIPT_INJECTED__) {
  window.__MY_CONTENT_SCRIPT_INJECTED__ = true;
}

const runtime = browser.runtime || chrome.runtime;

// Siempre registrar el listener para responder al popup, aunque el script
// ya se haya inyectado anteriormente en esta pestaña.
if (!window.__MY_CONTENT_SCRIPT_LISTENER__) {
  window.__MY_CONTENT_SCRIPT_LISTENER__ = true;

  runtime.onMessage.addListener((msg, sender, sendResponse) => {
    if (msg.action === "extractInfo") {
      (async () => {
        const baseUrl = window.location.hostname;

        // Per-site patterns first; hosts not registered keep the generic logic
        const siteMatch = matchSitePattern(
          baseUrl,
          window.location.pathname
        );
        const rawTitle = siteMatch
          ? siteMatch.title
          : window.location.pathname.split("/")[2];
        const chapter = siteMatch
          ? siteMatch.chapter
          : extractChapterFromUrl(window.location.href);

        // stripHashSuffix only for the generic fallback path: registered site
        // slugs are already clean and must not lose their last word
        const cleanedTitle = decodeURIComponent(
          cleanTitle(rawTitle, !siteMatch)
        );

        const site = {
          name: getDomainName(baseUrl),
          baseUrl,
          isActive: 1,
          language: navigator.language,
          lastChecked: new Date().toISOString(),
          imgUrl: `https://s2.googleusercontent.com/s2/favicons?domain_url=https://${baseUrl}`,
        };

        const manhwa = {
          title: cleanedTitle,
          chapters: null,
          currentChapterUrl: window.location.href,
          lastReadChapter: chapter,
          isFavorite: 0,
          status: null,
          lastTimeRead: new Date().toISOString(),
          imgUrl: null,
          genre: null,
          note: "",
        };

        runtime.sendMessage(
          { action: "fetchComicData", title: cleanedTitle },
          (response) => {
            if (response?.success && response.data) {
              const media = response.data;
              manhwa.chapters = media.chapters;
              manhwa.genre = media.genres.join(", ");
              manhwa.imgUrl = media.coverImage.large;
              manhwa.status = media.status || manhwa.status;
            } else {
              console.warn("Anilist fetch failed or returned no data");
            }

            sendResponse({ site, manhwa });
          }
        );
      })();

      return true;
    }
  });
}

