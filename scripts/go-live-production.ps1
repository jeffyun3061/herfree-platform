# Staging blocker fix -> production AWS -> GitHub -> release orchestration.
param(
    [string]$AwsProfile = "herfree-staging",
    [string]$Region = "ap-northeast-2",
    [string]$Repo = "jeffyun3061/herfree-platform",
    [string]$ProductionApiUrl = "https://api.herpfree.co.kr",
    [string]$ProductionFrontendUrl = "https://herpfree.co.kr",
    [string]$ProductionDeployRoleArn = "arn:aws:iam::439777528445:role/herfree-github-production-deploy",
    [switch]$SkipStagingFix,
    [switch]$SkipProductionAws,
    [switch]$SkipRelease,
    [switch]$DryRun
)

$ErrorActionPreference = "Stop"
$root = Split-Path -Parent $PSScriptRoot
Set-Location $root

function Write-Step([string]$Message) {
    Write-Host ""
    Write-Host "== $Message ==" -ForegroundColor Cyan
}

Write-Host ""
Write-Host "Herfree production go-live" -ForegroundColor Cyan
Write-Host "DryRun=$DryRun" -ForegroundColor DarkGray
Write-Host ""

# 0. AWS login
Write-Step "0. AWS login"
if ($DryRun) {
    Write-Host "[dry-run] aws sts get-caller-identity" -ForegroundColor Yellow
}
else {
    $identity = aws sts get-caller-identity --profile $AwsProfile --region $Region --output json | ConvertFrom-Json
    Write-Host "[OK] account $($identity.Account)" -ForegroundColor Green
}

# 1. Staging blockers
if (-not $SkipStagingFix) {
    Write-Step "1. Fix staging blockers"
    $fixArgs = @("-File", (Join-Path $PSScriptRoot "fix-staging-blockers.ps1"), "-AwsProfile", $AwsProfile)
    if ($DryRun) { $fixArgs += "-DryRun" }
    powershell -ExecutionPolicy Bypass @fixArgs
}

# 2. Staging status
Write-Step "2. Staging status"
$statusArgs = @("-File", (Join-Path $PSScriptRoot "check-staging-status.ps1"), "-AwsProfile", $AwsProfile)
powershell -ExecutionPolicy Bypass @statusArgs

# 3. Production AWS
if (-not $SkipProductionAws) {
    Write-Step "3. Production AWS"
    $prodArgs = @("-File", (Join-Path $PSScriptRoot "setup-production-aws.ps1"), "-AwsProfile", $AwsProfile)
    if ($DryRun) { $prodArgs += "-DryRun" }
    powershell -ExecutionPolicy Bypass @prodArgs
}

# 4. GitHub production Environment
Write-Step "4. GitHub production Environment"
gh auth status | Out-Null

$instanceId = $null
if (-not $DryRun) {
    $instances = aws ec2 describe-instances `
        --profile $AwsProfile --region $Region `
        --filters "Name=tag:Name,Values=herfree-production-api" "Name=instance-state-name,Values=running,pending" `
        --query "Reservations[0].Instances[0].InstanceId" --output text 2>$null
    if ($instances -and $instances -ne "None") {
        $instanceId = $instances.Trim()
    }
}

if ($instanceId) {
    Write-Host "Production EC2: $instanceId" -ForegroundColor Green
    if ($DryRun) {
        Write-Host "[dry-run] gh variable set PRODUCTION_INSTANCE_ID / PRODUCTION_API_URL" -ForegroundColor Yellow
        Write-Host "[dry-run] gh secret set AWS_DEPLOY_ROLE_ARN (production)" -ForegroundColor Yellow
    }
    else {
        gh variable set PRODUCTION_INSTANCE_ID -R $Repo -e production --body $instanceId
        gh variable set PRODUCTION_API_URL -R $Repo -e production --body $ProductionApiUrl
        gh secret set AWS_DEPLOY_ROLE_ARN -R $Repo -e production --body $ProductionDeployRoleArn
        Write-Host "[OK] GitHub production variables set" -ForegroundColor Green
    }
}
else {
    Write-Host "[SKIP] Production EC2 not running yet — complete setup-production-aws.ps1 first" -ForegroundColor Yellow
}

# 5. develop -> main PR
Write-Step "5. develop -> main"
$ahead = git rev-list --left-right --count main...develop 2>$null
if ($ahead) {
    $parts = $ahead.Trim() -split "\s+"
    $mainBehind = [int]$parts[1]
    if ($mainBehind -gt 0) {
        $existingPr = gh pr list -R $Repo --head develop --base main --json number --jq ".[0].number" 2>$null
        if ($existingPr) {
            Write-Host "[OK] PR #$existingPr already open (develop -> main)" -ForegroundColor Green
        }
        elseif ($DryRun) {
            Write-Host "[dry-run] gh pr create --base main --head develop" -ForegroundColor Yellow
        }
        else {
            gh pr create -R $Repo --base main --head develop `
                --title "release: production go-live (develop)" `
                --body "## Summary`n- Staging QA passed`n- Production infrastructure setup`n`n## Test plan`n- [ ] Release backend staging`n- [ ] Release backend production with staging-passed SHA`n- [ ] https://herpfree.co.kr smoke"
            Write-Host "[OK] PR created — merge after CI green" -ForegroundColor Green
        }
    }
    else {
        Write-Host "[OK] main is up to date with develop" -ForegroundColor Green
    }
}

# 6. Release
if (-not $SkipRelease) {
    Write-Step "6. Release backend"
    Write-Host "Staging release (if needed):"
    Write-Host "  gh workflow run release-backend.yml -R $Repo -f target=staging"
    Write-Host ""
    Write-Host "After staging-passed-<SHA> exists and main is merged:"
    Write-Host "  gh workflow run release-backend.yml -R $Repo -f target=production -f image_tag=staging-passed-<SHA>"
    Write-Host ""
    Write-Host "Amplify production (console): connect main branch, no Basic Auth"
    Write-Host "  API_REWRITE_TARGET=$ProductionApiUrl"
    Write-Host "  NEXT_PUBLIC_OAUTH_REDIRECT_ORIGIN=$ProductionFrontendUrl"
    Write-Host "Gabia: herpfree.co.kr -> Amplify, api -> production EIP"
}

Write-Host ""
Write-Host "Done. Complete manual steps above if any [SKIP]/[WARN] remain." -ForegroundColor Green
Write-Host ""
