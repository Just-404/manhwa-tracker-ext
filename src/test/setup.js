// Test setup for Vitest
import { vi, afterAll } from "vitest";

// Mock localStorage for tests
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};
Object.defineProperty(window, "localStorage", { value: localStorageMock });

// Mock Date.now for consistent time tests
const REAL_DATE = Date.now;
const FIXED_TIME = new Date("2026-01-15T12:00:00.000Z").getTime();
Date.now = vi.fn(() => FIXED_TIME);

// Restore after all tests
afterAll(() => {
  Date.now = REAL_DATE;
});