# VYRA Studio — Privacy

**Your camera. Your space.** Also: your data. All of it stays on your machine.

## What VYRA does

- ✅ Camera and microphone streams are processed **locally**, in the app.
- ✅ Recordings are encoded by a local ffmpeg process and saved to **your**
  chosen folder.
- ✅ Settings are a plain JSON file in your Electron `userData` directory.
- ✅ You can see at any time whether camera, microphone or recording is active
  (HUD indicators + tray).

## What VYRA does not do

- ❌ No analytics, telemetry or crash reporting
- ❌ No tracking, no fingerprinting
- ❌ No cloud uploads, no accounts, no servers
- ❌ No network permission of any kind — the app makes zero network requests
- ❌ No ads, no affiliate links, no "phone home"

## When recording

- Screen capture uses the OS picker — **you** choose what gets shared.
- Recordings and screenshots are written only to the output folder you
  configured.
- Nothing is cached or duplicated anywhere else.

## Face processing (roadmap)

Any future face detection / auto-framing features will run **locally** (on-device
models). Frames will never be sent to any server. This is a hard design
constraint, not a preference — see [ROADMAP.md](ROADMAP.md).

## Verifying

VYRA is open source: every network-touching line can be audited. A quick check
is to run the app with a firewall blocking all egress for its binary — every
feature keeps working, because nothing needs the network.
