# Email authentication configuration

Configure these settings on the **Campusza API server** only. Never put SMTP credentials in the frontend, repository, or client-visible config.

## Environment variables

| Variable | Required | Default (non-secret) | Description |
|----------|----------|----------------------|-------------|
| `CAMPUSZA_SMTP_HOST` | No | `smtp.gmail.com` | SMTP server host |
| `CAMPUSZA_SMTP_PORT` | No | `587` | SMTP port (STARTTLS) |
| `CAMPUSZA_SMTP_USERNAME` | No | `appointza@gmail.com` | SMTP auth username |
| `CAMPUSZA_SMTP_APP_PASSWORD` | **Yes** for sending | — | Gmail app password (secret) |
| `CAMPUSZA_SMTP_FROM_EMAIL` | No | `appointza@gmail.com` | From address |
| `CAMPUSZA_SMTP_FROM_NAME` | No | `Campusza` | From display name |
| `CAMPUSZA_SMTP_ENABLE_SSL` | No | `true` | Enable TLS for SMTP |
| `CAMPUSZA_FRONTEND_BASE_URL` | Recommended | — | Base URL for links in emails (e.g. `https://your-school.example.com`) |

Legacy `Email:*` keys in `appsettings.json` are still read if the `CAMPUSZA_*` variables are not set. Prefer environment variables or user secrets for passwords.

## Local development (.NET user secrets)

From `campusza_server/Campusza`:

```bash
dotnet user-secrets set "Email:Password" "<app-password-from-admin>"
dotnet user-secrets set "CAMPUSZA_SMTP_APP_PASSWORD" "<app-password-from-admin>"
dotnet user-secrets set "CAMPUSZA_FRONTEND_BASE_URL" "http://localhost:8080"
```

Alternatively set `CAMPUSZA_SMTP_APP_PASSWORD` in your shell or IDE launch profile.

## Production

Store `CAMPUSZA_SMTP_APP_PASSWORD` in your host’s secret manager (Azure Key Vault, AWS Secrets Manager, etc.). Set `CAMPUSZA_FRONTEND_BASE_URL` to the public SPA URL used by staff and admins.

## Database migration

Apply manually when ready:

- `Database/migrations/add_auth_verification_tokens.sql`
- Rollback: `Database/migrations/add_auth_verification_tokens_rollback.sql`

## API endpoints

All POST under `api/campusza/Authentication/` with body `{ "item": { ... } }`:

- `ForgotPassword` — `{ email }`
- `ResetPassword` — `{ token, newPassword, confirmPassword }`
- `CompleteInitialSetup` — `{ token, newPassword, confirmPassword }`
- `ValidateToken` — `{ token, purpose? }` (`initial_setup` or `password_reset`)
- `SendEmailOtp` — `{ token, purpose: "email_verification_otp" }` (scoped to valid setup link)
- `VerifyEmailOtp` — `{ token, otp, purpose: "email_verification_otp" }`

If SMTP is not configured, the API returns a safe error for send operations; forgot-password still returns a generic success message without revealing account existence.
