# VYRA Studio — Architecture

## Overview

```
┌──────────────────────────────────────────────────────────────┐
│                     Electron main process                     │
│                                                               │
│  domains/                                                     │
│    camera      → camera window power state + geometry         │
│    window      → create/manage camera, settings, palette,     │
│                  countdown and recording worker windows       │
│    settings    → JSON persistence (schema v2 + migration)     │
│    presets     → preset CRUD + apply                          │
│    shortcuts   → global shortcut registry (configurable)      │
│    recording   → ffmpeg screen/camera recording sessions      │
│    screenshot  → screen + camera frame capture                │
│    tray        → tray menu with live state                    │
│    countdown   → pre-recording countdown                      │
│                                                               │
└──────────────┬───────────────────────────────────────────────┘
               │ typed IPC (contextIsolation: true)
┌──────────────▼───────────────────────────────────────────────┐
│  preload bridge → window.vyra (single, typed API surface)     │
└──────────────┬───────────────────────────────────────────────┘
               │
┌──────────────▼───────────────────────────────────────────────┐
│                     Renderer (React 19)                       │
│                                                               │
│  pages (hash-routed):                                         │
│    #/          → floating camera page (bubble, drag, snap)    │
│    #/settings  → category-based settings                      │
│    #/palette   → command palette window                       │
│    #/countdown → pre-recording countdown                      │
│    #/worker    → hidden recording worker (getDISPlayMedia)    │
│                                                               │
│  stores (Zustand): camera, recording, ui                      │
└──────────────────────────────────────────────────────────────┘
```

## Principles

- **Separation**: UI never touches OS. Main never renders video.
- **Typed IPC**: every channel is a string constant + typed payload in
  `src/shared/types.ts`; the preload exposes one `window.vyra` object.
- **Security**: `contextIsolation: true`, `nodeIntegration: false`, no remote
  content. The renderer only sees the whitelisted bridge API.
- **Local-only**: settings live in a JSON file in `app.getPath('userData')`.
  No database, no network calls.

## Key flows

### Camera
`camera.service.ts` (main) owns the camera window: power state, size and
position. The renderer camera page draws the actual `<video>` stream and sends
geometry sync (`syncCameraPosition`, `resizeCameraWindow`) back to main.
On Linux the window itself is moved/resized; on Windows/macOS the transparent
fullscreen window positions the bubble in CSS and main stays out of the way.

### Recording
1. Main spawns the hidden worker window (`#/worker`) when recording starts.
2. The worker calls `getDisplayMedia`/`getUserMedia` (browser permission model).
3. Frames stream through `MediaRecorder` → IPC chunks → main.
4. Main pipes chunks to ffmpeg for a clean, standard MP4 (H.264 + AAC).
5. Errors (ffmpeg missing, cancelled picker, permission denied) surface as
   typed codes and are shown as overlays in the UI — never silent.

### Presets
`src/shared/presets.ts` defines built-ins as pure data. `preset.service.ts`
(main) persists user presets into settings JSON and resolves the active preset
into concrete window geometry. Applying a preset animates via CSS transitions
in the renderer and window moves in main.

### Settings
`settings.service.ts` stores a single JSON document with a versioned schema
(`schemaVersion: 2`). Legacy Floating Head Cam configs are detected and
migrated on load, so upgrading keeps user data. All writes are atomic.

## Directory map

```
src/
├── main/          # Electron main process (domains/*)
├── preload/       # bridge: ipcRenderer.invoke whitelist → window.vyra
├── renderer/src/  # React app (pages, stores, hooks, components)
├── shared/        # types, brand, colors, presets, shortcuts, i18n
└── tests/         # vitest setup
brand/             # vector logo system (source of truth)
scripts/           # generate-icons.mjs, release tooling
docs/              # you are here
```

## Brand assets

`brand/*.svg` are hand-written vector sources. `npm run icons` rasterizes them
into every icon the app needs (app icons, tray states) via `sharp` — no raster
asset is hand-edited or committed as source.
