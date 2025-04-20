const runtime = browser.runtime || chrome.runtime;

runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.action === "fetchComicData") {
    const cleanedTitle = msg.title;

    fetch("https://graphql.anilist.co", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({
        query: `query {
            Media(search: "${cleanedTitle}", type: MANGA) {
              chapters
              genres
              coverImage { large }
              status
            }
          }`,
      }),
    })
      .then((res) => res.json())
      .then((json) => {
        sendResponse({ success: true, data: json.data.Media });
      })
      .catch((error) => {
        console.error("Background fetch failed:", error);
        sendResponse({ success: false, error });
      });

    return true;
  }
});
