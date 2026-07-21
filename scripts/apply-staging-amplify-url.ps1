# Staging을 Amplify 기본 URL(amplifyapp.com) 기준으로 맞춘다. secret 원문은 출력하지 않는다.
param(
    [string]$AwsProfile = "herfree-staging",
    [string]$Region = "ap-northeast-2",
    [string]$FrontendUrl = "https://develop.d2bcg3vnlv5hkh.amplifyapp.com",
    [string]$ApiBackendUrl = "http://api-staging.herpfree.co.kr",
    [string]$Repo = "jeffyun3061/herfree-platform",
    [switch]$SkipGitHub,
    [switch]$UpdateSecretsManager,
    [switch]$DryRun
)

$ErrorActionPreference = "Stop"
$root = Split-Path -Parent $PSScriptRoot
Set-Location $root

Write-Host ""
Write-Host "== Staging amplifyapp.com URL 적용 ==" -ForegroundColor Cyan
Write-Host "Frontend: $FrontendUrl"
Write-Host "API (staging, HTTP direct): $ApiBackendUrl"
Write-Host ""

if (-not $SkipGitHub) {
    if ($DryRun) {
        Write-Host "[dry-run] gh variable set STAGING_FRONTEND_URL -> $FrontendUrl" -ForegroundColor Yellow
        Write-Host "[dry-run] gh variable set STAGING_API_URL -> $ApiBackendUrl" -ForegroundColor Yellow
    }
    else {
        gh auth status | Out-Null
        gh variable set STAGING_FRONTEND_URL -R $Repo -e staging --body $FrontendUrl
        gh variable set STAGING_API_URL -R $Repo -e staging --body $ApiBackendUrl
        Write-Host "[OK] GitHub STAGING_FRONTEND_URL / STAGING_API_URL updated" -ForegroundColor Green
    }
}

if ($UpdateSecretsManager) {
    $secretId = "herfree/staging/app-config"
    $fixScript = Join-Path $PSScriptRoot "fix-staging-app-config-urls.py"
    try {
        if ($DryRun) {
            Write-Host "[dry-run] would run $fixScript" -ForegroundColor Yellow
        }
        else {
            python $fixScript
            if ($LASTEXITCODE -ne 0) {
                throw "fix-staging-app-config-urls.py failed with exit code $LASTEXITCODE"
            }
            Write-Host "[OK] Secrets Manager $secretId updated (CORS/OAuth/password-reset origin)" -ForegroundColor Green
        }
    }
    catch {
        Write-Host "[SKIP] Secrets Manager: $($_.Exception.Message)" -ForegroundColor Yellow
        Write-Host "       Run: aws login --profile $AwsProfile" -ForegroundColor DarkGray
        Write-Host "       Then re-run with -UpdateSecretsManager" -ForegroundColor DarkGray
    }
}

Write-Host ""
Write-Host "== 수동으로 남은 작업 (순서대로) ==" -ForegroundColor Cyan
Write-Host ""
Write-Host "1. AWS Amplify 콘솔 -> herfree-staging -> 사용자 지정 도메인 -> herpfree.co.kr 제거 (24h 재추가 금지)"
Write-Host "2. 의뢰인 Gabia: staging CNAME + ACM _0dc/_0de 레코드 삭제, api-staging A 유지 (docs/staging-operations.md §9.3)"
Write-Host "3. Amplify -> Environment variables (develop 브랜치):"
Write-Host "     NEXT_PUBLIC_API_URL = $ApiBackendUrl"
Write-Host "     NEXT_PUBLIC_OAUTH_REDIRECT_ORIGIN = $FrontendUrl"
Write-Host "     (OAuth Client ID 3개는 기존 Dev 값 유지)"
Write-Host "4. AWS 로그인 후 Secrets 반영 + API 재배포:"
Write-Host "     aws sso login --profile $AwsProfile"
Write-Host "     powershell -File scripts/apply-staging-amplify-url.ps1 -UpdateSecretsManager"
Write-Host "     gh workflow run release-backend.yml -f target=staging"
Write-Host "5. (선택) EC2에서 nginx 중지: sudo systemctl stop nginx && sudo systemctl disable nginx"
Write-Host "6. SES herpfree3@gmail.com 인증 메일 승인"
Write-Host "7. OAuth Dev 콘솔 redirect: $FrontendUrl/auth/callback/{kakao,google,naver}"
Write-Host "8. 브라우저에서 $FrontendUrl 접속 (Basic Auth) -> 로그인/커뮤니티 smoke"
Write-Host "9. Release backend (staging) 재실행 -> E2E 통과 확인"
Write-Host ""
