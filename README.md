# CineFlow AI — From Script to Shoot

**Category:** Agentic AI / Film Production Intelligence / Production Workflow Automation  
**Hackathon:** Agentic Cinema: The Blockbuster Hackathon  
**Tagline:** From Script to Shoot — Powered by an Autonomous Google ADK Multi-Agent Crew.

---

## 🔗 Devpost Submission Links & Placeholders

* **Devpost Project:** `[DEVPOST_PROJECT_URL_PLACEHOLDER]` *(Status: PENDING)*
* **Hosted Application:** `[HOSTED_APP_URL_PLACEHOLDER]` *(Status: PENDING)*
* **GitHub Repository:** `[REPOSITORY_URL_PLACEHOLDER]` *(Status: PENDING)*
* **3-Minute Video Demo:** `[DEMO_VIDEO_URL_PLACEHOLDER]` *(Status: PENDING)*

---

## ⚖️ Judge Quick Start & Testing Documentation

- **[Judge Test & Setup Guide](docs/JUDGE_TEST_GUIDE.md):** Installation, environment variables, health checks, and LOCAL / LIVE execution path walkthroughs.
- **[3-Minute Demo Video Script](docs/DEMO_SCRIPT_3_MIN.md):** Timestamped narration and visual walkthrough script for judges.
- **[Devpost Submission Draft](docs/DEVPOST_SUBMISSION_DRAFT.md):** Project summary, architecture details, problem/solution statement, and Devpost compliance matrix.
- **[Video Recording Shot List](docs/VIDEO_SHOT_LIST.md):** Scene-by-scene recording guidelines with privacy and security rules.

### Quick Start Commands
```bash
# 1. Install exact dependencies
npm ci --no-audit --no-fund

# 2. Run automated test suite
npm run test:run

# 3. Start development server (http://localhost:3000)
npm run dev
```

---

## 🎬 Overview

**CineFlow AI** is an autonomous multi-agent film production intelligence engine built on the **Google Agent Development Kit (ADK)**. It automates screenplay breakdown, risk detection, regulatory permit research, continuity tracking, and shooting schedule optimization.

Built with Google ADK `SequentialAgent`, Gemini `LlmAgent` instances, and Parallel Search `FunctionTool`, CineFlow AI bridges creative screenwriting and physical production logistics.

---

## 🏗 System Architecture & Endpoints

```
 Screenplay Input ("NEON HARBOR", $45,000, Seattle Waterfront)
             │
             ▼
   [Express + Vite Server] ──► POST /api/agentic-workflow/start
             │                 GET  /api/agentic-workflow/:runId/events (SSE)
             │                 GET  /api/agentic-workflow/:runId
             │                 GET  /api/health
             ▼
 ┌─────────────────────────────────────────────────────────────┐
 │       Google ADK SequentialAgent Crew Orchestration         │
 ├──────────────┬──────────────────────────────┬───────────────┤
 │ Supervisor   │ ScriptAnalyst                │ Director      │
 │ Producer     │ Research (Parallel Tool)     │ Continuity    │
 │ Risk         │ Scheduler                    │               │
 └──────────────┴──────────────────────────────┴───────────────┘
             │                                        │
             ▼                                        ▼
    Vertex AI / Gemini API                     Parallel Search API
 (Server-Side Key Protection)           (Grounded Web Permits)
             │                                        │
             └──────────────────┬─────────────────────┘
                                │
                                ▼
         React 19 + Tailwind Judge-Ready Dashboard
          (0-100% Production Readiness Metric)
```

- **Google ADK Orchestration**: `SequentialAgent` orchestrating 8 `LlmAgent` instances.
- **Session State & Persistence**: Google ADK session state is managed in-memory during workflow execution via `InMemoryRunner`, while frontend application state uses client-side local storage.
- **Function Tooling**: Custom Parallel Search `FunctionTool` for live web permit validation.
- **Real-Time Streaming**: Server-Sent Events (SSE) `/api/agentic-workflow/:runId/events` transmitting real-time agent execution events to the UI.
- **Backend**: Express + Node.js (`server.ts`), integrated via Vite middleware with `dotenv/config`.
- **Frontend**: React 19 + TypeScript + Tailwind CSS.

### Actual API Endpoints
- `POST /api/agentic-workflow/start`: Triggers Google ADK multi-agent workflow execution.
- `GET /api/agentic-workflow/:runId/events`: Real-time SSE event stream for active workflow progress.
- `GET /api/agentic-workflow/:runId`: Fetches workflow state and results by run ID.
- `GET /api/health`: Health check reporting system status, ADK runtime mode, and provider key readiness without revealing raw secrets.

---

## 🚀 Key Features & 8-Agent Autonomous Crew Pipeline

CineFlow AI deploys an **8-Agent ADK Crew** executed sequentially via `SequentialAgent`:

1. **SupervisorAgent**: Parses production parameters, budget scope ($45,000), and target location (Seattle Industrial Waterfront, WA).
2. **ScriptAnalystAgent**: Breaks down scenes, INT/EXT headers, lighting times, character counts, and prop manifests.
3. **DirectorAgent**: Analyzes dramatic pacing, visual atmosphere, and camera/lighting complexity.
4. **ProducerAgent**: Generates departmental task backlogs across Art, Permits, Casting, and Legal.
5. **ResearchAgent**: Queries municipal regulations, drone flight laws, and permits via Parallel Search `FunctionTool`.
6. **ContinuityAgent**: Audits prop journeys, hero assets, and wardrobe timelines across 3 non-linear shoot days.
7. **RiskAgent**: Scans for high-risk hazards (night shoots, water stunts, pyro, public permits) and assigns severity ratings.
8. **SchedulerAgent**: Formulates location-efficient shooting call sheets and day breakdown blocks.

---

## 🔐 Honest Runtime Execution Modes

CineFlow AI strictly enforces **truthful system states**:

1. **LIVE — GOOGLE ADK + VERTEX AI**:
   - User clicks **`RUN LIVE AI CREW`**.
   - Launches real Google ADK `SequentialAgent` executing 8 `LlmAgent` instances sequentially.
   - `ResearchAgent` invokes real Parallel Search `FunctionTool` for live municipal permit research.
   - Displays real grounded web sources in Research & Sources views.
   - Displays runtime badge on the **AI Crew** screen after launch: `LIVE — GOOGLE ADK + VERTEX AI`.
   - Strictly guarded by server-side runtime checks (`server/workflowRuntimeGuard.ts`).
   - Requires `GOOGLE_GENAI_USE_VERTEXAI=true`, configured `GOOGLE_CLOUD_PROJECT`, Google Cloud ADC/credentials, and `PARALLEL_API_KEY`.
   - **Note:** `GEMINI_API_KEY` alone activates Developer API mode (`GOOGLE_ADK_GEMINI_DEVELOPER_API`) and is not sufficient to pass the guard for `RUN LIVE AI CREW`.

2. **LOCAL DEMO — SIMULATION — NO LIVE AI PROVIDERS**:
   - User clicks **`RUN LOCAL DEMO`**.
   - Executes deterministic local simulation of the 8 production breakdown roles.
   - Real Google ADK `SequentialAgent`, Gemini, Vertex AI, and Parallel Search are **NOT** invoked.
   - Research sources are explicitly labeled **DEMO / MOCK** sources.
   - Displays runtime badge on the **AI Crew** screen after launch: `LOCAL DEMO — SIMULATION — NO LIVE AI PROVIDERS`.

---

## 💻 Local Development & Commands

### Environment Variables

Configure server-side variables in `.env`. `.env.example` contains placeholders only:

```env
GEMINI_API_KEY=
GOOGLE_CLOUD_PROJECT=
GOOGLE_CLOUD_LOCATION=global
GOOGLE_GENAI_USE_VERTEXAI=true
CINEFLOW_GEMINI_MODEL=gemini-2.5-flash-lite
PARALLEL_API_KEY=
```

### Commands

```bash
# 1. Run Development Server
npm run dev

# 2. Run Automated Vitest Test Suite (277 tests)
npm run test:run

# 3. Security & Compliance Checks
npm run security:secrets
npm run competition:check
npm run release:check

# 4. Build & Production Start
npm run build
npm start
```

---

## 🏆 Evidence-Based Verification & Standards
- Project-local competition check passes (`npm run competition:check`).
- Automated scan found no hardcoded secrets in checked source files (`npm run security:secrets`).
- All 277 automated unit tests pass across 12 test suites.
- Complete Apache License 2.0 compliance.
- Final submission acceptance depends on Devpost hackathon judges.
