# Fix staging blockers reported by check-staging-status.ps1 (no secret output).
param(
    [string]$AwsProfile = "herfree-staging",
    [string]$Region = "ap-northeast-2",
    [string]$StagingInstanceId = "i-02cf5b8f3a7aa32da",
    [string]$FrontendUrl = "https://develop.d2bcg3vnlv5hkh.amplifyapp.com",
    [switch]$SkipSecretsSync,
    [switch]$DryRun
)

$ErrorActionPreference = "Stop"
$root = Split-Path -Parent $PSScriptRoot
Set-Location $root

function Invoke-Aws([string[]]$Args) {
    if ($DryRun) {
        Write-Host "[dry-run] aws $($Args -join ' ')" -ForegroundColor Yellow
        return $null
    }
    $output = & aws @Args --profile $AwsProfile --region $Region --output json 2>&1
    if ($LASTEXITCODE -ne 0) {
        throw ($output | Out-String)
    }
    if ($output) { return $output | ConvertFrom-Json }
    return $null
}

Write-Host ""
Write-Host "== Fix staging blockers ==" -ForegroundColor Cyan
Write-Host ""

$identity = Invoke-Aws @("sts", "get-caller-identity")
if (-not $DryRun) {
    Write-Host "[OK] AWS account $($identity.Account)" -ForegroundColor Green
}

Write-Host "-> EC2 IMDS hop limit 2"
if ($DryRun) {
    Write-Host "[dry-run] modify-instance-metadata-options" -ForegroundColor Yellow
}
else {
    Invoke-Aws @(
        "ec2", "modify-instance-metadata-options",
        "--instance-id", $StagingInstanceId,
        "--http-tokens", "required",
        "--http-put-response-hop-limit", "2"
    ) | Out-Null
    Write-Host "[OK] EC2 metadata hop limit set" -ForegroundColor Green
}

Write-Host "-> SES sender verification"
if ($DryRun) {
    Write-Host "[dry-run] ses verify-email-identity herpfree3@gmail.com" -ForegroundColor Yellow
}
else {
    $ses = aws ses get-identity-verification-attributes `
        --profile $AwsProfile --region $Region `
        --identities herpfree3@gmail.com --output json | ConvertFrom-Json
    $status = $ses.VerificationAttributes.'herpfree3@gmail.com'.VerificationStatus
    if ($status -ne "Success") {
        aws ses verify-email-identity `
            --profile $AwsProfile --region $Region `
            --email-address herpfree3@gmail.com | Out-Null
        Write-Host "[WARN] SES verification email sent — click link in herpfree3@gmail.com inbox" -ForegroundColor Yellow
    }
    else {
        Write-Host "[OK] SES sender already verified" -ForegroundColor Green
    }
}

if (-not $SkipSecretsSync) {
    Write-Host "-> Secrets Manager + GitHub staging URLs"
    $applyScript = Join-Path $PSScriptRoot "apply-staging-amplify-url.ps1"
    if ($DryRun) {
        Write-Host "[dry-run] apply-staging-amplify-url.ps1 -UpdateSecretsManager" -ForegroundColor Yellow
    }
    else {
        & $applyScript -FrontendUrl $FrontendUrl -UpdateSecretsManager
    }
}

Write-Host ""
Write-Host "Manual (console) if still blocked:" -ForegroundColor Cyan
Write-Host "  - Amplify herfree-staging: Connect GitHub develop branch (docs/staging-operations.md §8.1)"
Write-Host "  - Amplify Basic Auth must stay enabled for staging"
Write-Host ""
Write-Host "Re-check: powershell -File scripts/check-staging-status.ps1" -ForegroundColor DarkGray
Write-Host ""
