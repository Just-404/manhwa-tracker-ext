import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createCircuitBreaker } from "../circuitBreaker.js";

const BASE_TIME = 1_700_000_000_000;
let now;

beforeEach(() => {
  now = BASE_TIME;
  vi.spyOn(Date, "now").mockImplementation(() => now);
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("createCircuitBreaker", () => {
  it("starts closed", () => {
    const breaker = createCircuitBreaker({ threshold: 3, cooldownMs: 1000 });
    expect(breaker.isOpen()).toBe(false);
  });

  it("does not open before reaching the failure threshold", () => {
    const breaker = createCircuitBreaker({ threshold: 3, cooldownMs: 1000 });

    breaker.recordFailure();
    expect(breaker.isOpen()).toBe(false);

    breaker.recordFailure();
    expect(breaker.isOpen()).toBe(false);
  });

  it("opens after the threshold of consecutive failures", () => {
    const breaker = createCircuitBreaker({ threshold: 3, cooldownMs: 1000 });

    breaker.recordFailure();
    breaker.recordFailure();
    breaker.recordFailure();

    expect(breaker.isOpen()).toBe(true);
  });

  it("stays open during the cooldown window", () => {
    const cooldownMs = 15 * 60 * 1000;
    const breaker = createCircuitBreaker({ threshold: 1, cooldownMs });

    breaker.recordFailure();
    expect(breaker.isOpen()).toBe(true);

    now = BASE_TIME + cooldownMs - 1;
    expect(breaker.isOpen()).toBe(true);
  });

  it("closes again after the cooldown (half-open retry)", () => {
    const cooldownMs = 15 * 60 * 1000;
    const breaker = createCircuitBreaker({ threshold: 1, cooldownMs });

    breaker.recordFailure();
    expect(breaker.isOpen()).toBe(true);

    now = BASE_TIME + cooldownMs + 1;
    expect(breaker.isOpen()).toBe(false);
  });

  it("does not count a stale failure as consecutive (streak restarts)", () => {
    const cooldownMs = 1000;
    const breaker = createCircuitBreaker({ threshold: 2, cooldownMs });

    breaker.recordFailure(); // 1
    now = BASE_TIME + cooldownMs + 1; // previous failure is now stale

    breaker.recordFailure(); // streak restarts at 1 -> still closed
    expect(breaker.isOpen()).toBe(false);
  });

  it("counts failures within the cooldown window as consecutive", () => {
    const cooldownMs = 1000;
    const breaker = createCircuitBreaker({ threshold: 2, cooldownMs });

    breaker.recordFailure(); // 1
    now = BASE_TIME + cooldownMs - 100; // still fresh
    breaker.recordFailure(); // 2 -> opens
    expect(breaker.isOpen()).toBe(true);
  });

  it("recordSuccess resets the consecutive failure count", () => {
    const breaker = createCircuitBreaker({ threshold: 3, cooldownMs: 1000 });

    breaker.recordFailure();
    breaker.recordFailure();
    breaker.recordSuccess();
    breaker.recordFailure();
    breaker.recordFailure();

    expect(breaker.isOpen()).toBe(false);
  });

  it("reset() clears state", () => {
    const breaker = createCircuitBreaker({ threshold: 1, cooldownMs: 1000 });

    breaker.recordFailure();
    expect(breaker.isOpen()).toBe(true);

    breaker.reset();
    expect(breaker.isOpen()).toBe(false);
  });

  it("uses default threshold 3 and 15 min cooldown", () => {
    const breaker = createCircuitBreaker();

    breaker.recordFailure();
    breaker.recordFailure();
    expect(breaker.isOpen()).toBe(false);
    breaker.recordFailure();
    expect(breaker.isOpen()).toBe(true);

    now = BASE_TIME + 15 * 60 * 1000 + 1;
    expect(breaker.isOpen()).toBe(false);
  });
});
