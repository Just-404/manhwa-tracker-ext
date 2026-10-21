import { describe, it, expect, vi, beforeEach } from "vitest";
import { getStaleWindow, getStaleThreshold, setStaleThreshold, STALE_THRESHOLDS, STALE_THRESHOLD_KEY, LEGACY_THRESHOLD_KEY, DEFAULT_STALE_THRESHOLD } from "../settings";

describe("getStaleWindow", () => {
  it("returns correct window for each threshold", () => {
    expect(getStaleWindow(14)).toEqual({ minDays: 14, maxDays: 30 });
    expect(getStaleWindow(30)).toEqual({ minDays: 30, maxDays: 180 });
    expect(getStaleWindow(180)).toEqual({ minDays: 180, maxDays: 365 });
    expect(getStaleWindow(365)).toEqual({ minDays: 365, maxDays: null });
  });

  it("falls back to default for invalid threshold", () => {
    expect(getStaleWindow(999)).toEqual({ minDays: 14, maxDays: 30 });
    expect(getStaleWindow("invalid")).toEqual({ minDays: 14, maxDays: 30 });
    expect(getStaleWindow(null)).toEqual({ minDays: 14, maxDays: 30 });
  });
});

describe("STALE_THRESHOLDS", () => {
  it("has correct structure for each threshold", () => {
    expect(STALE_THRESHOLDS).toHaveLength(4);
    expect(STALE_THRESHOLDS[0]).toEqual({
      value: 14,
      label: "2 weeks – 1 month",
      minDays: 14,
      maxDays: 30,
    });
    expect(STALE_THRESHOLDS[1]).toEqual({
      value: 30,
      label: "1 – 6 months",
      minDays: 30,
      maxDays: 180,
    });
    expect(STALE_THRESHOLDS[2]).toEqual({
      value: 180,
      label: "6 months – 1 year",
      minDays: 180,
      maxDays: 365,
    });
    expect(STALE_THRESHOLDS[3]).toEqual({
      value: 365,
      label: "1+ year",
      minDays: 365,
      maxDays: null,
    });
  });
});

describe("localStorage persistence", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.getItem.mockImplementation((key) => {
      if (key === LEGACY_THRESHOLD_KEY) return null;
      if (key === STALE_THRESHOLD_KEY) return null;
      return null;
    });
    localStorage.setItem.mockClear();
    localStorage.removeItem.mockClear();
  });

  it("getStaleThreshold returns default when nothing stored", () => {
    expect(getStaleThreshold()).toBe(DEFAULT_STALE_THRESHOLD);
  });

  it("getStaleThreshold reads valid stored value", () => {
    localStorage.getItem.mockImplementation((key) => {
      if (key === STALE_THRESHOLD_KEY) return "30";
      return null;
    });
    expect(getStaleThreshold()).toBe(30);
  });

  it("getStaleThreshold falls back to default for invalid stored value", () => {
    localStorage.getItem.mockImplementation((key) => {
      if (key === STALE_THRESHOLD_KEY) return "999";
      return null;
    });
    expect(getStaleThreshold()).toBe(DEFAULT_STALE_THRESHOLD);
  });

  it("setStaleThreshold writes to localStorage", () => {
    setStaleThreshold(180);
    expect(localStorage.setItem).toHaveBeenCalledWith(STALE_THRESHOLD_KEY, "180");
  });

  it("migrates legacy threshold from weeks to days", () => {
    localStorage.getItem.mockImplementation((key) => {
      if (key === LEGACY_THRESHOLD_KEY) return "2";
      return null;
    });
    const result = getStaleThreshold();
    expect(result).toBe(14);
    expect(localStorage.setItem).toHaveBeenCalledWith(STALE_THRESHOLD_KEY, "14");
    expect(localStorage.removeItem).toHaveBeenCalledWith(LEGACY_THRESHOLD_KEY);
  });

  it("migrates all legacy values correctly", () => {
    const testCases = [
      { legacy: "2", expected: 14 },
      { legacy: "4", expected: 30 },
      { legacy: "26", expected: 180 },
      { legacy: "52", expected: 365 },
    ];
    for (const { legacy, expected } of testCases) {
      vi.clearAllMocks();
      localStorage.getItem.mockImplementation((key) => {
        if (key === LEGACY_THRESHOLD_KEY) return legacy;
        return null;
      });
      localStorage.setItem.mockClear();
      localStorage.removeItem.mockClear();
      const result = getStaleThreshold();
      expect(result).toBe(expected);
      expect(localStorage.setItem).toHaveBeenCalledWith(STALE_THRESHOLD_KEY, String(expected));
      expect(localStorage.removeItem).toHaveBeenCalledWith(LEGACY_THRESHOLD_KEY);
    }
  });
});