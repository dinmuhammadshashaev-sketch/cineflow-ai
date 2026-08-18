# Judge Testing Guide — CineFlow AI

This guide provides hackathon judges with step-by-step instructions to install, verify, and test **CineFlow AI** locally or in a cloud container.

---

## 📋 System Prerequisites

- **Node.js:** v18.0.0 or higher (v20+ / v22+ supported)
- **Package Manager:** npm v9+ (v10+ / v11+ supported with cross-platform lockfile)
- **Operating System:** Linux / macOS / Windows (WSL / Native)

---

## 🚀 Step 1: Environment Setup

1. Clone the repository and navigate into the root directory:
   ```bash
   git clone [REPOSITORY_URL_PLACEHOLDER]
   cd cineflow-ai
   ```

2. Install exact dependencies matching cross-platform lockfile:
   ```bash
   npm ci --no-audit --no-fund
   ```

3. Configure environment variables (Optional for LOCAL DEMO mode):
   Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```

   `.env.example` template:
   ```env
   # Server-Side Secrets (Never exposed to browser)
   # GEMINI_API_KEY alone is not sufficient for the guarded LIVE 8-agent workflow.
   # LIVE workflow requires Vertex AI configuration, Google credentials/ADC, and Parallel readiness.
   GEMINI_API_KEY=
   GOOGLE_CLOUD_PROJECT=
   GOOGLE_CLOUD_LOCATION=global
   GOOGLE_GENAI_USE_VERTEXAI=true
   CINEFLOW_GEMINI_MODEL=gemini-2.5-flash-lite
   PARALLEL_API_KEY=
   ```

---

## ⚡ Step 2: Automated Verification & Test Suite

Run the full automated test suite and compliance checks before launching the application:

1. **Execute All 277 Unit Tests:**
   ```bash
   npm run test:run
   ```
   *Expected Output:* `12 test files passed (12)`, `277 tests passed (277)`.

2. **Run Secret Scanner & Competition Check:**
   ```bash
   npm run security:secrets
   npm run competition:check
   ```
   *Expected Output:* Automated scan found no hardcoded secrets in checked source files, and project-local check verifies Gemini / Google ADK / Parallel Search compliance.

3. **Run Full Release Pipeline Check:**
   ```bash
   npm run release:check
   ```

---

## 💻 Step 3: Launching the Application

1. **Start Development Server:**
   ```bash
   npm run dev
   ```
   Open `http://localhost:3000` in your web browser.

2. **Verify System Health Endpoint:**
   Open `http://localhost:3000/api/health` in your browser or terminal:
   ```bash
   curl -s http://localhost:3000/api/health
   ```
   *Example Response:*
   ```json
   {
     "status": "ok",
     "service": "CineFlow AI Backend (Google ADK Runtime)",
     "runtimeMode": "LOCAL_SIMULATION",
     "modelName": "gemini-2.5-flash-lite",
     "parallel": "UNCONFIGURED",
     "researchProviderReady": false
   }
   ```

---

## 🧪 Step 4: Testing Application Features & Execution Modes

### Path A: Live Google ADK + Vertex AI Execution Path
1. Configure `.env` with `GOOGLE_GENAI_USE_VERTEXAI=true`, `GOOGLE_CLOUD_PROJECT`, Google Cloud ADC/credentials, and `PARALLEL_API_KEY`.
2. Restart the server (`npm run dev`).
3. In the **Script** view, verify readiness indicators confirm `GOOGLE_ADK / VERTEX READY` and `PARALLEL SEARCH READY`.
4. Click **`USE DEMO SCRIPT`** to load "NEON HARBOR" ($45,000 budget, Seattle Industrial Waterfront, WA, 3 shoot days).
5. Click **`RUN LIVE AI CREW`**.
6. Switch to **AI Crew** view and observe the runtime badge `LIVE — GOOGLE ADK + VERTEX AI`.
7. Explore views: **Overview**, **Script**, **Scenes**, **AI Crew**, **Research**, **Sources** (displaying real grounded web search results), **Risks**, **Board**, **Schedule**.
8. **Note:** `GEMINI_API_KEY` alone activates Developer API mode (`GOOGLE_ADK_GEMINI_DEVELOPER_API`) and does NOT pass the guard for `RUN LIVE AI CREW`.

### Path B: Local Simulation / Demo Path (Default - No API Keys Required)
1. Open `http://localhost:3000` without cloud credentials configured.
2. In the **Script** view, click **`USE DEMO SCRIPT`** to load "NEON HARBOR".
3. Click **`RUN LOCAL DEMO`**.
4. Switch to **AI Crew** view to observe the runtime badge `LOCAL DEMO — SIMULATION — NO LIVE AI PROVIDERS`.
5. Observe the 8 roles execute in local deterministic simulation mode without external API calls.
6. Explore views: **Overview** (with **`BUILD PRODUCTION (SIMULATION)`** button), **Script**, **Scenes**, **AI Crew**, **Research**, **Sources** (displaying entries explicitly tagged **DEMO / MOCK**), **Risks**, **Board**, **Schedule**.

---

## 🔍 Troubleshooting

| Issue | Cause | Solution |
|---|---|---|
| `Port 3000 in use` | Another process is occupying port 3000 | Stop existing process or restart terminal session. |
| `LOCAL DEMO badge showing` | Server is running without Vertex AI + ADC config | Expected default behavior for offline local testing. |
| `Guard error on RUN LIVE AI CREW` | Missing Vertex AI, ADC credentials, or Parallel Search key | Check `/api/health` endpoint for exact missing prerequisites. |
