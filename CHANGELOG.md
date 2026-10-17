# Changelog

All notable changes to **cinnamon-sysmon-text** are documented here.
Format based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

## [1.1.0] — 2026-10-17

### Added
- **Native Cinnamon settings** (right-click → Configure…):
  update-interval spinbutton (100 ms – 3 s), taskbar CPU/MEM/NET
  field toggles, and popup section toggles (network / system / per-core bars)
- `install.sh` / `uninstall.sh` one-step scripts (incl. one-line `curl | bash`)
- `tests/validate.py` offline validation suite, wired into CI
- CI now also parse-checks the shell scripts
- `SECURITY.md` + `SUPPORT.md`, real screenshots embedded in the README
- GitHub labels, milestone and release packaging
### Changed
- `metadata.json` gained `version` and `settings-schema` keys

## [1.0.0] — 2026-10-17

### Added
- Taskbar realtime readout: `CPU %` · `MEM used` · `▼ download ▲ upload`
- Hover/click netspeed-style popup card:
  - interface + type, download/upload speeds, totals since boot
  - max link speed (`/sys/class/net/<iface>/speed`), MAC, IP, gateway
- System section: overall CPU %, used/total memory
- Per-core CPU usage bars (up to 8 cores, text-drawn)
- Auto-detect of the default network interface
- Monospace fixed-width fields so the taskbar layout never shifts
- Hover opens after 0.2 s; closes 0.3 s after mouse leaves; click toggles
- Compatible with Cinnamon 6.x (Mint 21 / 22)
