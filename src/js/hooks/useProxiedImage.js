import { useState, useEffect, useMemo } from "react";

const MANGADEX_COVER_HOST = "uploads.mangadex.org";

export const useProxiedImage = (src) => {
  const [proxiedSrc, setProxiedSrc] = useState(src);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);

  const isMangadexCover = useMemo(() => {
    if (!src) return false;
    try {
      const u = new URL(src);
      return u.hostname === MANGADEX_COVER_HOST;
    } catch {
      return false;
    }
  }, [src]);

  useEffect(() => {
    if (!isMangadexCover || !src) {
      setProxiedSrc(src);
      return;
    }

    let cancelled = false;
    let objectUrl = null;

    const fetchAndProxy = async () => {
      setLoading(true);
      setError(false);

      try {
        const response = await fetch(src);
        if (!response.ok) throw new Error(`HTTP ${response.status}`);

        const blob = await response.blob();
        objectUrl = URL.createObjectURL(blob);

        if (!cancelled) {
          setProxiedSrc(objectUrl);
          setLoading(false);
        }
      } catch (err) {
        console.warn("Failed to proxy MangaDex cover:", err);
        if (!cancelled) {
          setError(true);
          setProxiedSrc(src); // Fallback to original (may show broken image)
          setLoading(false);
        }
      }
    };

    fetchAndProxy();

    return () => {
      cancelled = true;
      if (objectUrl) {
        URL.revokeObjectURL(objectUrl);
      }
    };
  }, [src, isMangadexCover]);

  return { src: proxiedSrc, loading, error, isProxied: isMangadexCover };
};