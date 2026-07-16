# 배포 전에 로컬에서 실행하는 통합 자동 검사
param(
    [switch]$SkipAudit
)

$ErrorActionPreference = "Continue"
$root = Split-Path -Parent $PSScriptRoot
Set-Location $root

if (Test-Path variable:PSNativeCommandUseErrorActionPreference) {
    $PSNativeCommandUseErrorActionPreference = $false
}

function Invoke-CheckedStep {
    param(
        [string]$Name,
        [scriptblock]$Command
    )

    Write-Host ""
    Write-Host "== $Name ==" -ForegroundColor Cyan
    $global:LASTEXITCODE = 0
    & $Command
    if ($LASTEXITCODE -ne 0) {
        throw "$Name 실패 (exit code: $LASTEXITCODE)"
    }
    Write-Host "$Name 통과" -ForegroundColor Green
}

try {
    Invoke-CheckedStep "Git 변경 형식 검사" { git diff --check }

    Invoke-CheckedStep "Git 비밀 파일 추적 검사" {
        $pattern = '(^|/)(\.env|local-secrets\.yml|application-local\.yml|application-prod\.yml|application-secret\.yml)$'
        $forbidden = @(git ls-files | Where-Object { $_ -match $pattern })
        if ($forbidden.Count -gt 0) {
            $forbidden | ForEach-Object { Write-Host "추적 금지 파일: $_" -ForegroundColor Red }
            $global:LASTEXITCODE = 1
        }
    }

    Invoke-CheckedStep "전체 비밀정보 검사" { node scripts/check-secrets.mjs --all }

    Push-Location backend
    try {
        Invoke-CheckedStep "백엔드 clean build와 테스트" { .\gradlew.bat clean build }
    } finally {
        Pop-Location
    }

    Push-Location frontend
    try {
        if (-not (Test-Path node_modules)) {
            Invoke-CheckedStep "프론트 의존성 설치" { npm ci }
        }
        Invoke-CheckedStep "프론트 보안 헤더 정책" { npm run check:security-headers }
        Invoke-CheckedStep "프론트 lint" { npm run lint }
        Invoke-CheckedStep "이전 Next 검증 산출물 정리" {
            $nextBuildDir = Join-Path $root "frontend\.next-preflight"
            if (Test-Path $nextBuildDir) {
                $resolvedBuildDir = (Resolve-Path $nextBuildDir).Path
                $resolvedFrontend = (Resolve-Path (Join-Path $root "frontend")).Path
                if (-not $resolvedBuildDir.StartsWith($resolvedFrontend, [StringComparison]::OrdinalIgnoreCase)) {
                    Write-Host "안전하지 않은 삭제 경로: $resolvedBuildDir" -ForegroundColor Red
                    $global:LASTEXITCODE = 1
                    return
                }
                Remove-Item -LiteralPath $resolvedBuildDir -Recurse -Force
            }
        }
        $previousNextDistDir = $env:NEXT_DIST_DIR
        try {
            $env:NEXT_DIST_DIR = ".next-preflight"
            Invoke-CheckedStep "프론트 production build" { npm run build }
        } finally {
            $env:NEXT_DIST_DIR = $previousNextDistDir
        }
        if (-not $SkipAudit) {
            Invoke-CheckedStep "npm 취약점 검사" { npm audit --audit-level=high }
        }
    } finally {
        Pop-Location
    }

    Write-Host ""
    Write-Host "자동 검사가 모두 통과했습니다." -ForegroundColor Green
    Write-Host "이제 docs/go-live-checklist.md의 NO-GO와 staging 수동 항목을 확인하세요."
} catch {
    Write-Host ""
    Write-Host $_.Exception.Message -ForegroundColor Red
    exit 1
}
