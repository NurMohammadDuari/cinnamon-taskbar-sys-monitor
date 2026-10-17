# 🗺️ Roadmap

Ordered by demand. Items completed are moved to the bottom [Changelog](../CHANGELOG.md).

## v1.2.x — next stop

- [ ] **Vertical panel support** — proper orientation of the readout & popup anchor
- [ ] **Per-interface selection** in the Configure dialog (dropdown of `/sys/class/net/*`)
  instead of pure auto-detect
- [ ] **Disk readout** (read/written per second, like the network panel —
  `/proc/diskstats`)
- [ ] **CPU load watermark colouring** — >90% tints red, >60% amber
- [ ] Settings: choose ↕ *which* rows the taskbar shows first (drag order)

## /v1.3 — ambitions

- [ ] Sparkline history graphs inside the popup (last 60 s) drawn with a
      `St.DrawingArea`/Cairo canvas
- [ ] Network totals persisted across reboots (rolling file in `~/.cache`)
- [ ] Right-side numeric file descriptors: `nproc/thread/uptime` compact mode
- [ ] Multi-instance support for multiple panels/monitors (`max-instances` > 1)
      with independent ifaces
- [ ] Packaged as a proper `.deb` and submission to the official
      [cinnamon-spices.linuxmint.com](https://cinnamon-spices.linuxmint.com/) applet store
- [ ] Battery / temperature readout (`/sys/class/power_supply`, `lm-sensors`)

## Done

- [x] v1.1 — native Cinnamon settings (interval + field/section toggles),
      install/uninstall scripts, offline test suite, CI, screenshots
- [x] v1.0 — taskbar CPU/RAM/NET readout with netspeed-style hover card,
      per-core bars, IP/gateway/MAC

## Non-goals

- Grafana-scale telemetry — this is a taskbar glance, not a monitoring stack
- Animated graphs on the taskbar itself — keeps the readout cheap and non-intrusive

## Priority voting 👍

Leave a `+1` reaction on the matching discussion thread
([Discussions → Ideas](https://github.com/NurMohammadDuari/cinnamon-taskbar-sys-monitor/discussions)),
or open a feature request issue — the loudest items get done first.
