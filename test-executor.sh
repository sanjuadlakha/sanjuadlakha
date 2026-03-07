# Test Trigger Script for Azure DevOps Workflow
# This simulates an Azure DevOps webhook to trigger actual test case generation

param(
  [Parameter(Mandatory=$false)]
  [ValidateSet("azure-devops-workitem-created","azure-devops-workitem","devops-workitem-created")]
  [string]$EventType = "azure-devops-workitem",

  [Parameter(Mandatory=$false)]
  [int]$WorkItemId = 107,

  [Parameter(Mandatory=$false)]
  [string]$Owner = "sanjuadlakha",

  [Parameter(Mandatory=$false)]
  [string]$Repo = "Automation-git-worflow"
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
  Write-Host "2. Give it a name (e.g., 'Test Workflow Trigger')" -ForegroundColor White
  Write-Host "3. Select scopes: 'repo' (Full control)" -ForegroundColor White
  Write-Host "4. Click 'Generate token' and copy it" -ForegroundColor White
  Write-Host ""
  Write-Host "Then run:" -ForegroundColor Cyan
  Write-Host '$env:GITHUB_TOKEN = "ghp_your_token_here"' -ForegroundColor White
  Write-Host ".\test-executor.ps1" -ForegroundColor White
  Write-Host ""

  exit 1
}

Write-Host ""
Write-Host "====================================================" -ForegroundColor Cyan
Write-Host " Azure DevOps Test Case Generation Trigger" -ForegroundColor Cyan
Write-Host "====================================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "Repository: $Owner/$Repo" -ForegroundColor White
Write-Host "Event Type: $EventType" -ForegroundColor White
Write-Host "Work Item ID: $WorkItemId" -ForegroundColor Yellow
Write-Host ""

if ($EventType -eq "azure-devops-workitem") {
  Write-Host "Mode: Issue + Auto-trigger real workflow" -ForegroundColor Cyan
  Write-Host " 1. Creates tracking issue" -ForegroundColor White
  Write-Host " 2. Automatically triggers test generation" -ForegroundColor White
}
else {
  Write-Host "Mode: Direct test generation workflow" -ForegroundColor Cyan
  Write-Host " Directly runs Python + Azure OpenAI generation" -ForegroundColor White
}

Write-Host ""

# Create payload matching devops-trigger.yml expectations

$payloadData = @{
  event_type = $EventType
  client_payload = @{
    workItemId = $WorkItemId
    title = "Bug in Bonus Calculation Logic"
    type = "Issue"
    state = "To Do"
    resource = @{
      id = $WorkItemId
      workItemId = $WorkItemId
      fields = @{
        "System.Title" = "Bug in Bonus Calculation Logic"
        "System.WorkItemType" = "Issue"
        "System.State" = "To Do"
        "System.Description" = "Automated test trigger"
      }
    }
    url = "https://dev.azure.com/pravinpandagale/BugInspector/_workitems/edit/$WorkItemId"
  }
}

$payload = $payloadData | ConvertTo-Json -Depth 10

Write-Host "Payload Structure:" -ForegroundColor Yellow
Write-Host " - Event: $EventType" -ForegroundColor White
Write-Host " - Work Item: $WorkItemId" -ForegroundColor White
Write-Host " - Title: Bug in Bonus Calculation Logic" -ForegroundColor White
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

```
$response = Invoke-RestMethod `
    -Uri $uri `
    -Method Post `
    -Headers $headers `
    -Body $payload `
    -ContentType "application/json"

Write-Host "SUCCESS! Workflow triggered!" -ForegroundColor Green
Write-Host "====================================================" -ForegroundColor Green
Write-Host ""

Write-Host "What Happens Next:" -ForegroundColor Cyan
Write-Host ""

if ($EventType -eq "azure-devops-workitem") {
    Write-Host "1. Tracking issue created (check issues tab)" -ForegroundColor Yellow
    Write-Host "2. Second workflow auto-triggered for test generation" -ForegroundColor Yellow
    Write-Host "3. Azure OpenAI generates test cases (2-3 min)" -ForegroundColor Yellow
    Write-Host "4. Pull Request created with artifacts" -ForegroundColor Yellow
}
else {
    Write-Host "1. Workflow fetches work item from Azure DevOps" -ForegroundColor Yellow
    Write-Host "2. Azure OpenAI analyzes and generates tests" -ForegroundColor Yellow
    Write-Host "3. Tracking issue created automatically" -ForegroundColor Yellow
    Write-Host "4. Pull Request created with test artifacts" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "Monitor Progress:" -ForegroundColor Cyan

Write-Host "1. Workflow runs:" -ForegroundColor Yellow
Write-Host " https://github.com/$owner/$repo/actions" -ForegroundColor White

Write-Host "2. GitHub issues:" -ForegroundColor Yellow
Write-Host " https://github.com/$owner/$repo/issues" -ForegroundColor White

Write-Host "3. Pull Requests (after 2-3 min):" -ForegroundColor Yellow
Write-Host " https://github.com/$owner/$repo/pulls" -ForegroundColor White

Write-Host "====================================================" -ForegroundColor Green
```

}
catch {

```
Write-Host ""
Write-Host "====================================================" -ForegroundColor Red
Write-Host " FAILED TO TRIGGER WORKFLOW" -ForegroundColor Red
Write-Host "====================================================" -ForegroundColor Red

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
Write-Host " - Workflow file missing" -ForegroundColor White
```

}
