# SaansAI (साँस AI) — Intelligent Air Quality Companion
> **Competition Entry for Google Developers Prompt War Challenge 6**  
> *An agentic, scientifically rigorous environmental intelligence platform empowering citizens against hazardous air pollution.*

---

## 🌟 Executive Overview

**SaansAI** is an advanced environmental health and air quality decision-support platform designed for citizens, families, and communities in severely polluted regions such as the Indo-Gangetic Plain and Delhi NCR. 

Unlike generic AQI aggregators that report lagging numbers or generic weather warnings, SaansAI combines:
1. **Statutory Regulatory Precision**: CPCB National Air Quality Index (NAQI) compliance alongside short-term hourly indicative indicators (HISI) and spatial Inverse Distance Weighting (IDW).
2. **First-Principles Environmental Physics**: An analytical mass-balance ordinary differential equation (ODE) simulator modeling indoor aerosol decay, infiltration, CADR purification, and internal particle generation.
3. **Agentic Generative AI**: Powered by Google's official `@google/genai` SDK and Gemini 2.5/3.8 Flash, utilizing an autonomous 13-tool registry with loop bounding and strict anti-hallucination guardrails.
4. **Actionable Personalization**: Diurnal atmospheric boundary layer routine modeling, mask penetration factors, and cohort-specific non-diagnostic health advisories.

---

## 🚀 Completed Stages & Implementation Summary

### ✅ Stage 1: UI Shell, Design System & Accessibility
- **Modern Web Foundation**: Built on Next.js 15 App Router, React 19, strict TypeScript, and Tailwind CSS v4.
- **Visual Design**: Minimalist environmental aesthetic utilizing an `#0891B2` cyan primary palette, neutral slate surfaces, and accessible contrast ratios (WCAG AA).
- **Navigation & Layout**: Responsive shell featuring desktop sidebar, mobile drawer, persistent environmental health disclaimer, and dynamic active-tab indicators.
- **Verification**: Strict ESLint, zero TypeScript errors, responsive layout across mobile, tablet, and widescreen.

### ✅ Stage 2: Backend Architecture & AQI Data Pipeline
- **Dual-Provider Telemetry**: Primary integration with OpenAQ v3 API backed by real-time Open-Meteo Air Quality reanalysis and CAAQMS station mapping.
- **Statutory CPCB NAQI Engine**: Implements the official 8-pollutant sub-index breakpoint algorithms ($\text{PM}_{2.5}, \text{PM}_{10}, \text{NO}_2, \text{NH}_3, \text{SO}_2, \text{CO}, \text{O}_3, \text{Pb}$).
  - Strictly enforces the statutory **16-hour minimum data sufficiency** rule for 24-hour averages.
  - Enforces the statutory **3-pollutant minimum requirement** (requiring at least one particulate).
- **Hourly Indicative Sub-Index (HISI)**: Distinctly separates short-term hourly snapshots from official 24-hour CPCB AQI to eliminate misrepresentation.
- **Spatial Interpolation**: Bounded Inverse Distance Weighting (IDW) engine for estimating pollutant concentrations at unmonitored coordinates with distance falloff.
- **Caching & Resilience**: TTL-governed in-memory cache preventing API rate-limit exhaustion.

### ✅ Stage 3: Personalized Daily Routine & Diurnal Risk Engine
- **Cohort-Specific Preference Engine**: Zod-validated user preferences (active hours, indoor/outdoor balance, commute mode, sensitivity profile without diagnostic medical disclosures).
- **Atmospheric Boundary Layer (ABL) Diurnal Model**: Models morning temperature inversions (pollutant trapping), afternoon solar convection (peak dispersion), and evening cooling accumulation.
- **Hourly Activity Scheduler**: Deterministic algorithm generating safe outdoor activity windows, N95/FFP2 mask advisories, and indoor sanctuary timings.
- **Interactive Diurnal Timeline**: Visual 24-hour scrubber at `/routine` displaying pollutant trajectories, risk tiers, and specific mitigation strategies.

### ✅ Stage 4: Full Agentic AI Integration (`@google/genai`)
- **Official Google GenAI SDK**: Implemented via `@google/genai` (v3.5.0) targeting Gemini models (`gemini-2.5-flash` / `gemini-3.8-flash`) configurable via `GEMINI_MODEL`.
- **Autonomous Multi-Turn Tool Calling**: Gemini autonomously queries actual environmental telemetry, spatial models, and routine engines to resolve user queries.
- **Strict Anti-Hallucination Guardrails**: Model system instructions prevent inventing AQI values, forecasts, or medical diagnoses.
- **Execution Safeguards**: Bounded tool iteration loop (maximum 5 turns) with cycle detection preventing infinite execution.
- **Real-Time Streaming**: Server-Sent Events (SSE) streaming API route (`/api/chat`) yielding token-by-token responses and tool execution telemetry to the assistant UI (`/assistant`).

### ✅ Stage 5: Advanced Indoor Air Quality Simulator & Sanctuary Lab
- **First-Principles Mass-Balance ODE Model**:
  $$\frac{dC}{dt} = P \lambda C_{\text{out}} + \frac{S(t)}{V} - (\lambda + k_f + k_d) C$$
  Solved via exact analytical piecewise integration:
  $$C(t + \Delta t) = C_{\text{ss}} + (C(t) - C_{\text{ss}}) e^{-K_{\text{total}} \Delta t}$$
  Guaranteeing unconditional numerical stability ($C \ge 0$) for arbitrary time steps.
- **Peer-Reviewed Physical Parameters**:
  - Infiltration air exchange rates ($\lambda \in [0.35, 8.5]\,\text{h}^{-1}$) across building envelope tightness tiers.
  - Penetration factors ($P = 0.70$ for $\text{PM}_{2.5}$, $0.40$ for $\text{PM}_{10}$).
  - Surface deposition rates ($k_{d,2.5} = 0.24\,\text{h}^{-1}$, $k_{d,10} = 1.05\,\text{h}^{-1}$).
  - HEPA CADR mechanical clearance ($k_f = \text{CADR}/V$) with variable fan speed multipliers.
  - Internal emission rates for Indian cooking, incense (*agarbatti*), mosquito coils, candles, and smoking.
- **Scenario Comparison Lab**: Multi-scenario evaluation matrix (e.g., *Winter Smog Defense*, *Ventilation Dilemma*, *Cooking Surge*) quantifying cumulative exposure Area Under the Curve ($\text{AUC}$), peak concentrations, and clearance half-life ($t_{1/2}$).
- **Deterministic Action Advisories**: Evidence-based recommendations for CADR sizing, weather-stripping, and kitchen exhaust isolation. Never advises window ventilation during Severe ambient air quality.
- **User-Isolated Room Persistence**: Server-side in-memory store isolated by `userId` with confirmation mutation safety gates (`isConfirmed: true`).
- **5 Simulator Agent Tools**: Extended agent tool registry to 13 total tools.
- **Rich Interactive UI at `/indoor-sanctuary`**:
  - Isometric 2D SVG chamber diagram with dimensions, CADR vortex, and emission plume animations.
  - Interactive SVG time-series chart with scrubber, outdoor baseline, and WHO/CPCB statutory threshold lines.
  - Comparative exposure delta matrix.

---

## 🛠️ Complete Agentic Tool Registry (13 Tools)

| Tool Name | Domain | Description |
| :--- | :--- | :--- |
| `get_current_aqi` | Ambient AQI | Retrieves official CPCB AQI and hourly indicative sub-index for any supported city/station. |
| `get_pollutant_breakdown` | Ambient AQI | Returns discrete concentrations for all 8 monitored pollutants with statutory status. |
| `get_station_readings` | Ambient AQI | Fetches individual CAAQMS station telemetry, coordinates, and reporting timestamps. |
| `estimate_aqi_at_location` | Spatial IDW | Calculates distance-weighted pollutant concentrations for arbitrary coordinates. |
| `list_available_stations` | Stations | Lists all active monitoring stations with geographical coordinates and status. |
| `get_daily_routine_recommendation` | Personalization | Generates diurnal schedule, safe activity windows, and protective recommendations. |
| `calculate_exposure_dose` | Health / Physics | Calculates inhaled particulate mass based on ventilation rates and ambient concentration. |
| `get_health_guidelines` | Health | Returns official CPCB and WHO exposure thresholds and health advisory bands. |
| `simulate_indoor_air_quality` | Indoor Physics | Executes mass-balance ODE simulation for a customized room over a defined time horizon. |
| `compare_indoor_scenarios` | Indoor Physics | Evaluates multiple indoor intervention configurations and returns exposure deltas. |
| `explain_simulation_results` | Indoor Physics | Generates plain-language scientific explanations of indoor clearance rates and half-life. |
| `get_room_configuration` | Persistence | Retrieves saved room geometries, filtration hardware, and baseline conditions. |
| `save_room_configuration` | Persistence | Persists user room parameters with mandatory `isConfirmed: true` mutation safety guard. |

---

## 📂 Repository Architecture

```
challenge-6/
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   ├── aqi/
│   │   │   │   ├── live/route.ts        # GET: Live station & aggregated AQI data
│   │   │   │   └── stations/route.ts    # GET: Active CAAQMS station registry
│   │   │   ├── chat/route.ts            # POST: SSE agentic Gemini streaming endpoint
│   │   │   ├── conversations/route.ts   # GET & POST: User conversation store
│   │   │   └── simulator/
│   │   │       ├── simulate/route.ts    # POST: Single-room physical simulation
│   │   │       ├── compare/route.ts     # POST: Multi-scenario comparative simulation
│   │   │       └── rooms/
│   │   │           ├── route.ts         # GET & POST: User room configurations
│   │   │           └── [id]/route.ts    # GET, PUT, DELETE: Room-level CRUD
│   │   ├── assistant/page.tsx           # Multi-turn streaming conversational AI UI
│   │   ├── commute-optimizer/page.tsx   # Commute exposure interface (Stage 6)
│   │   ├── dashboard/page.tsx           # Live ambient AQI & pollutant monitoring
│   │   ├── indoor-sanctuary/page.tsx    # Indoor air quality simulator & scenario lab
│   │   ├── routine/page.tsx             # Diurnal timeline & daily routine planner
│   │   ├── layout.tsx                   # Root UI shell, navigation, and disclaimer
│   │   └── page.tsx                     # Landing page and platform overview
│   ├── components/
│   │   ├── layout/                      # Navbar, Sidebar, Footer, MobileNav
│   │   ├── simulator/                   # RoomSchematic, SimulationChart, ComparisonChart
│   │   └── ui/                          # Button, Card, Badge, Slider, Tabs, Dialog
│   ├── data/
│   │   └── stations.ts                  # Delhi NCR CAAQMS station reference data
│   └── lib/
│       ├── agent/                       # Gemini SDK, 13 tools, runner, system prompt
│       ├── aqi/                         # CPCB calculator, HISI indicator, IDW interpolator
│       ├── routine/                     # Diurnal atmospheric model & activity planner
│       └── simulator/                   # Analytical ODE engine, scenarios, constants, store
└── tests/
    ├── agent/                           # Agent tool registration and runner tests
    ├── aqi/                             # CPCB AQI formulas, HISI, and IDW tests
    ├── routine/                         # Diurnal model and preferences tests
    └── simulator/                       # Engine physics, scenarios, tools, security tests
```

---

## 🧪 Test Suite & Quality Verification

SaansAI maintains an extensive automated test suite covering regulatory math, physical differential equations, agent tool safety, and user data isolation:

```bash
# Run all 72 automated tests
npm test
```

### Test Suite Breakdown (72/72 Passing):
- **Indoor Simulator Engine (`tests/simulator/simulator-engine.test.ts`)**: 8/8 passing
  - Tests zero-baseline decay, ambient infiltration equilibrium, CADR clearance kinetics, internal emission spikes, analytical stability, and half-life calculations.
- **Scenario Lab (`tests/simulator/simulator-scenarios.test.ts`)**: 3/3 passing
  - Tests comparative deltas, preset validation, and non-empty time-series output.
- **Simulator Agent Tools (`tests/simulator/simulator-tools.test.ts`)**: 5/5 passing
  - Tests schema validation, simulation tool outputs, scenario comparison tool, room fetch, and confirmation safety gates.
- **Security & User Isolation (`tests/simulator/simulator-security.test.ts`)**: 4/4 passing
  - Tests cross-user room isolation, room modification authorization, and deletion safety.
- **AQI & Regulatory Suite (`tests/aqi/`)**: 22/22 passing
  - Validates CPCB sub-index math, 16-hour data sufficiency rules, 3-pollutant requirements, HISI vs. 24-hr AQI separation, and IDW interpolation.
- **Routine Engine (`tests/routine/`)**: 14/14 passing
  - Validates diurnal ABL dispersion curves, preference constraints, and non-diagnostic health advisories.
- **Agent Tools Core (`tests/agent/`)**: 16/16 passing
  - Validates Gemini SDK tool invocation, loop termination, and hallucination guardrails.

### Static Analysis & Build Verification:
- **TypeScript**: `npx tsc --noEmit` — 0 errors.
- **ESLint**: `npx eslint src/ tests/` — 0 errors, 0 warnings.
- **Next.js Production Build**: `npm run build` — 17 static and dynamic routes compiled with Turbopack.

---

## 🏃 Getting Started

### Prerequisites
- Node.js 18.18.0 or later (Node.js 24 recommended)
- Google Gemini API Key

### Installation

1. **Clone the repository and install dependencies**:
   ```bash
   git clone https://github.com/your-repo/saansai.git
   cd saansai
   npm install
   ```

2. **Configure Environment Variables**:
   Copy the example environment file:
   ```bash
   cp .env.example .env.local
   ```
   Add your Gemini API key in `.env.local`:
   ```env
   GEMINI_API_KEY=your_gemini_api_key_here
   GEMINI_MODEL=gemini-2.5-flash
   NEXT_PUBLIC_APP_URL=http://localhost:3000
   ```

3. **Start the Development Server**:
   ```bash
   npm run dev
   ```
   Open [http://localhost:3000](http://localhost:3000) in your browser.

4. **Run Production Build**:
   ```bash
   npm run build
   npm run start
   ```

---

## 📄 License & Attribution

Developed for **Google Developers Prompt War Challenge 6**.  
Built with [Next.js](https://nextjs.org), [Tailwind CSS](https://tailwindcss.com), [Google GenAI SDK](https://www.npmjs.com/package/@google/genai), and environmental data provided by Central Pollution Control Board (CPCB) guidelines and OpenAQ.
