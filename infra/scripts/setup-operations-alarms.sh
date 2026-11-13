#!/usr/bin/env bash
set -euo pipefail
AWS_REGION="${AWS_REGION:-ap-northeast-2}"
: "${OPERATIONS_SNS_TOPIC_ARN:?Existing confirmed operations SNS topic is required}"
ACCOUNT_ID="$(aws sts get-caller-identity --query Account --output text)"
[[ "${OPERATIONS_SNS_TOPIC_ARN}" == "arn:aws:sns:${AWS_REGION}:${ACCOUNT_ID}:"* ]] || { echo 'Unexpected SNS account or region'; exit 1; }
confirmed="$(aws sns list-subscriptions-by-topic --region "${AWS_REGION}" --topic-arn "${OPERATIONS_SNS_TOPIC_ARN}" \
  --query 'Subscriptions[?SubscriptionArn!=`PendingConfirmation`].SubscriptionArn' --output text)"
[[ -n "${confirmed}" ]] || { echo 'Confirm an alert subscription before enabling alarms'; exit 1; }
for rule in \
 'host-memory|HostMemoryUsedPercent|GreaterThanOrEqualToThreshold|80|Percent|3|Maximum' \
 'root-disk|RootDiskUsedPercent|GreaterThanOrEqualToThreshold|80|Percent|3|Maximum' \
 'public-https|PublicHttpsHealthy|LessThanThreshold|1|Count|2|Minimum' \
 'restore-age|LastSuccessfulRestoreDrillAgeDays|GreaterThanThreshold|35|Count|1|Maximum' \
 'restore-health|RestoreDrillHealthy|LessThanThreshold|1|Count|1|Minimum' \
 'local-db-health|LocalDatabaseHealthy|LessThanThreshold|1|Count|2|Minimum' \
 'local-db-disk|LocalDatabaseDiskUsedPercent|GreaterThanOrEqualToThreshold|80|Percent|3|Maximum' \
 'local-db-backup-age|DatabaseBackupAgeHours|GreaterThanThreshold|8|Count|1|Maximum'; do
 IFS='|' read -r suffix metric comparison threshold unit periods statistic <<< "${rule}"
 aws cloudwatch put-metric-alarm --region "${AWS_REGION}" --alarm-name "herfree-production-${suffix}" \
   --namespace Herfree/Operations --metric-name "${metric}" --dimensions Name=Environment,Value=production \
   --statistic "${statistic}" --period 300 --evaluation-periods "${periods}" --datapoints-to-alarm "${periods}" \
   --threshold "${threshold}" --comparison-operator "${comparison}" --unit "${unit}" \
   --treat-missing-data breaching --alarm-actions "${OPERATIONS_SNS_TOPIC_ARN}" --ok-actions "${OPERATIONS_SNS_TOPIC_ARN}"
done
: "${PRODUCTION_INSTANCE_ID:?Operating EC2 instance ID is required}"
aws cloudwatch put-metric-alarm --region "${AWS_REGION}" --alarm-name herfree-production-instance-status \
  --namespace AWS/EC2 --metric-name StatusCheckFailed --dimensions "Name=InstanceId,Value=${PRODUCTION_INSTANCE_ID}" \
  --statistic Maximum --period 300 --evaluation-periods 1 --threshold 0 --comparison-operator GreaterThanThreshold \
  --treat-missing-data breaching --alarm-actions "${OPERATIONS_SNS_TOPIC_ARN}" --ok-actions "${OPERATIONS_SNS_TOPIC_ARN}"
