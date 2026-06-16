# Herfree 개발 폴더를 Cursor로 엽니다.
# 사용법: .\scripts\open-dev.ps1

$ErrorActionPreference = "Stop"
$RepoRoot = (Resolve-Path (Join-Path $PSScriptRoot "..")).Path

Write-Host ""
Write-Host "=== Herfree 개발 환경 ===" -ForegroundColor Cyan
Write-Host "원본 경로: $RepoRoot" -ForegroundColor Green
Write-Host ""
Write-Host "Cursor에서 이 폴더를 여세요:" -ForegroundColor Yellow
Write-Host "  File -> Open Folder -> $RepoRoot" -ForegroundColor White
Write-Host ""

$cursorCmd = Get-Command cursor -ErrorAction SilentlyContinue
if ($cursorCmd) {
    Write-Host "cursor CLI로 열기..." -ForegroundColor Cyan
    & cursor $RepoRoot
} else {
    Write-Host "cursor CLI가 없습니다. 위 경로를 수동으로 여세요." -ForegroundColor DarkYellow
}
