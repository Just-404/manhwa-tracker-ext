// Umbral de tiempo sin leer para el carrusel "Continue reading".
// Los valores están en días naturales. Cada opción define un tramo [minDays, maxDays),
// donde maxDays === null significa "sin tope superior".
export const STALE_THRESHOLDS = Object.freeze([
  { value: 14, label: "2 weeks – 1 month", minDays: 14, maxDays: 30 },
  { value: 30, label: "1 – 6 months", minDays: 30, maxDays: 180 },
  { value: 180, label: "6 months – 1 year", minDays: 180, maxDays: 365 },
  { value: 365, label: "1+ year", minDays: 365, maxDays: null },
]);

export const STALE_THRESHOLD_KEY = "staleThresholdDays";
export const LEGACY_THRESHOLD_KEY = "staleThresholdWeeks";
export const DEFAULT_STALE_THRESHOLD = 14;

const isValidThreshold = (value) =>
  STALE_THRESHOLDS.some((threshold) => threshold.value === value);

// Migra el umbral antiguo (semanas) al nuevo (días) si existe.
const migrateLegacyThreshold = () => {
  try {
    const legacyRaw = localStorage.getItem(LEGACY_THRESHOLD_KEY);
    if (legacyRaw === null || legacyRaw === "") return null;
    const legacy = Number(legacyRaw);
    if (!Number.isFinite(legacy)) return null;
    const map = { 2: 14, 4: 30, 26: 180, 52: 365 };
    const migrated = map[legacy] ?? DEFAULT_STALE_THRESHOLD;
    localStorage.setItem(STALE_THRESHOLD_KEY, String(migrated));
    localStorage.removeItem(LEGACY_THRESHOLD_KEY);
    return migrated;
  } catch {
    // localStorage no disponible
  }
  return null;
};

// Devuelve el umbral guardado; si no existe o no es válido, usa el por defecto.
// Incluye migración automática desde la clave antigua.
export const getStaleThreshold = () => {
  const migrated = migrateLegacyThreshold();
  if (migrated !== null && isValidThreshold(migrated)) return migrated;

  try {
    const parsed = Number(localStorage.getItem(STALE_THRESHOLD_KEY));
    if (isValidThreshold(parsed)) return parsed;
  } catch {
    // localStorage no disponible
  }
  return DEFAULT_STALE_THRESHOLD;
};

// Persiste el umbral; ignora errores de almacenamiento para no romper la UI.
export const setStaleThreshold = (value) => {
  try {
    localStorage.setItem(STALE_THRESHOLD_KEY, String(value));
  } catch {
    // localStorage no disponible
  }
};

// Traduce el umbral elegido a su ventana [minDays, maxDays].
// Si el threshold no es válido, cae al rango por defecto (2 weeks – 1 month).
export const getStaleWindow = (threshold) => {
  const found = STALE_THRESHOLDS.find((t) => t.value === threshold);
  if (found) {
    return { minDays: found.minDays, maxDays: found.maxDays };
  }
  // Fallback por defecto
  const def = STALE_THRESHOLDS.find((t) => t.value === DEFAULT_STALE_THRESHOLD);
  return { minDays: def.minDays, maxDays: def.maxDays };
};
