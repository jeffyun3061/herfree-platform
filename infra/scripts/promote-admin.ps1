param(
    [Parameter(Mandatory = $true)]
    [string]$Email,

    [string]$Container = "herfree-mysql",
    [string]$Database = "herfree_db",
    [string]$DbUser = "herfree_user",
    [string]$DbPassword = "herfree_pass"
)

$escaped = $Email.Replace("'", "''")
$sql = "UPDATE users SET role = 'SUPER_ADMIN' WHERE email = '$escaped'; SELECT id, email, role, status FROM users WHERE email = '$escaped';"

Write-Host "Promoting $Email to SUPER_ADMIN ..."

docker exec $Container mysql -u"$DbUser" -p"$DbPassword" $Database -e $sql

if ($LASTEXITCODE -ne 0) {
    Write-Error "Failed. Is Docker MySQL running? (docker compose -f docker-compose.local.yml up -d)"
    exit 1
}

Write-Host ""
Write-Host "Done. Log out and log in again, then open /admin"
