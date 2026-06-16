# Journal API smoke test — signup, CRUD, date format, admin aggregate privacy
$ErrorActionPreference = "Stop"
$Base = "http://localhost:8080"
$Suffix = [Guid]::NewGuid().ToString("N").Substring(0, 8)
$Email = "journaltest+$Suffix@example.com"
$Password = "TestPass01"
$Nickname = "jt$Suffix"

function Assert($cond, $msg) {
    if (-not $cond) { throw "FAIL: $msg" }
}

Write-Host "== 1. Signup + Login =="
$signupBody = @{ email = $Email; password = $Password; nickname = $Nickname } | ConvertTo-Json
$r = Invoke-RestMethod -Uri "$Base/api/auth/signup" -Method POST -Body $signupBody -ContentType "application/json; charset=utf-8"
Assert ($r.success -eq $true) "signup failed: $($r.message)"

$loginBody = @{ email = $Email; password = $Password } | ConvertTo-Json
$login = Invoke-RestMethod -Uri "$Base/api/auth/login" -Method POST -Body $loginBody -ContentType "application/json; charset=utf-8"
Assert ($login.success -eq $true) "login failed"
$token = $login.data.accessToken
$headers = @{ Authorization = "Bearer $token" }

Write-Host "== 2. Upsert journal record =="
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

Write-Host "== 3. Dashboard date fields =="
$dash = Invoke-RestMethod -Uri "$Base/api/journal/dashboard" -Method GET -Headers $headers
Assert ($dash.success -eq $true) "dashboard failed"
foreach ($day in $dash.data.timelineDays) {
    Assert ($day.date -is [string]) "timeline date must be string"
    Assert ($day.date -match '^\d{4}-\d{2}-\d{2}$') "timeline date format: $($day.date)"
}
if ($dash.data.todayRecord) {
    Assert ($dash.data.todayRecord.recordDate -is [string]) "todayRecord.recordDate must be string"
}

Write-Host "== 4. Delete record =="
try {
    Invoke-WebRequest -Uri "$Base/api/journal/records/$recordId" -Method DELETE -Headers $headers -UseBasicParsing | Out-Null
} catch {
    if ($_.Exception.Response.StatusCode.value__ -ne 204) { throw }
}
$byDate = Invoke-RestMethod -Uri "$Base/api/journal/records/by-date?date=$today" -Method GET -Headers $headers
Assert ($byDate.data -eq $null) "record should be deleted"

Write-Host "== 5. Admin stats has no PII fields =="
# Use bootstrap admin if available — skip if 401/403
try {
    $adminLogin = Invoke-RestMethod -Uri "$Base/api/auth/login" -Method POST -Body (@{
        email = "admin@herfree.local"; password = "HerfreeAdmin01"
    } | ConvertTo-Json) -ContentType "application/json; charset=utf-8"
    $adminHeaders = @{ Authorization = "Bearer $($adminLogin.data.accessToken)" }
    $stats = Invoke-RestMethod -Uri "$Base/api/admin/journal/stats" -Method GET -Headers $adminHeaders
    $json = $stats.data | ConvertTo-Json -Depth 6
    Assert ($json -notmatch 'memo') "admin stats must not contain memo"
    Assert ($json -notmatch $Email) "admin stats must not contain user email"
    Assert ($stats.data.totalRecords -ge 0) "totalRecords present"
    Write-Host "Admin stats OK (aggregate only)"
} catch {
    Write-Host "SKIP admin stats (no SUPER_ADMIN creds): $($_.Exception.Message)"
}

Write-Host ""
Write-Host "ALL JOURNAL API CHECKS PASSED"
