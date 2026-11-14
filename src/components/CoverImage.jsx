import { useEffect, useState } from "react";
import { useProxiedImage } from "../js/hooks/useProxiedImage";

// Placeholder SVG 2:3 que encaja perfecto en el card sin pixelarse
const PLACEHOLDER_SVG = `data:image/svg+xml,${encodeURIComponent(`
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 2 3" width="100%" height="100%" preserveAspectRatio="none">
    <rect width="2" height="3" fill="var(--surface-2)"/>
    <text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle"
          font-family="system-ui, sans-serif" font-size="0.15" fill="var(--text-faint)">
      Sin portada
    </text>
  </svg>
`)}`;

// Cover image with graceful fallbacks:
// - null/missing URL -> "Sin portada" placeholder
// - MangaDex covers are proxied through useProxiedImage
// - a load failure (proxy error or <img> onError) shows the placeholder
//   instead of a broken/black tile
const CoverImage = ({ src, alt, className, style, draggable }) => {
  const { src: proxiedSrc, loading: isLoading, error: proxyError } =
    useProxiedImage(src);
  const [loadFailed, setLoadFailed] = useState(false);

  // Reset the load-error flag when the source changes
  useEffect(() => {
    setLoadFailed(false);
  }, [src]);

  const resolvedSrc =
    loadFailed || proxyError ? PLACEHOLDER_SVG : proxiedSrc || PLACEHOLDER_SVG;

  return (
    <img
      src={resolvedSrc}
      alt={alt}
      loading="lazy"
      decoding="async"
      draggable={draggable}
      className={className}
      style={isLoading ? { opacity: 0.5, ...style } : style}
      onError={() => setLoadFailed(true)}
    />
  );
};

export default CoverImage;
