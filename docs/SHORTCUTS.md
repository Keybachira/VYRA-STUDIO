# VYRA Studio — Shortcuts

All shortcuts are configurable in **Settings → Shortcuts**. Defaults below.

## Global (system-wide, even when VYRA is unfocused)

| Action | Default |
|---|---|
| Command palette | `Ctrl + Space` |
| Toggle camera | `F9` |
| Start / stop recording | `F10` |
| Screenshot | `F8` |
| Toggle microphone | `Alt + M` |
| Apply preset 1 / 2 / 3 | `Alt + 1` / `Alt + 2` / `Alt + 3` |

## Local (when the camera window has focus)

| Action | Default |
|---|---|
| Mirror video | `Alt + N` |
| Toggle always-on-top | `Alt + T` |
| Size: XS / SM / MD / LG / fullscreen | `1` / `2` / `3` / `4` / `5` |
| Snap: top-left / top-right | `Alt + Q` / `Alt + E` |
| Snap: left / center / right | `Alt + A` / `Alt + S` / `Alt + D` |
| Snap: bottom-left / bottom-right | `Alt + Z` / `Alt + C` |
| Close palette / overlays | `Esc` |

## Changing bindings

Open **Settings → Shortcuts**, click a row, press the new combo. Bindings are
persisted to the local settings file; invalid or conflicting entries fall back
to defaults on load (enforced by `normalizeShortcuts`).

## Omarchy / Hyprland

Configured by you in `hyprland.conf` — see [OMARCHY.md](OMARCHY.md).
VYRA never registers or overwrites compositor keybinds automatically.
