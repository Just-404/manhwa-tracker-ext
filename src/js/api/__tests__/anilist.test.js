import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { fetchAniList } from "../anilist.js";

const jsonResponse = (body, { status = 200, contentType = "application/json" } = {}) => ({
  ok: status >= 200 && status < 300,
  status,
  headers: {
    get: (name) =>
      name.toLowerCase() === "content-type" ? contentType : null,
  },
  json: async () => body,
});

const htmlResponse = (status) => ({
  ok: status >= 200 && status < 300,
  status,
  headers: { get: (name) => (name.toLowerCase() === "content-type" ? "text/html" : null) },
  json: async () => {
    throw new Error("body is not JSON");
  },
});

let fetchMock;

beforeEach(() => {
  fetchMock = vi.fn();
  vi.stubGlobal("fetch", fetchMock);
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("fetchAniList", () => {
  it("returns mapped data on success", async () => {
    fetchMock.mockResolvedValueOnce(
      jsonResponse({
        data: {
          Media: {
            chapters: 201,
            genres: ["Action", "Fantasy"],
            coverImage: { large: "https://s4.anilist.co/cover.jpg" },
            status: "FINISHED",
          },
        },
      })
    );

    const result = await fetchAniList("solo leveling");

    expect(result.ok).toBe(true);
    expect(result.source).toBe("anilist");
    expect(result.data).toEqual({
      chapters: 201,
      genres: ["Action", "Fantasy"],
      coverImage: { large: "https://s4.anilist.co/cover.jpg" },
      status: "FINISHED",
    });

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe("https://graphql.anilist.co");
    expect(init.method).toBe("POST");
  });

  it("returns a descriptive error (not a JSON.parse error) when the server returns HTML with HTTP 502", async () => {
    fetchMock.mockResolvedValueOnce(htmlResponse(502));

    const result = await fetchAniList("some title");

    expect(result.ok).toBe(false);
    expect(result.error).toBe("HTTP 502");
    expect(result.error).not.toContain("JSON.parse");
  });

  it("returns joined GraphQL error messages", async () => {
    fetchMock.mockResolvedValueOnce(
      jsonResponse({
        errors: [{ message: "Too Many Requests" }, { message: "slow down" }],
      })
    );

    const result = await fetchAniList("another title");

    expect(result.ok).toBe(false);
    expect(result.error).toBe("Too Many Requests; slow down");
  });

  it("returns an error when no Media is found", async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse({ data: { Media: null } }));

    const result = await fetchAniList("nonexistent title");

    expect(result.ok).toBe(false);
    expect(result.error).toBe("No media found for title");
  });

  it("does not throw when Media has no coverImage", async () => {
    fetchMock.mockResolvedValueOnce(
      jsonResponse({
        data: {
          Media: {
            chapters: 12,
            genres: ["Action"],
            status: "RELEASING",
            coverImage: null,
          },
        },
      })
    );

    const result = await fetchAniList("title without cover");

    expect(result.ok).toBe(true);
    expect(result.data.coverImage).toEqual({ large: null });
  });

  it("serves repeated titles from cache (single fetch call)", async () => {
    fetchMock.mockResolvedValue(
      jsonResponse({
        data: {
          Media: {
            chapters: 5,
            genres: ["Drama"],
            coverImage: { large: "https://s4.anilist.co/c.jpg" },
            status: "RELEASING",
          },
        },
      })
    );

    const first = await fetchAniList("cached title");
    const second = await fetchAniList("cached title");

    expect(first.ok).toBe(true);
    expect(second.ok).toBe(true);
    expect(second.data).toEqual(first.data);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("returns the network error message when fetch rejects", async () => {
    fetchMock.mockRejectedValueOnce(new TypeError("NetworkError when attempting to fetch resource."));

    const result = await fetchAniList("offline title");

    expect(result.ok).toBe(false);
    expect(result.error).toBe("NetworkError when attempting to fetch resource.");
  });
});
