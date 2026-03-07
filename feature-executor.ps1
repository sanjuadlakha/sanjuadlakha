# Feature Development Trigger Script for Azure DevOps Workflow
# This triggers Copilot to implement new features

param(
  [Parameter(Mandatory=$false)]
  [ValidateSet("azure-devops-feature","azure-devops-feature-created","devops-feature-created","feature-trigger")]
  [string]$EventType = "azure-devops-feature",

  [Parameter(Mandatory=$false)]
  [int]$WorkItemId = 108,

  [Parameter(Mandatory=$false)]
  [string]$FeatureTitle = "New Feature Implementation",

  [Parameter(Mandatory=$false)]
  [string]$FeatureDescription = "Feature to be implemented by Copilot",

  [Parameter(Mandatory=$false)]
  [string]$Owner = "sanjuadlakha",

  [Parameter(Mandatory=$false)]
  [string]$Repo = "sanjuadlakha"
)

$token = $env:GITHUB_TOKEN

if (-not $token) {
  Write-Host ""
  Write-Host "ERROR: GITHUB_TOKEN not set" -ForegroundColor Red
  Write-Host ""
  Write-Host "Please set GITHUB_TOKEN environment variable:" -ForegroundColor Yellow
  Write-Host ""
  Write-Host "Steps:" -ForegroundColor Cyan
  Write-Host "1. Go to: https://github.com/settings/tokens/new" -ForegroundColor White
  Write-Host "2. Give it a name (e.g., 'Feature Development Trigger')" -ForegroundColor White
  Write-Host "3. Select scopes: 'repo' (Full control)" -ForegroundColor White
  Write-Host "4. Click 'Generate token' and copy it" -ForegroundColor White
  Write-Host ""
  Write-Host "Then run:" -ForegroundColor Cyan
  Write-Host '$env:GITHUB_TOKEN = "ghp_your_token_here"' -ForegroundColor White
  Write-Host ".\feature-executor.ps1" -ForegroundColor White
  Write-Host ""

  exit 1
}

Write-Host ""
Write-Host "====================================================" -ForegroundColor Cyan
Write-Host " Azure DevOps Feature Development Trigger" -ForegroundColor Cyan
Write-Host "====================================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "Repository: $Owner/$Repo" -ForegroundColor White
Write-Host "Event Type: $EventType" -ForegroundColor White
Write-Host "Work Item ID: $WorkItemId" -ForegroundColor Yellow
Write-Host "Feature Title: $FeatureTitle" -ForegroundColor Yellow
Write-Host ""

Write-Host "Mode: Feature + Auto-trigger Copilot AI Agent" -ForegroundColor Cyan
Write-Host " 1. Creates tracking issue" -ForegroundColor White
Write-Host " 2. Triggers Copilot AI coding agent automatically" -ForegroundColor White
Write-Host " 3. AI implements feature completely" -ForegroundColor White
Write-Host ""

# Create payload matching feature-trigger.yml expectations

$payloadData = @{
  event_type = $EventType
  client_payload = @{
    workItemId = $WorkItemId
    title = $FeatureTitle
    description = $FeatureDescription
    type = "Feature"
    state = "In Progress"
    resource = @{
      id = $WorkItemId
      workItemId = $WorkItemId
      fields = @{
        "System.Title" = $FeatureTitle
        "System.WorkItemType" = "Feature"
        "System.State" = "In Progress"
        "System.Description" = $FeatureDescription
      }
    }
    url = "https://dev.azure.com/yourorganization/yourproject/_workitems/edit/$WorkItemId"
  }
}

$payload = $payloadData | ConvertTo-Json -Depth 10

Write-Host "Payload Structure:" -ForegroundColor Yellow
Write-Host " - Event: $EventType" -ForegroundColor White
Write-Host " - Work Item: $WorkItemId" -ForegroundColor White
Write-Host " - Title: $FeatureTitle" -ForegroundColor White
Write-Host ""

$headers = @{
  "Accept" = "application/vnd.github+json"
  "Authorization" = "Bearer $token"
  "X-GitHub-Api-Version" = "2022-11-28"
}

$uri = "https://api.github.com/repos/$Owner/$Repo/dispatches"

Write-Host "Sending repository_dispatch event..." -ForegroundColor Cyan
Write-Host "API Endpoint: $uri" -ForegroundColor Gray
Write-Host ""

try {
  $response = Invoke-RestMethod `
    -Uri $uri `
    -Method Post `
    -Headers $headers `
    -Body $payload `
    -ContentType "application/json" `
    -ErrorAction Stop

  Write-Host "SUCCESS! Feature development workflow triggered!" -ForegroundColor Green
  Write-Host "====================================================" -ForegroundColor Green
  Write-Host ""

  Write-Host "What Happens Next:" -ForegroundColor Cyan
  Write-Host ""
  Write-Host "1. Tracking issue created (check issues tab)" -ForegroundColor Yellow
  Write-Host "2. Copilot AI agent triggered automatically" -ForegroundColor Yellow
  Write-Host "3. AI implements feature completely (5-10 min)" -ForegroundColor Yellow
  Write-Host "4. Pull Request created with feature implementation" -ForegroundColor Yellow
  Write-Host "5. PR assigned to Copilot for development" -ForegroundColor Yellow
  Write-Host ""

  Write-Host "Monitor Progress:" -ForegroundColor Cyan
  Write-Host ""
  Write-Host "1. Workflow runs:" -ForegroundColor Yellow
  Write-Host " https://github.com/$Owner/$Repo/actions" -ForegroundColor White
  Write-Host ""
  Write-Host "2. GitHub issues (tracking):" -ForegroundColor Yellow
  Write-Host " https://github.com/$Owner/$Repo/issues" -ForegroundColor White
  Write-Host ""
  Write-Host "3. Pull Requests (after 5-10 min):" -ForegroundColor Yellow
  Write-Host " https://github.com/$Owner/$Repo/pulls" -ForegroundColor White
  Write-Host ""
  Write-Host "====================================================" -ForegroundColor Green
  Write-Host ""
}
catch {
  Write-Host ""
  Write-Host "====================================================" -ForegroundColor Red
  Write-Host " FAILED TO TRIGGER FEATURE WORKFLOW" -ForegroundColor Red
  Write-Host "====================================================" -ForegroundColor Red
  Write-Host ""

  Write-Host "Error: $($_.Exception.Message)" -ForegroundColor Red

  if ($_.Exception.Response) {
    $statusCode = $_.Exception.Response.StatusCode.value__
    Write-Host "HTTP Status: $statusCode" -ForegroundColor Red

    try {
      $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
      $responseBody = $reader.ReadToEnd()

      Write-Host ""
      Write-Host "Response:" -ForegroundColor Yellow
      Write-Host $responseBody -ForegroundColor Red
    }
    catch {
      Write-Host "Could not read error response" -ForegroundColor Yellow
    }
  }

  Write-Host ""
  Write-Host "Common Issues:" -ForegroundColor Yellow
  Write-Host " - Token missing 'repo' scope" -ForegroundColor White
  Write-Host " - Token expired" -ForegroundColor White
  Write-Host " - Repository name incorrect" -ForegroundColor White
  Write-Host " - Workflow file not configured" -ForegroundColor White
  Write-Host " - GitHub Actions not enabled in repo" -ForegroundColor White
  Write-Host ""

  exit 1
}
