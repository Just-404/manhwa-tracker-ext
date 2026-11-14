// Circuit breaker for API requests (used for the AniList primary source).
// Pure logic, no browser APIs, so it can be unit tested.

// Creates a breaker that opens after `threshold` consecutive failures and
// stays open for `cooldownMs`. After the cooldown, the next isOpen() call
// closes it again (half-open behavior, so the API is retried).
export const createCircuitBreaker = ({
  threshold = 3,
  cooldownMs = 15 * 60 * 1000, // 15 min
} = {}) => {
  const state = {
    open: false,
    openUntil: 0,
    consecutiveFailures: 0,
    lastFailureAt: null,
  };

  return {
    // True while the breaker is open. Re-checks the cooldown on every call.
    isOpen() {
      if (state.open && Date.now() >= state.openUntil) {
        state.open = false;
        state.openUntil = 0;
        state.consecutiveFailures = 0;
        state.lastFailureAt = null;
      }
      return state.open;
    },
    recordFailure() {
      // Failures spaced farther apart than the cooldown are not "consecutive":
      // restart the streak so stale failures don't open the breaker.
      if (state.lastFailureAt != null && Date.now() - state.lastFailureAt > cooldownMs) {
        state.consecutiveFailures = 0;
      }
      state.lastFailureAt = Date.now();
      state.consecutiveFailures += 1;
      if (state.consecutiveFailures >= threshold) {
        state.open = true;
        state.openUntil = Date.now() + cooldownMs;
      }
    },
    recordSuccess() {
      state.consecutiveFailures = 0;
    },
    // For tests / manual reset.
    reset() {
      state.open = false;
      state.openUntil = 0;
      state.consecutiveFailures = 0;
      state.lastFailureAt = null;
    },
  };
};
