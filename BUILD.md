# Campusza production build

One folder: **Campusza.exe** + **Campusza.dll** + **wwwroot** SPA.

| File | Purpose |
|------|---------|
| `campusza-urls.json` (next to exe + in `wwwroot`) | Kestrel port (`backendListen`) and browser API host (`frontendApiBaseUrl`) |
| `campusza-urls.production.json` (repo root) | Template copied on every build — edit before `build-campusza.ps1` |

## Build (PowerShell or TakeBuild)

**Recommended** — from repo root:

```powershell
.\build-campusza.ps1
```

**Alternative** — C# helper (same output folder):

```powershell
dotnet run --project TakeBuild -- --out build-out\campusza
```

Both set `CAMPUSZA_BUILD_OUT` so Vite writes into `<out>\wwwroot`.

Optional overrides:

```powershell
.\build-campusza.ps1 -BackendListen "http://0.0.0.0:5054" -FrontendApiBaseUrl "https://campusza.com"
```

Output: **`build-out\campusza\`** inside this repo (same as TakeBuild default). Run `run.cmd` or `Campusza.exe`.

Legacy path still works:

```powershell
.\build-campusza.ps1 -OutDir "D:\aravindan\build\campusza"
```

Open UI: **http://localhost:&lt;port&gt;/** (from `backendListen`, not `0.0.0.0`).

### URL rules

- **backendListen** — `http://0.0.0.0:5052` = listen on all interfaces (change port as needed).
- **frontendApiBaseUrl** — `""` = same host as the page (recommended behind `https://campusza.com`). Or `https://campusza.com` if API is explicit.
- **Never** put `http://0.0.0.0:...` in `frontendApiBaseUrl` — the build strips it; use `""` or your public HTTPS origin.

The API also serves `/campusza-urls.json` at runtime (sanitized for the browser).

## Deploy to production

See **[DEPLOY.md](DEPLOY.md)**. Summary:

1. Copy the **entire** publish folder (not only `wwwroot`).
2. Stop **PlanItNoww** / old **Campusza.exe** on the server.
3. Start the new **Campusza.exe**; point nginx/IIS at its port.
4. Confirm **https://campusza.com/swagger** shows **Campusza** and **GetAdminDashboardPage**.

## Local dev

```powershell
cd campusza_server\Campusza
dotnet run

cd school-hub
npm run dev
```

UI: **http://localhost:8087** — Vite proxies `/api` to the API port.
