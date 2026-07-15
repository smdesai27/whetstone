#!/bin/sh
# Whetstone skill installer (POSIX sh; macOS / Linux / WSL / Git-Bash).
#
# Installs SKILL.md (plus FORMAT.md, which it references) into your agent's
# skills directory. Defaults to Claude Code
# (~/.claude/skills/whetstone/SKILL.md); use --dir to target any other agent.
# Re-running it updates an existing install (the old SKILL.md is backed up).
#
#   Local:   ./install.sh
#   Piped:   curl -fsSL https://raw.githubusercontent.com/smdesai27/whetstone/main/install.sh | sh
#   Custom:  ./install.sh --dir "$HOME/.config/some-agent/skills/whetstone"
#
# It creates the skills directory if missing, backs up any existing SKILL.md,
# and prints the next steps. It never touches your whetstone *data* folder —
# that is created later, by running /whetstone (Setup mode).

set -eu

REPO_RAW="https://raw.githubusercontent.com/smdesai27/whetstone/main"
HUB_URL="https://smdesai27.github.io/whetstone/"

# ---- tiny helpers -----------------------------------------------------------
say()  { printf '%s\n' "$*"; }
warn() { printf '%s\n' "$*" >&2; }
die()  { printf 'error: %s\n' "$*" >&2; exit 1; }

usage() {
  cat <<EOF
Whetstone installer

Usage: install.sh [--dir DIR] [--print-paths] [-h|--help]

  --dir DIR       Install into DIR instead of the Claude Code default.
                  (DIR is created if it does not exist.)
  --print-paths   Print the SKILL.md path for every known agent and exit.
  -h, --help      Show this help.

Environment:
  CLAUDE_CONFIG_DIR   Overrides the Claude Code config dir (default: ~/.claude).
EOF
}

# ---- documented skill paths per agent --------------------------------------
CLAUDE_DIR="${CLAUDE_CONFIG_DIR:-$HOME/.claude}"
print_paths() {
  cat <<EOF
Where SKILL.md goes, by agent:

  Claude Code      $CLAUDE_DIR/skills/whetstone/SKILL.md   (installed by default)
  Claude Desktop   ~/Library/Application Support/Claude/skills/whetstone/SKILL.md   (macOS)
                   %APPDATA%\\Claude\\skills\\whetstone\\SKILL.md                    (Windows)
  Cursor           add it as a project rule: <project>/.cursor/rules/whetstone.md
                   (Cursor has no global skills dir; reference SKILL.md from the rule)
  Codex CLI        ~/.codex/skills/whetstone/SKILL.md   (or your AGENTS.md's skills path)
  Cowork           paste SKILL.md into a Cowork skill/instruction slot in its UI

Any agent that reads a markdown instruction file can run Whetstone — point it at SKILL.md.
Re-run with --dir to install into any of the paths above.
EOF
}

# ---- arg parsing ------------------------------------------------------------
TARGET_DIR="$CLAUDE_DIR/skills/whetstone"
while [ $# -gt 0 ]; do
  case "$1" in
    --dir) [ $# -ge 2 ] || die "--dir needs a path"; TARGET_DIR="$2"; shift 2 ;;
    --dir=*) TARGET_DIR="${1#--dir=}"; shift ;;
    --print-paths) print_paths; exit 0 ;;
    -h|--help) usage; exit 0 ;;
    *) die "unknown option: $1 (try --help)" ;;
  esac
done

# ---- locate the source SKILL.md (local next to script, else download) -------
resolve_local() {
  # $0 may be "sh" or "-" when piped; guard for that.
  case "${0:-}" in
    ''|sh|-sh|-|dash|bash) return 1 ;;
  esac
  _d=$(CDPATH= cd -- "$(dirname -- "$0")" 2>/dev/null && pwd) || return 1
  [ -f "$_d/SKILL.md" ] || return 1
  printf '%s\n' "$_d/SKILL.md"
}

fetch() { # url out
  if command -v curl >/dev/null 2>&1; then curl -fsSL "$1" -o "$2"
  elif command -v wget >/dev/null 2>&1; then wget -qO "$2" "$1"
  else die "need curl or wget to download SKILL.md"; fi
}

TMP=""
FMT_TMP=""
cleanup() { rm -f ${TMP:+"$TMP"} ${FMT_TMP:+"$FMT_TMP"} || true; }
trap cleanup EXIT

if SRC=$(resolve_local); then
  say "Using local SKILL.md: $SRC"
else
  TMP="$(mktemp "${TMPDIR:-/tmp}/whetstone-skill.XXXXXX")"
  say "Downloading SKILL.md from $REPO_RAW ..."
  fetch "$REPO_RAW/SKILL.md" "$TMP" || die "download failed"
  [ -s "$TMP" ] || die "downloaded SKILL.md is empty"
  SRC="$TMP"
fi

# ---- install ----------------------------------------------------------------
mkdir -p "$TARGET_DIR" || die "could not create $TARGET_DIR"
DEST="$TARGET_DIR/SKILL.md"

if [ -f "$DEST" ]; then
  BAK="$DEST.bak.$(date +%Y%m%d%H%M%S)"
  cp -- "$DEST" "$BAK"
  cp -- "$SRC" "$DEST"
  say "Updated existing skill (backup: $BAK)"
else
  cp -- "$SRC" "$DEST"
  say "Installed skill."
fi

# ---- FORMAT.md (the file-format spec SKILL.md references) --------------------
if [ -z "$TMP" ] && [ -f "$(dirname -- "$SRC")/FORMAT.md" ]; then
  cp -- "$(dirname -- "$SRC")/FORMAT.md" "$TARGET_DIR/FORMAT.md"
else
  FMT_TMP="$(mktemp "${TMPDIR:-/tmp}/whetstone-format.XXXXXX")"
  if fetch "$REPO_RAW/FORMAT.md" "$FMT_TMP" && [ -s "$FMT_TMP" ]; then
    cp -- "$FMT_TMP" "$TARGET_DIR/FORMAT.md"
  else
    warn "note: could not fetch FORMAT.md — the skill still works; re-run later to add it"
  fi
fi

say ""
say "  ->  $DEST"
say ""
say "Next steps:"
say "  1. In your agent, run:  /whetstone"
say "     First-run setup creates your synced folder (whetstone.json, decks/, profile.md, LOG.md)."
say "  2. Add a source:        /whetstone <link or file>"
say "  3. Open the read-only hub and point it at that folder:"
say "       $HUB_URL   (Chrome / Edge / Brave), or open hub/index.html locally."
say ""
say "Update later with:  /whetstone update   (or just re-run this installer)"
say "Installing for a different agent? Run:  install.sh --print-paths"
