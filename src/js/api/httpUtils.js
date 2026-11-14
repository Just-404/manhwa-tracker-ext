// Safe response parsing for API modules.
// Prevents raw Firefox errors like "JSON.parse: unexpected character at line 1
// column 1" from surfacing when a server returns HTML/empty bodies (rate
// limits, Cloudflare challenges, gateway errors).

// Parses a fetch Response as JSON without ever throwing.
// Returns { ok: true, json } or { ok: false, error }.
export const parseJsonResponse = async (response) => {
  if (!response.ok) {
    const hint = response.status === 429 ? " (rate limited)" : "";
    return { ok: false, error: `HTTP ${response.status}${hint}` };
  }

  const contentType = response.headers.get("content-type") || "";
  if (!contentType.includes("json")) {
    return {
      ok: false,
      error: `Non-JSON response (content-type: ${contentType || "unknown"})`,
    };
  }

  try {
    return { ok: true, json: await response.json() };
  } catch (error) {
    return { ok: false, error: `Invalid JSON response: ${error.message}` };
  }
};
