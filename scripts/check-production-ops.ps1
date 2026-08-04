param(
    [string]$AwsProfile = $(if ($env:AWS_PROFILE) { $env:AWS_PROFILE } else { "default" }),
    [string]$Region = "ap-northeast-2",
    [string]$AccountId = "439777528445",
    [string]$RdsInstanceId = "herfree-production-mysql",
    [string]$S3Bucket = "herfree-prod-uploads-439777528445-ap-northeast-2",
    [string]$LogGroup = "/herfree/production/api",
    [string]$ProductionInstanceId = $env:PRODUCTION_INSTANCE_ID,
    [string]$ApiHost = "api.herpfree.co.kr",
    [string]$FrontendHost = "herpfree.co.kr",
    [switch]$RequireFrontendDns,
    [switch]$Strict,
    [string]$ReportPath = "artifacts/production-ops/latest.md"
)

$ErrorActionPreference = "Stop"
$root = Split-Path -Parent $PSScriptRoot
Set-Location $root

$checks = [System.Collections.Generic.List[object]]::new()

function Add-Check([string]$Name, [bool]$Passed, [string]$Detail, [bool]$Blocking = $true) {
    $checks.Add([pscustomobject]@{
            Name = $Name
            Passed = $Passed
            Detail = $Detail
            Blocking = $Blocking
        }) | Out-Null
    $label = if ($Passed) { "OK" } elseif ($Blocking) { "BLOCK" } else { "WARN" }
    $color = if ($Passed) { "Green" } elseif ($Blocking) { "Red" } else { "Yellow" }
    Write-Host "[$label] $Name - $Detail" -ForegroundColor $color
}

function Invoke-AwsJson([string[]]$Arguments) {
    $raw = @(& aws @Arguments --profile $AwsProfile --region $Region --output json 2>&1)
    if ($LASTEXITCODE -ne 0) { throw (($raw | Out-String).Trim()) }
    if ($raw.Count -eq 0 -or [string]::IsNullOrWhiteSpace(($raw -join ""))) { return $null }
    return (($raw -join [Environment]::NewLine) | ConvertFrom-Json)
}

function Resolve-Names([string]$Name, [string]$Type) {
    try {
        return @(Resolve-DnsName $Name -Type $Type -ErrorAction Stop |
            Where-Object { $_.IPAddress -or $_.NameHost } |
            ForEach-Object { if ($_.IPAddress) { $_.IPAddress } else { $_.NameHost } })
    }
    catch { return @() }
}

Write-Host "== Herfree production operations audit (read-only) ==" -ForegroundColor Cyan
Write-Host "AWS profile: $AwsProfile | region: $Region"
Write-Host "No secret values are retrieved or printed."
Write-Host ""

try {
    $identity = Invoke-AwsJson @("sts", "get-caller-identity")
    Add-Check "AWS account" ($identity.Account -eq $AccountId) "account $($identity.Account)"
}
catch {
    Add-Check "AWS credentials" $false "run aws sso login --profile $AwsProfile"
    $blocking = @($checks | Where-Object { -not $_.Passed -and $_.Blocking })
    if ($Strict -and $blocking.Count -gt 0) { exit 1 }
    exit 0
}

try {
    $rds = (Invoke-AwsJson @("rds", "describe-db-instances", "--db-instance-identifier", $RdsInstanceId)).DBInstances[0]
    Add-Check "RDS available" ($rds.DBInstanceStatus -eq "available") "$($rds.DBInstanceStatus)"
    Add-Check "RDS private" (-not $rds.PubliclyAccessible) "publiclyAccessible=$($rds.PubliclyAccessible)"
    Add-Check "RDS storage encryption" ($rds.StorageEncrypted -eq $true) "storageEncrypted=$($rds.StorageEncrypted)"
    Add-Check "RDS deletion protection" ($rds.DeletionProtection -eq $true) "deletionProtection=$($rds.DeletionProtection)"
    Add-Check "RDS backup retention" ([int]$rds.BackupRetentionPeriod -ge 7) "retention=$($rds.BackupRetentionPeriod) day(s)"
    Add-Check "RDS point-in-time restore" (-not [string]::IsNullOrWhiteSpace([string]$rds.LatestRestorableTime)) "latestRestorableTime present"
    Add-Check "RDS CA certificate" (-not [string]::IsNullOrWhiteSpace([string]$rds.CACertificateIdentifier)) "CA=$($rds.CACertificateIdentifier)"
}
catch {
    Add-Check "RDS inventory" $false $_.Exception.Message
}

try {
    $publicBlock = Invoke-AwsJson @("s3api", "get-public-access-block", "--bucket", $S3Bucket).PublicAccessBlockConfiguration
    $publicBlockOk = $publicBlock.BlockPublicAcls -and $publicBlock.IgnorePublicAcls -and $publicBlock.BlockPublicPolicy -and $publicBlock.RestrictPublicBuckets
    Add-Check "S3 public access block" $publicBlockOk "all four public-access controls enabled"
}
catch {
    Add-Check "S3 public access block" $false $_.Exception.Message
}

try {
    $encryption = Invoke-AwsJson @("s3api", "get-bucket-encryption", "--bucket", $S3Bucket)
    $algorithm = [string]$encryption.ServerSideEncryptionConfiguration.Rules[0].ApplyServerSideEncryptionByDefault.SSEAlgorithm
    Add-Check "S3 default encryption" ($algorithm -in @("AES256", "aws:kms")) "algorithm=$algorithm"
}
catch {
    Add-Check "S3 default encryption" $false $_.Exception.Message
}

try {
    $versioning = Invoke-AwsJson @("s3api", "get-bucket-versioning", "--bucket", $S3Bucket)
    Add-Check "S3 versioning" ($versioning.Status -eq "Enabled") "status=$($versioning.Status)"
}
catch {
    Add-Check "S3 versioning" $false $_.Exception.Message
}

try {
    $log = @((Invoke-AwsJson @("logs", "describe-log-groups", "--log-group-name-prefix", $LogGroup)).logGroups |
        Where-Object { $_.logGroupName -eq $LogGroup })[0]
    if ($null -eq $log) { throw "log group not found" }
    Add-Check "CloudWatch log retention" ([int]$log.retentionInDays -ge 30) "retention=$($log.retentionInDays) day(s)"
    Add-Check "CloudWatch log KMS" (-not [string]::IsNullOrWhiteSpace([string]$log.kmsKeyId)) "KMS key configured"
}
catch {
    Add-Check "CloudWatch log group" $false $_.Exception.Message
}

try {
    $alarms = @(Invoke-AwsJson @("cloudwatch", "describe-alarms", "--alarm-name-prefix", "herfree-production")).MetricAlarms
    $alarmNames = @($alarms | ForEach-Object { [string]$_.AlarmName })
    Add-Check "CloudWatch alarms exist" ($alarmNames.Count -gt 0) "count=$($alarmNames.Count)"
    Add-Check "Health alarm" (@($alarmNames | Where-Object { $_ -match '(?i)health' }).Count -gt 0) "name contains health"
    Add-Check "5xx/error alarm" (@($alarmNames | Where-Object { $_ -match '(?i)5xx|error|http' }).Count -gt 0) "name contains 5xx/error/http"
    Add-Check "RDS alarm" (@($alarmNames | Where-Object { $_ -match '(?i)rds|database|db' }).Count -gt 0) "name contains rds/database/db"
    Add-Check "Host resource alarm" (@($alarmNames | Where-Object { $_ -match '(?i)cpu|memory|disk|storage' }).Count -gt 0) "name contains cpu/memory/disk/storage"
    $badStates = @($alarms | Where-Object { $_.StateValue -eq "INSUFFICIENT_DATA" })
    Add-Check "CloudWatch alarm state" ($badStates.Count -eq 0) "insufficient-data=$($badStates.Count)"
}
catch {
    Add-Check "CloudWatch alarms inventory" $false $_.Exception.Message
}

try {
    $summary = Invoke-AwsJson @("iam", "get-account-summary").SummaryMap
    Add-Check "AWS account MFA" ([int]$summary.AccountMFAEnabled -eq 1) "AccountMFAEnabled=$($summary.AccountMFAEnabled)"
}
catch {
    Add-Check "AWS account MFA" $false $_.Exception.Message
}

if (-not [string]::IsNullOrWhiteSpace($ProductionInstanceId)) {
    try {
        $instance = (Invoke-AwsJson @("ec2", "describe-instances", "--instance-ids", $ProductionInstanceId)).Reservations[0].Instances[0]
        Add-Check "Production EC2 running" ($instance.State.Name -eq "running") "state=$($instance.State.Name)"
        Add-Check "EC2 IMDSv2" ($instance.MetadataOptions.HttpTokens -eq "required") "HttpTokens=$($instance.MetadataOptions.HttpTokens)"
        $ssm = @(Invoke-AwsJson @("ssm", "describe-instance-information", "--filters", "Key=InstanceIds,Values=$ProductionInstanceId")).InstanceInformationList[0]
        Add-Check "EC2 SSM online" ($null -ne $ssm -and $ssm.PingStatus -eq "Online") "ping=$($ssm.PingStatus)"
    }
    catch {
        Add-Check "Production EC2 inventory" $false $_.Exception.Message
    }
}
else {
    Add-Check "Production EC2 inventory" $false "provide -ProductionInstanceId or PRODUCTION_INSTANCE_ID" $false
}

$apiRecords = @(Resolve-Names $ApiHost "A") + @(Resolve-Names $ApiHost "CNAME")
Add-Check "API DNS" ($apiRecords.Count -gt 0) $(if ($apiRecords.Count) { $apiRecords -join ", " } else { "no A/CNAME record" })
$frontendRecords = @(Resolve-Names $FrontendHost "A") + @(Resolve-Names $FrontendHost "CNAME")
if ($RequireFrontendDns) {
    Add-Check "Frontend DNS" ($frontendRecords.Count -gt 0) $(if ($frontendRecords.Count) { $frontendRecords -join ", " } else { "no A/CNAME record" })
}
else {
    Add-Check "Frontend DNS" ($frontendRecords.Count -gt 0) $(if ($frontendRecords.Count) { $frontendRecords -join ", " } else { "not configured; run with -RequireFrontendDns to block" }) $false
}

$blocking = @($checks | Where-Object { -not $_.Passed -and $_.Blocking })
$warnings = @($checks | Where-Object { -not $_.Passed -and -not $_.Blocking })
$reportFile = Join-Path $root $ReportPath
$reportDir = Split-Path -Parent $reportFile
New-Item -ItemType Directory -Force -Path $reportDir | Out-Null
$lines = [System.Collections.Generic.List[string]]::new()
$lines.Add("# Production operations audit")
$lines.Add("")
$lines.Add("- Checked (UTC): $((Get-Date).ToUniversalTime().ToString('o'))")
$lines.Add("- AWS region: $Region")
$lines.Add("- Result: **$(if ($blocking.Count -eq 0) { 'PASS' } else { 'BLOCKED' })**")
$lines.Add("")
$lines.Add("| Check | Status | Detail |")
$lines.Add("| --- | --- | --- |")
foreach ($check in $checks) {
    $status = if ($check.Passed) { "PASS" } elseif ($check.Blocking) { "BLOCK" } else { "WARN" }
    $safeDetail = ([string]$check.Detail) -replace '\|', '\\|'
    $lines.Add("| $($check.Name) | $status | $safeDetail |")
}
Set-Content -LiteralPath $reportFile -Value ($lines -join [Environment]::NewLine) -Encoding UTF8

Write-Host ""
Write-Host "Report: $reportFile" -ForegroundColor DarkGray
Write-Host "blocking=$($blocking.Count) warnings=$($warnings.Count)"
if ($Strict -and $blocking.Count -gt 0) { exit 1 }
exit 0
