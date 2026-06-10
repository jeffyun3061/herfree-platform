param(
    [Parameter(Mandatory = $true)]
    [string]$Email,

    [string]$Container = "herfree-mysql",
    [string]$Database = "herfree_db",
    [string]$User = "herfree_user",
    [string]$Password = "herfree_pass"
)

$escaped = $Email.Replace("'", "''")
$sql = "UPDATE users SET role = 'ADMIN' WHERE email = '$escaped'; SELECT id, email, role, status FROM users WHERE email = '$escaped';"

Write-Host "Promoting $Email to ADMIN ..."

docker exec $Container mysql -u$User -p$Password $Database -e $sql

if ($LASTEXITCODE -ne 0) {
    Write-Error "Failed. Is Docker MySQL running? (docker compose -f docker-compose.local.yml up -d)"
    exit 1
}

Write-Host ""
Write-Host "Done. Log out and log in again, then open /admin"
