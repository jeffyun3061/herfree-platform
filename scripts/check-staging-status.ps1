# Check Herfree staging without printing secret values.
param(
    [string]$AwsProfile = "herfree-staging",
    [string]$Region = "ap-northeast-2",
    [switch]$Strict
)

$ErrorActionPreference = "Stop"
$root = Split-Path -Parent $PSScriptRoot
Set-Location $root

$StagingFrontendUrl = "https://develop.d2bcg3vnlv5hkh.amplifyapp.com"
$StagingCustomFrontendHost = "staging.herpfree.co.kr"

$checks = New-Object System.Collections.Generic.List[object]

function Add-Check([string]$Name, [bool]$Passed, [string]$Detail, [bool]$Blocking = $false) {
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

function Resolve-ARecord([string]$Name) {
    try {
        return @(Resolve-DnsName $Name -Type A -ErrorAction Stop |
            Where-Object { $_.IPAddress } |
            Select-Object -ExpandProperty IPAddress)
    }
    catch {
        return @()
    }
}

function Test-Https([string]$Url, [hashtable]$Credential = $null) {
    try {
        $params = @{
            Uri             = $Url
            UseBasicParsing = $true
            TimeoutSec      = 15
        }
        if ($Credential) {
            $pair = "{0}:{1}" -f $Credential.Username, $Credential.Password
            $bytes = [System.Text.Encoding]::ASCII.GetBytes($pair)
            $params.Headers = @{ Authorization = "Basic $([Convert]::ToBase64String($bytes))" }
        }
        $response = Invoke-WebRequest @params
        return $response.StatusCode
    }
    catch {
        if ($_.Exception.Response) {
            return [int]$_.Exception.Response.StatusCode
        }
        return 0
    }
}

Write-Host ""
Write-Host "== Herfree staging status ==" -ForegroundColor Cyan
Write-Host "Secret values are never printed." -ForegroundColor DarkGray
Write-Host ""

try {
    $identity = aws sts get-caller-identity --profile $AwsProfile --region $Region --output json | ConvertFrom-Json
    Add-Check "AWS login" ($identity.Account -eq "439777528445") "account $($identity.Account)"
}
catch {
    Add-Check "AWS login" $false "Run: aws sso login --profile $AwsProfile" $true
}

try {
    $instance = aws ec2 describe-instances `
        --profile $AwsProfile --region $Region `
        --instance-ids i-02cf5b8f3a7aa32da `
        --query "Reservations[0].Instances[0].{State:State.Name,PublicIp:PublicIpAddress,HopLimit:MetadataOptions.HttpPutResponseHopLimit,Tokens:MetadataOptions.HttpTokens}" `
        --output json | ConvertFrom-Json
    $ec2Ok = $instance.State -eq "running" -and $instance.PublicIp -eq "3.37.78.234"
    Add-Check "EC2" $ec2Ok "$($instance.State), EIP $($instance.PublicIp), IMDSv2 $($instance.Tokens), hop $($instance.HopLimit)" $true
    Add-Check "Container AWS credentials" ($instance.HopLimit -ge 2) "Docker bridge requires IMDS hop limit 2" $true
}
catch {
    Add-Check "EC2" $false $_.Exception.Message $true
}

try {
    $rds = aws rds describe-db-instances `
        --profile $AwsProfile --region $Region `
        --db-instance-identifier herfree-staging-mysql `
        --query "DBInstances[0].{Status:DBInstanceStatus,Public:PubliclyAccessible,Encrypted:StorageEncrypted,BackupDays:BackupRetentionPeriod,LatestRestore:LatestRestorableTime}" `
        --output json | ConvertFrom-Json
    $rdsOk = $rds.Status -eq "available" -and -not $rds.Public -and $rds.Encrypted
    Add-Check "RDS" $rdsOk "$($rds.Status), private=$(-not $rds.Public), encrypted=$($rds.Encrypted)" $true
    Add-Check "RDS automated backup" ($rds.BackupDays -ge 1 -and $null -ne $rds.LatestRestore) "retention $($rds.BackupDays) day(s), latest restore $($rds.LatestRestore)" $true
}
catch {
    Add-Check "RDS" $false $_.Exception.Message $true
}

try {
    $amplify = aws amplify get-app `
        --profile $AwsProfile --region $Region `
        --app-id d2bcg3vnlv5hkh `
        --query "app.{Repository:repository,DefaultDomain:defaultDomain,BasicAuth:enableBasicAuth}" `
        --output json | ConvertFrom-Json
    Add-Check "Amplify Basic Auth" ($amplify.BasicAuth -eq $true) "enabled=$($amplify.BasicAuth)" $true
    Add-Check "Amplify GitHub connection" (-not [string]::IsNullOrWhiteSpace($amplify.Repository)) $(if ($amplify.Repository) { $amplify.Repository } else { "repository connection required" }) $true
    try {
        $domains = aws amplify list-domain-associations `
            --profile $AwsProfile --region $Region `
            --app-id d2bcg3vnlv5hkh `
            --query "domainAssociations[].domainName" `
            --output json | ConvertFrom-Json
        $customDomains = @($domains | Where-Object { $_ })
        $customOk = $customDomains.Count -eq 0
        Add-Check "Amplify custom domain removed" $customOk $(if ($customOk) { "none (amplifyapp.com only)" } else { ($customDomains -join ", ") + " — remove per docs/staging-operations.md §9" })
    }
    catch {
        Add-Check "Amplify custom domain removed" $false "could not list domain associations"
    }
}
catch {
    Add-Check "Amplify" $false $_.Exception.Message $true
}

try {
    $sesRaw = aws ses get-identity-verification-attributes `
        --profile $AwsProfile --region $Region `
        --identities herpfree3@gmail.com --output json | ConvertFrom-Json
    $sesStatus = $sesRaw.VerificationAttributes.'herpfree3@gmail.com'.VerificationStatus
    if (-not $sesStatus) { $sesStatus = "NotFound" }
    Add-Check "SES sender" ($sesStatus -eq "Success") $sesStatus $true
}
catch {
    Add-Check "SES sender" $false $_.Exception.Message $true
}

$apiIps = Resolve-ARecord "api-staging.herpfree.co.kr"
$customFrontendIps = Resolve-ARecord $StagingCustomFrontendHost
Add-Check "API DNS" ($apiIps -contains "3.37.78.234") $(if ($apiIps.Count) { $apiIps -join ", " } else { "not configured" }) $true
Add-Check "Custom frontend DNS (optional)" ($customFrontendIps.Count -eq 0) $(if ($customFrontendIps.Count) { "still configured — Gabia cleanup §9.3" } else { "not configured (expected during reset)" })

$apiHttpCode = Test-Https "http://api-staging.herpfree.co.kr/api/health"
Add-Check "API HTTP redirect/health" ($apiHttpCode -in @(200, 301, 302, 308)) "HTTP $apiHttpCode"

if ($apiIps.Count -gt 0) {
    $healthCode = Test-Https "https://api-staging.herpfree.co.kr/api/health"
    Add-Check "API HTTPS health" ($healthCode -eq 200) $(if ($healthCode -eq 200) { "HTTP 200" } else { "HTTPS not ready" }) $true
}

$frontendCode = Test-Https $StagingFrontendUrl
Add-Check "Amplify frontend" ($frontendCode -in @(200, 401)) "HTTP $frontendCode at $StagingFrontendUrl" $true

try {
    gh auth status 2>&1 | Out-Null
    $secretNames = @(gh secret list --env staging --json name --jq '.[].name')
    foreach ($requiredSecret in @("AWS_DEPLOY_ROLE_ARN", "E2E_HTTP_USERNAME", "E2E_HTTP_PASSWORD")) {
        Add-Check "GitHub secret: $requiredSecret" ($secretNames -contains $requiredSecret) "value hidden" $true
    }

    $frontendVar = gh variable get STAGING_FRONTEND_URL -e staging 2>$null
    Add-Check "GitHub STAGING_FRONTEND_URL" ($frontendVar -eq $StagingFrontendUrl) $(if ($frontendVar) { $frontendVar } else { "missing" }) $true

    $runJson = gh run list --workflow "Release backend" --limit 1 --json databaseId,status,conclusion,headSha,url | ConvertFrom-Json
    if ($runJson.Count -gt 0) {
        $run = $runJson[0]
        Add-Check "Latest staging release" ($run.conclusion -eq "success") "$($run.conclusion), $($run.headSha.Substring(0, 7)), $($run.url)" $true
    }
}
catch {
    Add-Check "GitHub status" $false "Run gh auth login or check API access" $true
}

$blocking = @($checks | Where-Object { -not $_.Passed -and $_.Blocking })
Write-Host ""
if ($blocking.Count -eq 0) {
    Write-Host "STAGING READY: automated status checks passed. Continue manual user-flow QA." -ForegroundColor Green
}
else {
    Write-Host "STAGING BLOCKED: complete the following $($blocking.Count) item(s)." -ForegroundColor Red
    $blocking | ForEach-Object { Write-Host "  - $($_.Name): $($_.Detail)" }
}

if ($Strict -and $blocking.Count -gt 0) {
    exit 1
}

exit 0
