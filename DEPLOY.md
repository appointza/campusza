# Deploy Campusza to campusza.com (replace PlanItNoww)

Production **404** on new routes (e.g. `GetAdminDashboardPage`) while login works usually means **HTTPS is still served by an old binary** (e.g. **PlanItNoww**), not today’s **Campusza** build.

## 1. Build on your PC

```powershell
cd D:\aravindan\project\campusza
# Edit campusza-urls.production.json (port + frontendApiBaseUrl) first
.\build-campusza.ps1
```

Verify locally:

- `build-out\campusza\Campusza.dll` is today’s date (or your `-OutDir` path).
- `build-out\campusza\run.cmd` → open **http://localhost:<port>/** and test admin dashboard.

## 2. Copy to server (43.205.255.163)

Copy **the whole folder**, for example:

- `Campusza.exe`, `Campusza.dll`, all `.dll` dependencies
- `wwwroot\` (SPA)
- `appsettings.json`
- `campusza-urls.json` (next to exe; `wwwroot\campusza-urls.json` should match)

**Do not** copy only `wwwroot` — the new API lives in **Campusza.dll**.

## 3. Configure URLs on the server

Edit `campusza-urls.json`:

```json
{
  "backendListen": "http://0.0.0.0:5052",
  "frontendApiBaseUrl": ""
}
```

Use `""` when UI and API are both `https://campusza.com`. Use `https://campusza.com` only if you need an explicit public API origin.

## 4. Stop old app, start new

1. Stop **PlanItNoww.exe** / old **Campusza.exe** (Task Manager, Windows Service, or IIS site).
2. Start **`Campusza.exe`** from the new folder (or point your service at it).
3. Ensure reverse proxy forwards **`/api`** to `http://127.0.0.1:&lt;port&gt;` (same process for `/api/user` and `/api/campusza`).

## 5. Verify

From your PC (PowerShell):

```powershell
.\scripts\verify-production-api.ps1 -BaseUrl https://campusza.com
```

Or open in browser: **`https://campusza.com/api/campusza/version`**  
Expected JSON: `"product": "Campusza"`, `"assembly": "Campusza"`, recent `fileUtc`, `api.GetAdminDashboardPage: true`.  
If this URL is **404**, the server is still on an **old DLL** (PlanItNoww / partial deploy).

| Check | Expected |
|--------|----------|
| `GET /api/campusza/version` | **200**, product **Campusza** |
| `https://campusza.com/swagger` | Schemas say **Campusza**, not PlanItNoww |
| Dashboard in Swagger | **POST** `GetAdminDashboardPage` on **Dashboard** or **Page** (or legacy **GetStats**) |
| Browser | Admin dashboard loads after login |

## 6. Direct test on server (SSH/RDP)

```http
POST http://127.0.0.1:5052/api/campusza/Dashboard/GetAdminDashboardPage
Content-Type: application/json

{"item":{"organizationid":"YOUR_ORG_ID"}}
```

- **200** locally but **404** on `https://campusza.com` → fix nginx/IIS proxy.
- **404** locally → wrong folder or old exe still running.
