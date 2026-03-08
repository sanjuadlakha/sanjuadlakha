# Feature Development Trigger Script - Enhanced Version

param(
  [Parameter(Mandatory=$false)]
  [int]$WorkItemId = 108,

  [Parameter(Mandatory=$false)]
  [string]$FeatureTitle = "User Authentication System",

  [Parameter(Mandatory=$false)]
  [string]$FeatureDescription = "Implement OAuth2 authentication with JWT tokens",

  [Parameter(Mandatory=$false)]
  [string]$Owner = "sanjuadlakha",

  [Parameter(Mandatory=$false)]
  [string]$Repo = "sanjuadlakha",

  # New optional parameters for enhanced functionality
  [Parameter(Mandatory=$false)]
  [string]$TechStack = "",

  [Parameter(Mandatory=$false)]
  [string]$CustomInstructions = "",

  [Parameter(Mandatory=$false)]
  [ValidateSet("Feature", "Bug Fix", "Enhancement", "Scratch Development", "Full Project")]
  [string]$ProjectType = "Feature"
)

$token = $env:GITHUB_TOKEN

if (-not $token) {
  Write-Host "ERROR: GITHUB_TOKEN not set" -ForegroundColor Red
  Write-Host "Set token: `$env:GITHUB_TOKEN = 'ghp_your_token'" -ForegroundColor Yellow
  exit 1
}

Write-Host ""
Write-Host "🚀 Feature Development Trigger" -ForegroundColor Cyan
Write-Host "===============================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Repo: $Owner/$Repo" -ForegroundColor White
Write-Host "WI ID: $WorkItemId" -ForegroundColor Yellow
Write-Host "Type: $ProjectType" -ForegroundColor Yellow
Write-Host "Title: $FeatureTitle" -ForegroundColor Yellow
if ($TechStack) {
  Write-Host "Tech Stack: $TechStack" -ForegroundColor Magenta
}
Write-Host ""

$clientPayload = @{
  workItemId = $WorkItemId
  title = $FeatureTitle
  description = $FeatureDescription
  projectType = $ProjectType
  type = $ProjectType
  state = "In Progress"
}

# Add optional fields if provided
if ($TechStack) {
  $clientPayload.techStack = $TechStack
}

if ($CustomInstructions) {
  $clientPayload.customInstructions = $CustomInstructions
}

$payload = @{
  event_type = "azure-devops-feature"
  client_payload = $clientPayload
} | ConvertTo-Json -Depth 10

$headers = @{
  "Accept" = "application/vnd.github+json"
  "Authorization" = "Bearer $token"
  "X-GitHub-Api-Version" = "2022-11-28"
}

try {
  Invoke-RestMethod `
    -Uri "https://api.github.com/repos/$Owner/$Repo/dispatches" `
    -Method Post `
    -Headers $headers `
    -Body $payload `
    -ContentType "application/json" `
    -ErrorAction Stop

  Write-Host "✅ SUCCESS! Workflow triggered!" -ForegroundColor Green
  Write-Host ""
  Write-Host "Next steps:" -ForegroundColor Cyan
  Write-Host "1. Check: https://github.com/$Owner/$Repo/actions" -ForegroundColor White
  Write-Host "2. Issue: https://github.com/$Owner/$Repo/issues" -ForegroundColor White
  Write-Host "3. PR: https://github.com/$Owner/$Repo/pulls" -ForegroundColor White
  Write-Host ""
}
catch {
  Write-Host "❌ FAILED" -ForegroundColor Red
  Write-Host "Error: $($_.Exception.Message)" -ForegroundColor Red
  exit 1
}
