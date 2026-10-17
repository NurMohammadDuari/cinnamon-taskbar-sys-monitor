# Security Policy

## Supported versions

| Version | Supported |
| ------- | --------- |
| 1.1.x   | ✅        |
| 1.0.x   | ⚠ last-only (critical fixes) |

## Reporting a vulnerability

This applet runs inside the **Cinnamon shell (GJS)** with the same privileges as
your desktop session. Its attack surface is limited to:

- reading `/proc` and `/sys` (read-only, kernel-provided)
- invoking `ip` via `GLib.spawn_command_line_sync`

**How to report:** use [Private vulnerability reporting](
https://github.com/NurMohammadDuari/cinnamon-taskbar-sys-monitor/security/advisories/new).
Please do **not** open a public issue for security problems.

You will get a reply within 72 hours. Responsible disclosure appreciated.
