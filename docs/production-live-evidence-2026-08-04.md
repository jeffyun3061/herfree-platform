# Production live evidence — 2026-08-04

This record is intentionally separate from the legal review. It records what was
actually verified for the deployed release and what still requires an operator or
external provider.

## Deployed release

- GitHub Actions `Release backend` production run: `30873986701`
- Staging validation run: `30873607756`
- Immutable image promoted from staging: `staging-passed-390a6b3fad891a3878099fa398995d7d54114f85`
- Production deploy and public smoke: **passed**; no rollback was triggered.

## Independent read-only checks

The following were checked against `https://api.herpfree.co.kr` after the release:

- `GET /api/health` returned HTTP 200 with `success=true`, `status=UP`,
  `environment=prod`, and an `X-Request-ID` response header.
- `GET /api/journal/public/home-stats` returned HTTP 200 with
  `Cache-Control: private, no-store` and `data: {}`. No participant counters or
  health values are exposed by the public compatibility endpoint.
- `GET /swagger-ui.html` returned 404.
- Unauthenticated `GET /api/admin/reports` returned an authentication/authorization
  response (401/403 boundary).

Repeat the checks from the repository root with:

```powershell
powershell.exe -NoProfile -ExecutionPolicy Bypass -File .\scripts\verify-production-live.ps1
```

Add `-FrontendUrl https://herpfree.co.kr -RequireFrontend` only after Gabia DNS
and the custom certificate are active. A temporary Amplify URL returning 200 does
not prove the custom domain is ready.

## Open operational gates

These are not inferred from application smoke and remain explicit owner actions:

- Gabia apex/`www` DNS and custom TLS certificate propagation.
- Production RDS automated-backup retention of at least 7 days and a successful
  isolated restore drill with recorded RPO/RTO.
- CloudWatch production alarms for health/5xx, host resources, RDS connections,
  CPU and storage; verify notification delivery.
- Production admin access through individual accounts with MFA or VPN/Access
  gateway, and a restricted `ADMIN_ACCESS_ALLOWED_CIDRS` value.
- Final confirmation that production OAuth callbacks, SMTP reset mail, S3 upload/
  deletion and the data-retention/consent text match the deployed behavior.

Until these external gates have evidence, the service is deployed and healthy but
the operations sign-off is not complete.
