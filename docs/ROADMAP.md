# VYRA Studio — Roadmap

Shipped and planned, in build order. Nothing here is fake: features land in the
app only when they actually work — no placeholder buttons.

## ✅ Phase 1 — Rebirth (shipped)

- Floating camera window: drag, resize, 9-point snap, 7 shapes
- Presets (built-in + user), preset shortcuts
- Design system: charcoal / neon-yellow / blue, dark-first
- Settings (JSON persistence with legacy migration)
- Global shortcuts (configurable)
- Tray with live state
- Command palette (`Ctrl + Space`)

## ✅ Phase 2 — Studio (shipped)

- Recording studio: camera, screen, camera + screen (ffmpeg MP4)
- Recording timer, pause/resume, countdown
- Screenshots (screen + camera frame)
- Microphone mute + audio meter
- Onboarding-lite first run

## 🔜 Phase 3 — Creator

- **Instant replay buffer** — rolling N-second buffer, hotkey to save the
  last 15/30/60/120s
- **Camera effects** — grayscale, cinematic, soft, low-light (WebGL shaders)
- **Backgrounds** — blur, solid, gradient, image; local background
  segmentation behind an experimental flag
- **Face framing** — local face detection, auto-center, auto-zoom, headroom
  control

## 🔜 Phase 4 — Automation

- Automation engine: `WHEN <trigger> → DO <action>`
- Triggers: app focus, fullscreen start/stop, recording state, workspace change
- Actions: apply preset, show/hide camera, start/stop recording
- Workspace profiles (preset per virtual desktop)

## 🔜 Phase 5 — Omarchy

- Local daemon + full `vyra` CLI (socket-controlled)
- Native Hyprland workspace awareness (replacing the helper script)
- Waybar module bundled with the Linux package
- VYRA quick menu (already wired; polish + persistence)

## 🔮 Future

Plugin system, virtual camera output, scene system, multiple cameras,
streaming integrations (OBS bridge), local AI assistant. Foundations are in
place (typed IPC, domain services, preset/automation data models) but none of
this is implemented yet — by design.
