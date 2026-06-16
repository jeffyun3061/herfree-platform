# 바탕화면(OneDrive) 복사본 폴더 제거
# Cursor가 OneDrive 경로를 열고 있으면 삭제가 실패합니다.
# 1) Cursor에서 C:\dev\herfree-platform 을 연 뒤
# 2) 이 스크립트 실행

$ErrorActionPreference = "Stop"
$DesktopCopy = "C:\Users\dba35\OneDrive\바탕 화면\herfree-platform"
$DevRoot = "C:\dev\herfree-platform"

Write-Host ""
Write-Host "=== Herfree 복사본 정리 ===" -ForegroundColor Cyan

if (-not (Test-Path -LiteralPath $DevRoot)) {
    Write-Host "[오류] 원본이 없습니다: $DevRoot" -ForegroundColor Red
    exit 1
}

if (-not (Test-Path -LiteralPath $DesktopCopy)) {
    Write-Host "[완료] 복사본이 이미 없습니다." -ForegroundColor Green
    exit 0
}

try {
    Remove-Item -LiteralPath $DesktopCopy -Recurse -Force
    Write-Host "[완료] 복사본 삭제: $DesktopCopy" -ForegroundColor Green
} catch {
    Write-Host "[실패] 폴더가 다른 프로그램(Cursor 등)에서 사용 중입니다." -ForegroundColor Red
    Write-Host "  1. Cursor를 닫거나 File -> Open Folder -> $DevRoot 로 전환" -ForegroundColor Yellow
    Write-Host "  2. 이 스크립트를 다시 실행" -ForegroundColor Yellow
    exit 1
}

Write-Host ""
Write-Host "이제부터 원본만 사용하세요: $DevRoot" -ForegroundColor Green
Write-Host ""
