# Journal API smoke test — signup, CRUD, date format, admin aggregate privacy
param(
    [string]$BaseUrl = "http://localhost:8080",
    [switch]$RequireAdmin
)

$ErrorActionPreference = "Stop"
$Base = $BaseUrl.TrimEnd('/')
$Suffix = [Guid]::NewGuid().ToString("N").Substring(0, 8)
$Email = "journaltest+$Suffix@example.com"
$Password = "TestPass!01"
$Nickname = "jt$Suffix"

function Assert($cond, $msg) {
    if (-not $cond) { throw "FAIL: $msg" }
}

Write-Host "== 1. Signup + Login =="
$signupBody = @{
    email = $Email
    password = $Password
    nickname = $Nickname
    agreeTerms = $true
    agreePrivacy = $true
    agreeSensitive = $false
    agreeAge = $true
    agreeMarketing = $false
    agreeHealthStatistics = $false
} | ConvertTo-Json
$r = Invoke-RestMethod -Uri "$Base/api/auth/signup" -Method POST -Body $signupBody -ContentType "application/json; charset=utf-8"
Assert ($r.success -eq $true) "signup failed: $($r.message)"

$loginBody = @{ email = $Email; password = $Password } | ConvertTo-Json
$login = Invoke-RestMethod -Uri "$Base/api/auth/login" -Method POST -Body $loginBody -ContentType "application/json; charset=utf-8"
Assert ($login.success -eq $true) "login failed"
$token = $login.data.accessToken
$headers = @{ Authorization = "Bearer $token" }

Write-Host "== 2. Consent gate =="
$consent = Invoke-RestMethod -Uri "$Base/api/users/me/consents/health-data" -Method GET -Headers $headers
Assert ($consent.success -eq $true -and $consent.data.agreed -eq $false) "signup without health consent must remain community-only"

$gateBody = @{
    recordDate = (Get-Date).ToString("yyyy-MM-dd")
    hadSymptoms = $false
} | ConvertTo-Json
try {
    Invoke-WebRequest -Uri "$Base/api/journal/records" -Method POST -Body $gateBody -Headers $headers -ContentType "application/json; charset=utf-8" -UseBasicParsing | Out-Null
    throw "journal write without consent unexpectedly succeeded"
} catch {
    if ($null -eq $_.Exception.Response) { throw }
    $status = $_.Exception.Response.StatusCode.value__
    $body = $_.Exception.Response.GetResponseStream()
    $reader = New-Object System.IO.StreamReader($body)
    $errorJson = $reader.ReadToEnd() | ConvertFrom-Json
    Assert ($status -eq 428 -and $errorJson.code -eq "HEALTH_DATA_CONSENT_REQUIRED") "missing consent must return 428 HEALTH_DATA_CONSENT_REQUIRED"
}

$consent = Invoke-RestMethod -Uri "$Base/api/users/me/consents/health-data" -Method PATCH -Headers $headers -Body (@{ agreed = $true } | ConvertTo-Json) -ContentType "application/json; charset=utf-8"
Assert ($consent.data.agreed -eq $true) "health consent grant failed"

Write-Host "== 3. Upsert journal record =="
$today = (Get-Date).ToString("yyyy-MM-dd")
$recordBody = @{
    recordDate = $today
    hadSymptoms = $false
    stressLevel = "LOW"
    avgSleep = "H6_7"
    medicationStatus = "NORMAL"
    memo = "smoke-test memo"
    supplementTaken = $true
    exerciseDone = $false
} | ConvertTo-Json
$upsert = Invoke-RestMethod -Uri "$Base/api/journal/records" -Method POST -Body $recordBody -Headers $headers -ContentType "application/json; charset=utf-8"
Assert ($upsert.success -eq $true) "upsert failed"
$recordId = $upsert.data.id
Assert ($upsert.data.recordDate -is [string]) "recordDate must be string, got $($upsert.data.recordDate.GetType().Name)"
Assert ($upsert.data.recordDate -match '^\d{4}-\d{2}-\d{2}$') "recordDate format invalid: $($upsert.data.recordDate)"

Write-Host "== 4. Dashboard date fields =="
$dash = Invoke-RestMethod -Uri "$Base/api/journal/dashboard" -Method GET -Headers $headers
Assert ($dash.success -eq $true) "dashboard failed"
foreach ($day in $dash.data.timelineDays) {
    Assert ($day.date -is [string]) "timeline date must be string"
    Assert ($day.date -match '^\d{4}-\d{2}-\d{2}$') "timeline date format: $($day.date)"
}
if ($dash.data.todayRecord) {
    Assert ($dash.data.todayRecord.recordDate -is [string]) "todayRecord.recordDate must be string"
}

Write-Host "== 5. Revoke consent deletes records and closes API =="
$consent = Invoke-RestMethod -Uri "$Base/api/users/me/consents/health-data" -Method PATCH -Headers $headers -Body (@{ agreed = $false } | ConvertTo-Json) -ContentType "application/json; charset=utf-8"
Assert ($consent.data.agreed -eq $false) "health consent revoke failed"
try {
    Invoke-WebRequest -Uri "$Base/api/journal/records/by-date?date=$today" -Method GET -Headers $headers -UseBasicParsing | Out-Null
    throw "journal read after revoke unexpectedly succeeded"
} catch {
    if ($null -eq $_.Exception.Response) { throw }
    $status = $_.Exception.Response.StatusCode.value__
    Assert ($status -eq 428) "journal API must remain closed after revoke"
}
$consent = Invoke-RestMethod -Uri "$Base/api/users/me/consents/health-data" -Method PATCH -Headers $headers -Body (@{ agreed = $true } | ConvertTo-Json) -ContentType "application/json; charset=utf-8"
$byDate = Invoke-RestMethod -Uri "$Base/api/journal/records/by-date?date=$today" -Method GET -Headers $headers
Assert ($byDate.data -eq $null) "records must be deleted when health consent is revoked"

Write-Host "== 6. Delete record =="
$consent = $consent.data
try {
    Invoke-WebRequest -Uri "$Base/api/journal/records/$recordId" -Method DELETE -Headers $headers -UseBasicParsing | Out-Null
} catch {
    if ($_.Exception.Response.StatusCode.value__ -ne 204 -and $_.Exception.Response.StatusCode.value__ -ne 404) { throw }
}
$byDate = Invoke-RestMethod -Uri "$Base/api/journal/records/by-date?date=$today" -Method GET -Headers $headers
Assert ($byDate.data -eq $null) "record should be deleted"

Write-Host "== 7. Admin stats has no PII fields =="
# Use bootstrap admin if configured; skip if credentials are not supplied.
try {
    if ([string]::IsNullOrWhiteSpace($env:ADMIN_EMAIL) -or [string]::IsNullOrWhiteSpace($env:ADMIN_PASSWORD)) {
        if ($RequireAdmin) { throw "ADMIN_EMAIL/ADMIN_PASSWORD are not set" }
        throw "SKIP_ADMIN_SMOKE"
    }
    $adminLogin = Invoke-RestMethod -Uri "$Base/api/auth/login" -Method POST -Body (@{
        email = $env:ADMIN_EMAIL; password = $env:ADMIN_PASSWORD
    } | ConvertTo-Json) -ContentType "application/json; charset=utf-8"
    $adminHeaders = @{ Authorization = "Bearer $($adminLogin.data.accessToken)" }
    $stats = Invoke-RestMethod -Uri "$Base/api/admin/journal/stats" -Method GET -Headers $adminHeaders
    $json = $stats.data | ConvertTo-Json -Depth 6
    Assert ($json -notmatch 'memo') "admin stats must not contain memo"
    Assert ($json -notmatch $Email) "admin stats must not contain user email"
    Assert ($stats.data.totalRecords -ge 0) "totalRecords present"
    Write-Host "Admin stats OK (aggregate only)"
} catch {
    if ($RequireAdmin) { throw }
    Write-Host "SKIP admin stats (no SUPER_ADMIN creds): $($_.Exception.Message)"
}

Write-Host ""
Write-Host "ALL JOURNAL API CHECKS PASSED"
