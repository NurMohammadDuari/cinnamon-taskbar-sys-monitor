#!/usr/bin/env bash
# cinnamon-sysmon-text installer
# Installs the taskbar CPU/MEM/NET applet into ~/.local/share/cinnamon/applets
set -euo pipefail

APPDIR=$(dirname "$(readlink -f "$0")")
ERR_SRC="$APPDIR/sysmon-text@win11"
DEST="$HOME/.local/share/cinnamon/applets/sysmon-text@win11"

if [[ ! -d "$ERR_SRC" ]]; then
    echo "❌ sysmon-text@win11 folder not found next to install.sh" >&2
    exit 1
fi

echo "==> Installing cinnamon-sysmon-text"
echo "==> [1/3] copying applet files"
mkdir -p "$DEST"

# strip possible CRLF line endings; exec bit not needed
if command -v dos2unix >/dev/null 2>&1; then
    dos2unix -q "$ERR_SRC"/applet.js 2>/dev/null || true
fi
cp -f "$ERR_SRC"/applet.js "$ERR_SRC"/metadata.json "$ERR_SRC"/settings-schema.json "$DEST"/

echo "==> [2/3] files installed to: $DEST"

# Reload Cinnamon so the applet registers (non-fatal if headless)
echo "==> [3/3] reloading Cinnamon shell (panel flash is normal)"
if [[ -n "${DISPLAY:-}" ]] && pgrep -x cinnamon >/dev/null 2>&1; then
    nohup cinnamon --replace >/dev/null 2>&1 &
    sleep 3
fi

echo ""
echo "✅ Done! Now:"
echo "   1. Right-click the panel → Applets"
echo "   2. Add 'SysMon Text' and drag it wherever you like"
echo "   3. Hover or click it for the netspeed-style popup"
