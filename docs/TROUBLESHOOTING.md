# 🔧 Troubleshooting

From real-world use of the taskbar readout. Find the symptom → the fix.

## The applet is missing entirely

```bash
# 1 — is it registered?
gsettings get org.cinnamon enabled-applets | grep -o "sysmon-text[^']*"
```

- **nothing printed** → re-add it:
  ```bash
  cinnamon --replace &
  ```
  then right-click panel → Applets → add *SysMon Text* (or rerun `install.sh`).
- **printed** → check for a load error (next section).

## "Problems during Cinnamon startup" banner

Cinnamon unloaded the applet after a JS error. The log is at `~/.xsession-errors`
and in **Looking Glass** (`cinnamon --replace` window / `Melange`).

Common triggers and fixes:

| Error in the log | Cause | Fix |
|---|---|---|
| `Unrecognized parameter "can_focus"` | settings schema built for a newer Cinnamon | use a matching release tag for your Cinnamon version |
| `Unable to load template file … settings-schema.json could not be found` | schema file renamed/missing | re-run `install.sh` |
| `Could not set up binding` | schema & applet.js out of sync | reinstall applet folder from same release |

After fixing, reload: `cinnamon --replace`.

## The applet vanished "a minute ago"

Cinnamon wrote it out of `enabled-applets` (e.g. a stray right-click → *Remove
from panel*, or a crash loop). Re-add from *Applets* or:

```bash
CURRENT=$(gsettings get org.cinnamon enabled-applets)
gsettings set org.cinnamon enabled-applets \
  "$CURRENT"   # no-op; edit by hand to insert: 'panel1:right:N:sysmon-text@win11:100'
```

If the entry exists but won't spawn, it's a load error — see above — or a
half-broken toggle: does two-step unload/reload by removing and re-adding the
entry a few seconds apart; if that doesn't stick, `cinnamon --replace`.

## The readout shows but is frozen

- `MEM` frozen forever, no net arrows → the `timeout_add` loop died after an
  exception reported in the log — reload the shell.
- Everything frozen exactly when hovering → `set_applet_label` suspension is
  intentional (panel relayout closes popups); text resumes on mouse-leave.

## CPU says 90–100% constantly

Believe it — verify:

```bash
top -bn2 | grep -A8 load      # or htop
```

On small 4-core CPUs, two or three busy processes (browser, updater, ripper,
cracker…) saturate it. If legit load bothers you visually, the number is
working as designed. 😅

## Wrong interface / IP / gateway shown

Auto-detect takes the first **default route** in `/proc/net/route` — so:

- **VPN active** → the card reports the VPN iface and its IP (that's your real
  traffic path). Without the VPN you'd get the ethernet/wifi values.
- **NIC renaming** → if `enp2s0` failed to detect at all, the applet assumes
  the default `enp2s0`; edit `_defaultIface()` in `applet.js` if the default is
  wrong on your box (works for `eth0`, `wlan0`, `wlp3s0`…).

To see what it *should* detect:

```bash
ip -4 route show default
```

## Speeds are always `0B`

- iface guess wrong (shows `lo`) → see above.
- Counters stuck → test directly:
  ```bash
  cat /proc/net/dev
  ```
  and check the byte columns move while downloading something.

## Popup doesn't appear on hover

1. Another applet toggling? Check the log for JS errors mentioning
   `sysmon-text`.
2. Panel in edit mode (`panel-edit-mode=true`) blocks interactions — exit edit.
3. If it stopped after an applet-code edit you made: fully reload
   (`cinnamon --replace`), since in-place toggling occasionally leaves the old
   instance running.

## Panel icons jump around when numbers change

They shouldn't — the label is monospace and width-padded. If it happens, you
probably replaced the label style; keep:

- `font-family: monospace`
- `_fmtRate()` padding to 6 chars, `_fmtMem()` to 5.

## Nuclear option

```bash
bash uninstall.sh      # removes applet + settings + panel entry
bash install.sh        # clean reinstall from the repo copy
```

Still stuck → [open an issue](
https://github.com/NurMohammadDuari/cinnamon-sysmon-text/issues/new?labels=bug&template=bug_report.md)
with your Cinnamon version, Mint version, and the relevant lines of
`~/.xsession-errors`.
