#!/usr/bin/env bash
set -euo pipefail

umask 077

if [[ "${CONFIRM_LOCAL_DB_AWS_SETUP:-}" != "YES" ]]; then
  echo "refusing AWS setup: set CONFIRM_LOCAL_DB_AWS_SETUP=YES" >&2
  exit 2
fi

AWS_REGION="${AWS_REGION:-ap-northeast-2}"
PRODUCTION_INSTANCE_ID="${PRODUCTION_INSTANCE_ID:-i-0e7f8a0d032e554c3}"
PRODUCTION_ROLE_NAME="${PRODUCTION_ROLE_NAME:-herfree-production-ec2}"
ACCOUNT_ID="$(aws sts get-caller-identity --query Account --output text)"
BACKUP_BUCKET="${BACKUP_BUCKET:-herfree-prod-db-backups-${ACCOUNT_ID}-${AWS_REGION}}"
VOLUME_NAME="herfree-production-local-mysql"

WORK_DIR="$(mktemp -d)"
cleanup() {
  if [[ "${WORK_DIR}" == /tmp/* ]]; then
    rm -rf "${WORK_DIR}"
  fi
}
trap cleanup EXIT

echo "configuring private database backup bucket"
if ! aws s3api head-bucket --bucket "${BACKUP_BUCKET}" 2>/dev/null; then
  aws s3api create-bucket \
    --region "${AWS_REGION}" \
    --bucket "${BACKUP_BUCKET}" \
    --create-bucket-configuration "LocationConstraint=${AWS_REGION}" >/dev/null
fi
aws s3api put-public-access-block --region "${AWS_REGION}" --bucket "${BACKUP_BUCKET}" \
  --public-access-block-configuration \
    BlockPublicAcls=true,IgnorePublicAcls=true,BlockPublicPolicy=true,RestrictPublicBuckets=true
aws s3api put-bucket-encryption --region "${AWS_REGION}" --bucket "${BACKUP_BUCKET}" \
  --server-side-encryption-configuration \
    '{"Rules":[{"ApplyServerSideEncryptionByDefault":{"SSEAlgorithm":"AES256"},"BucketKeyEnabled":false}]}'

cat > "${WORK_DIR}/lifecycle.json" <<'EOF'
{
  "Rules": [
    {
      "ID": "expire-frequent-backups",
      "Status": "Enabled",
      "Filter": {"Prefix": "db-backups/production/frequent/"},
      "Expiration": {"Days": 8},
      "AbortIncompleteMultipartUpload": {"DaysAfterInitiation": 1}
    },
    {
      "ID": "expire-daily-backups",
      "Status": "Enabled",
      "Filter": {"Prefix": "db-backups/production/daily/"},
      "Expiration": {"Days": 32},
      "AbortIncompleteMultipartUpload": {"DaysAfterInitiation": 1}
    },
    {
      "ID": "expire-predeploy-backups",
      "Status": "Enabled",
      "Filter": {"Prefix":"db-backups/production/predeploy/"},
      "Expiration": {"Days": 15},
      "AbortIncompleteMultipartUpload": {"DaysAfterInitiation": 1}
    },
    {
      "ID": "expire-manual-backups",
      "Status": "Enabled",
      "Filter": {"Prefix":"db-backups/production/manual/"},
      "Expiration": {"Days": 15},
      "AbortIncompleteMultipartUpload": {"DaysAfterInitiation": 1}
    }
  ]
}
EOF
aws s3api put-bucket-lifecycle-configuration --region "${AWS_REGION}" \
  --bucket "${BACKUP_BUCKET}" --lifecycle-configuration "file://${WORK_DIR}/lifecycle.json"

cat > "${WORK_DIR}/bucket-policy.json" <<EOF
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "DenyInsecureTransport",
      "Effect": "Deny",
      "Principal": "*",
      "Action": "s3:*",
      "Resource": [
        "arn:aws:s3:::${BACKUP_BUCKET}",
        "arn:aws:s3:::${BACKUP_BUCKET}/*"
      ],
      "Condition": {"Bool": {"aws:SecureTransport": "false"}}
    }
  ]
}
EOF
aws s3api put-bucket-policy --region "${AWS_REGION}" --bucket "${BACKUP_BUCKET}" \
  --policy "file://${WORK_DIR}/bucket-policy.json"

cat > "${WORK_DIR}/runtime-policy.json" <<EOF
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "DatabaseBackupObjects",
      "Effect": "Allow",
      "Action": ["s3:PutObject", "s3:GetObject"],
      "Resource": "arn:aws:s3:::${BACKUP_BUCKET}/db-backups/production/*"
    },
    {
      "Sid": "DatabaseBackupInventory",
      "Effect": "Allow",
      "Action": ["s3:ListBucket"],
      "Resource": "arn:aws:s3:::${BACKUP_BUCKET}",
      "Condition": {"StringLike": {"s3:prefix": "db-backups/production/*"}}
    },
    {
      "Sid": "DatabaseOperationsMetrics",
      "Effect": "Allow",
      "Action": "cloudwatch:PutMetricData",
      "Resource": "*",
      "Condition": {"StringEquals": {"cloudwatch:namespace": "Herfree/Operations"}}
    }
  ]
}
EOF
aws iam put-role-policy \
  --role-name "${PRODUCTION_ROLE_NAME}" \
  --policy-name herfree-production-local-db-ops \
  --policy-document "file://${WORK_DIR}/runtime-policy.json"

echo "adding backup configuration without changing the active RDS mode"
aws secretsmanager get-secret-value --region "${AWS_REGION}" \
  --secret-id herfree/production/app-config \
  --query SecretString --output text > "${WORK_DIR}/app-config.json"
jq --arg bucket "${BACKUP_BUCKET}" \
  '. + {dbBackupBucket:$bucket, dbMode:(.dbMode // "rds")}' \
  "${WORK_DIR}/app-config.json" > "${WORK_DIR}/app-config.next.json"
aws secretsmanager put-secret-value --region "${AWS_REGION}" \
  --secret-id herfree/production/app-config \
  --secret-string "file://${WORK_DIR}/app-config.next.json" >/dev/null

aws secretsmanager get-secret-value --region "${AWS_REGION}" \
  --secret-id herfree/production/db-app \
  --query SecretString --output text > "${WORK_DIR}/db-app.json"
if ! jq -e '.rootPassword | type == "string" and length >= 16' "${WORK_DIR}/db-app.json" >/dev/null; then
  root_password="$(openssl rand -base64 48 | tr -d '\r\n')"
  jq --arg password "${root_password}" '. + {rootPassword:$password}' \
    "${WORK_DIR}/db-app.json" > "${WORK_DIR}/db-app.next.json"
  aws secretsmanager put-secret-value --region "${AWS_REGION}" \
    --secret-id herfree/production/db-app \
    --secret-string "file://${WORK_DIR}/db-app.next.json" >/dev/null
  unset root_password
fi

availability_zone="$(aws ec2 describe-instances --region "${AWS_REGION}" \
  --instance-ids "${PRODUCTION_INSTANCE_ID}" \
  --query 'Reservations[0].Instances[0].Placement.AvailabilityZone' --output text)"
volume_id="$(aws ec2 describe-volumes --region "${AWS_REGION}" \
  --filters "Name=tag:Name,Values=${VOLUME_NAME}" \
    "Name=availability-zone,Values=${availability_zone}" \
    'Name=status,Values=available,in-use' \
  --query 'Volumes[0].VolumeId' --output text)"
if [[ -z "${volume_id}" || "${volume_id}" == "None" ]]; then
  volume_id="$(aws ec2 create-volume --region "${AWS_REGION}" \
    --availability-zone "${availability_zone}" \
    --size 10 --volume-type gp3 --encrypted \
    --tag-specifications \
      "ResourceType=volume,Tags=[{Key=Name,Value=${VOLUME_NAME}},{Key=Project,Value=herfree},{Key=Environment,Value=production},{Key=Purpose,Value=mysql-data},{Key=HerfreeBackup,Value=daily}]" \
    --query VolumeId --output text)"
  aws ec2 wait volume-available --region "${AWS_REGION}" --volume-ids "${volume_id}"
fi

attached_instance="$(aws ec2 describe-volumes --region "${AWS_REGION}" --volume-ids "${volume_id}" \
  --query 'Volumes[0].Attachments[0].InstanceId' --output text)"
if [[ -n "${attached_instance}" && "${attached_instance}" != "None" \
   && "${attached_instance}" != "${PRODUCTION_INSTANCE_ID}" ]]; then
  echo "database volume is attached to an unexpected instance" >&2
  exit 1
fi
if [[ -z "${attached_instance}" || "${attached_instance}" == "None" ]]; then
  aws ec2 attach-volume --region "${AWS_REGION}" \
    --volume-id "${volume_id}" --instance-id "${PRODUCTION_INSTANCE_ID}" \
    --device /dev/sdf >/dev/null
  aws ec2 wait volume-in-use --region "${AWS_REGION}" --volume-ids "${volume_id}"
fi

remote_script="$(cat <<EOF
set -euo pipefail
volume_id='${volume_id}'
serial="\${volume_id//-/}"
device=''
for _ in {1..60}; do
  candidate="/dev/disk/by-id/nvme-Amazon_Elastic_Block_Store_\${serial}"
  if [[ -e "\${candidate}" ]]; then
    device="\$(readlink -f "\${candidate}")"
    break
  fi
  sleep 2
done
[[ -b "\${device}" ]] || { echo 'attached database block device was not found' >&2; exit 1; }
filesystem="\$(blkid -s TYPE -o value "\${device}" || true)"
if [[ -z "\${filesystem}" ]]; then
  mkfs.ext4 -m 0 -L herfree-mysql "\${device}" >/dev/null
elif [[ "\${filesystem}" != 'ext4' ]]; then
  echo 'database volume has an unexpected filesystem' >&2
  exit 1
fi
install -d -m 0755 /var/lib/herfree
uuid="\$(blkid -s UUID -o value "\${device}")"
grep -q "UUID=\${uuid} " /etc/fstab || printf 'UUID=%s /var/lib/herfree ext4 defaults,nofail 0 2\n' "\${uuid}" >> /etc/fstab
mountpoint -q /var/lib/herfree || mount /var/lib/herfree
if ! swapon --show=NAME --noheadings | grep -qx '/swapfile'; then
  if [[ ! -f /swapfile ]]; then
    fallocate -l 1G /swapfile
    chmod 600 /swapfile
    mkswap /swapfile >/dev/null
  fi
  swapon /swapfile
  grep -q '^/swapfile ' /etc/fstab || printf '/swapfile none swap sw 0 0\n' >> /etc/fstab
fi
findmnt /var/lib/herfree
free -m
EOF
)"
jq -n --arg script "${remote_script}" \
  '{commands:[("printf %s " + ($script | @sh) + " | bash")],executionTimeout:["600"]}' > "${WORK_DIR}/ssm-parameters.json"
command_id="$(aws ssm send-command --region "${AWS_REGION}" \
  --instance-ids "${PRODUCTION_INSTANCE_ID}" \
  --document-name AWS-RunShellScript \
  --timeout-seconds 600 \
  --parameters "file://${WORK_DIR}/ssm-parameters.json" \
  --query 'Command.CommandId' --output text)"
if ! aws ssm wait command-executed --region "${AWS_REGION}" \
    --command-id "${command_id}" --instance-id "${PRODUCTION_INSTANCE_ID}"; then
  aws ssm get-command-invocation --region "${AWS_REGION}" \
    --command-id "${command_id}" --instance-id "${PRODUCTION_INSTANCE_ID}"
  exit 1
fi
aws ssm get-command-invocation --region "${AWS_REGION}" \
  --command-id "${command_id}" --instance-id "${PRODUCTION_INSTANCE_ID}" \
  --query '{Status:Status,Output:StandardOutputContent,Error:StandardErrorContent}' --output json

dlm_role_name="AWSDataLifecycleManagerDefaultRole"
if ! aws iam get-role --role-name "${dlm_role_name}" >/dev/null 2>&1; then
  cat > "${WORK_DIR}/dlm-trust.json" <<'EOF'
{"Version":"2012-10-17","Statement":[{"Effect":"Allow","Principal":{"Service":"dlm.amazonaws.com"},"Action":"sts:AssumeRole"}]}
EOF
  aws iam create-role --role-name "${dlm_role_name}" \
    --assume-role-policy-document "file://${WORK_DIR}/dlm-trust.json" >/dev/null
fi
aws iam attach-role-policy --role-name "${dlm_role_name}" \
  --policy-arn arn:aws:iam::aws:policy/service-role/AWSDataLifecycleManagerServiceRole

dlm_description="Herfree production local MySQL daily snapshots"
existing_dlm="$(aws dlm get-lifecycle-policies --region "${AWS_REGION}" \
  --query "Policies[?Description=='${dlm_description}'].PolicyId | [0]" --output text)"
if [[ -z "${existing_dlm}" || "${existing_dlm}" == "None" ]]; then
  cat > "${WORK_DIR}/dlm-policy.json" <<'EOF'
{
  "PolicyType": "EBS_SNAPSHOT_MANAGEMENT",
  "ResourceTypes": ["VOLUME"],
  "TargetTags": [{"Key": "HerfreeBackup", "Value": "daily"}],
  "Schedules": [{
    "Name": "Daily encrypted MySQL volume snapshots",
    "CopyTags": true,
    "TagsToAdd": [{"Key": "Project", "Value": "herfree"}, {"Key": "Environment", "Value": "production"}],
    "CreateRule": {"Interval": 24, "IntervalUnit": "HOURS", "Times": ["18:00"]},
    "RetainRule": {"Count": 7}
  }]
}
EOF
  aws dlm create-lifecycle-policy --region "${AWS_REGION}" \
    --description "${dlm_description}" \
    --state ENABLED \
    --execution-role-arn "arn:aws:iam::${ACCOUNT_ID}:role/${dlm_role_name}" \
    --policy-details "file://${WORK_DIR}/dlm-policy.json" >/dev/null
fi

for alarm in \
  'herfree-production-local-db-health|LocalDatabaseHealthy|LessThanThreshold|1|Count|300|2' \
  'herfree-production-local-db-disk|LocalDatabaseDiskUsedPercent|GreaterThanOrEqualToThreshold|80|Percent|300|1' \
  'herfree-production-local-db-backup-age|DatabaseBackupAgeHours|GreaterThanThreshold|8|Count|900|1'; do
  IFS='|' read -r name metric comparison threshold unit period periods <<< "${alarm}"
  aws cloudwatch put-metric-alarm --region "${AWS_REGION}" \
    --alarm-name "${name}" \
    --namespace Herfree/Operations \
    --metric-name "${metric}" \
    --dimensions Name=Environment,Value=production \
    --statistic Maximum \
    --period "${period}" --evaluation-periods "${periods}" \
    --datapoints-to-alarm "${periods}" \
    --threshold "${threshold}" --comparison-operator "${comparison}" \
    --treat-missing-data breaching --unit "${unit}"
done

echo "local DB AWS prerequisites ready: bucket=${BACKUP_BUCKET} volume=${volume_id}"
echo "active database mode remains RDS"
