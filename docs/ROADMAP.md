# VYRA Studio — Roadmap

Shipped and planned, in build order. Nothing here is fake: features land in the
app only when they actually work — no placeholder buttons.

Statuses: ✅ shipped · 🚧 in progress · 🔜 planned · 🔮 future.
Sizes: **S** < 1 day · **M** 1–3 days · **L** 1–2 weeks · **XL** research project.

## ✅ Shipped — Foundation

- Floating camera window: drag, 9-point snap, 7 shapes, opacity, multi-display
- Click-through overlay hardened (no stuck mouse capture, invisible bubble never steals clicks)
- Presets (built-in + user) + **Scenes** (Gaming/Coding/Recording, F5–F7 global)
- Real-time effects engine: 12 GPU-composited CSS-filter effects + cinematic vignette
- VYRA Pulse: border glow follows mic level (attack/decay smoothing, reduced-motion aware)
- Design system: charcoal / neon-yellow, dark-first
- Settings (JSON persistence with legacy migration + v2 section restore)
- Global shortcuts (configurable) + tray with live state + scenes submenu
- Command palette (`Ctrl + Space`): Raycast-style, grouped, keyboard-first
- Recording studio: screen capture → ffmpeg (QSV/NVENC/AMF/VideoToolbox/x264, CFR fix)
- Screenshots (screen + camera frame with effect baked in), countdown, mic mute + mixer

## 🚧 In progress

- Omarchy track: local daemon + `vyra` CLI, Hyprland awareness, Waybar module
  (see `docs/OMARCHY.md`)

## 🔜 Next — Quick wins (robustness & vision §25–28)

Ordered by impact/effort. Each is shippable alone.

1. **Auto-start with Windows** — `settings.launchOnStartup` key and
   `getLoginItemSettings` read already exist; wire `setLoginItemSettings` +
   General-tab toggle. **S**
2. **Hardware-encoder fallback** — pre-flight the selected encoder; on
   `codec-unavailable`/QSV-runtime failure, auto-retry once with `libx264`
   instead of hard-erroring the recording. **M**
3. **Camera resolution picker** — enumerate `getCapabilities()` and apply
   `applyConstraints` (vision §27). **M**
4. **Recording format + quality options** — output is `.mov`-fixed today;
   offer MP4 + quality tiers (vision §15). **S**
5. **Discreet notifications** — toast on camera on/off, recording start/stop,
   preset/scene applied (vision §28). **S**
6. **Onboarding first-run** — i18n keys exist but no page; 2-step
   (pick camera → pick scene). **M**
7. **F5 default conflict** — global scene shortcuts hijack F5–F7 (e.g. reload
   in Settings); confirm or rebalance defaults. **XS**

## 🔜 Creator tools (vision §§8–9, 16–17)

8. **Simple backgrounds** — solid/gradient backdrop behind the transparent
   bubble (pure CSS, no segmentation). **S**
9. **True background blur/remove** — local segmentation model (~40MB, lazy
   download, experimental flag, disabled in low-end mode). **L**
10. **Extra shapes** — diamond/hexagon via `clip-path` (shapes infra already
    supports custom geometry). **S**
11. **Camera-only recording mode** — the mode selector exists in Settings but
    the worker only captures screen; implement or remove the option. **M**
12. **Screenshot variants** — overlay/HUD-inclusive captures. **M**

## 🔜 Intelligence (vision §§11, 36 — gated by low-end mode)

13. **Performance modes** — Performance/Balanced/Quality switch that gates
    effects, pulse, segmentation and tracking (vision §§22–23). **M**
14. **Face framing** — local detection, auto-center + auto-zoom with headroom
    control. **L**
15. **VYRA Focus** — subtle zoom on speech/proximity. **L**

## 🔜 Ecosystem

16. **Instant replay buffer** — rolling N-second buffer, hotkey saves last
    15/30/60/120s. **L**
17. **Multi-camera** — two bubbles / source switching without restart. **L**
18. **Automation engine** — `WHEN <trigger> → DO <action>`
    (app focus, fullscreen, recording state → apply scene, show/hide). **L**
19. **OBS virtual camera output** — native module/driver work on Windows. **XL**

## 🔮 Future

Marketplace, cloud presets/sync, monetization tiers (Free/Pro/Studio),
streaming integrations. Deliberately not scheduled — the local-first studio
comes first.
