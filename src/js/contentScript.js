import {
  cleanTitle,
  extractChapterFromUrl,
  getDomainName,
} from "./utils/utils";

const runtime = browser.runtime || chrome.runtime;

runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.action === "extractInfo") {
    (async () => {
      const baseUrl = window.location.hostname;
      const title = window.location.pathname.split("/")[2];
      const cleanedTitle = decodeURIComponent(cleanTitle(title));

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
        lastReadChapter: extractChapterFromUrl(window.location.href),
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
