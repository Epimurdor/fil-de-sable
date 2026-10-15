<#
.SYNOPSIS
  Reproduit en local la version active sur Wasmer pour lire les vraies erreurs.

.DESCRIPTION
  `wasmer app logs` ne montre pas les erreurs d'exécution de Next.js. Ce script récupère le
  package actif (wasmer app get -> source sha256), le lance avec `wasmer run` (même runtime
  Edge.js que la production), branché sur la base de production, sonde quelques pages et
  affiche les erreurs écrites sur stderr. Le mot de passe de la base n'est jamais affiché.

.EXAMPLE
  .\debug.ps1
  .\debug.ps1 -Paths '/', '/boutique/perle-d-ecume' -Wait 90
  .\debug.ps1 -NoDatabase      # sans connexion à la base de production
#>
param(
  [string[]]$Paths = @('/connexion', '/', '/boutique'),
  [int]$Port = 4070,
  [int]$Wait = 75,
  [switch]$NoDatabase
)
$ErrorActionPreference = 'Continue'
$project = (Resolve-Path (Join-Path $PSScriptRoot '..\..\..\..')).Path
$wasmer = @("$env:USERPROFILE\.wasmer\bin\wasmer.exe", (Get-Command wasmer -ErrorAction SilentlyContinue).Source) | Where-Object { $_ -and (Test-Path $_) } | Select-Object -First 1
if (-not $wasmer) { Write-Host "CLI wasmer introuvable." -ForegroundColor Red; exit 1 }

$appYaml = Get-Content (Join-Path $project 'app.yaml') -Raw
$app = "$([regex]::Match($appYaml, '(?m)^owner:\s*(\S+)').Groups[1].Value)/$([regex]::Match($appYaml, '(?m)^name:\s*(\S+)').Groups[1].Value)"

$yaml = (& $wasmer app get $app 2>&1 | ForEach-Object { "$_" }) -join "`n"
$hash = [regex]::Match($yaml, 'source: (sha256:[0-9a-f]+)').Groups[1].Value
if (-not $hash) { Write-Host "Package actif introuvable pour $app." -ForegroundColor Red; exit 1 }
$version = [regex]::Match($yaml, '(?m)^\s+version: (v\d+)').Groups[1].Value
Write-Host "App $app, version active $version, package $hash"

$envVars = @($appYaml -split "`n" | Where-Object { $_ -match '^\s{2}([A-Z_]+):\s*(.+)$' } | ForEach-Object { "$($Matches[1])=$($Matches[2].Trim().Trim('"'))" })
$envVars += "PORT=$Port", "NODE_ENV=production"
if (-not $NoDatabase) {
  $db = @(((& $wasmer app database list $app --with-password -f json) -join "`n") | ConvertFrom-Json)[0]
  if ($db) { $envVars += "DB_HOST=$($db.host)", "DB_PORT=$($db.port)", "DB_NAME=$($db.name)", "DB_USERNAME=$($db.username)", "DB_PASSWORD=$($db.password)" }
}

$log = Join-Path $env:TEMP "wasmer-debug-$Port.log"
$runArgs = @('run', $hash, '--net') + ($envVars | ForEach-Object { '--env', $_ })
$p = Start-Process $wasmer -ArgumentList $runArgs -PassThru -NoNewWindow -RedirectStandardOutput $log -RedirectStandardError "$log.err"
Write-Host "Démarrage local (premier lancement : téléchargement du package), attente $Wait s..."
Start-Sleep $Wait

foreach ($u in $Paths) {
  $code = try { (Invoke-WebRequest "http://localhost:$Port$u" -UseBasicParsing -TimeoutSec 90).StatusCode } catch { [int]$_.Exception.Response.StatusCode }
  "{0,-26} {1}" -f $u, $code
}
Start-Sleep 2
Stop-Process -Id $p.Id -Force -ErrorAction SilentlyContinue

Write-Host "`n--- stdout ---"; Get-Content $log -Tail 5
Write-Host "--- erreurs (stderr) ---"
Get-Content "$log.err" | Where-Object { $_ -notmatch 'DB_PASSWORD' } |
  Select-String -Pattern 'Error|Cannot find|ENOENT|TypeError|ReferenceError|not supported|at ' | Select-Object -First 30 | ForEach-Object { $_.Line }
Write-Host "`nLog complet : $log.err"
