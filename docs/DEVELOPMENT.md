# 💻 Development guide

How to hack on **cinnamon-taskbar-sys-monitor** with a fast edit-reload loop, and how
the offline tests back you up.

## Repo map (what touches what)

```
sysmon-text@win11/
├── applet.js              ← the whole logic (engine + popup + settings)
├── metadata.json          ← uuid/name/version/settings-schema pointer
└── settings-schema.json   ← right-click "Configure…" dialog definition
tests/validate.py          ← offline guardrails (JSON ↔ JS → bindings)
install.sh/uninstall.sh    ← copy in/out of ~/.local/share/cinnamon/applets
```

## Hot-reload loop

There's no JSD rebuild — Cinnamon loads `applet.js` at shell startup. Two ways:

```bash
# fast for JS-only tweaks: point your editor at the INSTALLED copy
$EDITOR ~/.local/share/cinnamon/applets/sysmon-text@win11/applet.js
cinnamon --replace &   # reloads the shell; keeps windows open

# or edit the repo copy and push it in
bash install.sh && cinnamon --replace
```

Typical cycle ≈ 15 s (13 s shell rebuild + 2 s check). Keep a terminal with
`tail -f ~/.xsession-errors` open for live errors.

## Things that will bite you (learned the hard way)

1. **`Applet.AppletPopupMenu`** — plain `PopupMenu.PopupMenu` never gets added
   to the stage in Cinnamon 6.x → invisible popup.
2. **`PopupBaseMenuItem.addActor()`** — the item actor is a `GenericContainer`
   that only measures children registered via `addActor()`; `add_child()` yields
   size 0 → invisible card.
3. **Schema file name** must be literally `settings-schema.json`; the
   `metadata.json` key `settings-schema` points at it.
4. **Old instance can survive inplace reloads** — after certain property edits,
   the panel toggles "successfully" but the running applet keeps the old code.
   Trust `cinnamon --replace` over gsettings toggles whenlever JS changed.
5. **`Main`loop timers** must be tracked (`this._loopTid`) and cleaned up in
   `on_applet_removed_from_panel()` — otherwise flakes after applet surgery.
6. **Don't `set_applet_label` while the popup is open** — panel relayout closes
   the menu mid-hover; label update is skipped until close instead.

## Offline validation suite

```bash
python3 tests/validate.py
```

Guards: JSON parse of metadata + settings schema · required metadata keys ·
schema defaults sane · every `bindProperty()` key exists in the schema ·
`node --check` JS (SpiderMonkey-compatible) · first-party imports only ·
timer cleanup present. CI runs this on every push (`.github/workflows/lint.yml`).

Add checks as you add features — they're cheap.

## Testing the popup & settings without touching the mouse

Cinnamon can be driven over D-Bus while the shell is rotated (careful: this
controls your live desktop):

```bash
# open the popup programmatically
dbus-send --session --print-reply --dest=org.Cinnamon /org/Cinnamon \
  org.Cinnamon.Eval string:"(function(){ \
    let d=AppletManager.getDefinitions().filter(x=>x.uuid==='sysmon-text@win11')[0]; \
    AppletManager.get_object_for_instance(d.applet_id).menu.open(); \
    return 'open';})()"
```

Then screenshot: `import -window root -crop WxH+X+Y out.png` (ImageMagick).
Settings values live in
`~/.config/cinnamon/spices/sysmon-text@win11/sysmon-text@win11.json` (and are
editable — edit → `cinnamon --replace`).

## Releasing a version

1. Bump `version` in `sysmon-text@win11/metadata.json`
2. Add a `CHANGELOG.md` section
3. `python3 tests/validate.py` → green
4. Zip the applet folder + install scripts
5. Tag & publish a GitHub release with the zip asset
6. `bash install.sh` on a real machine and hover around briefly (popup, settings
   dialog, all toggles) before announcing

## Style used in this codebase

- Two-space indent, single-quoted strings, `Lang.bind` for callbacks
- All the file I/O goes through `_read(path)` (fails soft returning `''`)
- Try/catch around every external-subsystem boundary with silent failure +
  graceful `—` row values rather than crashes
