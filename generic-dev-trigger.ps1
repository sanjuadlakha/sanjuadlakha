# Generic Development Trigger Script 
# Works with any repository and any type of development

param(
  # Basic Parameters
  [Parameter(Mandatory=$false)]
  [string]$Owner = "sanjuadlakha",

  [Parameter(Mandatory=$false)]
  [string]$Repo = "sanjuadlakha",

  [Parameter(Mandatory=$false)]
  [int]$WorkItemId = $null,

  [Parameter(Mandatory=$true)]
  [string]$ProjectTitle,

  [Parameter(Mandatory=$true)]
  [string]$ProjectDescription,

  # Development Type
  [Parameter(Mandatory=$false)]
  [ValidateSet("Feature", "Bug Fix", "Enhancement", "Scratch Development", "Full Project", "Refactor", "Documentation", "Test", "API", "UI/UX", "Database")]
  [string]$ProjectType = "Feature",

  # Optional Advanced Parameters
  [Parameter(Mandatory=$false)]
  [string]$TechStack = "",

  [Parameter(Mandatory=$false)]
  [string]$CustomInstructions = "",

  # Trigger Type (for different event types)
  [Parameter(Mandatory=$false)]
  [ValidateSet("azure-devops-feature", "feature-trigger", "scratch-development", "new-project")]
  [string]$EventType = "feature-trigger"
)

# Generate work item ID if not provided
if (-not $WorkItemId) {
  $WorkItemId = Get-Random -Minimum 100 -Maximum 9999
}

$token = $env:GITHUB_TOKEN

if (-not $token) {
  Write-Host ""
  Write-Host "ERROR: GITHUB_TOKEN environment variable not set" -ForegroundColor Red
  Write-Host ""
  Write-Host "Set your GitHub token:" -ForegroundColor Yellow
  Write-Host '  $env:GITHUB_TOKEN = "ghp_your_token_here"' -ForegroundColor White
  Write-Host ""
  Write-Host "Token needs 'repo' and 'workflow' permissions" -ForegroundColor Yellow
  exit 1
}

# Determine emoji based on project type
$typeEmojis = @{
  'Feature' = '🚀'
  'Bug Fix' = '🐛'
  'Enhancement' = '✨'
  'Scratch Development' = '🏗️'
  'Full Project' = '🌟'
  'Refactor' = '♻️'
  'Documentation' = '📚'
  'Test' = '🧪'
  'API' = '🔌'
  'UI/UX' = '🎨'
  'Database' = '💾'
}
$emoji = $typeEmojis[$ProjectType]

Write-Host ""
Write-Host "=========================================" -ForegroundColor Cyan
Write-Host "  Generic Development Trigger" -ForegroundColor Cyan
Write-Host "=========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Repository:     $Owner/$Repo" -ForegroundColor White
Write-Host "Work Item ID:   WI-$WorkItemId" -ForegroundColor Yellow
Write-Host "Project Type:   $emoji $ProjectType" -ForegroundColor Yellow
Write-Host "Title:          $ProjectTitle" -ForegroundColor Yellow

if ($TechStack) {
  Write-Host "Tech Stack:     $TechStack" -ForegroundColor Magenta
}

Write-Host ""
Write-Host "Description:" -ForegroundColor Cyan
Write-Host $ProjectDescription -ForegroundColor White
Write-Host ""

if ($CustomInstructions) {
  Write-Host "Custom Instructions:" -ForegroundColor Cyan
  Write-Host $CustomInstructions -ForegroundColor White
  Write-Host ""
}

# Build payload
$clientPayload = @{
  workItemId = $WorkItemId
  title = $ProjectTitle
  description = $ProjectDescription
  projectType = $ProjectType
  type = $ProjectType
}

# Add optional fields if provided
if ($TechStack) {
  $clientPayload.techStack = $TechStack
}

if ($CustomInstructions) {
  $clientPayload.customInstructions = $CustomInstructions
}

$payload = @{
  event_type = $EventType
  client_payload = $clientPayload
} | ConvertTo-Json -Depth 10

$headers = @{
  "Accept" = "application/vnd.github+json"
  "Authorization" = "Bearer $token"
  "X-GitHub-Api-Version" = "2022-11-28"
}

Write-Host "Triggering Copilot coding agent..." -ForegroundColor Yellow
Write-Host ""

try {
  Invoke-RestMethod `
    -Uri "https://api.github.com/repos/$Owner/$Repo/dispatches" `
    -Method Post `
    -Headers $headers `
    -Body $payload `
    -ContentType "application/json" `
    -ErrorAction Stop

  Write-Host "✅ SUCCESS! Workflow triggered successfully!" -ForegroundColor Green
  Write-Host ""
  Write-Host "=========================================" -ForegroundColor Cyan
  Write-Host "  Next Steps" -ForegroundColor Cyan
  Write-Host "=========================================" -ForegroundColor Cyan
  Write-Host ""
  Write-Host "1. View workflow execution:" -ForegroundColor White
  Write-Host "   https://github.com/$Owner/$Repo/actions" -ForegroundColor Blue
  Write-Host ""
  Write-Host "2. Check created issue:" -ForegroundColor White
  Write-Host "   https://github.com/$Owner/$Repo/issues" -ForegroundColor Blue
  Write-Host ""
  Write-Host "3. Monitor Copilot agent progress:" -ForegroundColor White
  Write-Host "   Look for 'copilot-swe-agent[bot]' as assignee" -ForegroundColor Blue
  Write-Host ""
  Write-Host "4. Review generated PR when ready:" -ForegroundColor White
  Write-Host "   https://github.com/$Owner/$Repo/pulls" -ForegroundColor Blue
  Write-Host ""
  Write-Host "Copilot will automatically:" -ForegroundColor Green
  Write-Host "  - Analyze your requirements" -ForegroundColor White
  Write-Host "  - Create appropriate project structure" -ForegroundColor White
  Write-Host "  - Implement with production-quality code" -ForegroundColor White
  Write-Host "  - Include tests and documentation" -ForegroundColor White
  Write-Host "  - Create a PR for your review" -ForegroundColor White
  Write-Host ""
}
catch {
  Write-Host "❌ FAILED to trigger workflow" -ForegroundColor Red
  Write-Host ""
  Write-Host "Error: $($_.Exception.Message)" -ForegroundColor Red
  Write-Host ""
  
  if ($_.Exception.Response) {
    $statusCode = $_.Exception.Response.StatusCode.value__
    
    switch ($statusCode) {
      404 {
        Write-Host "Possible causes:" -ForegroundColor Yellow
        Write-Host "  - Repository $Owner/$Repo does not exist" -ForegroundColor White
        Write-Host "  - Workflow file missing: .github/workflows/feature-trigger.yml" -ForegroundColor White
        Write-Host "  - Token doesn't have access to repository" -ForegroundColor White
      }
      401 {
        Write-Host "Authentication failed - check GITHUB_TOKEN" -ForegroundColor Yellow
      }
      403 {
        Write-Host "Permission denied - token needs 'repo' and 'workflow' scopes" -ForegroundColor Yellow
      }
      default {
        Write-Host "HTTP Status Code: $statusCode" -ForegroundColor Yellow
      }
    }
  }
  
  Write-Host ""
  exit 1
}