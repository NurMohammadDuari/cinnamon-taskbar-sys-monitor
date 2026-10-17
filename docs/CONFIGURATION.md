# ⚙️ Configuration guide

Every knob of **cinnamon-sysmon-text** lives in Cinnamon's native settings UI:
right-click the taskbar readout → **Configure…** (or *Cinnamon Settings → Applets →
SysMon Text → Configure*).

The schema is defined in [`sysmon-text@win11/settings-schema.json`](
../sysmon-text@win11/settings-schema.json); Cinnamon renders it as a dialog and
stores your choices in `~/.config/cinnamon/spices/sysmon-text@win11/sysmon-text@win11.json`.

## Reference — every setting

| Key | UI control | Default | Range | Effect when changed |
|---|---|---|---|---|
| `interval` | Spin button | `500` | 100 – 3000 ms | Applies **instantly**, no applet restart needed. The CPU/RAM/NET text *and* the hover card both refresh at this cadence. |
| `show-cpu` | Switch | on | — | Removes/returns `CPU 32%` from the taskbar text. |
| `show-memory` | Switch | on | — | Removes/returns `MEM 4.9G`. |
| `show-network` | Switch | on | — | Removes/returns `▼ 4G ▲ 54K`. |
| `popup-network` | Switch | on | — | Hides/shows the whole *Interface* section of the hover card (speeds, totals, max speed, MAC, IP, gateway). |
| `popup-system` | Switch | on | — | Hides/shows the *System* section (CPU %, memory). |
| `popup-cores` | Switch | on | — | Hides/shows the `Core 0…N` rows inside the System section. |

### Example configurations

**Minimal look** —— only download/upload on the bar:

```json
{
  "show-cpu":    false,
  "show-memory": false,
  "show-network": true
}
```

**Battery saver** —— refresh once per second, popup without per-core rows:

```json
{ "interval": 1000, "popup-cores": false }
```

## How values are stored

Cinnamon writes your config here (this file is regenerated on every dialog change):

```
~/.config/cinnamon/spices/sysmon-text@win11/sysmon-text@win11.json
```

Curious what a raw config looks like?

```json
{
  "interval":   { "value": 500 },
  "show-cpu":   { "value": true },
  "show-memory":{ "value": true },
  "show-network":{ "value": true },
  "popup-network": { "value": true },
  "popup-system":  { "value": true },
  "popup-cores":   { "value": true }
}
```

You can also hand-edit this file and press *Reload shell* — but the dialog is safer.

## Which fields appear where

```
Taskbar label   = "CPU <pct>  MEM <used>" + "▼<down> ▲<up>"    ← controls: show-cpu / show-memory / show-network
Hover card       = Interface section + System section + Core rows ← controls: popup-network / popup-system / popup-cores
```

## Reset to defaults

Open the file above, delete it, then `cinnamon --replace`. The applet rebuilds it
from the defaults in `settings-schema.json`.
