# 로컬 MySQL 백업 (Docker)
# 사용: .\scripts\backup-db.ps1
param(
    [string]$ContainerName = "herfree-mysql",
    [string]$BackupDir = ".\backups"
)

$ErrorActionPreference = "Stop"
$stamp = Get-Date -Format "yyyyMMdd_HHmmss"
$outFile = Join-Path $BackupDir "herfree_db_$stamp.sql"

New-Item -ItemType Directory -Force -Path $BackupDir | Out-Null

docker exec $ContainerName mysqldump `
    -uherfree_user -pherfree_pass `
    --single-transaction `
    herfree_db | Out-File -FilePath $outFile -Encoding utf8

Write-Host "backup saved: $outFile"

# 7일 지난 백업 삭제
Get-ChildItem $BackupDir -Filter "herfree_db_*.sql" |
    Where-Object { $_.LastWriteTime -lt (Get-Date).AddDays(-7) } |
    Remove-Item -Force
