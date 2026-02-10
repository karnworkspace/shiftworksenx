param(
  [string]$Root
)

$ErrorActionPreference = 'Stop'

$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
if (-not $Root) {
  $Root = (Resolve-Path (Join-Path $scriptDir '..')).Path
}

$deploy = Join-Path $Root 'deploy'
$backendSrc = Join-Path $Root 'backend'
$frontendDist = Join-Path $Root 'frontend\dist'

if (-not (Test-Path $deploy)) {
  New-Item -ItemType Directory -Path $deploy | Out-Null
}

# Clean old outputs
Remove-Item -Force -Recurse (Join-Path $deploy 'backend-deploy') -ErrorAction SilentlyContinue
Remove-Item -Force (Join-Path $deploy 'backend-deploy.zip') -ErrorAction SilentlyContinue
Remove-Item -Force (Join-Path $deploy 'frontend-dist.zip') -ErrorAction SilentlyContinue

# Stage backend deploy folder
New-Item -ItemType Directory -Path (Join-Path $deploy 'backend-deploy') | Out-Null
Copy-Item -Recurse -Force (Join-Path $backendSrc 'dist') (Join-Path $deploy 'backend-deploy\dist')
Copy-Item -Recurse -Force (Join-Path $backendSrc 'prisma') (Join-Path $deploy 'backend-deploy\prisma')
Copy-Item -Force (Join-Path $backendSrc 'package.json') (Join-Path $deploy 'backend-deploy\package.json')
Copy-Item -Force (Join-Path $backendSrc 'package-lock.json') (Join-Path $deploy 'backend-deploy\package-lock.json')
Copy-Item -Force (Join-Path $backendSrc '.env.example') (Join-Path $deploy 'backend-deploy\.env.example')

$supabaseEnvExample = Join-Path $backendSrc '.env.supabase.example'
if (Test-Path $supabaseEnvExample) {
  Copy-Item -Force $supabaseEnvExample (Join-Path $deploy 'backend-deploy\.env.supabase.example')
}

# Zip backend (contents of backend-deploy at zip root)
Compress-Archive -Path (Join-Path $deploy 'backend-deploy\*') -DestinationPath (Join-Path $deploy 'backend-deploy.zip') -Force

# Zip frontend dist (contents of dist at zip root)
if (-not (Test-Path $frontendDist)) {
  throw "frontend/dist not found. Run: cd frontend; npm run build"
}
Compress-Archive -Path (Join-Path $frontendDist '*') -DestinationPath (Join-Path $deploy 'frontend-dist.zip') -Force

Write-Host "Created:" -ForegroundColor Green
Get-ChildItem $deploy | Where-Object { $_.Name -match '\.zip$' } | Select-Object Name, Length | Format-Table -AutoSize
