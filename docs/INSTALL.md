# 🚀 Installation guide

Three ways to get the taskbar readout. All of them end with enabling the
**SysMon Text** applet in Cinnamon.

## Requirements

| | |
|---|---|
| Desktop | Linux Mint 21.x / 22 with **Cinnamon 6.x** |
| Privileges | **none** — user-level install only |
| Network | only if cloning/downloading (the applet itself is offline) |

## Method 1 — one line, no clone

```bash
bash <(curl -fsSL https://raw.githubusercontent.com/NurMohammadDuari/cinnamon-taskbar-sys-monitor/main/install.sh)
```

## Method 2 — clone and run the installer (recommended)

```bash
git clone https://github.com/NurMohammadDuari/cinnamon-taskbar-sys-monitor.git
cd cinnamon-taskbar-sys-monitor
bash install.sh
```

`install.sh` copies the applet folder (metadata + JS + settings schema) to
`~/.local/share/cinnamon/applets/sysmon-text@win11/` and reloads the shell.

To remove everything (applet + saved settings + panel entry):

```bash
bash uninstall.sh
```

## Method 3 — release zip

Download [`cinnamon-taskbar-sys-monitor-v1.1.0.zip`](
https://github.com/NurMohammadDuari/cinnamon-taskbar-sys-monitor/releases/latest),
extract, run `bash install.sh` inside.

## Method 4 — fully manual

```bash
mkdir -p ~/.local/share/cinnamon/applets
git clone https://github.com/NurMohammadDuari/cinnamon-taskbar-sys-monitor.git
cp -r cinnamon-taskbar-sys-monitor/sysmon-text@win11 ~/.local/share/cinnamon/applets/
cinnamon --replace     # optional, registers the applet immediately
```

## Enable the applet

1. **Right-click the taskbar → Applets** (or *Menu → Preferences → Applets*)
2. *Manage* tab → *Available Applets* → **SysMon Text** → **+**
3. Drag it with Alt+Left-drag anywhere on the panel; drop it between sound/network and the clock
4. Right-click → **Configure…** to pick what shows ([guide](CONFIGURATION.md))

## Where files live

| Path | Contents |
|---|---|
| `~/.local/share/cinnamon/applets/sysmon-text@win11/` | `applet.js`, `metadata.json`, `settings-schema.json` |
| `~/.config/cinnamon/spices/sysmon-text@win11/` | your saved settings |
| panel placement | `gsettings get org.cinnamon enabled-applets` |

## Upgrading

```bash
cd cinnamon-taskbar-sys-monitor
git pull
bash install.sh       # overwrites the applet files, keeps your settings
```

## Verify it installed correctly

```bash
gsettings get org.cinnamon enabled-applets | grep sysmon
# should print an entry like: 'panel1:right:9:sysmon-text@win11:100'
```

And on the panel itself you should see:

```
CPU 7%  MEM 4.8G ▼ 4G ▲ 54K
```
