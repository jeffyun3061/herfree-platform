param(
    [string]$ApexHost = "herpfree.co.kr",
    [string]$FrontendHost = "www.herpfree.co.kr",
    [string]$ApiHost = "api.herpfree.co.kr",
    [string]$ReportPath = "artifacts/production-dns/latest.md"
)

$ErrorActionPreference = "Stop"
$root = Split-Path -Parent $PSScriptRoot
Set-Location $root

$checks = [System.Collections.Generic.List[object]]::new()

function Add-Check([string]$Name, [bool]$Passed, [string]$Detail, [bool]$Blocking = $true) {
    $checks.Add([pscustomobject]@{ Name = $Name; Passed = $Passed; Detail = $Detail; Blocking = $Blocking }) | Out-Null
    $label = if ($Passed) { "OK" } elseif ($Blocking) { "BLOCK" } else { "WARN" }
    $color = if ($Passed) { "Green" } elseif ($Blocking) { "Red" } else { "Yellow" }
    Write-Host "[$label] $Name - $Detail" -ForegroundColor $color
}

function Resolve-Records([string]$HostName) {
    try {
        return @(Resolve-DnsName $HostName -ErrorAction Stop |
            Where-Object { $_.IPAddress -or $_.NameHost } |
            ForEach-Object { if ($_.IPAddress) { "A:$($_.IPAddress)" } else { "CNAME:$($_.NameHost)" } })
    }
    catch { return @() }
}

function Test-Http([string]$Url) {
    try {
        $response = Invoke-WebRequest -Uri $Url -Method Head -UseBasicParsing -MaximumRedirection 0 -TimeoutSec 20 -ErrorAction Stop
        return [int]$response.StatusCode
    }
    catch {
        if ($_.Exception.Response) { return [int]$_.Exception.Response.StatusCode.value__ }
        return 0
    }
}

Write-Host "== Herfree production DNS preflight (read-only) ==" -ForegroundColor Cyan
Write-Host "No DNS or hosting records are changed."

$apexRecords = Resolve-Records $ApexHost
$wwwRecords = Resolve-Records $FrontendHost
$apiRecords = Resolve-Records $ApiHost

Add-Check "Apex DNS exists" ($apexRecords.Count -gt 0) $(if ($apexRecords.Count) { $apexRecords -join ", " } else { "no A/CNAME record for $ApexHost" }) $false
Add-Check "Frontend DNS exists" ($wwwRecords.Count -gt 0) $(if ($wwwRecords.Count) { $wwwRecords -join ", " } else { "no A/CNAME record for $FrontendHost" })
Add-Check "API DNS exists" ($apiRecords.Count -gt 0) $(if ($apiRecords.Count) { $apiRecords -join ", " } else { "no A/CNAME record for $ApiHost" })

$wwwStatus = Test-Http "https://$FrontendHost/"
$apiStatus = Test-Http "https://$ApiHost/api/health"
Add-Check "Frontend HTTPS" ($wwwStatus -ge 200 -and $wwwStatus -lt 400) "HTTP $wwwStatus from https://$FrontendHost/"
Add-Check "API HTTPS health" ($apiStatus -eq 200) "HTTP $apiStatus from https://$ApiHost/api/health"

$blocking = @($checks | Where-Object { -not $_.Passed -and $_.Blocking })
$warnings = @($checks | Where-Object { -not $_.Passed -and -not $_.Blocking })
$reportFile = Join-Path $root $ReportPath
New-Item -ItemType Directory -Force -Path (Split-Path -Parent $reportFile) | Out-Null
$lines = [System.Collections.Generic.List[string]]::new()
$lines.Add("# Production DNS preflight")
$lines.Add("")
$lines.Add("- Checked (UTC): $((Get-Date).ToUniversalTime().ToString('o'))")
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

Write-Host "Report: $reportFile" -ForegroundColor DarkGray
Write-Host "blocking=$($blocking.Count) warnings=$($warnings.Count)"
if ($blocking.Count -gt 0) { exit 1 }
exit 0
