# AeroWatch — UAV Weather Intelligence

A real-time UAV weather intelligence dashboard built with **Vite + React + TypeScript**. Designed for flight operators monitoring atmospheric conditions for unmanned aerial vehicles.

![AeroWatch Dashboard](https://raw.githubusercontent.com/taha-zaidii/AeroWatch/main/preview.png)

## Features

- **Live telemetry** — battery, altitude, airspeed, and signal strength updating every second
- **Interactive tactical map** — OpenStreetMap tiles with geofence overlay, weather cells, and fleet positions
- **Wind & Weather** — gust threshold bar, alert log with acknowledgement, hourly forecast strip
- **Control Panel** — arm/disarm, RTH, emergency landing (guarded by confirmation dialog), virtual joystick
- **Reports & History** — flight log, daily bar chart, performance sparkline
- **HCI Benchmark** — live Fitts' law and time-on-task tests
- **Guided demo mode** — press `T` to start a 12-step annotated walkthrough
- **Trainee / Operator modes** — simplified layout for new pilots, full console for experienced ones
- **Dark / light theme** — persisted to `localStorage`
- **Keyboard shortcuts** — `1–7` to navigate, `E` to toggle HCI annotations, `?` for help

## Tech stack

| Layer | Technology |
|---|---|
| Bundler | Vite 5 |
| UI library | React 18 |
| Language | TypeScript |
| Styling | Vanilla CSS (design tokens) |
| Map | Custom web-mercator tile renderer (no external map library) |
| State | React Context + `useState` |
| Deployment | Vercel (SPA rewrites via `vercel.json`) |

## Getting started

```bash
# Clone
git clone https://github.com/taha-zaidii/AeroWatch.git
cd AeroWatch

# Install
npm install

# Dev server → http://localhost:5173
npm run dev

# Production build → dist/
npm run build
```

## Deploying to Vercel

1. Import this repo at [vercel.com/new](https://vercel.com/new)
2. Leave all settings as default (Vite is auto-detected)
3. Click **Deploy**

The included `vercel.json` handles SPA client-side routing so page refreshes don't 404.

## Project structure

```
src/
├── App.tsx                 # Root shell + screen router
├── context/
│   └── AppContext.tsx      # Global state, telemetry simulation, keyboard shortcuts
├── components/
│   ├── Icon.tsx            # 60+ inline SVG icons
│   ├── Shell.tsx           # Sidebar, Topbar, Toasts, HCINote
│   ├── MissionMap.tsx      # Interactive tile map
│   ├── Radar.tsx           # Canvas radar with drone swarm
│   ├── DemoMode.tsx        # Guided walkthrough overlay
│   └── Welcome.tsx         # Onboarding + coachmarks
├── screens/
│   ├── Login.tsx
│   ├── Dashboard.tsx
│   ├── Wind.tsx
│   ├── Control.tsx
│   ├── Reports.tsx
│   ├── Wireframes.tsx
│   ├── Evaluation.tsx
│   └── Benchmark.tsx
└── styles/
    ├── index.css           # Design tokens & base
    ├── screens.css         # Screen layouts
    ├── animations.css
    ├── trainee.css
    ├── bridge.css
    ├── weather.css
    └── theme-dark.css
```

## Keyboard shortcuts

| Key | Action |
|---|---|
| `1` – `7` | Navigate between screens |
| `E` | Toggle HCI annotations |
| `T` | Start/stop guided demo |
| `?` | Show shortcuts help toast |
| `⌘K` | Search (UI only) |

## License

MIT
