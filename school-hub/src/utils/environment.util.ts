function isInvalidApiOrigin(url: string) {
  const u = url.toLowerCase();
  return (
    !u ||
    u.includes("0.0.0.0") ||
    u.includes("your_public_host") ||
    u === "http:" ||
    u === "https:"
  );
}

function readRuntimeApiUrl() {
  if (typeof window === "undefined") return "";
  const raw = String(window.__CAMPUSZA_API_URL__ ?? "").trim().replace(/\/$/, "");
  if (isInvalidApiOrigin(raw)) return "";
  return raw;
}

function pageOrigin() {
  if (typeof window === "undefined" || !window.location?.origin) return "";
  return window.location.origin.replace(/\/$/, "");
}

/** Production: always use frontendApiBaseUrl from campusza-urls.json when set; else same origin. */
function publicOrigin() {
  const fromEnv = String(import.meta.env.VITE_API_URL ?? "").trim().replace(/\/$/, "");
  if (import.meta.env.DEV) {
    if (fromEnv) return fromEnv.replace(/\/api$/i, "");
    return "";
  }

  const configured = readRuntimeApiUrl() || fromEnv.replace(/\/api$/i, "");
  if (configured) return configured;

  return pageOrigin();
}

/** Axios base URL: dev uses Vite /api proxy unless VITE_API_URL is set. Prod uses campusza-urls.json. */
export function getApiBaseUrl(): string {
  const fromEnv = String(import.meta.env.VITE_API_URL ?? "").trim().replace(/\/$/, "");
  if (import.meta.env.DEV) {
    if (fromEnv) return fromEnv.endsWith("/api") ? fromEnv : `${fromEnv}/api`;
    return "/api";
  }

  const origin = publicOrigin();
  if (!origin) return "/api";
  return `${origin}/api`;
}

declare global {
  interface Window {
    __CAMPUSZA_API_URL__?: string;
  }
}
