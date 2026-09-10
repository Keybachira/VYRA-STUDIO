# VYRA Studio — Omarchy / Hyprland Integration

VYRA is built Omarchy-first: the camera window is a floating, always-on-top
overlay that behaves like a native layer under Hyprland/Wayland compositors.

**Status:** as of the current build, the integration is delivered as
**documented config + helper scripts** you opt into. VYRA will **never
overwrite your existing keybinds** or config automatically. A local daemon +
`vyra` CLI is planned — see [ROADMAP.md](ROADMAP.md) — and is not shipped yet,
so any `vyra ...` commands you see in older docs do not exist today.

## 1. Manual global shortcuts (Hyprland)

VYRA registers its own global shortcuts through Electron (Windows/Linux) and
reads them from Settings → Shortcuts. If you prefer Hyprland-level binds, you
can exec the app with arguments instead of a CLI:

```ini
# ── VYRA Studio (manual, opt-in) ─────────────────────────
bind = SUPER SHIFT, V, exec, vyra-studio
```

Launching a second instance is safe: VYRA uses `requestSingleInstanceLock`
and focuses the running camera instead of spawning a duplicate.

## 2. Window rules

Keep the camera bubble well-behaved under Hyprland:

```ini
windowrulev2 = float, class:^(vyra-studio)$ title:^(VYRA Camera)$
windowrulev2 = pin,        class:^(vyra-studio)$ title:^(VYRA Camera)$
windowrulev2 = noborder,   class:^(vyra-studio)$ title:^(VYRA Camera)$
windowrulev2 = norounding, class:^(vyra-studio)$ title:^(VYRA Camera)$
```

(`pin` = keep across workspaces. VYRA also manages always-on-top itself; add
these only if your compositor fights with it.)

## 3. Workspace presets (today)

A small watcher script can apply presets per workspace until native workspace
awareness ships:

```bash
#!/usr/bin/env bash
# ~/.config/hypr/scripts/vyra-workspace-watch
# Requires: VYRA running on the same machine (dev build).
declare -A PRESETS=( [1]="coding" [2]="recording" [3]="gaming" )

stdbuf -oL hyprctl workspace | grep --line-buffered -oE 'workspace [0-9]+' | \
  while read -r _ ws; do
    preset="${PRESETS[$ws]:-}"
    echo "workspace $ws → preset: ${preset:-none}"
  done
```

> This script only *prints* the mapping today; wiring it into the app needs
> the CLI/socket interface (Phase 5). Included for transparency — not
> presented as a working integration.

## 4. Planned (Phase 5)

- **`vyra` CLI** — `camera toggle/show/hide`, `preset <name>`,
  `recording start/stop`, `screenshot`, `mic mute/unmute`, `status [--json]`,
  `open`, `menu`
- **Local socket daemon** in the Electron main process so external tools can
  query state and send commands
- **Native workspace awareness** — preset per Hyprland workspace, applied in-app
- **Waybar module** — `󰄀 CAM ●` / `REC 00:12` states, click to open
- **Quick menu** bound to `SUPER + SHIFT + V`

When Phase 5 lands, this file becomes a copy-paste setup guide with working
commands. Until then, everything above is either already automatic (window
class, single instance, window rules) or clearly marked as planned.
