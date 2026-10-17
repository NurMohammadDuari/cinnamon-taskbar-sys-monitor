<div align="center">
  <img src=".github/assets/banner.svg" alt="cinnamon-sysmon-text — realtime CPU, RAM and network speed readout applet for Linux Mint Cinnamon taskbar" width="820"/>

  # ⏱️ ⚡ cinnamon-sysmon-text

  **Realtime CPU · RAM · Network-speed readout applet for the Linux Mint (Cinnamon) taskbar — with a netspeed-style hover popup.**

  [![made-for-cinnamon](https://img.shields.io/badge/Cinnamon-6.x-yellow?color=E79A3C&style=for-the-badge&logo=cinnamon)](https://cinnamon-spices.linuxmint.com/)
  [![Linux Mint](https://img.shields.io/badge/Linux%20Mint-21%20%7C%2022%20Wilma-green?style=for-the-badge&logo=linuxmint&logoColor=white)](https://linuxmint.com)
  [![License](https://img.shields.io/badge/License-MIT-blue?style=for-the-badge)](LICENSE)
  [![Stars](https://img.shields.io/github/stars/NurMohammadDuari/cinnamon-sysmon-text?style=for-the-badge&color=FFCC4D)](https://github.com/NurMohammadDuari/cinnamon-sysmon-text/stargazers)
  [![Issues](https://img.shields.io/github/issues/NurMohammadDuari/cinnamon-sysmon-text?style=for-the-badge&color=crimson)](https://github.com/NurMohammadDuari/cinnamon-sysmon-text/issues)

</div>

---

## 📋 What is this?

A **zero-dependency system monitor applet** for the **Cinnamon taskbar (panel)** that always shows:

| Field | Source |
|---|---|
| `CPU` | total usage %, sampled live from `/proc/stat` |
| `MEM` | used memory from `/proc/meminfo` |
| `▼ / ▲` | download & upload rates from `/proc/net/dev` |

…right inside the taskbar text:

```
CPU 100%  MEM 4.8G ▼ 4G ▲ 54K
```

Hover (or click) the text and a **netspeed-style dark card popup** appears above the panel —
the same layout as the popular `netspeed` app — with **live per-core CPU bars**:

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
│ Core 0  ████████████ 92%                │
│ Core 1  ████████████ 98%                │
│ Core 2  ████████████ 94%                │
│ Core 3  ████████████ 94%                │
└─────────────────────────────────────────┘
```

## ✨ Features

- ✅ **Taskbar CPU, RAM and network readout** — realtime, 4 updates/sec
- ✅ **Hover popup card** — network speeds, totals, link speed, MAC, IP, gateway
- ✅ **Per-core CPU usage bars** (up to 8 cores, text-drawn, always aligned)
- ✅ **Monospace-padded fields** — panel icons **never shift** when numbers change
- ✅ **Zero dependencies** — no GNOME libs, no Python, no binaries; pure `/proc` & `/sys` parsing
- ✅ Auto-detects the **default network interface** (falls back to the default route)
- ✅ Hover opens in 0.2 s, closes 0.3 s after leaving (**no flicker**); click toggles
- ✅ Works on both horizontal panels; ~14 KB total, pure JS

## 📦 Install (Linux Mint / Cinnamon 6.x)

```bash
git clone https://github.com/NurMohammadDuari/cinnamon-sysmon-text.git
cd cinnamon-sysmon-text
mkdir -p ~/.local/share/cinnamon/applets
cp -r sysmon-text@win11 ~/.local/share/cinnamon/applets/
```

Then enable it:

1. Right-click the panel → **Applets** (or open *Cinnamon Settings → Applets*)
2. Find **SysMon Text** under *Manage → Available applets* → **+** to add
3. Drag it where you like on the panel

If it doesn't appear instantly, reload the shell:

```bash
cinnamon --replace
```

## 🔍 How it works (tech notes)

| Metric | Implementation |
|---|---|
| CPU total & per-core | jiffy delta between ticks of `/proc/stat` (`cpuN` lines, idle = idle + iowait) |
| Memory used | `MemTotal − MemAvailable` in `/proc/meminfo` |
| Download / upload | byte deltas on the default iface in `/proc/net/dev` |
| Totals | the raw `/proc/net/dev` counters (since boot), formatted → B / KB / MB / GB |
| Max speed | `/sys/class/net/<iface>/speed` |
| MAC | `/sys/class/net/<iface>/address` |
| IP / gateway | `ip -o -4 addr` + `/proc/net/route` (hex little-endian → dotted quad) |
| Interface auto-detect | first non-loopback default route in `/proc/net/route` |

Built on the standard Cinnamon applet API: `Applet.AppletPopupMenu`,
`PopupMenu.PopupMenuManager`, `St.BoxLayout`, and `GenericContainer`-compatible
`addActor()` layout.

## 🖼️ Popup design credit

The card layout — *interface, speeds, totals, max speed, MAC* — is modeled after the
**netspeed** app (Rust/egui). The per-core bars and System section are additions.

## 🤝 Contributions

**This project is maintained by [NurMohammadDuari](https://github.com/NurMohammadDuari) only.**
Pushes to `main` are restricted to the code owner
(see [`.github/CODEOWNERS`](.github/CODEOWNERS)). Issues and bug reports are always welcome!

## 📜 License

[MIT](LICENSE) © 2026 Nur Mohammad Duari

## ⭐ See also

- [cinnamon-spices.linuxmint.com](https://cinnamon-spices.linuxmint.com/) — official Cinnamon applet collection
- <https://github.com/NurMohammadDuari> — more from the author

<div align="center">
<sub>Keywords: linux mint, cinnamon applet, taskbar system monitor, cpu monitor, ram monitor, network speed monitor, netspeed, cpu per core, sysmon, panel applet, cinnamon 6</sub>
</div>
