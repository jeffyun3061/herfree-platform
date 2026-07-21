param(
    [Parameter(Mandatory = $true)]
    [string]$StagingInstanceId,

    [string]$StagingFrontendUrl = "https://develop.d2bcg3vnlv5hkh.amplifyapp.com",
    [string]$StagingApiUrl = "http://api-staging.herpfree.co.kr",
    [string]$AwsRegion = "ap-northeast-2",
    [string]$EcrRepository = "herfree-api",
    [string]$StagingDeployRoleArn = "arn:aws:iam::439777528445:role/herfree-github-staging-deploy"
)

$ErrorActionPreference = "Stop"
$owner = "jeffyun3061"
$repo = "herfree-platform"

gh auth status | Out-Null
if ($LASTEXITCODE -ne 0) {
    throw "Run 'gh auth login' first."
}

function Set-Environment {
    param(
        [string]$Name,
        [array]$Reviewers,
        [string[]]$Branches
    )

    $body = @{
        wait_timer          = 0
        prevent_self_review = $false
        reviewers           = $Reviewers
        deployment_branch_policy = @{
            protected_branches     = $false
            custom_branch_policies = $true
        }
    }
    $temp = Join-Path $env:TEMP "herfree-$Name-environment.json"
    try {
        [System.IO.File]::WriteAllText(
            $temp,
            ($body | ConvertTo-Json -Depth 8),
            (New-Object System.Text.UTF8Encoding($false))
        )
        gh api -X PUT "repos/$owner/$repo/environments/$Name" --input $temp | Out-Null
        if ($LASTEXITCODE -ne 0) {
            throw "Failed to configure the $Name environment."
        }
    }
    finally {
        Remove-Item -LiteralPath $temp -Force -ErrorAction SilentlyContinue
    }

    $existing = @(gh api "repos/$owner/$repo/environments/$Name/deployment-branch-policies" `
        --jq '.branch_policies[].name')
    foreach ($branch in $Branches) {
        if ($existing -notcontains $branch) {
            gh api -X POST "repos/$owner/$repo/environments/$Name/deployment-branch-policies" `
                -f name=$branch -f type=branch | Out-Null
        }
    }
}

$userId = [long](gh api user --jq '.id')
Set-Environment -Name "staging" -Reviewers @() -Branches @("develop", "main")
Set-Environment -Name "production" -Reviewers @(@{ type = "User"; id = $userId }) -Branches @("main")

gh variable set AWS_REGION -R "$owner/$repo" --body $AwsRegion
gh variable set ECR_REPOSITORY -R "$owner/$repo" --body $EcrRepository
gh variable set STAGING_INSTANCE_ID -R "$owner/$repo" -e staging --body $StagingInstanceId
gh variable set STAGING_FRONTEND_URL -R "$owner/$repo" -e staging --body $StagingFrontendUrl
gh variable set STAGING_API_URL -R "$owner/$repo" -e staging --body $StagingApiUrl
gh secret set AWS_DEPLOY_ROLE_ARN -R "$owner/$repo" -e staging --body $StagingDeployRoleArn

# Actions는 OIDC와 명시적으로 선언한 권한만 사용한다.
gh api -X PUT "repos/$owner/$repo/actions/permissions/workflow" `
    -f default_workflow_permissions=read `
    -F can_approve_pull_request_reviews=false | Out-Null

gh api -X PUT "repos/$owner/$repo/vulnerability-alerts" | Out-Null
gh api -X PUT "repos/$owner/$repo/automated-security-fixes" | Out-Null

gh api -X PATCH "repos/$owner/$repo" `
    -F allow_squash_merge=true `
    -F allow_merge_commit=false `
    -F allow_rebase_merge=false `
    -F delete_branch_on_merge=true `
    -f squash_merge_commit_title=PR_TITLE `
    -f squash_merge_commit_message=COMMIT_MESSAGES | Out-Null

Write-Host "GitHub environments and repository settings configured." -ForegroundColor Green
