# VYRA Studio — Development Guide

## Prerequisites

- Node.js 20+
- npm 10+
- Windows, macOS or Linux (Wayland-friendly on Linux)

## Setup

```bash
npm install
npm run dev
```

## Scripts

| Script | What it does |
|---|---|
| `npm run dev` | electron-vite dev server with hot reload |
| `npm run build` | production bundles to `out/` |
| `npm run typecheck` | `tsc --noEmit` for node + web tsconfigs |
| `npm run lint` | ESLint (React hooks, import order, prettier) |
| `npm test` | vitest unit suite |
| `npm run dist` | packaged installers via electron-builder |
| `npm run icons` | regenerate all raster icons from `brand/*.svg` |

## Conventions

- **TypeScript strict** everywhere; no `any` unless bridging Electron internals.
- **Domains**: both `src/main/domains/*` and `src/renderer/src/domains/*` group
  code by feature (camera, recording, settings…), not by file type.
- **Stores**: Zustand slices, one concern per store. No god-store.
- **IPC**: channels declared in `src/shared/ipc.ts`-style constants and typed
  in `src/shared/types.ts`. Never `ipcRenderer.send('string', payload)` ad hoc.
- **Styling**: hand-written CSS design tokens in `src/renderer/src/assets/main.css`
  (`--color-*`, `--radius-*`). Yellow (`#FFDB00`) = active/recording/focus only.
- **i18n**: all user-facing strings via `src/shared/i18n.ts` (`en` / `pt`).

## Testing

```bash
npm test              # full suite
npx vitest run src/shared   # single area
```

Priority coverage: presets, shortcut normalization, design tokens, renderer
helpers. If you add a pure module, add a test next to it (`*.test.ts`).

## Adding a feature — checklist

1. Types in `src/shared/types.ts`
2. Main service in `src/main/domains/<feature>/`
3. IPC handler in main + method in `src/preload/index.ts` + `index.d.ts`
4. UI in `src/renderer/src/domains/<feature>/`
5. Strings in i18n (en + pt)
6. Test if the logic is pure
7. `npm run typecheck && npm run lint && npm test`

## Debugging

- Renderer devtools: `Ctrl + Shift + I` in dev builds.
- Main logs go to the launching terminal.
- Settings JSON: open **Settings → Advanced** and use *Open data folder*.
- Recording failures show ffmpeg stderr in the error overlay.

## Release

```bash
npm run build
npm run dist        # artifacts in dist/ (nsis / AppImage / dmg)
```

Icons must be regenerated after any brand change: `npm run icons`.
