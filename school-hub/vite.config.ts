import fs from "node:fs";
import path from "node:path";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import { componentTagger } from "lovable-tagger";

function stripSlash(url: string): string {
  return String(url || "").replace(/\/+$/, "");
}

function listenToBrowserOrigin(listenUrl: string): string {
  const value = stripSlash(listenUrl);
  if (!value) return "http://localhost:5052";
  try {
    const parsed = new URL(value);
    if (parsed.hostname === "0.0.0.0" || parsed.hostname === "::" || parsed.hostname === "[::]") {
      parsed.hostname = "localhost";
    }
    parsed.pathname = "";
    parsed.search = "";
    parsed.hash = "";
    return stripSlash(parsed.toString());
  } catch {
    return value.replace(/:\/\/0\.0\.0\.0/gi, "://localhost");
  }
}

function readUrls(filePath: string): { backendListen: string; frontendApiBaseUrl: string } | null {
  if (!fs.existsSync(filePath)) return null;
  try {
    const parsed = JSON.parse(fs.readFileSync(filePath, "utf8"));
    return {
      backendListen: String(parsed.backendListen || "").trim().replace(/\/+$/, ""),
      frontendApiBaseUrl: String(parsed.frontendApiBaseUrl || "").trim().replace(/\/+$/, ""),
    };
  } catch {
    return null;
  }
}

const buildRoot = stripSlash(process.env.CAMPUSZA_BUILD_OUT || "").replace(/\\/g, "/");
const wwwrootOutDir = buildRoot
  ? path.resolve(`${buildRoot}/wwwroot`)
  : path.resolve(__dirname, "dist");
const urlsBuildPath = buildRoot ? path.resolve(buildRoot, "campusza-urls.json") : "";
const urlsPublicPath = path.resolve(__dirname, "public/campusza-urls.json");
const urls =
  (urlsBuildPath ? readUrls(urlsBuildPath) : null) ||
  readUrls(urlsPublicPath) ||
  { backendListen: "http://0.0.0.0:5052", frontendApiBaseUrl: "" };
const proxyTarget = listenToBrowserOrigin(urls.backendListen || "http://0.0.0.0:5052");

export default defineConfig(({ mode }) => ({
  base: "/",
  build: {
    outDir: wwwrootOutDir,
    assetsDir: "assets",
    emptyOutDir: true,
    sourcemap: mode === "development",
    chunkSizeWarningLimit: 1200,
  },
  server: {
    host: "::",
    port: Number(process.env.PORT) || 8087,
    hmr: {
      overlay: false,
      // Keep HMR on localhost so Wi‑Fi/VPN changes do not break module loads (ERR_NETWORK_CHANGED).
      host: "localhost",
      clientPort: Number(process.env.PORT) || 8087,
    },
    proxy: {
      "/api": { target: proxyTarget, changeOrigin: true },
      // Do not proxy — serve `public/campusza-urls.json` when the API is offline (avoids 500 on boot).
    },
  },
  plugins: [
    react(),
    mode === "development" && componentTagger(),
    buildRoot && {
      name: "campusza-urls-single-file",
      closeBundle() {
        fs.rmSync(path.join(wwwrootOutDir, "campusza-urls.json"), { force: true });
        if (urlsBuildPath && !fs.existsSync(urlsBuildPath) && fs.existsSync(urlsPublicPath)) {
          fs.mkdirSync(path.dirname(urlsBuildPath), { recursive: true });
          fs.copyFileSync(urlsPublicPath, urlsBuildPath);
        }
        if (urlsBuildPath) {
          console.log(`[campusza] URL config: ${urlsBuildPath}`);
        }
      },
    },
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));
