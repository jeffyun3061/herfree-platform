param(
    [switch]$Global
)

$ErrorActionPreference = "Stop"

$repoRoot = Resolve-Path (Join-Path $PSScriptRoot "..")
Set-Location $repoRoot

$templatePath = Join-Path $repoRoot ".gitmessage.txt"
if (-not (Test-Path $templatePath)) {
    throw ".gitmessage.txt 파일을 찾을 수 없습니다."
}

$scope = @()
if ($Global) {
    $scope = @("--global")
}

git config @scope commit.template ".gitmessage.txt"
git config @scope init.defaultBranch main
git config @scope fetch.prune true
git config @scope pull.rebase false

Write-Host "Git 작업 규칙 설정 완료"
Write-Host "- commit.template = .gitmessage.txt"
Write-Host "- init.defaultBranch = main"
Write-Host "- fetch.prune = true"
Write-Host "- pull.rebase = false"
Write-Host ""
Write-Host "현재 저장소에만 적용했습니다. 모든 저장소에 적용하려면:"
Write-Host "  .\scripts\setup-git-workflow.ps1 -Global"
