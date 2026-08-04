param(
    [string]$ApiBaseUrl = $(if ($env:PRODUCTION_API_URL) { $env:PRODUCTION_API_URL } else { "https://api.herpfree.co.kr" }),
    [string]$FrontendUrl = $env:PRODUCTION_FRONTEND_URL,
    [switch]$RequireFrontend,
    [string]$ReportPath = "artifacts/production-live/latest.md"
)

$ErrorActionPreference = "Stop"
$root = Split-Path -Parent $PSScriptRoot
Set-Location $root

$ApiBaseUrl = $ApiBaseUrl.TrimEnd('/')
$checks = [System.Collections.Generic.List[object]]::new()
Add-Type -AssemblyName System.Net.Http
$httpClient = [System.Net.Http.HttpClient]::new()
$httpClient.Timeout = [TimeSpan]::FromSeconds(20)

function Invoke-ReadOnlyGet([string]$Url) {
    $request = [System.Net.Http.HttpRequestMessage]::new([System.Net.Http.HttpMethod]::Get, $Url)
    try {
        $response = $httpClient.SendAsync($request).GetAwaiter().GetResult()
        $body = $response.Content.ReadAsStringAsync().GetAwaiter().GetResult()
        $headers = @{}
        foreach ($header in $response.Headers) {
            $headers[$header.Key.ToLowerInvariant()] = ($header.Value -join ", ")
        }
        foreach ($header in $response.Content.Headers) {
            $headers[$header.Key.ToLowerInvariant()] = ($header.Value -join ", ")
        }
        return [pscustomobject]@{
            StatusCode = [int]$response.StatusCode
            Headers = $headers
            Body = $body
        }
    }
    finally {
        $request.Dispose()
    }
}

function Add-Check([string]$Name, [bool]$Passed, [string]$Detail) {
    $checks.Add([pscustomobject]@{ Name = $Name; Passed = $Passed; Detail = $Detail })
    if ($Passed) { Write-Host "[OK] $Name - $Detail" -ForegroundColor Green }
    else { Write-Host "[FAIL] $Name - $Detail" -ForegroundColor Red }
}

function Read-Json([object]$Response, [string]$Name) {
    try { return ($Response.Body | ConvertFrom-Json) }
    catch {
        Add-Check "$Name JSON" $false "response was not valid JSON"
        return $null
    }
}

Write-Host "== Herfree production read-only smoke ==" -ForegroundColor Cyan
Write-Host "API: $ApiBaseUrl"

$health = Invoke-ReadOnlyGet "$ApiBaseUrl/api/health"
$healthJson = Read-Json $health "health"
Add-Check "health status" ($health.StatusCode -eq 200) "HTTP $($health.StatusCode)"
Add-Check "health request correlation" ($health.Headers.ContainsKey('x-request-id') -and -not [string]::IsNullOrWhiteSpace($health.Headers['x-request-id'])) "X-Request-ID present"
Add-Check "health payload" ($null -ne $healthJson -and $healthJson.success -eq $true -and $healthJson.data.status -eq 'UP' -and $healthJson.data.environment -eq 'prod') "success=true, status=UP, environment=prod"

$stats = Invoke-ReadOnlyGet "$ApiBaseUrl/api/journal/public/home-stats"
$statsJson = Read-Json $stats "public home stats"
$statsData = if ($null -ne $statsJson) { $statsJson.data } else { $null }
$statsIsEmptyObject = $false
if ($null -ne $statsData) {
    $statsIsEmptyObject = ($statsData -is [pscustomobject] -and @($statsData.PSObject.Properties).Count -eq 0)
}
Add-Check "public stats status" ($stats.StatusCode -eq 200) "HTTP $($stats.StatusCode)"
Add-Check "public stats cache policy" ($stats.Headers.ContainsKey('cache-control') -and $stats.Headers['cache-control'] -match '(?i)no-store') "Cache-Control includes no-store"
Add-Check "public stats privacy contract" ($null -ne $statsJson -and $statsJson.success -eq $true -and $statsIsEmptyObject) "data is an empty object; no population counters"

$swagger = Invoke-ReadOnlyGet "$ApiBaseUrl/swagger-ui.html"
Add-Check "Swagger disabled" ($swagger.StatusCode -eq 404) "HTTP $($swagger.StatusCode)"

$admin = Invoke-ReadOnlyGet "$ApiBaseUrl/api/admin/reports"
Add-Check "admin unauthenticated boundary" ($admin.StatusCode -eq 401 -or $admin.StatusCode -eq 403) "HTTP $($admin.StatusCode)"

if (-not [string]::IsNullOrWhiteSpace($FrontendUrl)) {
    $frontend = Invoke-ReadOnlyGet $FrontendUrl.TrimEnd('/')
    $frontendPass = $frontend.StatusCode -ge 200 -and $frontend.StatusCode -lt 400
    Add-Check "frontend URL" $frontendPass "HTTP $($frontend.StatusCode)"
} elseif ($RequireFrontend) {
    Add-Check "frontend URL" $false "provide -FrontendUrl or PRODUCTION_FRONTEND_URL"
} else {
    Write-Host "[WARN] frontend URL - skipped (custom DNS may still be pending)" -ForegroundColor Yellow
}

$failed = @($checks | Where-Object { -not $_.Passed })
$reportFile = Join-Path $root $ReportPath
$reportDir = Split-Path -Parent $reportFile
New-Item -ItemType Directory -Force -Path $reportDir | Out-Null
$lines = [System.Collections.Generic.List[string]]::new()
$lines.Add("# Production live smoke")
$lines.Add("")
$lines.Add("- Checked (UTC): $((Get-Date).ToUniversalTime().ToString('o'))")
$lines.Add("- API: $ApiBaseUrl")
$lines.Add("- Result: **$(if ($failed.Count -eq 0) { 'PASS' } else { 'FAIL' })**")
$lines.Add("")
$lines.Add("| Check | Status | Detail |")
$lines.Add("| --- | --- | --- |")
foreach ($check in $checks) {
    $status = if ($check.Passed) { "PASS" } else { "FAIL" }
    $safeDetail = $check.Detail -replace '\|', '\\|'
    $lines.Add("| $($check.Name) | $status | $safeDetail |")
}
Set-Content -LiteralPath $reportFile -Value ($lines -join [Environment]::NewLine) -Encoding UTF8

Write-Host "Report: $reportFile" -ForegroundColor DarkGray
if ($failed.Count -gt 0) { exit 1 }
exit 0
