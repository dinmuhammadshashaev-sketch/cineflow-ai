# 3-Minute Video Demo Script — CineFlow AI

**Target Duration:** 3 Minutes (180 Seconds)  
**Tone:** Authoritative, Professional, Tech-Forward  
**Audience:** Devpost Hackathon Judges (Google ADK & Gemini Experts)

---

## ⏱ Timeline & Scene Breakdown

### 🎬 Scene 1: Problem Statement & CineFlow AI Overview (0:00 – 0:20)
* **Primary Path (LIVE):**
  > **Voiceover:** "Converting a screenplay into a physical production plan takes line producers weeks of manual work. A single missed permit or continuity error can halt a shoot. Meet CineFlow AI — an autonomous film production engine powered by Google ADK that turns raw scripts into shoot-ready production plans."  
  > **Visual:** Header of CineFlow AI in browser. Clean UI showing title "CineFlow AI — From Script to Shoot" and overview metrics in the Overview view.
* **Honest LOCAL Fallback Path:**
  > **Voiceover:** "If demonstrating in offline environments, CineFlow AI provides a local simulation mode that demonstrates the exact multi-agent workflow layout without external API calls."  
  > **Visual:** Overview view showing local project parameters.

---

### 🎬 Scene 2: Demo Script Selection & Readiness Setup (0:20 – 0:45)
* **Primary Path (LIVE):**
  > **Voiceover:** "We start in the Script view by clicking 'USE DEMO SCRIPT' to load 'NEON HARBOR' — an action sequence set in Seattle Industrial Waterfront, WA with a $45,000 budget across 3 shoot days. In the Script view, notice the readiness indicators confirming 'GOOGLE ADK / VERTEX READY' and 'PARALLEL SEARCH READY'."  
  > **Visual:** Click **`USE DEMO SCRIPT`** in the Script view. Point out the script text ("NEON HARBOR"), $45,000 budget scope, 3 shoot days, and the `GOOGLE ADK / VERTEX READY` and `PARALLEL SEARCH READY` readiness indicators in the Script view.
* **Honest LOCAL Fallback Path:**
  > **Voiceover:** "If Vertex AI or Parallel Search keys are unconfigured, the indicators report 'SIMULATION MODE'. The user can run a deterministic offline simulation via 'RUN LOCAL DEMO'."  
  > **Visual:** Script view showing `SIMULATION MODE` readiness indicators.

---

### 🎬 Scene 3: 8-Agent ADK Pipeline Execution (0:45 – 1:20)
* **Primary Path (LIVE):**
  > **Voiceover:** "When we click 'RUN LIVE AI CREW', Google ADK's `SequentialAgent` launches our 8-agent crew. Switching to the AI Crew view, the runtime badge confirms 'LIVE — GOOGLE ADK + VERTEX AI'. Here, SupervisorAgent parses parameters; ScriptAnalystAgent extracts INT/EXT headers and character counts; DirectorAgent evaluates dramatic pacing; and ProducerAgent builds departmental task backlogs."  
  > **Visual:** Click **`RUN LIVE AI CREW`**. Switch to **AI Crew** view. Highlight the `LIVE — GOOGLE ADK + VERTEX AI` runtime badge on the AI Crew screen. Show active agent execution cards updating step-by-step with real-time SSE progress events.
* **Honest LOCAL Fallback Path:**
  > **Voiceover:** "If running in offline demo mode, click 'RUN LOCAL DEMO'. The AI Crew screen displays the badge 'LOCAL DEMO — SIMULATION — NO LIVE AI PROVIDERS'. Note that this is a local simulation and does NOT execute the real ADK SequentialAgent or live AI models."  
  > **Visual:** Click **`RUN LOCAL DEMO`**. AI Crew view showing the `LOCAL DEMO — SIMULATION — NO LIVE AI PROVIDERS` badge.

---

### 🎬 Scene 4: Research & Grounded Sources (1:20 – 1:50)
* **Primary Path (LIVE):**
  > **Voiceover:** "Next, ResearchAgent executes Parallel Search as an ADK FunctionTool to query live municipal film permit rules, drone flight laws, and environmental restrictions. In the Research and Sources views, we see live grounded search results with verified external URLs."  
  > **Visual:** Navigate to **Research** view, then **Sources** view. Point out real municipal search queries, live snippet results, and verified external source URLs.
* **Honest LOCAL Fallback Path:**
  > **Voiceover:** "In local simulation mode, the Sources view displays research entries explicitly tagged as 'DEMO / MOCK' sources. We never present mock results as proof of live web research."  
  > **Visual:** Sources view showing cards explicitly tagged `DEMO / MOCK`.

---

### 🎬 Scene 5: Risks Audit & Departmental Board (1:50 – 2:15)
* **Primary Path (LIVE):**
  > **Voiceover:** "ContinuityAgent audits hero props across 3 shoot days, while RiskAgent scans for high-severity hazards like night stunts on public piers, assigning severity ratings and actionable mitigation steps."  
  > **Visual:** Click **Risks** view to show high-severity safety risk cards (`HIGH: Night Stunt on Industrial Pier`) with mitigation protocols. Then click **Board** view to show departmental task cards.
* **Honest LOCAL Fallback Path:**
  > **Voiceover:** "In local simulation mode, Risk and Board views display pre-computed risk matrices and task backlogs derived from local screenplay breakdown rules."  
  > **Visual:** Scroll through Risks and Board views in local mode.

---

### 🎬 Scene 6: Shooting Schedule & Production Dashboard (2:15 – 2:40)
* **Primary Path (LIVE):**
  > **Voiceover:** "SchedulerAgent outputs an optimized shooting schedule grouped by location across 3 shoot days. In the Overview tab, the Production Dashboard synthesizes a 0 to 100 percent Production Readiness Score with departmental action priorities."  
  > **Visual:** Navigate to **Schedule** view showing call sheets for Day 1, 2, and 3. Then return to **Overview** view showing the Readiness Score gauge (e.g. `85/100`) and departmental readiness bars.
* **Honest LOCAL Fallback Path:**
  > **Voiceover:** "In local simulation mode, click 'BUILD PRODUCTION (SIMULATION)' to calculate local readiness metrics."  
  > **Visual:** Click **`BUILD PRODUCTION (SIMULATION)`** in Overview view.

---

### 🎬 Scene 7: Google Cloud Architecture & Summary Value (2:40 – 3:00)
* **Primary Path (LIVE):**
  > **Voiceover:** "Built with Google ADK, Gemini, Express, and Parallel Search, CineFlow AI proves the power of agentic AI in creative logistics. Automated security scanners found no hardcoded secrets in checked source files. Source code is open under Apache 2.0. Thank you!"  
  > **Visual:** Return to Architecture diagram or README summary screen. Display closing slide with PENDING placeholders for Devpost, repo, and hosted app URLs.
* **Honest LOCAL Fallback Path:**
  > **Voiceover:** "For judge evaluation without live cloud credentials, all 277 automated unit tests pass locally via `npm run test:run`."  
  > **Visual:** Show terminal output of `npm run release:check` passing all 277 tests.
