import { describe, expect, it } from "vitest";
import { matchSitePattern } from "../sitePatterns.js";
import { cleanTitle, extractChapterFromUrl } from "../utils.js";

// The 8 real URLs the registry was built from (maintainer-provided).
const URLS = [
  {
    url: "https://comix.to/title/qqwrm-full-time-awakening/11487838-chapter-166",
    hostname: "comix.to",
    pathname: "/title/qqwrm-full-time-awakening/11487838-chapter-166",
    title: "Full Time Awakening",
    chapter: 166,
  },
  {
    url: "https://asurascans.com/comics/the-heavenly-demon-wants-a-quiet-life-f212c582/chapter/103",
    hostname: "asurascans.com",
    pathname:
      "/comics/the-heavenly-demon-wants-a-quiet-life-f212c582/chapter/103",
    title: "The Heavenly Demon Wants A Quiet Life",
    chapter: 103,
  },
  {
    url: "https://www.toongod.org/webtoon/the-ultimate-shut-in/chapter-1/",
    hostname: "www.toongod.org",
    pathname: "/webtoon/the-ultimate-shut-in/chapter-1/",
    title: "The Ultimate Shut In",
    chapter: 1,
  },
  {
    url: "https://manhwatop.com/manga/solo-maxlevel-newbie-series-manhwa/chapter-0/",
    hostname: "manhwatop.com",
    pathname: "/manga/solo-maxlevel-newbie-series-manhwa/chapter-0/",
    title: "Solo Maxlevel Newbie Series Manhwa",
    chapter: 0,
  },
  {
    url: "https://dragontea.ink/novel/apocalyptic-survival-i-can-see-hidden-clues/chapter-66/",
    hostname: "dragontea.ink",
    pathname:
      "/novel/apocalyptic-survival-i-can-see-hidden-clues/chapter-66/",
    title: "Apocalyptic Survival I Can See Hidden Clues",
    chapter: 66,
  },
  {
    url: "https://roliascan.com/read/the-artist-who-draws-dungeons/ch32-363585/",
    hostname: "roliascan.com",
    pathname: "/read/the-artist-who-draws-dungeons/ch32-363585/",
    title: "The Artist Who Draws Dungeons",
    chapter: 32,
  },
  {
    url: "https://kunmanga.com/manga/global-freeze-i-created-an-apocalypse-shelter/chapter-633/",
    hostname: "kunmanga.com",
    pathname:
      "/manga/global-freeze-i-created-an-apocalypse-shelter/chapter-633/",
    title: "Global Freeze I Created An Apocalypse Shelter",
    chapter: 633,
  },
  {
    url: "https://manhuatop.org/manhua/her-summon-series/chapter-88/",
    hostname: "manhuatop.org",
    pathname: "/manhua/her-summon-series/chapter-88/",
    title: "Her Summon Series",
    chapter: 88,
  },
];

// What the content script does with a match: cleanTitle with the anti-hash
// strip disabled, since registered slugs are already clean.
const toTitle = (raw) => cleanTitle(raw, false);

describe("matchSitePattern", () => {
  it.each(URLS)(
    "extracts title and chapter for $hostname",
    ({ hostname, pathname, title, chapter }) => {
      const match = matchSitePattern(hostname, pathname);

      expect(match).not.toBe(null);
      expect(toTitle(match.title)).toBe(title);
      expect(match.chapter).toBe(chapter);
    }
  );

  it("returns null for unregistered hosts (generic fallback applies)", () => {
    expect(
      matchSitePattern("some-other-site.com", "/manga/solo-leveling/chapter-12/")
    ).toBe(null);
  });

  it("returns null for empty or missing input", () => {
    expect(matchSitePattern("", "/title/x/")).toBe(null);
    expect(matchSitePattern("comix.to", "")).toBe(null);
  });

  it("matches subdomains of registered hosts", () => {
    const match = matchSitePattern(
      "www.toongod.org",
      "/webtoon/some-title/chapter-2/"
    );
    expect(match.chapter).toBe(2);
  });
});

describe("comix.to specifics", () => {
  it("drops everything before the first dash of the slug", () => {
    const match = matchSitePattern(
      "comix.to",
      "/title/abcd12-some-title-name/99-chapter-5"
    );
    expect(match.title).toBe("some-title-name");
  });

  it("keeps the whole slug when it has no dash", () => {
    const match = matchSitePattern("comix.to", "/title/noblesse/99-chapter-5");
    expect(match.title).toBe("noblesse");
  });
});

describe("fractional chapters", () => {
  it.each([
    ["kunmanga.com", "/manga/x/chapter-16.5/", 16.5],
    ["asurascans.com", "/comics/x-f212c582/chapter/16.5", 16.5],
    ["comix.to", "/title/a-title/99-chapter-16.5", 16.5],
    ["roliascan.com", "/read/x/ch16.5-363585/", 16.5],
  ])("extracts fractional chapter on %s", (hostname, pathname, expected) => {
    const match = matchSitePattern(hostname, pathname);
    expect(match).not.toBe(null);
    expect(match.chapter).toBe(expected);
  });

  it("also supports fractional chapters via the generic fallback regex", () => {
    expect(extractChapterFromUrl("https://x.com/manga/a/chapter-16.5")).toBe(
      16.5
    );
  });
});
