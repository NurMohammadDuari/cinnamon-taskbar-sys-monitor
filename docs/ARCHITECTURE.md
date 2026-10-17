# 🧠 How it works — architecture

Single-file applet (`applet.js`, ~450 lines) running inside the Cinnamon shell's
GJS (SpiderMonkey JS). No dependencies beyond Cinnamon core APIs.

## Component map

```
┌─────────────────────────────────────────────────────────────────┐
│ Cinnamon shell (GJS process)                                    │
│                                                                 │
│  appletManager loads applet.js → main(metadata, orientation, …) │
│        │                                                        │
│        ├─► TextApplet          ← the taskbar actor (St.Bin)     │
│        │      └─ monospace label: "CPU 32% MEM 4.9G ▼4G ▲54K"   │
│        │                                                        │
│        ├─► Mainloop.timeout_add(interval, _tick) ← engine       │
│        │                                                        │
│        ├─► Settings.AppletSettings ← org.cinnamon spice store   │
│        │      (interval, show-* / popup-* switches)              │
│        │                                                        │
│        └─► AppletPopupMenu  ← netspeed-style hover card         │
│               └─ St.BoxLayout tree (rows)                       │
│                  opened via enter-event + 200 ms delay          │
└─────────────────────────────────────────────────────────────────┘
```

## The tick pipeline (every 500 ms by default)

```
_tick()
 ├─ ① CPU total & per-core deltas
 │     /proc/stat  ─ s/Δproc/stat  Δcpu ─ idle & total jiffies
 │     cpuN%  = (Δtotal - Δidle) / Δtotal          (idle = idle + iowait)
 │
 ├─ ② Memory
 │     /proc/meminfo  → MemTotal - MemAvailable   (used, KB)
 │
 ├─ ③ Network rates
 │     /proc/net/dev → byte counters for the active iface
 │     rate = (bytes_now - bytes_prev) / Δt
 │
 ├─ ④ taskbar label composition (respecting show-* toggles)
 │      skipped while the popup is open (panel relayout would close it)
 │
 └─ ⑤ if menu.isOpen → _refreshPopup(): row labels + core bars
```

## Popup construction

- `Applet.AppletPopupMenu` is the only menu class that gets parented into
  `Main.uiGroup` in Cinnamon 6.x — the generic `PopupMenu.PopupMenu` does **not**.
- Content is one `PopupBaseMenuItem` (`reactive:false`) wrapping the card.
- Critical detail: `PopupBaseMenuItem.actor` is a `Cinnamon.GenericContainer`
  that only sizes actors registered through **`item.addActor(child)`** — a raw
  `actor.add_child()` yields a 0-size, invisible card.
- Rows are plain `St.BoxLayout` pairs: grey key (`min-width:150px`) +
  white monospace value.
- Hover lifecycle:
  - `enter-event` on the applet actor or menu → opens after 200 ms
  - `leave-event` → closes after 300 ms (cross-actor transitions don't flicker)

## Data sources

| Metric | File | Parsing |
|---|---|---|
| CPU | `/proc/stat` | `cpu [user nice system idle iowait irq softirq …]` — idle = `f[3]+f[4]`, total = Σ |
| Per-core | same file, lines `cpuN` | per-core deltas, first 8 cores |
| RAM | `/proc/meminfo` | `MemTotal:`, `MemAvailable:` |
| Net rates/totals | `/proc/net/dev` | `<iface>: rx_bytes tx_bytes` (fields 0 and 8) |
| Interface | `/proc/net/route` | first row with gateway `00000000`, dst `00000000`, iface ≠ `Iface` |
| Link speed | `/sys/class/net/<iface>/speed` | e.g. `100` → `100 Mb/s` |
| MAC | `/sys/class/net/<iface>/address` | as-is |
| IP | `ip -o -4 addr show dev <iface>` | regex `inet\s+([0-9.]+)` |
| Gateway | `/proc/net/route` | default-row gateway hex, little-endian → dotted quad |

## Formatting rules (why it never vibrates)

- Rates padded to 6 chars: `  66B`, ` 7.2K`, `466.3M`
- Memory padded to 5 chars: ` 4.9G`, ` 123M`
- Monospace font forced on the label actor
- Percentages on 4 chars (` 92%`, `100%`) and the core bars are fixed at 10 blocks

## Performance profile

- Work per tick: a handful of small file reads (`/proc/stat`, `/proc/meminfo`,
  `/proc/net/dev` ≈ few KB) + string building → **negligible**, even at 100 ms
- `ip` subprocess only runs **once**, at popup construction (IP/gateway are static rows)
- No timers, no animations; the popup is entirely native St widgets

## Known limits

- Vertical panels untested
- VPN as the default route → the card reports the VPN iface (by design:
  that's where your traffic really goes)
- Totals count since boot only (`/proc/net/dev` counters reset on reboot)
- TLS 1.3 ECH and other privacy tech is irrelevant here (we read OS counters,
  not packets)

## Design choices / credits

- Card layout modelled after the **netspeed** app (Rust/egui)
- Per-core bars and System section are our additions
- Follows the patterns used by `power@cinnamon.org` (settings) and
  builtin applets (popup menu construction)
