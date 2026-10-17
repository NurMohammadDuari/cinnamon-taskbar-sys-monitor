#!/usr/bin/env bash
# cinnamon-sysmon-text uninstaller
set -euo pipefail

DEST="$HOME/.local/share/cinnamon/applets/sysmon-text@win11"
CONF="$HOME/.config/cinnamon/spices/sysmon-text@win11"

echo "==> Removing cinnamon-sysmon-text"

# drop it from the panel config
CURRENT=$(gsettings get org.cinnamon enabled-applets 2>/dev/null || echo "[]")
if [[ "$CURRENT" != "[]" ]]; then
    python3 - "$CURRENT" <<'PYEOF'
import ast, subprocess, sys, pprint
cur = ast.literal_eval(sys.argv[1])
kept = [item for item in cur if 'sysmon-text@win11' not in item]
subprocess.run(["gsettings", "set", "org.cinnamon", "enabled-applets",
                pprint.pformat(kept)], check=True)
PYEOF
fi

rm -rf "$DEST" "$CONF"
echo "==> Removed applet files and saved settings"

if [[ -n "${DISPLAY:-}" ]] && pgrep -x cinnamon >/dev/null 2>&1; then
    nohup cinnamon --replace >/dev/null 2>&1 &
    sleep 2
fi
echo "✅ cinnamon-sysmon-text removed"
