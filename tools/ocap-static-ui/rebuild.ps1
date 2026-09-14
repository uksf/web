param(
  [Parameter(Mandatory = $true)][string]$Tag
)
$ErrorActionPreference = 'Stop'
$Root = $PSScriptRoot
$Work = Join-Path $env:TEMP ("ocap-ui-" + [guid]::NewGuid().ToString('n'))
New-Item -ItemType Directory -Path $Work | Out-Null
try {
  $tar = Join-Path $Work 'web.tgz'
  Write-Host "Fetching OCAP2/web@$Tag ..."
  Invoke-WebRequest -Uri "https://github.com/OCAP2/web/archive/refs/tags/$Tag.tar.gz" -OutFile $tar -UseBasicParsing
  tar -xzf $tar -C $Work
  $Src = Get-ChildItem $Work -Directory | Where-Object { $_.Name -like 'web-*' } | Select-Object -First 1
  if (-not $Src) { throw 'upstream extract missing' }

  Write-Host 'Applying UKSF patches ...'
  Copy-Item (Join-Path $Root 'patches/ui/src/hooks/useAuth.tsx') (Join-Path $Src.FullName 'ui/src/hooks/useAuth.tsx') -Force
  Copy-Item (Join-Path $Root 'patches/ui/src/components/AuthBadge.tsx') (Join-Path $Src.FullName 'ui/src/components/AuthBadge.tsx') -Force

  Write-Host 'Building ...'
  Push-Location (Join-Path $Src.FullName 'ui')
  npm ci
  npm run build
  Pop-Location

  $Out = Join-Path $Root 'dist'
  if (Test-Path $Out) { Remove-Item $Out -Recurse -Force }
  New-Item -ItemType Directory -Path $Out | Out-Null
  Copy-Item (Join-Path $Src.FullName 'internal/frontend/dist/*') $Out -Recurse -Force
  Write-Host "Built $Out — copy to C:/Server/OCAP/static-ui/ on uksf-server and Restart-Service OCAP"
}
finally {
  Remove-Item $Work -Recurse -Force -ErrorAction SilentlyContinue
}
