# Support

Need help with **cinnamon-taskbar-sys-monitor**?

| Question | Place |
|---|---|
| 🐛 It doesn't show / shows wrong values | [Open an issue](https://github.com/NurMohammadDuari/cinnamon-taskbar-sys-monitor/issues/new?labels=bug&template=bug_report.md) |
| 💡 Feature ideas | [Disscussions](https://github.com/NurMohammadDuari/cinnamon-taskbar-sys-monitor/discussions) |
| ❓ Quick questions | [Disscussions](https://github.com/NurMohammadDuari/cinnamon-taskbar-sys-monitor/discussions) |
| 🔐 Security problems | [Private report](https://github.com/NurMohammadDuari/cinnamon-taskbar-sys-monitor/security/advisories/new) |

## Quick troubleshooting

<details>
<summary><b>The applet doesn't appear on the taskbar</b></summary>

```bash
# enable it from the command line
cinnamon-settings applets >/dev/null   # GUI way
# or the CLI way:
bash install.sh   # then `cinnamon --replace`
```
</details>

<details>
<summary><b>CPU always says 100%</b></summary>

The applet is accurate — open `top` and check. On 2–4 core laptops two or
three busy processes are enough to reach 100%.
</details>

<details>
<summary><b>Where can I configure it?</b></summary>

Right-click the taskbar readout → **Configure…** — update interval, which
fields show on the taskbar, and which popup sections appear.
</details>

<details>
<summary><b>Wrong interface is used (e.g. shows lo or a VPN)</b></summary>

Auto-detection picks the first default route in `/proc/net/route`. VPNs and
`lo` are filtered by order — if a VPN is default, the card shows that iface;
restart without the VPN to get the physical one.
</details>
