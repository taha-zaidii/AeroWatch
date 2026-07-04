# AeroWatch — UAV Weather Intelligence

[![CI](https://github.com/taha-zaidii/AeroWatch/actions/workflows/ci.yml/badge.svg)](https://github.com/taha-zaidii/AeroWatch/actions/workflows/ci.yml)
[![Live](https://img.shields.io/badge/live-aero--watch--delta.vercel.app-5a7d3e)](https://aero-watch-delta.vercel.app/)
[![React 19](https://img.shields.io/badge/React-19-61dafb?logo=react&logoColor=white)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-strict-3178c6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![License: MIT](https://img.shields.io/badge/license-MIT-lightgrey)](#license)

A real-time weather-intelligence console for drone operators. Pick **any city on Earth** and AeroWatch streams its live atmospheric conditions, computes an **explainable go/no-go flight-risk index**, finds the **optimal launch windows** in the next 24 hours, plans **storm-avoiding routes with A\***, and answers questions through **AeroPilot**, an AI flight assistant.

**Live demo → [aero-watch-delta.vercel.app](https://aero-watch-delta.vercel.app/)** (any credentials sign you in — it's a demo)

---

## What makes it interesting

This is not a CRUD app with a weather widget. The core of the project is a set of hand-rolled, unit-tested algorithms operating on real data:

| Algorithm | Where | What it does |
|---|---|---|
| **Flight-Risk Engine** | [`src/lib/risk.ts`](src/lib/risk.ts) | Deterministic go/no-go scoring across six weighted factors (gusts, wind, precipitation, visibility, temperature, cloud ceiling) using piecewise-linear ramps calibrated to sUAS operating limits, with hard no-fly gates. Every point of the score traces to a reading. |
| **Launch-Window Optimizer** | [`src/lib/risk.ts`](src/lib/risk.ts) | O(n) sliding window over prefix sums finds the lowest-mean-risk, non-overlapping 2-hour windows in the 24-hour forecast. |
| **A\* Route Planner** | [`src/lib/astar.ts`](src/lib/astar.ts) | A\* over a weighted 72×72 geo-grid with a binary min-heap frontier, octile heuristic, corner-cut prevention, and *soft costs* — storm fringes are penalised, not just blocked — so planned routes keep a safety margin. |
| **Kalman Filter** | [`src/lib/kalman.ts`](src/lib/kalman.ts) | Scalar predict/update Kalman smoothing on the telemetry channels, the way a real ground-control station cleans jittery downlink. |
| **Fuzzy Matcher** | [`src/lib/fuzzy.ts`](src/lib/fuzzy.ts) | Subsequence scorer with consecutive-run and word-boundary bonuses powering the ⌘K command palette. |
| **Cloud-Base Estimation** | [`src/lib/weather.ts`](src/lib/weather.ts) | Lifted-condensation-level approximation (≈125 m per °C of temperature/dew-point spread) — a real meteorological formula, since forecast APIs don't give you the ceiling. |

All of it is covered by a [Vitest suite](src/lib/__tests__) that runs in CI on every push.

## AeroPilot — the AI copilot

AeroPilot answers operational questions ("can I fly?", "when's the best window today?", "any rain coming?") with a **dual-engine design**:

1. **Local engine** ([`src/lib/copilot.ts`](src/lib/copilot.ts)) — deterministic intent matching + template generation grounded in the risk engine and live feed. Zero network, zero cost, always available, fully explainable.
2. **Claude engine** ([`api/copilot.ts`](api/copilot.ts)) — a Vercel serverless function that sends the conversation plus a structured live-data snapshot to **Claude Opus 4.8** (prompt-cached system prompt, abuse guards). It activates automatically when `ANTHROPIC_API_KEY` is set in the Vercel project; otherwise the client transparently falls back to the local engine.

The app never *depends* on a paid API key — graceful degradation is part of the design.

## Features

- 🌍 **Fly anywhere** — ⌘K opens a command palette; type any city and the entire app retargets to its real weather (Open-Meteo geocoding + forecast, free and keyless)
- 📡 **Live conditions** — temperature, wind/gusts, humidity, pressure trend, visibility, UV, precipitation, estimated cloud base; refreshed every 60 s via TanStack Query
- 🎯 **Risk dial** — animated SVG gauge with per-factor breakdown bars and plain-language explanations
- 🗺️ **Tactical map** — custom web-mercator tile renderer (no map library), geofence, geo-anchored storm cells, draggable waypoints, and one-click A\* safe-route planning
- 🤖 **AeroPilot assistant** — chat panel with suggestion chips and per-message engine attribution
- ⌨️ **Keyboard-first** — `1–7` navigate, `⌘K` search, `E` HCI annotations, map layer hotkeys
- 🌗 **Dark/light theme**, persisted, no flash-of-wrong-theme
- 📱 **Fully responsive** — sidebar drawer, fluid grids, works from phone to ultrawide
- 🧪 **38 unit tests + CI** — lint, test, and build gate every push

## Tech stack

| Layer | Choice | Why |
|---|---|---|
| Build | **Vite 6** | Instant HMR, per-route code splitting out of the box |
| UI | **React 19 + TypeScript (strict)** | Latest stable, zero `any` in the codebase |
| Routing | **React Router 7** | Real URLs per screen, lazy-loaded chunks |
| State | **Zustand 5** | Minimal, selector-based, no provider pyramid |
| Server state | **TanStack Query 5** | Caching, refetch intervals, request dedup for the live feed |
| Data | **Open-Meteo** | Free, keyless, CORS-enabled forecasts + geocoding |
| AI | **Claude API** (`@anthropic-ai/sdk`) via Vercel Functions | Optional, gracefully degrading |
| Styling | **Vanilla CSS design tokens** | Hand-built design system, dark/light theming, zero runtime cost |
| Tests | **Vitest** | Fast, Vite-native |
| Deploy | **Vercel** | Static SPA + serverless `/api`, auto-deploy on push |

## Architecture

```
src/
├── lib/                  # Pure algorithm layer — no React, fully unit-tested
│   ├── risk.ts           #   flight-risk engine + launch-window optimizer
│   ├── astar.ts          #   A* pathfinding (min-heap, soft costs) + haversine
│   ├── kalman.ts         #   scalar Kalman filter
│   ├── fuzzy.ts          #   fuzzy subsequence matcher
│   ├── weather.ts        #   Open-Meteo client, WMO codes, LCL cloud base
│   └── copilot.ts        #   AeroPilot local engine + Claude client
├── store/app.ts          # Zustand store (auth, telemetry, alerts, location…)
├── hooks/
│   ├── useWeather.ts     # TanStack Query wiring + live-feed→store bridge
│   └── useSystemEffects.ts # theme, Kalman-filtered telemetry sim, hotkeys
├── components/           # Shell, MissionMap, RiskPanel, CommandPalette, Copilot
├── screens/              # Dashboard, Wind, Control, Reports, HCI screens
└── styles/               # design tokens + per-feature stylesheets
api/
└── copilot.ts            # Vercel serverless function → Claude Opus 4.8
```

The `lib/` layer deliberately contains **no React imports** — every algorithm is a pure function over typed data, which is what makes the 38-test suite possible.

## Getting started

```bash
git clone https://github.com/taha-zaidii/AeroWatch.git
cd AeroWatch
npm install

npm run dev        # → http://localhost:5173
npm test           # run the algorithm test suite
npm run lint       # eslint (0 errors policy)
npm run build      # production build → dist/
```

No environment variables are required — live weather works out of the box.

### Enabling the Claude engine (optional)

1. Get an API key from [console.anthropic.com](https://console.anthropic.com)
2. In your Vercel project: **Settings → Environment Variables → `ANTHROPIC_API_KEY`**
3. Redeploy. AeroPilot replies now show a "Claude" attribution instead of "local risk engine".

## Origins

AeroWatch started as an Advanced HCI course project — the Wireframes, Usability Plan, and HCI Benchmark screens (live Fitts' law testing!) are preserved from that phase. It has since been rebuilt into a full product: real data, real algorithms, real AI, production CI/CD.

## License

MIT
