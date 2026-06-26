# Herfree backend — compile + test (서버는 안 뜸)
# 사용: cd backend && .\build.ps1
$ErrorActionPreference = "Stop"
Set-Location $PSScriptRoot

function Resolve-JavaHome {
    if ($env:JAVA_HOME -and (Test-Path (Join-Path $env:JAVA_HOME "bin\java.exe"))) {
        return $env:JAVA_HOME
    }

    $patterns = @(
        "C:\Program Files\Eclipse Adoptium\jdk-17*",
        "C:\Program Files\Java\jdk-17*",
        "C:\Program Files\Microsoft\jdk-17*"
    )

    foreach ($pattern in $patterns) {
        $found = Get-ChildItem $pattern -ErrorAction SilentlyContinue |
            Sort-Object Name -Descending |
            Select-Object -First 1
        if ($found) {
            return $found.FullName
        }
    }

    return $null
}

if (-not (Test-Path ".\gradlew.bat")) {
    Write-Error @"
gradlew.bat not found in $PSScriptRoot

Use the full project at C:\dev\herfree-platform\backend
(OneDrive 바탕 화면\herfree-platform\backend 는 소스가 없습니다.)
"@
}

$javaHome = Resolve-JavaHome
if ($javaHome) {
    $env:JAVA_HOME = $javaHome
    Write-Host "JAVA_HOME=$javaHome"
} else {
    Write-Warning "Java 17 not found. Install Temurin 17: https://adoptium.net"
}

Write-Host "Running: .\gradlew.bat clean build --no-daemon"
& .\gradlew.bat clean build --no-daemon @args
exit $LASTEXITCODE
