<#
.SYNOPSIS
  Met en ligne le dernier commit (HEAD) sur Wasmer Edge.

.DESCRIPTION
  1. Vérifie les outils (wasmer, git, npm) et la connexion Wasmer.
  2. Exporte une copie propre de HEAD (git archive) : jamais .env, node_modules ni modifications non commitées.
  3. Dans cette copie : npm ci, typecheck, lint, build (sauf -SkipChecks).
  4. Contrôle les migrations Prisma en attente sur la base de production ; les applique avec -Migrate.
  5. wasmer deploy --build-remote (build Linux chez Wasmer), puis sonde les pages en ligne.
  Code de sortie : 0 si tout répond sans erreur 5xx, 1 sinon.

.EXAMPLE
  .\deploy.ps1                 # contrôles + déploiement + sondes
  .\deploy.ps1 -Migrate        # applique aussi les migrations en attente sur la base de prod
  .\deploy.ps1 -SkipChecks     # déploiement direct (déconseillé)
#>
param(
  [switch]$SkipChecks,
  [switch]$Migrate,
  [switch]$AllowDirty,
  [string[]]$Paths = @('/', '/boutique', '/connexion', '/panier', '/compte', '/admin', '/boutique/n-existe-pas')
)

# 'Continue' : npm et wasmer écrivent sur stderr sans échouer ; on juge sur $LASTEXITCODE.
$ErrorActionPreference = 'Continue'
function Step($m) { Write-Host "`n==> $m" -ForegroundColor Cyan }
function Fail($m) { Write-Host "ECHEC : $m" -ForegroundColor Red; exit 1 }

# --- Outils ---------------------------------------------------------------
$project = (Resolve-Path (Join-Path $PSScriptRoot '..\..\..\..')).Path
Set-Location $project

$wasmer = @("$env:USERPROFILE\.wasmer\bin\wasmer.exe", (Get-Command wasmer -ErrorAction SilentlyContinue).Source) | Where-Object { $_ -and (Test-Path $_) } | Select-Object -First 1
$git = @((Get-Command git -ErrorAction SilentlyContinue).Source, "$env:LOCALAPPDATA\Programs\MinGit\cmd\git.exe", 'C:\Program Files\Git\cmd\git.exe') | Where-Object { $_ -and (Test-Path $_) } | Select-Object -First 1
if (-not $wasmer) { Fail "CLI wasmer introuvable. Installe-la : Set-ExecutionPolicy Bypass -Scope Process -Force; iwr https://win.wasmer.io -useb | iex" }
if (-not $git) { Fail "git introuvable." }
if (-not (Get-Command npm -ErrorAction SilentlyContinue)) { Fail "npm introuvable (Node 24 requis)." }

# --- app.yaml : propriétaire et nom de l'app ------------------------------
$appYaml = Get-Content (Join-Path $project 'app.yaml') -Raw
$owner = [regex]::Match($appYaml, '(?m)^owner:\s*(\S+)').Groups[1].Value
$name = [regex]::Match($appYaml, '(?m)^name:\s*(\S+)').Groups[1].Value
if (-not $owner -or -not $name) { Fail "owner et name doivent être définis dans app.yaml." }
$app = "$owner/$name"

Step "Connexion Wasmer"
$who = (& $wasmer whoami 2>&1 | Out-String).Trim()
if ($who -notmatch 'Logged into') { Fail "Pas connecté à Wasmer. Lance : wasmer login" }
Write-Host $who

# --- Git : on déploie HEAD, rien d'autre ----------------------------------
Step "Version à déployer"
$dirty = & $git status --porcelain
if ($dirty -and -not $AllowDirty) {
  Write-Host ($dirty -join "`n")
  Fail "Des modifications ne sont pas commitées. Seul HEAD est déployé : commite-les, ou relance avec -AllowDirty pour déployer HEAD sans elles."
}
$sha = (& $git rev-parse --short HEAD).Trim()
Write-Host "HEAD = $sha  $((& $git log -1 --format=%s).Trim())"
if ($dirty) { Write-Host "(modifications non commitées ignorées)" -ForegroundColor Yellow }

$stamp = Get-Date -Format 'yyyyMMdd-HHmmss'
$out = Join-Path $env:TEMP "wasmer-deploy-$name-$sha-$stamp"
New-Item -ItemType Directory -Force $out | Out-Null
& $git archive --format=zip -o "$out.zip" HEAD
Expand-Archive "$out.zip" -DestinationPath $out -Force
[IO.File]::Delete("$out.zip")
if (Get-ChildItem $out -Force -Filter '.env*' | Where-Object { $_.Name -ne '.env.example' }) { Fail "Un fichier .env est suivi par git : retire-le avant de déployer." }
Write-Host "Copie propre : $out"

# --- Contrôles dans la copie propre ---------------------------------------
Push-Location $out
try {
  Step "npm ci (copie propre)"
  npm ci --no-audit --no-fund 2>&1 | Select-Object -Last 2 | ForEach-Object { "$_" }
  if ($LASTEXITCODE -ne 0) { Fail "npm ci a échoué." }

  if (-not $SkipChecks) {
    Step "Typecheck"
    npx prisma generate 2>&1 | Out-Null
    npx tsc --noEmit
    if ($LASTEXITCODE -ne 0) { Fail "Erreurs TypeScript." }
    Step "Lint"
    npx eslint .
    if ($LASTEXITCODE -ne 0) { Fail "Erreurs ESLint." }
    Step "Build (webpack, comme chez Wasmer)"
    npm run build 2>&1 | Select-String -Pattern 'Compiled|rror' | ForEach-Object { $_.Line }
    if ($LASTEXITCODE -ne 0) { Fail "Le build a échoué." }
  }

  # --- Migrations sur la base de production -------------------------------
  Step "Migrations Prisma (base de production)"
  $dbList = (& $wasmer app database list $app --with-password -f json 2>$null) -join "`n"
  $db = if ($dbList.Trim().StartsWith('[')) { @($dbList | ConvertFrom-Json)[0] } else { $null }
  if (-not $db) {
    Write-Host "Aucune base trouvée (premier déploiement ?) : contrôle ignoré." -ForegroundColor Yellow
  } else {
    $env:DATABASE_URL = "postgresql://$([uri]::EscapeDataString($db.username)):$([uri]::EscapeDataString($db.password))@$($db.host):$($db.port)/$($db.name)?sslmode=require"
    try {
      $status = (npx prisma migrate status 2>&1 | Out-String)
      $pending = $LASTEXITCODE -ne 0 -and $status -match 'not yet been applied|following migration'
      if ($pending -and $Migrate) {
        npx prisma migrate deploy 2>&1 | Select-String -Pattern 'Applying|applied|rror' | ForEach-Object { $_.Line }
        if ($LASTEXITCODE -ne 0) { Fail "prisma migrate deploy a échoué." }
      } elseif ($pending) {
        $status -split "`n" | Where-Object { $_ -match 'migration|^\s*\d{14}_' } | ForEach-Object { Write-Host $_ }
        Fail "Des migrations sont en attente sur la base de production. Relance avec -Migrate pour les appliquer avant le déploiement."
      } elseif ($LASTEXITCODE -ne 0) {
        Write-Host "prisma migrate status a échoué (base injoignable ?) : déploiement poursuivi sans contrôle." -ForegroundColor Yellow
      } else {
        Write-Host "Base à jour."
      }
    } finally {
      $env:DATABASE_URL = $null
    }
  }
} finally {
  Pop-Location
}

# --- Déploiement -------------------------------------------------------------
# On renvoie une copie sans node_modules ni .next : le build distant repart des sources.
$upload = "$out-upload"
New-Item -ItemType Directory -Force $upload | Out-Null
& $git archive --format=zip -o "$upload.zip" HEAD
Expand-Archive "$upload.zip" -DestinationPath $upload -Force
[IO.File]::Delete("$upload.zip")

Step "wasmer deploy (build distant, 1 à 3 min)"
$deployLog = "$out-deploy.log"
& $wasmer deploy --dir $upload --build-remote --non-interactive --owner $owner --app-name $name 2>&1 |
  ForEach-Object { "$_" } | Tee-Object -FilePath $deployLog |
  Select-String -Pattern 'Build complete|deployed successfully|Live:|fails with|rror' | ForEach-Object { $_.Line }
$deployOk = (Get-Content $deployLog -Raw) -match 'deployed successfully'
if (-not $deployOk) { Fail "Le déploiement a échoué. Log complet : $deployLog" }

# --- Sondes ------------------------------------------------------------------
$url = [regex]::Match((Get-Content $deployLog -Raw), 'Live:\s+(\S+)').Groups[1].Value
if (-not $url) { $url = "https://$name.wasmer.app" }
Step "Sondes sur $url"
$errors = 0
foreach ($p in $Paths) {
  $sw = [Diagnostics.Stopwatch]::StartNew()
  $req = [Net.HttpWebRequest]::Create("$url$p"); $req.AllowAutoRedirect = $false; $req.Timeout = 90000
  try { $resp = $req.GetResponse() } catch [Net.WebException] { $resp = $_.Exception.Response }
  if ($resp) {
    $code = [int]$resp.StatusCode; $resp.Close()
    if ($code -ge 500) { $errors++ }
    "{0,-26} {1}  {2,6} ms" -f $p, $code, $sw.ElapsedMilliseconds
  } else { $errors++; "{0,-26} PAS DE REPONSE" -f $p }
}

# Fichiers JS/CSS de la page d'accueil : un seul en erreur casse la navigation côté navigateur
# (ex. chunk "500-<hash>.js" servi en 500 par next-bundle), même si toutes les pages répondent 200.
Step "Fichiers statiques (_next/static) de l'accueil"
try {
  $homeHtml = (Invoke-WebRequest "$url/" -UseBasicParsing -TimeoutSec 90).Content
  $assets = [regex]::Matches($homeHtml, '/_next/static/[^"''\s<>]+\.(?:js|css)') | ForEach-Object { $_.Value } | Select-Object -Unique
  $badAssets = 0
  foreach ($a in $assets) {
    $code = try { (Invoke-WebRequest "$url$a" -UseBasicParsing -Method Head -TimeoutSec 60).StatusCode } catch { [int]$_.Exception.Response.StatusCode }
    if ($code -ne 200) { $badAssets++; $errors++; "{0}  {1}" -f $code, $a }
  }
  "{0} fichier(s) vérifié(s), {1} en erreur" -f @($assets).Count, $badAssets
} catch {
  $errors++; "Impossible de lire la page d'accueil : $($_.Exception.Message)"
}

if ($errors -gt 0) {
  Write-Host "`n$errors page(s) en erreur. Diagnostic : .\.claude\skills\deploy-wasmer\scripts\debug.ps1" -ForegroundColor Red
  exit 1
}
Write-Host "`nEn ligne : $url  (commit $sha)" -ForegroundColor Green
Write-Host "Copies de travail à supprimer si besoin : $out, $upload"
exit 0
