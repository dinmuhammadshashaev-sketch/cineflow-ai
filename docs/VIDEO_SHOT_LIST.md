# Video Recording Shot List & Guidelines — CineFlow AI

**Target Duration:** Exactly 3:00 (180 Seconds)  
**Aspect Ratio:** 16:9 (1920x1080 Full HD)  
**Frame Rate:** 30fps or 60fps  
**Audio:** Clear voiceover narration with subtle background music (-20dB ducked)

---

## ⛔ STRICT SECURITY & PRIVACY RULES

1. **NO RAW SECRETS IN SOURCE CODE:**
   - Automated scan found no hardcoded secrets in checked source files.
   - NEVER show terminal windows or `.env` files containing raw API keys or credentials during recording.
   - NEVER open browser DevTools Network tab if raw authorization headers are visible.
   - Blur or crop any accidental key/credential exposures.

2. **NO PRIVATE PERSONAL DATA:**
   - Use clean demo project titles ("NEON HARBOR") and sample screenplays provided in the app.
   - Do not display personal email addresses, billing account IDs, or private local file paths.

---

## 🎬 Shot List Matrix

| Shot ID | Time | Visual Focus | Action / On-Screen Content | Audio Focus |
|---|---|---|---|---|
| **SHOT-01** | `0:00–0:10` | Overview Dashboard | View of CineFlow AI header, tagline "From Script to Shoot", and 0-100% Production Readiness Score gauge in **Overview** view. | Intro & Problem Statement |
| **SHOT-02** | `0:10–0:20` | Script View | Open **Script** view showing screenplay text ("NEON HARBOR - EXT. SEATTLE WATERFRONT"). | Impact of manual breakdown errors |
| **SHOT-03** | `0:20–0:35` | Controls & Readiness Indicators | Click **`USE DEMO SCRIPT`**. Highlight budget ($45,000), location (Seattle Industrial Waterfront, WA), and readiness indicators (`GOOGLE ADK / VERTEX READY`, `PARALLEL SEARCH READY`) in Script view. | Setting up production parameters |
| **SHOT-04** | `0:35–0:45` | Workflow Launch | Click **`RUN LIVE AI CREW`** (or **`RUN LOCAL DEMO`** in simulation fallback). SSE event progress bar activates. | Initiating Google ADK SequentialAgent |
| **SHOT-05** | `0:45–1:10` | AI Crew View | Switch to **AI Crew** view. Highlight runtime badge `LIVE — GOOGLE ADK + VERTEX AI` (or `LOCAL DEMO — SIMULATION — NO LIVE AI PROVIDERS`). Show active agent cards updating sequentially: SupervisorAgent -> ScriptAnalystAgent -> DirectorAgent -> ProducerAgent. | Explaining multi-agent departmental separation |
| **SHOT-06** | `1:10–1:30` | Research & Sources Views | Switch to **Research** view (permit rules, drone flight laws), then **Sources** view showing grounded web source cards (or cards explicitly tagged **DEMO / MOCK** in simulation mode). | Regulatory research & truthful source labeling |
| **SHOT-07** | `1:30–1:50` | Risks & Board Views | Click **Risks** view to show high-severity safety risk cards (`HIGH: Night Stunt on Industrial Pier`) with mitigation protocols. Click **Board** view for task cards. | Safeguarding physical production & task tracking |
| **SHOT-08** | `1:50–2:15` | Schedule View | Navigate to **Schedule** view showing location-grouped call sheets across 3 shoot days. | Location-optimized shooting schedule |
| **SHOT-09** | `2:15–2:40` | Overview View | Return to **Overview** view showing Production Readiness Score gauge (`85/100`) and departmental readiness bars (or click **`BUILD PRODUCTION (SIMULATION)`**). | Synthesizing judge-ready metrics |
| **SHOT-10** | `2:40–3:00` | Architecture Summary Slide | Display clean technical summary slide showing Google ADK, Gemini, Express backend, Parallel Search, and Apache 2.0 license. | Closing summary & Call to Action |

---

## 📐 On-Screen Captions & Subtitles Guide

Add high-contrast, centered bottom captions (English) matching voiceover timing:
- `0:05`: *CineFlow AI — Autonomous Film Production Intelligence*
- `0:50`: *Google ADK SequentialAgent orchestrating 8 specialized AI agents*
- `1:15`: *Grounded permit research with truthful DEMO / MOCK source labeling*
- `1:35`: *Automated continuity auditing & high-severity risk detection*
- `2:20`: *Judge-Ready Production Dashboard with 0-100% Readiness Score*
- `2:45`: *100% Open Source (Apache 2.0) | Automated scan found no hardcoded secrets in checked source files*
