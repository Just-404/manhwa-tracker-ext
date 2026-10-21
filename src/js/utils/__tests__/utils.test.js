import { describe, it, expect } from "vitest";
import { cleanTitle, extractChapterFromUrl, getDomainName, formatTimeAgo } from "../utils";

describe("cleanTitle", () => {
  it("cleans title with hash suffix", () => {
    expect(cleanTitle("Solo Leveling-abc123")).toBe("Solo Leveling");
  });

  it("handles title without hash", () => {
    expect(cleanTitle("Solo Leveling")).toBe("Solo Leveling");
  });

  it("handles multiple dashes", () => {
    expect(cleanTitle("The-God-of-High-School-xyz789")).toBe("The God Of High School");
  });

  it("capitalizes words", () => {
    expect(cleanTitle("solo leveling")).toBe("Solo Leveling");
  });

  it("trims whitespace", () => {
    expect(cleanTitle("  Solo Leveling  ")).toBe("Solo Leveling");
  });
});

describe("extractChapterFromUrl", () => {
  it("extracts chapter from /chapter-123", () => {
    expect(extractChapterFromUrl("https://site.com/chapter-123")).toBe(123);
  });

  it("extracts chapter from /chapter/123", () => {
    expect(extractChapterFromUrl("https://site.com/chapter/123")).toBe(123);
  });

  it("extracts decimal chapter", () => {
    expect(extractChapterFromUrl("https://site.com/chapter-12.5")).toBe(12.5);
  });

  it("returns null for no match", () => {
    expect(extractChapterFromUrl("https://site.com/other")).toBeNull();
  });
});

describe("getDomainName", () => {
  it("extracts domain from simple hostname", () => {
    expect(getDomainName("example.com")).toBe("example");
  });

  it("handles www subdomain", () => {
    expect(getDomainName("www.example.com")).toBe("example");
  });

  it("handles multi-level TLD", () => {
    expect(getDomainName("sub.example.co.uk")).toBe("example");
    expect(getDomainName("example.com.br")).toBe("example");
    expect(getDomainName("site.co.jp")).toBe("site");
  });

  it("handles normal subdomain", () => {
    expect(getDomainName("sub.example.com")).toBe("example");
  });
});

describe("formatTimeAgo", () => {
  // Fixed time: 2026-01-15T12:00:00.000Z (set in setup.js)
  const FIXED_NOW = new Date("2026-01-15T12:00:00.000Z").getTime();

  it("returns 'Today' for same day", () => {
    expect(formatTimeAgo(new Date(FIXED_NOW - 2 * 60 * 60 * 1000).toISOString())).toBe("Today");
  });

  it("returns 'Xd ago' for days < 7", () => {
    expect(formatTimeAgo(new Date(FIXED_NOW - 3 * 24 * 60 * 60 * 1000).toISOString())).toBe("3d ago");
  });

  it("returns 'Xw ago' for weeks < 30 days", () => {
    expect(formatTimeAgo(new Date(FIXED_NOW - 14 * 24 * 60 * 60 * 1000).toISOString())).toBe("2w ago");
  });

  it("returns 'Xmo ago' for months < 365 days", () => {
    expect(formatTimeAgo(new Date(FIXED_NOW - 60 * 24 * 60 * 60 * 1000).toISOString())).toBe("2mo ago");
  });

  it("returns 'Xy ago' for years", () => {
    expect(formatTimeAgo(new Date(FIXED_NOW - 400 * 24 * 60 * 60 * 1000).toISOString())).toBe("1y ago");
  });

  it("returns empty string for invalid date", () => {
    expect(formatTimeAgo("invalid")).toBe("");
    expect(formatTimeAgo("")).toBe("");
    expect(formatTimeAgo(null)).toBe("");
  });
});