# Create or verify Herfree production AWS resources (staging과 분리). Secret 원문은 출력하지 않는다.
param(
    [string]$AwsProfile = "herfree-staging",
    [string]$Region = "ap-northeast-2",
    [string]$AccountId = "439777528445",
    [string]$ProductionApiName = "herfree-production-api",
    [string]$ProductionRdsId = "herfree-production-mysql",
    [string]$ProductionDomain = "api.herpfree.co.kr",
    [string]$FrontendOrigin = "https://herpfree.co.kr",
    [switch]$DryRun
)

$ErrorActionPreference = "Stop"
$root = Split-Path -Parent $PSScriptRoot
Set-Location $root

$ProductionBucket = "herfree-prod-uploads-${AccountId}-${Region}"
$LogGroup = "/herfree/production/api"
$StagingInstanceId = "i-02cf5b8f3a7aa32da"

function Invoke-AwsJson([string[]]$Args) {
    if ($DryRun) {
        Write-Host "[dry-run] aws $($Args -join ' ')" -ForegroundColor Yellow
        return $null
    }
    $raw = & aws @Args --profile $AwsProfile --region $Region --output json 2>&1
    if ($LASTEXITCODE -ne 0) { throw ($raw | Out-String) }
    if ([string]::IsNullOrWhiteSpace($raw)) { return $null }
    return $raw | ConvertFrom-Json
}

function Invoke-AwsText([string[]]$Args) {
    if ($DryRun) {
        Write-Host "[dry-run] aws $($Args -join ' ')" -ForegroundColor Yellow
        return $null
    }
    $raw = & aws @Args --profile $AwsProfile --region $Region --output text 2>&1
    if ($LASTEXITCODE -ne 0) { throw ($raw | Out-String) }
    return $raw.Trim()
}

function New-RandomSecret([int]$Bytes = 32) {
    $buffer = New-Object byte[] $Bytes
    [System.Security.Cryptography.RandomNumberGenerator]::Create().GetBytes($buffer)
    return [Convert]::ToBase64String($buffer)
}

Write-Host ""
Write-Host "== Production AWS setup ==" -ForegroundColor Cyan
Write-Host ""

$identity = Invoke-AwsJson @("sts", "get-caller-identity")
if (-not $DryRun) {
    if ($identity.Account -ne $AccountId) {
        throw "Expected AWS account $AccountId, got $($identity.Account)"
    }
    Write-Host "[OK] AWS account $AccountId" -ForegroundColor Green
}

# --- CloudWatch log group ---
Write-Host "-> CloudWatch log group $LogGroup"
if (-not $DryRun) {
    $existing = aws logs describe-log-groups `
        --profile $AwsProfile --region $Region `
        --log-group-name-prefix $LogGroup `
        --query "logGroups[?logGroupName=='$LogGroup'].logGroupName" `
        --output text 2>$null
    if (-not $existing) {
        aws logs create-log-group --profile $AwsProfile --region $Region --log-group-name $LogGroup | Out-Null
    }
    aws logs put-retention-policy --profile $AwsProfile --region $Region --log-group-name $LogGroup --retention-in-days 30 | Out-Null
    Write-Host "[OK] log group ready" -ForegroundColor Green
}

# --- S3 bucket ---
Write-Host "-> S3 bucket $ProductionBucket"
if (-not $DryRun) {
    $head = aws s3api head-bucket --bucket $ProductionBucket --profile $AwsProfile --region $Region 2>&1
    if ($LASTEXITCODE -ne 0) {
        if ($Region -eq "us-east-1") {
            aws s3api create-bucket --bucket $ProductionBucket --profile $AwsProfile --region $Region | Out-Null
        }
        else {
            aws s3api create-bucket --bucket $ProductionBucket `
                --create-bucket-configuration "LocationConstraint=$Region" `
                --profile $AwsProfile --region $Region | Out-Null
        }
    }
    # Re-apply these controls even when the bucket already exists; drift must
    # not silently make uploaded health-related images public or unencrypted.
    aws s3api put-public-access-block --bucket $ProductionBucket --profile $AwsProfile --region $Region `
        --public-access-block-configuration "BlockPublicAcls=true,IgnorePublicAcls=true,BlockPublicPolicy=true,RestrictPublicBuckets=true" | Out-Null
    aws s3api put-bucket-ownership-controls --bucket $ProductionBucket --profile $AwsProfile --region $Region `
        --ownership-controls "Rules=[{ObjectOwnership=BucketOwnerEnforced}]" | Out-Null
    aws s3api put-bucket-encryption --bucket $ProductionBucket --profile $AwsProfile --region $Region `
        --server-side-encryption-configuration "Rules=[{ApplyServerSideEncryptionByDefault={SSEAlgorithm=AES256}}]" | Out-Null
    Write-Host "[OK] S3 bucket ready" -ForegroundColor Green
}

# --- Discover VPC/subnets from staging ---
Write-Host "-> Discover VPC from staging RDS"
$stagingRds = Invoke-AwsJson @("rds", "describe-db-instances", "--db-instance-identifier", "herfree-staging-mysql")
$subnetGroupName = $stagingRds.DBInstances[0].DBSubnetGroup.DBSubnetGroupName
$vpcId = $stagingRds.DBInstances[0].DBSubnetGroup.VpcId
Write-Host "   VPC $vpcId, subnet group $subnetGroupName"

$stagingEc2 = Invoke-AwsJson @("ec2", "describe-instances", "--instance-ids", $StagingInstanceId)
$subnetId = $stagingEc2.Reservations[0].Instances[0].SubnetId
Write-Host "   EC2 subnet $subnetId"

# --- Security groups ---
Write-Host "-> Production security groups"
$apiSgName = "herfree-production-api-sg"
$rdsSgName = "herfree-production-rds-sg"

$apiSgId = Invoke-AwsText @("ec2", "describe-security-groups", "--filters", "Name=group-name,Values=$apiSgName", "Name=vpc-id,Values=$vpcId", "--query", "SecurityGroups[0].GroupId")
if (-not $apiSgId -or $apiSgId -eq "None") {
    if (-not $DryRun) {
        $apiSgId = Invoke-AwsText @(
            "ec2", "create-security-group",
            "--group-name", $apiSgName,
            "--description", "Herfree production API",
            "--vpc-id", $vpcId,
            "--query", "GroupId"
        )
        aws ec2 authorize-security-group-ingress --profile $AwsProfile --region $Region --group-id $apiSgId --ip-permissions `
            "IpProtocol=tcp,FromPort=80,ToPort=80,IpRanges=[{CidrIp=0.0.0.0/0,Description=HTTP}]" `
            "IpProtocol=tcp,FromPort=443,ToPort=443,IpRanges=[{CidrIp=0.0.0.0/0,Description=HTTPS}]" | Out-Null
    }
}
Write-Host "   API SG: $apiSgId"

$rdsSgId = Invoke-AwsText @("ec2", "describe-security-groups", "--filters", "Name=group-name,Values=$rdsSgName", "Name=vpc-id,Values=$vpcId", "--query", "SecurityGroups[0].GroupId")
if (-not $rdsSgId -or $rdsSgId -eq "None") {
    if (-not $DryRun) {
        $rdsSgId = Invoke-AwsText @(
            "ec2", "create-security-group",
            "--group-name", $rdsSgName,
            "--description", "Herfree production RDS",
            "--vpc-id", $vpcId,
            "--query", "GroupId"
        )
        aws ec2 authorize-security-group-ingress --profile $AwsProfile --region $Region --group-id $rdsSgId `
            --ip-permissions "IpProtocol=tcp,FromPort=3306,ToPort=3306,UserIdGroupPairs=[{GroupId=$apiSgId,Description=production API}]" | Out-Null
    }
}
Write-Host "   RDS SG: $rdsSgId"

# --- RDS ---
Write-Host "-> RDS $ProductionRdsId (backup 7 days)"
$rdsExists = $false
try {
    $prodRds = Invoke-AwsJson @("rds", "describe-db-instances", "--db-instance-identifier", $ProductionRdsId)
    $rdsExists = $true
    $rdsEndpoint = $prodRds.DBInstances[0].Endpoint.Address
    Write-Host "[OK] RDS exists: $rdsEndpoint (status $($prodRds.DBInstances[0].DBInstanceStatus))" -ForegroundColor Green
}
catch {
    if (-not $DryRun) {
        Write-Host "   Creating RDS (10-15 min)..."
        Invoke-AwsJson @(
            "rds", "create-db-instance",
            "--db-instance-identifier", $ProductionRdsId,
            "--db-instance-class", "db.t4g.micro",
            "--engine", "mysql",
            "--engine-version", "8.0.46",
            "--master-username", "admin",
            "--manage-master-user-password",
            "--allocated-storage", "20",
            "--storage-type", "gp3",
            "--storage-encrypted",
            "--backup-retention-period", "7",
            "--deletion-protection",
            "--no-publicly-accessible",
            "--db-subnet-group-name", $subnetGroupName,
            "--vpc-security-group-ids", $rdsSgId,
            "--copy-tags-to-snapshot",
            "--enable-cloudwatch-logs-exports", "error"
        ) | Out-Null
        Write-Host "[WAIT] RDS creating — re-run this script when available" -ForegroundColor Yellow
        return
    }
}

if ($rdsExists -and -not $DryRun) {
    aws rds wait db-instance-available --profile $AwsProfile --region $Region --db-instance-identifier $ProductionRdsId
    $prodRds = Invoke-AwsJson @("rds", "describe-db-instances", "--db-instance-identifier", $ProductionRdsId)
    $rdsEndpoint = $prodRds.DBInstances[0].Endpoint.Address
}

# --- EC2 ---
Write-Host "-> EC2 $ProductionApiName"
$prodInstances = Invoke-AwsJson @(
    "ec2", "describe-instances",
    "--filters", "Name=tag:Name,Values=$ProductionApiName", "Name=instance-state-name,Values=pending,running,stopping,stopped"
)
$prodInstance = $null
if ($prodInstances.Reservations.Count -gt 0) {
    $prodInstance = $prodInstances.Reservations[0].Instances[0]
}

if (-not $prodInstance) {
    if (-not $DryRun) {
        $ami = Invoke-AwsText @(
            "ec2", "describe-images",
            "--owners", "099720109477",
            "--filters", "Name=name,Values=ubuntu/images/hvm-ssd/ubuntu-jammy-22.04-amd64-server-*", "Name=state,Values=available",
            "--query", "sort_by(Images,&CreationDate)[-1].ImageId"
        )
        Write-Host "   Launching $ami in $subnetId"
        $instanceProfile = "herfree-production-ec2"
        $instanceId = Invoke-AwsText @(
            "ec2", "run-instances",
            "--image-id", $ami,
            "--instance-type", "t3.small",
            "--subnet-id", $subnetId,
            "--security-group-ids", $apiSgId,
            "--iam-instance-profile", "Name=$instanceProfile",
            "--metadata-options", "HttpTokens=required,HttpPutResponseHopLimit=2",
            "--block-device-mappings", "DeviceName=/dev/sda1,Ebs={VolumeSize=30,VolumeType=gp3,Encrypted=true}",
            "--tag-specifications", "ResourceType=instance,Tags=[{Key=Name,Value=$ProductionApiName}]",
            "--query", "Instances[0].InstanceId"
        )
        Write-Host "   Instance $instanceId starting..."
        aws ec2 wait instance-running --profile $AwsProfile --region $Region --instance-ids $instanceId
        $prodInstance = (Invoke-AwsJson @("ec2", "describe-instances", "--instance-ids", $instanceId)).Reservations[0].Instances[0]
    }
}
else {
    $instanceId = $prodInstance.InstanceId
    Write-Host "[OK] EC2 exists: $instanceId ($($prodInstance.State.Name))" -ForegroundColor Green
}

if ($prodInstance -and -not $DryRun) {
    $instanceId = $prodInstance.InstanceId
    # Elastic IP
    $eipAlloc = Invoke-AwsText @(
        "ec2", "describe-addresses",
        "--filters", "Name=instance-id,Values=$instanceId",
        "--query", "Addresses[0].AllocationId"
    )
    if (-not $eipAlloc -or $eipAlloc -eq "None") {
        $eipAlloc = Invoke-AwsText @("ec2", "allocate-address", "--domain", "vpc", "--query", "AllocationId")
        aws ec2 associate-address --profile $AwsProfile --region $Region --instance-id $instanceId --allocation-id $eipAlloc | Out-Null
    }
    $publicIp = Invoke-AwsText @("ec2", "describe-addresses", "--allocation-ids", $eipAlloc, "--query", "Addresses[0].PublicIp")
    Write-Host "[OK] Production EIP: $publicIp" -ForegroundColor Green
    Write-Host ""
    Write-Host "Gabia DNS: api.herpfree.co.kr A -> $publicIp" -ForegroundColor Yellow
}

# --- Production secrets (never copy staging credentials) ---
if ($rdsExists -and -not $DryRun) {
    Write-Host "-> Secrets Manager herfree/production/*"
    $secretIds = @(
        "herfree/production/app-config",
        "herfree/production/db-app",
        "herfree/production/smtp"
    )
    foreach ($secretId in $secretIds) {
        $secretCheck = aws secretsmanager describe-secret --profile $AwsProfile --region $Region --secret-id $secretId 2>&1
        if ($LASTEXITCODE -ne 0) {
            throw "Missing $secretId. Provision production-only secrets before running setup-production-aws.ps1; staging secrets are never copied."
        }
    }

    $appJsonRaw = aws secretsmanager get-secret-value --profile $AwsProfile --region $Region `
        --secret-id "herfree/production/app-config" --query SecretString --output text
    $dbJsonRaw = aws secretsmanager get-secret-value --profile $AwsProfile --region $Region `
        --secret-id "herfree/production/db-app" --query SecretString --output text
    $smtpJsonRaw = aws secretsmanager get-secret-value --profile $AwsProfile --region $Region `
        --secret-id "herfree/production/smtp" --query SecretString --output text

    $appConfig = $appJsonRaw | ConvertFrom-Json
    if ([string]::IsNullOrWhiteSpace($appConfig.healthDataEncryptionKey)) {
        $appConfig.healthDataEncryptionKey = New-RandomSecret 32
    }
    $healthKey = [string]$appConfig.healthDataEncryptionKey
    $healthKeyValid = $healthKey -match '^[0-9a-fA-F]{64}$'
    if (-not $healthKeyValid) {
        try { $healthKeyValid = ([Convert]::FromBase64String($healthKey)).Length -eq 32 } catch { $healthKeyValid = $false }
    }
    if (-not $healthKeyValid) {
        throw "Production app-config healthDataEncryptionKey must be a 32-byte base64 value or 64-character hex value."
    }
    $appConfig.frontendOrigin = $FrontendOrigin
    $appConfig.dbHost = $rdsEndpoint
    $appConfig.s3Bucket = $ProductionBucket
    $appConfig.cloudWatchLogGroup = $LogGroup
    $adminAccessCidrs = [string]$appConfig.adminAccessAllowedCidrs
    if ([string]::IsNullOrWhiteSpace($adminAccessCidrs) -or $adminAccessCidrs.Contains("0.0.0.0/0") -or $adminAccessCidrs.Contains("::/0")) {
        throw "Production app-config must contain a restricted adminAccessAllowedCidrs VPN/admin gate."
    }
    if (([string]::IsNullOrWhiteSpace($appConfig.jwtSecret) -or ([string]$appConfig.jwtSecret).Length -lt 32) -or ([string]::IsNullOrWhiteSpace($appConfig.analyticsHashSalt) -or ([string]$appConfig.analyticsHashSalt).Length -lt 32)) {
        throw "Production app-config must contain pre-provisioned JWT and analytics salt values of at least 32 characters."
    }
    foreach ($provider in @("kakao", "google", "naver")) {
        $appConfig.oauth.$provider.redirectUri = "$FrontendOrigin/auth/callback/$provider"
    }
    $appJson = $appConfig | ConvertTo-Json -Compress -Depth 8
    $dbConfig = $dbJsonRaw | ConvertFrom-Json
    foreach ($field in @("database", "username", "password")) {
        if ([string]::IsNullOrWhiteSpace([string]$dbConfig.$field)) {
            throw "Production db-app is missing $field."
        }
    }
    $smtpConfig = $smtpJsonRaw | ConvertFrom-Json
    foreach ($field in @("from", "host", "port", "username", "password")) {
        if ([string]::IsNullOrWhiteSpace([string]$smtpConfig.$field)) {
            throw "Production smtp secret is missing $field."
        }
    }

    foreach ($pair in @(
            @{ Id = "herfree/production/app-config"; Value = $appJson },
            @{ Id = "herfree/production/db-app"; Value = $dbJsonRaw },
            @{ Id = "herfree/production/smtp"; Value = $smtpJsonRaw }
        )) {
        $exists = $false
        try {
            aws secretsmanager describe-secret --profile $AwsProfile --region $Region --secret-id $pair.Id | Out-Null
            $exists = $true
        }
        catch { }

        if ($exists) {
            aws secretsmanager put-secret-value --profile $AwsProfile --region $Region `
                --secret-id $pair.Id --secret-string $pair.Value | Out-Null
        }
        else {
            aws secretsmanager create-secret --profile $AwsProfile --region $Region `
                --name $pair.Id --secret-string $pair.Value | Out-Null
        }
    }
    Write-Host "[OK] production-only secrets verified and infrastructure fields refreshed" -ForegroundColor Green
}

Write-Host ""
Write-Host "== Next ==" -ForegroundColor Cyan
Write-Host "1. Ensure IAM instance profile herfree-production-ec2 exists (SSM, ECR, S3, secrets, logs)"
Write-Host "2. Ensure IAM role herfree-github-production-deploy exists for GitHub production Environment"
Write-Host "3. SSM bootstrap EC2: install Docker/nginx, /opt/herfree layout"
Write-Host "4. Gabia: api.herpfree.co.kr A -> production EIP"
Write-Host "5. gh variable set PRODUCTION_INSTANCE_ID / PRODUCTION_API_URL"
Write-Host ""

if ($prodInstance -and -not $DryRun) {
    Write-Host "PRODUCTION_INSTANCE_ID=$instanceId"
    Write-Host "PRODUCTION_EIP=$publicIp"
}
