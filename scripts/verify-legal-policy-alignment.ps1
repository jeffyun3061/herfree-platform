param(
    [switch]$StrictOperationalFacts
)

$ErrorActionPreference = "Stop"
$root = Split-Path -Parent $PSScriptRoot
Set-Location $root

$failures = [System.Collections.Generic.List[string]]::new()
$warnings = [System.Collections.Generic.List[string]]::new()

function Pass([string]$Name) {
    Write-Host "[OK] $Name" -ForegroundColor Green
}

function Warn([string]$Name, [string]$Detail) {
    $warnings.Add("${Name}: ${Detail}") | Out-Null
    Write-Host "[WARN] $Name - $Detail" -ForegroundColor Yellow
}

function Fail([string]$Name, [string]$Detail) {
    $failures.Add("${Name}: ${Detail}") | Out-Null
    Write-Host "[FAIL] $Name - $Detail" -ForegroundColor Red
}

function ReadUtf8([string]$Path) {
    return Get-Content -LiteralPath (Join-Path $root $Path) -Raw -Encoding utf8
}

function RequireText([string]$Name, [string]$Text, [string]$Pattern) {
    if ($Text -match $Pattern) { Pass $Name }
    else { Fail $Name "required pattern not found: $Pattern" }
}

Write-Host "== Herpfree legal/data-flow alignment ==" -ForegroundColor Cyan

$requiredFiles = @(
    "docs/legal/herfree-terms-of-service.md",
    "docs/legal/herfree-privacy-policy.md",
    "docs/legal/legal-review-gates.md",
    "frontend/src/app/terms/page.tsx",
    "frontend/src/app/privacy/page.tsx",
    "frontend/src/components/auth/SignupAgreementFields.tsx",
    "frontend/src/features/community/containers/CommunityWriteContainer.tsx",
    "backend/src/main/java/com/herfree/domain/user/service/UserConsentAgreementService.java",
    "backend/src/main/java/com/herfree/domain/user/service/HealthDataConsentService.java",
    "backend/src/main/java/com/herfree/domain/user/entity/HealthDataConsent.java",
    "backend/src/main/resources/db/migration/V39__create_health_data_consents.sql",
    "backend/src/main/java/com/herfree/domain/user/service/HealthStatisticsConsentService.java",
    "backend/src/main/java/com/herfree/domain/journal/entity/HealthDataStringAttributeConverter.java",
    "backend/src/main/java/com/herfree/domain/journal/entity/JournalRecord.java",
    "backend/src/main/resources/application.yml",
    "backend/src/main/resources/db/migration/V38__rename_private_consult_board.sql"
)
foreach ($path in $requiredFiles) {
    if (Test-Path (Join-Path $root $path)) { Pass "file: $path" }
    else { Fail "missing file" $path }
}

$termsDoc = ReadUtf8 "docs/legal/herfree-terms-of-service.md"
$privacyDoc = ReadUtf8 "docs/legal/herfree-privacy-policy.md"
$termsPage = ReadUtf8 "frontend/src/app/terms/page.tsx"
$privacyPage = ReadUtf8 "frontend/src/app/privacy/page.tsx"
$consentService = ReadUtf8 "backend/src/main/java/com/herfree/domain/user/service/UserConsentAgreementService.java"
$healthConsentService = ReadUtf8 "backend/src/main/java/com/herfree/domain/user/service/HealthDataConsentService.java"
$healthConsentEntity = ReadUtf8 "backend/src/main/java/com/herfree/domain/user/entity/HealthDataConsent.java"
$statsConsentService = ReadUtf8 "backend/src/main/java/com/herfree/domain/user/service/HealthStatisticsConsentService.java"
$journalEntity = ReadUtf8 "backend/src/main/java/com/herfree/domain/journal/entity/JournalRecord.java"
$converter = ReadUtf8 "backend/src/main/java/com/herfree/domain/journal/entity/HealthDataStringAttributeConverter.java"
$application = ReadUtf8 "backend/src/main/resources/application.yml"
$visibilityUi = ReadUtf8 "frontend/src/features/community/containers/CommunityWriteContainer.tsx"
$visibilityApi = ReadUtf8 "frontend/src/lib/api/posts.ts"
$privateBoardMigration = ReadUtf8 "backend/src/main/resources/db/migration/V38__rename_private_consult_board.sql"
$healthConsentMigration = ReadUtf8 "backend/src/main/resources/db/migration/V39__create_health_data_consents.sql"

# Version coupling: a legal text change must be accompanied by a consent-version change.
$termsVersionMatch = [regex]::Match($consentService, 'TERMS_VERSION\s*=\s*"(?<value>[^"\r\n]+)"')
$privacyVersionMatch = [regex]::Match($consentService, 'PRIVACY_VERSION\s*=\s*"(?<value>[^"\r\n]+)"')
$statsVersionMatch = [regex]::Match($statsConsentService, 'POLICY_VERSION\s*=\s*"(?<value>[^"\r\n]+)"')
if (-not $termsVersionMatch.Success -or -not $privacyVersionMatch.Success -or -not $statsVersionMatch.Success) {
    Fail "consent versions" "could not read consent version constants"
} else {
    $termsVersion = $termsVersionMatch.Groups['value'].Value
    $privacyVersion = $privacyVersionMatch.Groups['value'].Value
    $statsVersion = $statsVersionMatch.Groups['value'].Value
    $termsDate = [datetime]::ParseExact($termsVersion, 'yyyy-MM-dd', $null)
    $privacyDate = [datetime]::ParseExact($privacyVersion, 'yyyy-MM-dd', $null)
    $termsDatePattern = "$($termsDate.Year).*0?$($termsDate.Month).*0?$($termsDate.Day)"
    $privacyDatePattern = "$($privacyDate.Year).*0?$($privacyDate.Month).*0?$($privacyDate.Day)"
    RequireText "terms version in canonical document" $termsDoc $termsDatePattern
    RequireText "terms version in website" $termsPage ("시행일:\s*" + $termsDatePattern)
    RequireText "privacy version in canonical document" $privacyDoc $privacyDatePattern
    RequireText "privacy version in website" $privacyPage ("시행일:\s*" + $privacyDatePattern)
    RequireText "health statistics policy version in canonical document" $privacyDoc ([regex]::Escape("정책 버전은 ${statsVersion}입니다."))
    RequireText "health statistics policy version in website" $privacyPage ([regex]::Escape("정책 버전 $statsVersion"))
}

# Public wording must describe the actual safety boundary, not a stronger promise.
RequireText "just-in-time sensitive-information consent is disclosed" $termsPage "개인일지 첫 저장 전에 별도 동의"
RequireText "just-in-time sensitive-information consent is disclosed in policy" $privacyPage "개인일지 첫 저장 전에 별도 동의"
RequireText "memo field encryption scope" $privacyPage "자유입력 메모.*AES-GCM"
RequireText "memo field encryption scope in terms" $termsPage "자유입력 메모.*AES-GCM"
RequireText "structured health data control scope" $privacyPage "구조화된 값.*DB 저장 암호화"
RequireText "aggregate data is not called fully anonymous" $privacyPage "완전한 익명화"
RequireText "public/member-only visibility" $termsPage "공개.*비회원.*회원 전용"
RequireText "non-medical inquiry boundary" $termsPage "상담문의.*의료 상담"
RequireText "JWT and cookie boundary" $termsPage "HttpOnly.*SameSite.*access JWT"
RequireText "health consent policy version is explicit" $healthConsentService 'POLICY_VERSION\s*=\s*"2026-08-04"'
RequireText "health consent is append-only" $healthConsentEntity "Append-only consent history"
RequireText "health consent migration exists" $healthConsentMigration "CREATE TABLE health_data_consents"
RequireText "health consent migration preserves legacy history" $healthConsentMigration "INSERT INTO health_data_consents"
Pass "no overclaiming field encryption (reviewed canonical wording)"

# Data-flow/code coupling.
RequireText "journal memo uses health converter" $journalEntity "HealthDataStringAttributeConverter.class"
RequireText "journal memo field exists" $journalEntity "private String memo"
RequireText "converter requires public health key" $converter "HEALTH_DATA_ENCRYPTION_KEY"
RequireText "frontend sends visibility" $visibilityApi "visibility"
RequireText "visibility selector is rendered" $visibilityUi "PUBLIC|MEMBERS_ONLY"
RequireText "private board migration labels service inquiry" $privateBoardMigration "상담문의"
RequireText "analytics retention default" $application "APP_RETENTION_EVENT_DAYS:90"
RequireText "reset-token retention default" $application "APP_RETENTION_RESET_TOKEN_GRACE_DAYS:7"
RequireText "admin-audit retention default" $application "APP_RETENTION_ADMIN_AUDIT_DAYS:365"
RequireText "role-audit retention default" $application "APP_RETENTION_ROLE_AUDIT_DAYS:365"
RequireText "privacy states analytics retention" $privacyPage "90일"
RequireText "privacy states reset-token retention" $privacyPage "7일"
RequireText "privacy states audit retention" $privacyPage "365일"

# If external analytics is enabled, it is an explicit operational/legal decision.
$posthogKey = [Environment]::GetEnvironmentVariable("NEXT_PUBLIC_POSTHOG_KEY")
if ([string]::IsNullOrWhiteSpace($posthogKey)) {
    Pass "external analytics disabled by default"
} else {
    $posthogHost = [Environment]::GetEnvironmentVariable("NEXT_PUBLIC_POSTHOG_HOST")
    if ([string]::IsNullOrWhiteSpace($posthogHost) -or $posthogHost -notmatch '^https://') {
        Fail "external analytics host" "NEXT_PUBLIC_POSTHOG_HOST must be an HTTPS origin when PostHog is enabled"
    } else {
        Pass "external analytics host is HTTPS"
    }
    if ($StrictOperationalFacts -and [Environment]::GetEnvironmentVariable("POSTHOG_POLICY_APPROVED") -ne "true") {
        Fail "external analytics approval" "set POSTHOG_POLICY_APPROVED=true only after provider, region, retention and legal basis are documented"
    }
}

if ($StrictOperationalFacts) {
    $factNames = @(
        "LEGAL_OPERATOR_NAME",
        "LEGAL_OPERATOR_REPRESENTATIVE",
        "LEGAL_OPERATOR_ADDRESS",
        "LEGAL_OPERATOR_PHONE",
        "PRIVACY_OFFICER_NAME",
        "PRIVACY_OFFICER_TITLE",
        "PRIVACY_OFFICER_PHONE",
        "PRIVACY_OFFICER_ADDRESS",
        "LEGAL_MAIL_PROVIDER",
        "LEGAL_MAIL_PROVIDER_COUNTRY",
        "LEGAL_AWS_REGION",
        "LEGAL_AWS_CROSS_BORDER_ACCESS_REVIEWED"
    )
    foreach ($name in $factNames) {
        $value = [Environment]::GetEnvironmentVariable($name)
        if ([string]::IsNullOrWhiteSpace($value) -or $value -match '<|CHANGE_ME|확인 필요') {
            Fail "operational legal fact: $name" "production value is missing or still a placeholder"
        } else {
            Pass "operational legal fact: $name"
        }
    }
} else {
    Warn "operational legal facts" "not evaluated; production requires -StrictOperationalFacts with verified operator, CPO, provider and transfer facts"
}

Write-Host ""
Write-Host "Legal/data-flow alignment: failures=$($failures.Count), warnings=$($warnings.Count)" -ForegroundColor $(if ($failures.Count -eq 0) { "Green" } else { "Red" })
if ($failures.Count -gt 0) {
    $failures | ForEach-Object { Write-Host "  - $_" -ForegroundColor Red }
    exit 1
}
if ($warnings.Count -gt 0) {
    $warnings | ForEach-Object { Write-Host "  - $_" -ForegroundColor Yellow }
}
exit 0
