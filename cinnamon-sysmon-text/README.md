# cinnamon-sysmon-text

A Linux Mint / Cinnamon taskbar applet that shows a realtime **CPU / RAM / network**
readout on the taskbar — with a `netspeed`-style hover popup.

```
Taskbar:  CPU 100%  MEM 4.8G ▼ 4G ▲ 54K
```

Hovering (or clicking) the taskbar text opens a dark card popup:

```
┌─────────────────────────────────────────┐
│ Interface: enp2s0 (Ethernet)            │
│ ─────────────────────────────────────── │
│ Download speed        219.76 KB/s       │
│ Upload speed          3.59 KB/s         │
│ Total downloaded      2.23 GB           │
│ Total uploaded        466.53 MB         │
│ Max speed             100 Mb/s          │
│ MAC address           18:c0:4d:7b:82:e1 │
│ IP address            192.168.0.119     │
│ Gateway               192.168.0.1       │
│ ─────────────────────────────────────── │
│ System                                  │
│ CPU usage             100%              │
│ Memory                4.9G / 7.6G       │
│ Core 0  ██████████  92%                 │
│ Core 1  ██████████  98%                 │
│ Core 2  ██████████  94%                 │
│ Core 3  ██████████  94%                 │
└─────────────────────────────────────────┘
```

## Features

- **Taskbar text** — CPU %, used RAM, download & upload rates, monospace-padded
  so the layout never shifts.
- **Hover popup** — netspeed-like network card + per-core CPU bars
  (text-drawn, monospace), 4 updates/sec live while open.
- **Zero dependencies** — reads `/proc/stat`, `/proc/meminfo`, `/proc/net/dev`,
  `/proc/net/route` and `/sys/class/net/*` directly.
- Auto-detects the default interface (falls back to parsing the default route).
- Hover opens after 0.2s, closes 0.3s after leaving; click toggles it too.
- Constant-width fields so panel icons don't jump around.

## Install

```bash
mkdir -p ~/.local/share/cinnamon/applets
cp -r sysmon-text@win11 ~/.local/share/cinnamon/applets/
```

Then enable it: right-click the taskbar → *Applets* → *SysMon Text* → add
(or in Cinnamon Settings → Applets). Works on Cinnamon 6.x (Mint 21/22).

If it doesn't show up right away: `cinnamon --replace` to reload the shell.

## Files

| Path | Purpose |
|---|---|
| `sysmon-text@win11/applet.js` | the whole applet |
| `sysmon-text@win11/metadata.json` | applet metadata (uuid, name) |

## Forked concepts

- The **netspeed** app (Rust/egui, by AmiXDme) — the popup card's row layout
  (interface, speeds, totals, max speed, MAC) is modeled after its UI.
- `multicore-sys-monitor@ccadeptic23` — realtime CPU-per-core idea.
