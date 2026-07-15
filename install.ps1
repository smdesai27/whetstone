<#
  Whetstone skill installer (Windows PowerShell 5+ / PowerShell 7+).

  Installs SKILL.md (plus FORMAT.md, which it references) into your agent's
  skills directory. Defaults to Claude Code
  (%USERPROFILE%\.claude\skills\whetstone\SKILL.md); use -Dir for any other
  agent. Re-running it updates an existing install (the old SKILL.md is backed up).

    Local:   .\install.ps1
    Piped:   irm https://raw.githubusercontent.com/smdesai27/whetstone/main/install.ps1 | iex
    Custom:  .\install.ps1 -Dir "$env:APPDATA\Claude\skills\whetstone"

  Creates the skills directory if missing, backs up any existing SKILL.md, and
  prints next steps. It never touches your whetstone *data* folder — that is
  created later by running /whetstone (Setup mode).
#>
[CmdletBinding()]
param(
  [string]$Dir,
  [switch]$PrintPaths,
  [switch]$Help
)

$ErrorActionPreference = 'Stop'
$RepoRaw = 'https://raw.githubusercontent.com/smdesai27/whetstone/main'
$HubUrl  = 'https://smdesai27.github.io/whetstone/'
$ClaudeDir = if ($env:CLAUDE_CONFIG_DIR) { $env:CLAUDE_CONFIG_DIR } else { Join-Path $env:USERPROFILE '.claude' }

function Show-Usage {
  @"
Whetstone installer

Usage: .\install.ps1 [-Dir DIR] [-PrintPaths] [-Help]

  -Dir DIR        Install into DIR instead of the Claude Code default (created if missing).
  -PrintPaths     Print the SKILL.md path for every known agent and exit.
  -Help           Show this help.

Environment:
  CLAUDE_CONFIG_DIR   Overrides the Claude Code config dir (default: %USERPROFILE%\.claude).
"@ | Write-Output
}

function Show-Paths {
  @"
Where SKILL.md goes, by agent:

  Claude Code      $ClaudeDir\skills\whetstone\SKILL.md   (installed by default)
  Claude Desktop   %APPDATA%\Claude\skills\whetstone\SKILL.md
  Cursor           add it as a project rule: <project>\.cursor\rules\whetstone.md
                   (Cursor has no global skills dir; reference SKILL.md from the rule)
  Codex CLI        %USERPROFILE%\.codex\skills\whetstone\SKILL.md
  Cowork           paste SKILL.md into a Cowork skill/instruction slot in its UI

Any agent that reads a markdown instruction file can run Whetstone — point it at SKILL.md.
Re-run with -Dir to install into any of the paths above.
"@ | Write-Output
}

if ($Help)       { Show-Usage; return }
if ($PrintPaths) { Show-Paths; return }

$TargetDir = if ($Dir) { $Dir } else { Join-Path $ClaudeDir 'skills\whetstone' }

# ---- locate source SKILL.md (local next to script, else download) ----
$Src = $null
if ($PSScriptRoot -and (Test-Path (Join-Path $PSScriptRoot 'SKILL.md'))) {
  $Src = Join-Path $PSScriptRoot 'SKILL.md'
  Write-Output "Using local SKILL.md: $Src"
} else {
  $Src = Join-Path ([System.IO.Path]::GetTempPath()) ("whetstone-skill-" + [guid]::NewGuid().ToString('N') + '.md')
  Write-Output "Downloading SKILL.md from $RepoRaw ..."
  try { [Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12 } catch {}
  Invoke-WebRequest -Uri "$RepoRaw/SKILL.md" -OutFile $Src -UseBasicParsing
  if (-not (Test-Path $Src) -or (Get-Item $Src).Length -eq 0) { throw "download failed or empty" }
}

# ---- install ----
New-Item -ItemType Directory -Force -Path $TargetDir | Out-Null
$Dest = Join-Path $TargetDir 'SKILL.md'

if (Test-Path $Dest) {
  $bak = "$Dest.bak.$(Get-Date -Format yyyyMMddHHmmss)"
  Copy-Item -Path $Dest -Destination $bak -Force
  Copy-Item -Path $Src  -Destination $Dest -Force
  Write-Output "Updated existing skill (backup: $bak)"
} else {
  Copy-Item -Path $Src -Destination $Dest -Force
  Write-Output "Installed skill."
}

# ---- FORMAT.md (the file-format spec SKILL.md references) ----
if ($PSScriptRoot -and (Test-Path (Join-Path $PSScriptRoot 'FORMAT.md'))) {
  Copy-Item -Path (Join-Path $PSScriptRoot 'FORMAT.md') -Destination (Join-Path $TargetDir 'FORMAT.md') -Force
} else {
  try {
    Invoke-WebRequest -Uri "$RepoRaw/FORMAT.md" -OutFile (Join-Path $TargetDir 'FORMAT.md') -UseBasicParsing
  } catch {
    Write-Warning "could not fetch FORMAT.md - the skill still works; re-run later to add it"
  }
}

Write-Output ""
Write-Output "  ->  $Dest"
Write-Output ""
Write-Output "Next steps:"
Write-Output "  1. In your agent, run:  /whetstone"
Write-Output "     First-run setup creates your synced folder (whetstone.json, decks/, profile.md, LOG.md)."
Write-Output "  2. Add a source:        /whetstone <link or file>"
Write-Output "  3. Open the read-only hub and point it at that folder:"
Write-Output "       $HubUrl   (Chrome / Edge / Brave), or open hub/index.html locally."
Write-Output ""
Write-Output "Update later with:  /whetstone update   (or just re-run this installer)"
Write-Output "Installing for a different agent? Run:  .\install.ps1 -PrintPaths"
