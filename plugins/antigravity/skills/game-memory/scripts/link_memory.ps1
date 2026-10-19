param(
  [Parameter(Mandatory = $true)][string]$Project,
  [switch]$DryRun
)
$ErrorActionPreference = 'Stop'
$root = (Resolve-Path $Project).Path.TrimEnd('\')
$slug = [regex]::Replace($root, '[^A-Za-z0-9]', '-')
$configDir = if ($env:CLAUDE_CONFIG_DIR) { $env:CLAUDE_CONFIG_DIR } else { Join-Path $env:USERPROFILE '.claude' }
$repoMem = Join-Path $root '.claude\memory'
$link = Join-Path $configDir "projects\$slug\memory"
"project: $root"
"repo memory: $repoMem"
"agent memory: $link"
if ($DryRun) { return }

New-Item -ItemType Directory -Force $repoMem | Out-Null
New-Item -ItemType Directory -Force (Split-Path $link) | Out-Null

if (Test-Path $link) {
  $item = Get-Item $link -Force
  if ($item.LinkType) {
    $targets = @($item.Target | ForEach-Object { $_.TrimEnd('\') })
    if ($targets -contains $repoMem) { 'already linked'; return }
    throw "agent memory is a $($item.LinkType) to $($targets -join ', '), not to $repoMem; fix it by hand"
  }
  $conflicts = @()
  foreach ($file in Get-ChildItem $link -File) {
    $dest = Join-Path $repoMem $file.Name
    if ((Test-Path $dest) -and ((Get-FileHash $dest).Hash -ne (Get-FileHash $file.FullName).Hash)) { $conflicts += $file.Name }
  }
  if ($conflicts.Count -gt 0) { throw "both places have different versions of: $($conflicts -join ', '); merge them into $repoMem first" }
  foreach ($file in Get-ChildItem $link -File) {
    $dest = Join-Path $repoMem $file.Name
    if (-not (Test-Path $dest)) { Copy-Item $file.FullName $dest; "moved $($file.Name)" }
  }
  Remove-Item $link -Recurse -Force
}

New-Item -ItemType Junction -Path $link -Target $repoMem | Out-Null
"linked $link -> $repoMem"
