#!/usr/bin/env bash
set -euo pipefail

if [[ "${CONFIRM_LOCAL_DB_OPS_INSTALL:-}" != "YES" ]]; then
  echo "refusing operations timer install: set CONFIRM_LOCAL_DB_OPS_INSTALL=YES" >&2
  exit 2
fi
if [[ "$(id -u)" -ne 0 ]]; then
  echo "install-local-db-ops.sh must run as root" >&2
  exit 1
fi

APP_DIR="${HERFREE_APP_DIR:-/opt/herfree}"
for script in backup-db.sh restore-local-db-drill.sh monitor-local-db.sh; do
  [[ -x "${APP_DIR}/infra/scripts/${script}" ]] || { echo "missing executable: ${script}" >&2; exit 1; }
done

install -m 0644 /dev/stdin /etc/systemd/system/herfree-db-backup-frequent.service <<EOF
[Unit]
Description=Herfree six-hour production database backup
After=docker.service network-online.target
Wants=network-online.target

[Service]
Type=oneshot
Environment=DEPLOY_ENV=production
Environment=HERFREE_APP_DIR=${APP_DIR}
ExecStart=${APP_DIR}/infra/scripts/backup-db.sh frequent
User=root
Group=root
Nice=10
EOF

install -m 0644 /dev/stdin /etc/systemd/system/herfree-db-backup-frequent.timer <<'EOF'
[Unit]
Description=Run Herfree database backup every six hours

[Timer]
OnCalendar=*-*-* 00/6:15:00 UTC
Persistent=true
RandomizedDelaySec=300

[Install]
WantedBy=timers.target
EOF

install -m 0644 /dev/stdin /etc/systemd/system/herfree-db-backup-daily.service <<EOF
[Unit]
Description=Herfree daily production database backup
After=docker.service network-online.target
Wants=network-online.target

[Service]
Type=oneshot
Environment=DEPLOY_ENV=production
Environment=HERFREE_APP_DIR=${APP_DIR}
ExecStart=${APP_DIR}/infra/scripts/backup-db.sh daily
User=root
Group=root
Nice=10
EOF

install -m 0644 /dev/stdin /etc/systemd/system/herfree-db-backup-daily.timer <<'EOF'
[Unit]
Description=Run Herfree daily database backup

[Timer]
OnCalendar=*-*-* 03:20:00 UTC
Persistent=true
RandomizedDelaySec=300

[Install]
WantedBy=timers.target
EOF

install -m 0644 /dev/stdin /etc/systemd/system/herfree-db-restore-drill.service <<EOF
[Unit]
Description=Herfree monthly isolated database restore drill
After=docker.service network-online.target
Wants=network-online.target

[Service]
Type=oneshot
Environment=DEPLOY_ENV=production
Environment=HERFREE_APP_DIR=${APP_DIR}
Environment=CONFIRM_RESTORE_DRILL=YES
ExecStart=${APP_DIR}/infra/scripts/restore-local-db-drill.sh
User=root
Group=root
Nice=15
EOF

install -m 0644 /dev/stdin /etc/systemd/system/herfree-db-restore-drill.timer <<'EOF'
[Unit]
Description=Run Herfree isolated restore drill monthly

[Timer]
OnCalendar=*-*-01 04:30:00 UTC
Persistent=true
RandomizedDelaySec=900

[Install]
WantedBy=timers.target
EOF

install -m 0644 /dev/stdin /etc/systemd/system/herfree-db-monitor.service <<EOF
[Unit]
Description=Herfree local database operations monitor
After=docker.service network-online.target
Wants=network-online.target

[Service]
Type=oneshot
Environment=DEPLOY_ENV=production
Environment=HERFREE_APP_DIR=${APP_DIR}
ExecStart=${APP_DIR}/infra/scripts/monitor-local-db.sh
User=root
Group=root
EOF

install -m 0644 /dev/stdin /etc/systemd/system/herfree-db-monitor.timer <<'EOF'
[Unit]
Description=Monitor Herfree local database every five minutes

[Timer]
OnBootSec=5min
OnUnitActiveSec=5min
Persistent=true

[Install]
WantedBy=timers.target
EOF

systemctl daemon-reload
systemctl enable --now \
  herfree-db-backup-frequent.timer \
  herfree-db-backup-daily.timer \
  herfree-db-restore-drill.timer \
  herfree-db-monitor.timer

systemctl list-timers --all 'herfree-db-*'
