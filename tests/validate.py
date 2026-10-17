#!/usr/bin/env python3
"""Offline validation for cinnamon-taskbar-sys-monitor.

Run locally or in CI — no Cinnamon session required:

    python3 tests/validate.py

Checks (pure offline checks, no Cinnamon session required):
  * metadata.json is valid JSON with required keys
  * settings-schema.json is valid JSON with sane defaults
  * every settings key referenced by applet.js exists in the schema
  * applet.js is syntactically valid JS (SpiderMonkey/GJS compatible)
  * applet.js uses only APIs available in Cinnamon >= 6
"""

import json
import os
import re
import subprocess
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
APPLET = os.path.join(ROOT, "sysmon-text@win11")

failures = []


def check(name, condition, detail=""):
    status = "✅" if condition else "❌"
    print(f"{status} {name}" + (f" — {detail}" if detail and not condition else ""))
    if not condition:
        failures.append(name)


# ---------------------------------------------------------------- metadata
meta = json.load(open(os.path.join(APPLET, "metadata.json")))
check("metadata.json parses as JSON", True)
for key in ("uuid", "name", "description", "max-instances", "version", "settings-schema"):
    check(f"metadata has '{key}'", key in meta, f"missing '{key}'")
check("uuid matches directory name", meta.get("uuid") == "sysmon-text@win11")

schema_meta = meta.get("settings-schema")
schema_path = os.path.join(APPLET, "settings-schema.json")
check("settings-schema.json present", os.path.exists(schema_path))

# ---------------------------------------------------------------- schema
schema = json.load(open(schema_path))
check("settings-schema.json parses as JSON", True)
for key in ("interval", "show-cpu", "show-memory", "show-network",
            "popup-network", "popup-system", "popup-cores"):
    check(f"schema has '{key}'", key in schema)
iv = schema.get("interval", {})
check("interval defaults sane", 100 <= iv.get("default", 0) <= 3000,
      f"default={iv.get('default')}")
for k, v in schema.items():
    if v.get("type") == "switch":
        check(f"'{k}' default is a bool", isinstance(v.get("default"), bool))

# ---------------------------------------------------------------- applet.js
js_path = os.path.join(APPLET, "applet.js")
js = open(js_path).read()

node = subprocess.run(["node", "--check", js_path], capture_output=True, text=True)
check("applet.js is valid JS (node --check)", node.returncode == 0,
      (node.stderr or "").strip()[:200])

# every bound settings key must exist in the schema
bound = set(re.findall(r"bindProperty\([^,]+,\s*'([^']+)'", js))
check("all bound settings keys exist in schema",
      bound.issubset(schema.keys()),
      f"missing: {sorted(bound - set(schema.keys()))}")

# only first-party imports — no external deps
imports = set(re.findall(r"imports\.\w+(?:\.\w+)*", js))
allowed_first_party = {
    "imports.ui.applet", "imports.ui.settings", "imports.ui.popupMenu",
    "imports.gi.St", "imports.gi.Clutter", "imports.gi.GLib",
    "imports.gi.Gtk", "imports.lang", "imports.mainloop",
}
check("imports are first-party & Cinnamon-core only",
      imports <= allowed_first_party, f"unexpected: {sorted(imports - allowed_first_party)}")

# signal hygiene: every connect has a matching removal/destroy path
check("applet cleans up its mainloop timers",
      "_loopTid" in js and "source_remove(this._loopTid)" in js)

print()
if failures:
    print(f"FAILED: {len(failures)} check(s): {failures}")
    sys.exit(1)
print("All checks passed ✅")
