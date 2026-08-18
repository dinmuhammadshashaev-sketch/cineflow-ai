import 'dotenv/config';
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI, Type } from '@google/genai';
import {
  getWorkflowRun,
  subscribeToRunEvents,
  runCineFlowAgenticWorkflow,
  detectTruthfulRuntime
} from './server/agents/cineflow/runner.js';
import { guardWorkflowStart } from './server/workflowRuntimeGuard.js';
import { WorkflowRun } from './src/types/index.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  // API Hardening: Request body size limits
  app.use(express.json({ limit: '2mb' }));

  // Safe Health & Truthful Runtime Status Endpoint
  app.get('/api/health', (_req, res) => {
    const runtime = detectTruthfulRuntime();
    const parallelStatus = process.env.PARALLEL_API_KEY ? 'CONFIGURED' : 'UNCONFIGURED';
    res.json({
      status: 'ok',
      service: 'CineFlow AI Backend (Google ADK Runtime)',
      runtimeMode: runtime.runtimeMode,
      modelName: runtime.modelName,
      project: runtime.project,
      location: runtime.location,
      parallel: parallelStatus,
      researchProviderReady: parallelStatus === 'CONFIGURED'
    });
  });

  // Server-Side Gemini API Proxy for Script Analysis
  app.post('/api/analyze-script', async (req, res) => {
    try {
      const { production, scriptText } = req.body || {};

      if (!production || typeof production !== 'object' || !production.id || !production.title) {
        return res.status(400).json({ error: 'Invalid request payload: production object with id and title is required.' });
      }

      if (typeof scriptText !== 'string' || scriptText.trim().length === 0) {
        return res.status(400).json({ error: 'Invalid request payload: non-empty scriptText string is required.' });
      }

      if (scriptText.length > 100000) {
        return res.status(400).json({ error: 'Script length exceeds maximum allowed limit of 100,000 characters.' });
      }

      const apiKey = process.env.GEMINI_API_KEY;

      if (!apiKey || apiKey === 'MY_GEMINI_API_KEY') {
        return res.status(200).json({
          provider: 'mock',
          model: 'local-simulation',
          simulated: true,
          status: 'UNCONFIGURED',
          message: 'GEMINI_API_KEY is not configured on the server. Fallback to local engine.',
          analysis: null
        });
      }

      const ai = new GoogleGenAI({
        apiKey,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build'
          }
        }
      });

      const prompt = `You are CineFlow AI, an autonomous film production crew supervisor.
Analyze this screenplay breakdown request:
Title: ${production.title}
Type: ${production.type || 'Short Film'}
Location: ${production.location || 'Unknown'}

Screenplay Text:
${scriptText}

Perform a full multi-department breakdown and return JSON conforming to the requested schema. Provide complete, detailed, realistic film production data.`;

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              scenes: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    id: { type: Type.STRING },
                    productionId: { type: Type.STRING },
                    sceneNumber: { type: Type.INTEGER },
                    heading: { type: Type.STRING },
                    intExt: { type: Type.STRING },
                    dayNight: { type: Type.STRING },
                    location: { type: Type.STRING },
                    summary: { type: Type.STRING },
                    complexity: { type: Type.STRING },
                    characters: { type: Type.ARRAY, items: { type: Type.STRING } },
                    props: { type: Type.ARRAY, items: { type: Type.STRING } },
                    wardrobe: { type: Type.ARRAY, items: { type: Type.STRING } },
                    specialRequirements: { type: Type.ARRAY, items: { type: Type.STRING } },
                    directorNotes: { type: Type.STRING },
                    scheduleStatus: { type: Type.STRING },
                    shootDayNumber: { type: Type.INTEGER },
                    estimatedMinutes: { type: Type.INTEGER }
                  },
                  required: ['sceneNumber', 'heading', 'intExt', 'dayNight', 'location', 'summary']
                }
              },
              characters: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    id: { type: Type.STRING },
                    productionId: { type: Type.STRING },
                    name: { type: Type.STRING },
                    roleType: { type: Type.STRING },
                    description: { type: Type.STRING },
                    castRequirements: { type: Type.STRING },
                    sceneCount: { type: Type.INTEGER },
                    sceneNumbers: { type: Type.ARRAY, items: { type: Type.INTEGER } }
                  },
                  required: ['name', 'roleType', 'description']
                }
              },
              props: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    id: { type: Type.STRING },
                    productionId: { type: Type.STRING },
                    name: { type: Type.STRING },
                    category: { type: Type.STRING },
                    description: { type: Type.STRING },
                    fragile: { type: Type.BOOLEAN },
                    sceneNumbers: { type: Type.ARRAY, items: { type: Type.INTEGER } }
                  },
                  required: ['name', 'category', 'description']
                }
              },
              tasks: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    id: { type: Type.STRING },
                    productionId: { type: Type.STRING },
                    title: { type: Type.STRING },
                    description: { type: Type.STRING },
                    category: { type: Type.STRING },
                    priority: { type: Type.STRING },
                    status: { type: Type.STRING },
                    sceneNumber: { type: Type.INTEGER },
                    assignedAgent: { type: Type.STRING }
                  },
                  required: ['title', 'category', 'priority', 'status']
                }
              },
              researchQuestions: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    id: { type: Type.STRING },
                    productionId: { type: Type.STRING },
                    question: { type: Type.STRING },
                    sceneNumber: { type: Type.INTEGER },
                    importance: { type: Type.STRING },
                    status: { type: Type.STRING },
                    findings: { type: Type.STRING }
                  },
                  required: ['question', 'importance']
                }
              },
              risks: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    id: { type: Type.STRING },
                    productionId: { type: Type.STRING },
                    title: { type: Type.STRING },
                    description: { type: Type.STRING },
                    severity: { type: Type.STRING },
                    sceneNumber: { type: Type.INTEGER },
                    reason: { type: Type.STRING },
                    recommendedAction: { type: Type.STRING },
                    status: { type: Type.STRING }
                  },
                  required: ['title', 'severity', 'recommendedAction']
                }
              },
              continuityIssues: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    id: { type: Type.STRING },
                    productionId: { type: Type.STRING },
                    title: { type: Type.STRING },
                    description: { type: Type.STRING },
                    category: { type: Type.STRING },
                    sceneNumbers: { type: Type.ARRAY, items: { type: Type.INTEGER } },
                    severity: { type: Type.STRING },
                    status: { type: Type.STRING },
                    recommendation: { type: Type.STRING }
                  }
                }
              },
              shootDays: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    id: { type: Type.STRING },
                    productionId: { type: Type.STRING },
                    dayNumber: { type: Type.INTEGER },
                    locationName: { type: Type.STRING },
                    sceneNumbers: { type: Type.ARRAY, items: { type: Type.INTEGER } },
                    dayNightFocus: { type: Type.STRING },
                    estimatedHours: { type: Type.INTEGER },
                    notes: { type: Type.STRING }
                  },
                  required: ['dayNumber', 'locationName', 'sceneNumbers']
                }
              },
              readinessScore: { type: Type.INTEGER }
            },
            required: ['scenes', 'characters', 'props', 'tasks', 'researchQuestions', 'risks']
          }
        }
      });

      const rawJson = response.text;
      if (!rawJson) {
        throw new Error('Gemini model returned empty response.');
      }

      const parsedAnalysis = JSON.parse(rawJson);

      return res.json({
        provider: 'gemini',
        model: 'gemini-2.5-flash',
        simulated: false,
        status: 'SUCCESS',
        analysis: parsedAnalysis
      });
    } catch (err: any) {
      console.error('Error in /api/analyze-script:', err?.message || err);
      return res.status(200).json({
        provider: 'gemini',
        model: 'gemini-2.5-flash',
        simulated: true,
        status: 'FAILED',
        error: err?.message || 'Gemini processing failed',
        analysis: null
      });
    }
  });

  // Server-Side Research Endpoint (Parallel Search API Integration)
  app.post('/api/research', async (req, res) => {
    try {
      const { question, context } = req.body || {};

      if (typeof question !== 'string' || question.trim().length === 0 || question.length > 1000) {
        return res.status(400).json({ error: 'Invalid request payload: question string (1-1000 chars) is required.' });
      }

      const { executeParallelSearch } = await import('./server/agents/cineflow/parallelSearchTool.js');
      const searchRes = await executeParallelSearch({
        objective: `Official film permit requirements and regulations for: ${question}`,
        searchQueries: [question, context?.location ? `${context.location} film permit` : 'film permit'].filter(Boolean),
        context
      });

      return res.json({
        provider: 'parallel',
        status: searchRes.providerStatus,
        simulated: searchRes.providerStatus !== 'SUCCESS',
        findings: searchRes.findings,
        sources: searchRes.sources
      });
    } catch (err: any) {
      console.error('Error in /api/research:', err?.message || err);
      return res.status(200).json({
        provider: 'parallel',
        status: 'FAILED',
        error: err?.message || 'Research lookup failed',
        findings: null,
        sources: []
      });
    }
  });

  // -----------------------------------------------------------------
  // STAGE 2.0: REAL GOOGLE ADK MULTI-AGENT WORKFLOW ENDPOINTS
  // -----------------------------------------------------------------

  // Endpoint 1: Start ADK Agentic Workflow (Returns 202 Accepted + runId immediately)
  app.post('/api/agentic-workflow/start', async (req, res) => {
    try {
      const { production, scriptText, mode } = req.body || {};

      if (!production || !production.id || !production.title) {
        return res.status(400).json({ error: 'Valid production object with id and title is required.' });
      }

      const runtimeInfo = detectTruthfulRuntime();
      const isParallelConfigured = Boolean(process.env.PARALLEL_API_KEY && process.env.PARALLEL_API_KEY.trim().length > 0);

      const guard = guardWorkflowStart(mode, runtimeInfo.runtimeMode, isParallelConfigured);
      if (!guard.allowed) {
        return res.status(guard.statusCode || 400).json(guard.responseBody);
      }

      const targetMode = guard.resolvedMode!;
      const runId = `wfr_adk_${Date.now()}`;
      const screenplayText = scriptText || production.scriptText || '';

      const initialRun: WorkflowRun = {
        id: runId,
        productionId: production.id,
        mode: targetMode,
        status: 'RUNNING',
        startedAt: new Date().toISOString(),
        activities: []
      };

      // Launch workflow asynchronously in background
      void runCineFlowAgenticWorkflow({
        runId,
        production,
        screenplayText,
        mode: targetMode
      }).catch((err) => {
        console.error(`Background workflow run ${runId} error:`, err);
      });

      // Immediately respond 202 Accepted with runId
      return res.status(202).json({
        success: true,
        runId,
        status: 'RUNNING',
        workflowRun: initialRun
      });
    } catch (err: any) {
      console.error('Error starting ADK workflow:', err?.message || err);
      return res.status(500).json({ error: err?.message || 'Failed to start ADK multi-agent workflow.' });
    }
  });

  // Endpoint 2: SSE Stream for Live ADK Agent Events
  app.get('/api/agentic-workflow/:runId/events', (req, res) => {
    const { runId } = req.params;

    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders();

    const unsubscribe = subscribeToRunEvents(runId, (evt) => {
      res.write(`data: ${JSON.stringify(evt)}\n\n`);
    });

    const interval = setInterval(() => {
      res.write(`data: ${JSON.stringify({ type: 'HEARTBEAT', timestamp: new Date().toISOString() })}\n\n`);
    }, 2000);

    req.on('close', () => {
      clearInterval(interval);
      unsubscribe();
    });
  });

  // Endpoint 3: Query ADK Workflow Status
  app.get('/api/agentic-workflow/:runId', (req, res) => {
    const { runId } = req.params;
    const existing = getWorkflowRun(runId);

    if (!existing) {
      return res.status(404).json({ error: 'Workflow run not found.' });
    }

    return res.json({
      run: existing.run,
      production: existing.state.production,
      readinessScore: existing.state.readinessScore
    });
  });

  // Vite Middleware / Static serving
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa'
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`🎬 CineFlow AI server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start CineFlow AI server:', err);
  process.exit(1);
});
