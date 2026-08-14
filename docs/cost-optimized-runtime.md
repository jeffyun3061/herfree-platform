# Cost-optimized runtime operations

Last verified: 2026-08-14 (Asia/Seoul)

## What runs continuously

Production uses one `t3.small` EC2 instance for the API and MySQL 8.4.10. MySQL data is not kept on the root disk; it is stored on a dedicated encrypted 10 GiB gp3 EBS volume mounted at `/var/lib/herfree`.

The database is reachable only through the private Docker network. It has no published host port. The API connection must use `jdbc:mysql://mysql:3306/...` with `sslMode=REQUIRED`; the application refuses any other host when `DB_RUNTIME=local`. RDS mode still requires `VERIFY_IDENTITY` and the AWS CA truststore.

Staging EC2 remains stopped except during an intentional test session. The former staging RDS instance was removed after its encrypted manual snapshot was verified. Restore it only when historical staging data is specifically required; normal staging work should use a disposable local MySQL container.

## Backups and monitoring

- Encrypted logical backup to private S3 every 6 hours; retained for 8 days.
- Encrypted daily logical backup to private S3; retained for 32 days.
- Pre-deploy backup before every production deployment; retained for 15 days.
- Encrypted EBS snapshot every day through DLM; seven snapshots retained.
- Isolated restore drill every month. The drill container has no network and checks tables plus Flyway history.
- Health, disk use, and backup age are published to the `Herfree/Operations` CloudWatch namespace every 5 minutes.
- Production deployment is rejected unless a verified migration marker and MySQL data directory exist.

The systemd timers are:

```text
herfree-db-backup-frequent.timer
herfree-db-backup-daily.timer
herfree-db-restore-drill.timer
herfree-db-monitor.timer
```

Useful checks:

```bash
systemctl list-timers --all 'herfree-db-*'
DEPLOY_ENV=production /opt/herfree/infra/scripts/monitor-local-db.sh
DEPLOY_ENV=production /opt/herfree/infra/scripts/backup-db.sh manual
CONFIRM_RESTORE_DRILL=YES DEPLOY_ENV=production /opt/herfree/infra/scripts/restore-local-db-drill.sh
```

## Deployment policy

Production builds its own immutable image from the selected `main` commit, rejects HIGH or CRITICAL Trivy findings, pushes the scanned image, and deploys by digest. Staging is optional and is not a mandatory always-on gate.

For a staging session:

1. Start the stopped staging EC2 instance.
2. Use a local disposable MySQL container or restore the retained staging snapshot only if old staging data is needed.
3. Run the staging test suite.
4. Stop staging EC2 immediately after the test.

## RDS rollback window

The production RDS instance was stopped after the local database passed an exact 23-table row-count comparison, TLS write/read smoke, encrypted S3 backup, isolated restore drill, internal health gate, and public production smoke.

AWS automatically restarts a stopped RDS instance after seven days. During the short rollback window, either delete the instance after confidence is established or stop it again before the automatic restart. Keeping it stopped indefinitely is not a valid cost-control strategy. The encrypted manual snapshot `herfree-production-pre-local-20260814t0520z` is the long-term RDS rollback artifact.

If local MySQL fails during the rollback window:

1. Start `herfree-production-mysql` and wait for `available`.
2. Set `herfree/production/app-config` field `dbMode` to `rds` without changing other secret fields.
3. Run `render-release-env.sh production`.
4. Deploy the last known-good immutable image digest.
5. Confirm `/api/health`, public journal cache headers, Swagger blocking, and admin authorization blocking.

## Trade-off

This design removes the always-on managed database compute cost, but API and database now share one EC2 failure domain. The dedicated encrypted volume, frequent S3 dumps, daily EBS snapshots, restore drills, swap, strict memory limits, and alarms are required controls; do not disable them to save a negligible amount.
