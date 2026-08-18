# Devpost Submission Draft — CineFlow AI

> **Tagline:** From Script to Shoot — Powered by an Autonomous Google ADK Multi-Agent Crew.

---

## 🔗 Project Links & Submission Status

* **Devpost Submission URL:** `[DEVPOST_PROJECT_URL_PLACEHOLDER]` *(Status: PENDING)*
* **Hosted Application URL:** `[HOSTED_APP_URL_PLACEHOLDER]` *(Status: PENDING)*
* **GitHub Repository URL:** `[REPOSITORY_URL_PLACEHOLDER]` *(Status: PENDING)*
* **3-Minute Video Demo URL:** `[DEMO_VIDEO_URL_PLACEHOLDER]` *(Status: PENDING)*
* **Hackathon Category:** Agentic Cinema: The Blockbuster Hackathon

---

## 💡 The Problem

Independent filmmakers and studio line producers face a major operational hurdle: converting a screenplay into a physical production plan requires weeks of tedious manual department breakdowns. Producers must extract locations, characters, props, legal permits, drone flight restrictions, continuity schedules, and safety hazards. A single overlooked continuity error or missing municipal film permit can halt an active shoot.

---

## 🎬 The Solution: CineFlow AI

**CineFlow AI** is an autonomous film production intelligence platform built on the **Google Agent Development Kit (ADK)**. 

By executing a crew of **8 specialized AI agents** structured via ADK `SequentialAgent`, CineFlow AI transforms raw screenplays (such as the demo script **"NEON HARBOR"**, set in Seattle Industrial Waterfront, WA with a $45,000 budget across 3 shoot days) into comprehensive shoot schedules, departmental task backlogs, continuity matrices, risk mitigation registries, and permit research reports.

---

## 👥 Target Audience & User Interface

CineFlow AI serves Line Producers, 1st ADs, Location Managers, and Independent Filmmakers via 9 structured views:
1. **Overview:** Executive summary and Production Readiness Score (0–100%).
2. **Script:** Screenplay text viewer and header analysis with readiness indicators (`GOOGLE ADK / VERTEX READY`, `PARALLEL SEARCH READY`).
3. **Scenes:** INT/EXT scene decomposition and element manifests.
4. **AI Crew:** Real-time 8-agent ADK execution timeline, status cards, and runtime mode badges.
5. **Research:** Municipal permit research, drone flight restrictions, and environmental rules.
6. **Sources:** Grounded research source citations (labeled **DEMO / MOCK** in local simulation mode).
7. **Risks:** High-severity production safety risk audit and mitigation protocols.
8. **Board:** Departmental task breakdown board.
9. **Schedule:** Location-optimized shooting call sheets across 3 shoot days.

---

## 🤖 The 8-Agent ADK Crew Architecture

1. **SupervisorAgent:** Parses production parameters, budget scope ($45,000), and target locations (Seattle Industrial Waterfront, WA).
2. **ScriptAnalystAgent:** Performs scene breakdown, header extraction (INT/EXT, DAY/NIGHT), character counting, and prop manifests.
3. **DirectorAgent:** Analyzes dramatic pacing, visual atmosphere, lighting complexity, and camera coverage requirements.
4. **ProducerAgent:** Formulates departmental task backlogs across Art, Legal, Permits, Casting, and Transportation.
5. **ResearchAgent:** Queries municipal regulations, film permits, and drone flight laws via Parallel Search `FunctionTool`.
6. **ContinuityAgent:** Audits prop journeys, hero assets, character wardrobe timelines, and detects cross-scene logical flaws across 3 shoot days.
7. **RiskAgent:** Scans for high-severity production risks (night shoots, water stunts, pyro, public permits) and outputs mitigation protocols.
8. **SchedulerAgent:** Assembles location-optimized call sheets, day breakdown blocks, and shoot timelines.

---

## ☁️ Google Cloud & Gemini Architecture

- **Google Agent Development Kit (ADK):** Uses native ADK `SequentialAgent` and `LlmAgent` classes to enforce structured, deterministic agent handoffs.
- **Session State & Persistence:** ADK session state is managed in-memory during workflow execution via `InMemoryRunner`, while frontend application state uses client-side local storage.
- **Server-Side Security:** Provider credentials are read server-side, and the automated scanner found no hardcoded credentials in the checked client source (`server.ts` with `dotenv/config`).
- **Real-Time Streaming:** Server-Sent Events (SSE) `/api/agentic-workflow/:runId/events` stream live execution logs, active agent states, and progress metrics to the frontend UI.

---

## 🔐 Honest Runtime Execution Modes

- **LIVE — GOOGLE ADK + VERTEX AI**:
  - Triggered via the **`RUN LIVE AI CREW`** button in the UI.
  - Launches real Google ADK `SequentialAgent` executing 8 `LlmAgent` instances.
  - `ResearchAgent` invokes real Parallel Search `FunctionTool` for live municipal permit research.
  - Displays real grounded web sources in Research & Sources views.
  - Displays runtime badge on the **AI Crew** screen after launch: `LIVE — GOOGLE ADK + VERTEX AI`.
  - Guarded by server-side runtime checks (`server/workflowRuntimeGuard.ts`). Requires `GOOGLE_GENAI_USE_VERTEXAI=true`, `GOOGLE_CLOUD_PROJECT`, Google Cloud ADC credentials, and `PARALLEL_API_KEY`.
  - `GEMINI_API_KEY` alone activates Developer API mode (`GOOGLE_ADK_GEMINI_DEVELOPER_API`) and does not pass the guard for live execution.

- **LOCAL DEMO — SIMULATION — NO LIVE AI PROVIDERS**:
  - Triggered via the **`RUN LOCAL DEMO`** button in the UI.
  - Runs offline deterministic simulation without external API calls or real ADK execution.
  - Displays runtime badge on the **AI Crew** screen after launch: `LOCAL DEMO — SIMULATION — NO LIVE AI PROVIDERS`.
  - Research sources are explicitly labeled **DEMO / MOCK** sources.

---

## ⚡ Technical Accomplishments & Evidence

- **277/277 Automated Unit Tests Passing** across 12 test suites.
- **Automated Scan Found No Hardcoded Secrets in Checked Source Files:** `npm run security:secrets` found zero hardcoded keys.
- **Project-Local Competition Check Passing:** `npm run competition:check` verifies only Gemini, Google ADK, and Parallel Search are present and active.
- **Final Acceptance:** Subject to Devpost hackathon judge review.
