# User Management Feature Trigger Script
# Repository: Sanju-Organization/user-management

param(
  [Parameter(Mandatory=$false)]
  [int]$WorkItemId = 1,

  [Parameter(Mandatory=$false)]
  [string]$FeatureTitle = "User Management Web Application",

  [Parameter(Mandatory=$false)]
  [string]$Owner = "Sanju-Organization",

  [Parameter(Mandatory=$false)]
  [string]$Repo = "user-management"
)

$FeatureDescription = @"
Build a User Management Web Application with the following stack:

## Frontend:
- React
- Fetch or Axios for API calls
- Modern Intuitive UI with Material UI based styling components

## Backend:
- Node.js
- Express.js

## Database:
- SQL.js
- Store user data in SQL tables
- Initialize schema when the server starts

## Features:
1. User registration
2. Login / logout
3. Role-based access control (admin, user)
4. CRUD operations for users
5. Update profile
6. Change password
7. Soft delete users
8. Pagination and search

## Technical Requirements:
- Password hashing with bcrypt
- JWT authentication
- Input validation
- Error handling middleware
- REST API design

## Deliverables:
1. Overall system architecture
2. Database schema for SQL.js
3. Backend folder structure
4. Express.js API endpoints
5. SQL queries for CRUD operations
6. Authentication flow
7. React frontend structure
8. Example components (login, register, admin dashboard)
9. API integration in React
10. Instructions to run the project locally

## Testing:
- Generate comprehensive test cases
- Execute test cases using Playwright
- Include unit tests, integration tests, and E2E tests

Provide clean, production-style code with explanations.
"@

$token = $env:GITHUB_TOKEN

if (-not $token) {
  Write-Host ""
  Write-Host "ERROR: GITHUB_TOKEN not set" -ForegroundColor Red
  Write-Host ""
  Write-Host "Set token using:" -ForegroundColor Yellow
  Write-Host '  $env:GITHUB_TOKEN = "ghp_your_token"' -ForegroundColor White
  Write-Host ""
  Write-Host "Or use a PAT with repo and workflow permissions" -ForegroundColor Yellow
  exit 1
}

Write-Host ""
Write-Host "=========================================" -ForegroundColor Cyan
Write-Host "  User Management App - Copilot Trigger" -ForegroundColor Cyan
Write-Host "=========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Repository: $Owner/$Repo" -ForegroundColor White
Write-Host "Work Item:  WI-$WorkItemId" -ForegroundColor Yellow
Write-Host "Feature:    $FeatureTitle" -ForegroundColor Yellow
Write-Host ""
Write-Host "This will trigger Copilot coding agent to build:" -ForegroundColor Magenta
Write-Host "  - React frontend with Material UI" -ForegroundColor White
Write-Host "  - Node.js/Express backend" -ForegroundColor White
Write-Host "  - SQL.js database" -ForegroundColor White
Write-Host "  - JWT authentication" -ForegroundColor White
Write-Host "  - Role-based access control" -ForegroundColor White
Write-Host "  - Playwright tests" -ForegroundColor White
Write-Host ""

$payload = @{
  event_type = "azure-devops-feature"
  client_payload = @{
    workItemId = $WorkItemId
    title = $FeatureTitle
    description = $FeatureDescription
    type = "Feature"
    state = "In Progress"
  }
} | ConvertTo-Json -Depth 10

$headers = @{
  "Accept" = "application/vnd.github+json"
  "Authorization" = "Bearer $token"
  "X-GitHub-Api-Version" = "2022-11-28"
}

Write-Host "Triggering workflow..." -ForegroundColor Yellow

try {
  Invoke-RestMethod `
    -Uri "https://api.github.com/repos/$Owner/$Repo/dispatches" `
    -Method Post `
    -Headers $headers `
    -Body $payload `
    -ContentType "application/json" `
    -ErrorAction Stop

  Write-Host ""
  Write-Host "✅ SUCCESS! Workflow triggered!" -ForegroundColor Green
  Write-Host ""
  Write-Host "=========================================" -ForegroundColor Cyan
  Write-Host "  Next Steps" -ForegroundColor Cyan
  Write-Host "=========================================" -ForegroundColor Cyan
  Write-Host ""
  Write-Host "1. View workflow run:" -ForegroundColor White
  Write-Host "   https://github.com/$Owner/$Repo/actions" -ForegroundColor Blue
  Write-Host ""
  Write-Host "2. Check created issue:" -ForegroundColor White
  Write-Host "   https://github.com/$Owner/$Repo/issues" -ForegroundColor Blue
  Write-Host ""
  Write-Host "3. Monitor Copilot agent:" -ForegroundColor White
  Write-Host "   https://github.com/$Owner/$Repo/issues (look for copilot-swe-agent assignee)" -ForegroundColor Blue
  Write-Host ""
  Write-Host "4. Review PR when ready:" -ForegroundColor White
  Write-Host "   https://github.com/$Owner/$Repo/pulls" -ForegroundColor Blue
  Write-Host ""
}
catch {
  Write-Host ""
  Write-Host "❌ FAILED to trigger workflow" -ForegroundColor Red
  Write-Host ""
  Write-Host "Error: $($_.Exception.Message)" -ForegroundColor Red
  Write-Host ""
  
  if ($_.Exception.Response.StatusCode -eq 404) {
    Write-Host "Possible causes:" -ForegroundColor Yellow
    Write-Host "  - Repository $Owner/$Repo does not exist" -ForegroundColor White
    Write-Host "  - Token doesn't have access to this repository" -ForegroundColor White
    Write-Host "  - Workflow file .github/workflows/feature-trigger.yml missing" -ForegroundColor White
  }
  elseif ($_.Exception.Response.StatusCode -eq 401) {
    Write-Host "Authentication failed - check your GITHUB_TOKEN" -ForegroundColor Yellow
  }
  elseif ($_.Exception.Response.StatusCode -eq 403) {
    Write-Host "Permission denied - token needs 'repo' and 'workflow' scopes" -ForegroundColor Yellow
  }
  
  exit 1
}
