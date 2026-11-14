import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  fetchMangaDex,
  mapStatus,
  extractGenres,
  buildCoverUrl,
  pickBestCandidate,
  scoreCandidate,
  mangadexCache,
} from "../mangadex.js";

const jsonResponse = (body, { status = 200, contentType = "application/json" } = {}) => ({
  ok: status >= 200 && status < 300,
  status,
  headers: {
    get: (name) =>
      name.toLowerCase() === "content-type" ? contentType : null,
  },
  json: async () => body,
});

const makeCandidate = (overrides = {}) => ({
  id: "abc-123",
  attributes: {
    title: { en: "Solo Leveling" },
    altTitles: [],
    status: "ongoing",
    chapters: "110",
    tags: [
      { attributes: { group: "genre", name: { en: "Action" } } },
      { attributes: { group: "theme", name: { en: "Monsters" } } },
      { attributes: { group: "format", name: { en: "Long Strip" } } },
    ],
  },
  relationships: [{ type: "cover_art", attributes: { fileName: "cover.jpg" } }],
  ...overrides,
});

let fetchMock;

beforeEach(() => {
  fetchMock = vi.fn();
  vi.stubGlobal("fetch", fetchMock);
  mangadexCache.clear();
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("mapStatus", () => {
  it.each([
    ["completed", "FINISHED"],
    ["ongoing", "RELEASING"],
    ["hiatus", "HIATUS"],
    ["cancelled", "CANCELLED"],
    ["something-else", "UNKNOWN"],
    [undefined, "UNKNOWN"],
  ])("maps %s to %s", (input, expected) => {
    expect(mapStatus(input)).toBe(expected);
  });
});

describe("extractGenres", () => {
  it("keeps genre and theme tags, drops format tags and missing names", () => {
    const tags = [
      { attributes: { group: "genre", name: { en: "Action" } } },
      { attributes: { group: "theme", name: { en: "Monsters" } } },
      { attributes: { group: "format", name: { en: "Long Strip" } } },
      { attributes: { group: "genre", name: {} } },
    ];
    expect(extractGenres(tags)).toEqual(["Action", "Monsters"]);
  });

  it("returns [] for non-array input", () => {
    expect(extractGenres(undefined)).toEqual([]);
  });
});

describe("buildCoverUrl", () => {
  it("builds the uploads.mangadex.org cover URL", () => {
    expect(buildCoverUrl("abc-123", { attributes: { fileName: "f.jpg" } })).toBe(
      "https://uploads.mangadex.org/covers/abc-123/f.jpg"
    );
  });

  it("returns null when there is no cover_art relationship", () => {
    expect(buildCoverUrl("abc-123", null)).toBe(null);
    expect(buildCoverUrl("abc-123", { attributes: {} })).toBe(null);
  });
});

describe("scoreCandidate / pickBestCandidate", () => {
  it("scores exact title match highest", () => {
    const exact = makeCandidate({ id: "1" });
    const partial = makeCandidate({
      id: "2",
      attributes: {
        title: { en: "Solo Leveling Ragnarok" },
        altTitles: [],
        tags: [],
      },
    });
    expect(pickBestCandidate([partial, exact], "solo leveling").id).toBe("1");
  });

  it("returns null when there are no results", () => {
    expect(pickBestCandidate([], "anything")).toBe(null);
    expect(pickBestCandidate(null, "anything")).toBe(null);
  });

  it("word overlap produces a nonzero score", () => {
    const candidate = makeCandidate({
      id: "3",
      attributes: {
        title: { en: "The Solo Journey" },
        altTitles: [],
        tags: [],
      },
    });
    expect(scoreCandidate(candidate, "solo journey")).toBeGreaterThan(0);
  });
});

describe("fetchMangaDex", () => {
  it("returns mapped data on success", async () => {
    fetchMock.mockResolvedValueOnce(
      jsonResponse({ result: "ok", data: [makeCandidate()] })
    );

    const result = await fetchMangaDex("solo leveling");

    expect(result.ok).toBe(true);
    expect(result.source).toBe("mangadex");
    expect(result.data).toEqual({
      chapters: 110,
      genres: ["Action", "Monsters"],
      coverImage: { large: "https://uploads.mangadex.org/covers/abc-123/cover.jpg" },
      status: "RELEASING",
    });

    const [url] = fetchMock.mock.calls[0];
    expect(url).toContain("https://api.mangadex.org/manga?title=solo%20leveling");
    expect(url).toContain("includes[]=cover_art");
  });

  it("returns a descriptive error (not a JSON.parse error) when the search returns HTML with HTTP 403", async () => {
    fetchMock.mockResolvedValueOnce({
      ok: false,
      status: 403,
      headers: { get: () => "text/html" },
      json: async () => {
        throw new Error("body is not JSON");
      },
    });

    const result = await fetchMangaDex("blocked title");

    expect(result.ok).toBe(false);
    expect(result.error).toBe("HTTP 403");
    expect(result.error).not.toContain("JSON.parse");
  });

  it("mentions rate limiting on HTTP 429", async () => {
    fetchMock.mockResolvedValueOnce({
      ok: false,
      status: 429,
      headers: { get: () => "application/json" },
      json: async () => ({ result: "error" }),
    });

    const result = await fetchMangaDex("ratelimited title");

    expect(result.ok).toBe(false);
    expect(result.error).toBe("HTTP 429 (rate limited)");
  });

  it("returns an error when the search returns 200 with a non-JSON body", async () => {
    fetchMock.mockResolvedValueOnce({
      ok: true,
      status: 200,
      headers: { get: () => "text/html" },
      json: async () => {
        throw new Error("body is not JSON");
      },
    });

    const result = await fetchMangaDex("weird title");

    expect(result.ok).toBe(false);
    expect(result.error).toContain("Non-JSON response");
  });

  it("returns an error when no manga is found", async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse({ result: "ok", data: [] }));

    const result = await fetchMangaDex("unknown title");

    expect(result.ok).toBe(false);
    expect(result.error).toBe("No manga found on MangaDex");
  });

  it("returns null cover when the candidate has no cover_art relationship", async () => {
    fetchMock.mockResolvedValueOnce(
      jsonResponse({
        result: "ok",
        data: [
          makeCandidate({
            relationships: [{ type: "author", attributes: { name: "x" } }],
          }),
        ],
      })
    );

    const result = await fetchMangaDex("no cover title");

    expect(result.ok).toBe(true);
    expect(result.data.coverImage).toEqual({ large: null });
  });

  it("falls back to the aggregate endpoint when chapters is null", async () => {
    fetchMock
      .mockResolvedValueOnce(
        jsonResponse({
          result: "ok",
          data: [
            makeCandidate({
              attributes: {
                title: { en: "Aggregate Test" },
                altTitles: [],
                status: "ongoing",
                tags: [],
              },
            }),
          ],
        })
      )
      .mockResolvedValueOnce(
        jsonResponse({
          result: "ok",
          chapters: {
            vol1: { c1: {}, c2: {} },
            vol2: { c3: {} },
          },
        })
      );

    const result = await fetchMangaDex("aggregate title");

    expect(result.ok).toBe(true);
    expect(result.data.chapters).toBe(3);
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(fetchMock.mock.calls[1][0]).toBe(
      "https://api.mangadex.org/manga/abc-123/aggregate"
    );
  });

  it("reports 0 chapters when the aggregate endpoint also fails", async () => {
    fetchMock
      .mockResolvedValueOnce(
        jsonResponse({
          result: "ok",
          data: [
            makeCandidate({
              attributes: {
                title: { en: "Aggregate Fail" },
                altTitles: [],
                status: "ongoing",
                tags: [],
              },
            }),
          ],
        })
      )
      .mockResolvedValueOnce({
        ok: false,
        status: 404,
        headers: { get: () => "text/html" },
        json: async () => {
          throw new Error("body is not JSON");
        },
      });

    const result = await fetchMangaDex("aggregate fail title");

    expect(result.ok).toBe(true);
    expect(result.data.chapters).toBe(0);
  });

  it("serves repeated titles from cache (single search call)", async () => {
    fetchMock.mockResolvedValue(
      jsonResponse({ result: "ok", data: [makeCandidate()] })
    );

    const first = await fetchMangaDex("cached md title");
    const second = await fetchMangaDex("cached md title");

    expect(first.ok).toBe(true);
    expect(second.ok).toBe(true);
    expect(second.data).toEqual(first.data);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
});
