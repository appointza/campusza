import "./index.css";

const root = document.getElementById("root");
if (!root) {
  throw new Error("Root element #root not found");
}

async function loadApiUrl() {
  try {
    const res = await fetch("/campusza-urls.json", { cache: "no-store" });
    if (!res.ok) return;
    const urls = (await res.json()) as { frontendApiBaseUrl?: string };
    window.__CAMPUSZA_API_URL__ = String(urls.frontendApiBaseUrl ?? "").trim();
  } catch {
    /* same-origin /api */
  }
}

void (async () => {
  await loadApiUrl();
  const { default: App } = await import("./App.tsx");
  const { createRoot } = await import("react-dom/client");
  createRoot(root).render(<App />);
})();
