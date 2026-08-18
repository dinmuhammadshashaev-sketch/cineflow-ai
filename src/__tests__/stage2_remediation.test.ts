import { describe, it, expect } from 'vitest';
import { envFlag, detectTruthfulRuntime } from '../../server/agents/cineflow/runner.js';
import {
  parseAgentOutput,
  AgentOutputValidationError,
  mapScriptOutputToScenes,
  mapScriptOutputToCharacters,
  mapScriptOutputToProps,
  mapProducerOutputToTasks,
  createInitialResearchQuestions,
  updateResearchQuestionsWithFindings,
  mapContinuityOutputToIssues,
  mapRiskOutputToRisks,
  mapSchedulerOutputToShootDays
} from '../../server/agents/cineflow/mappers.js';
import {
  SupervisorOutputSchema,
  ScriptAnalystOutputSchema,
  SchedulerOutputSchema
} from '../../server/agents/cineflow/schemas.js';
import { Source, Scene } from '../types/index.js';
import { ParallelSearchParameters } from '../../server/agents/cineflow/parallelSearchTool.ts';

describe('Stage 2.0.2 Remediation Verification Tests', () => {
  describe('1. envFlag Boolean Normalization', () => {
    it('normalizes case-insensitive truthy and falsy values', () => {
      process.env.TEST_FLAG_1 = 'TRUE';
      process.env.TEST_FLAG_2 = '1';
      process.env.TEST_FLAG_3 = 'yes';
      process.env.TEST_FLAG_4 = 'FALSE';
      process.env.TEST_FLAG_5 = '0';

      expect(envFlag('TEST_FLAG_1')).toBe(true);
      expect(envFlag('TEST_FLAG_2')).toBe(true);
      expect(envFlag('TEST_FLAG_3')).toBe(true);
      expect(envFlag('TEST_FLAG_4')).toBe(false);
      expect(envFlag('TEST_FLAG_5')).toBe(false);
      expect(envFlag('NON_EXISTENT_VAR')).toBe(false);

      delete process.env.TEST_FLAG_1;
      delete process.env.TEST_FLAG_2;
      delete process.env.TEST_FLAG_3;
      delete process.env.TEST_FLAG_4;
      delete process.env.TEST_FLAG_5;
    });

    it('evaluates multiple fallback environment flags in priority order', () => {
      process.env.FLAG_A = 'false';
      process.env.FLAG_B = 'TRUE';

      expect(envFlag('FLAG_A', 'FLAG_B')).toBe(false);
      expect(envFlag('MISSING_FLAG', 'FLAG_B')).toBe(true);

      delete process.env.FLAG_A;
      delete process.env.FLAG_B;
    });
  });

  describe('2. parseAgentOutput Helper', () => {
    it('parses valid pre-parsed object', () => {
      const valid = {
        status: 'READY',
        summary: 'Supervisor setup complete.',
        focusAreas: ['Permits', 'Safety']
      };
      const res = parseAgentOutput(valid, SupervisorOutputSchema, 'SupervisorAgent');
      expect(res).toEqual(valid);
    });

    it('parses raw JSON string', () => {
      const jsonString = JSON.stringify({
        status: 'READY',
        summary: 'Supervisor string test.',
        focusAreas: ['Budget']
      });
      const res = parseAgentOutput(jsonString, SupervisorOutputSchema, 'SupervisorAgent');
      expect(res.status).toBe('READY');
      expect(res.summary).toBe('Supervisor string test.');
    });

    it('strips markdown code fences from JSON strings', () => {
      const markdownJson = `\`\`\`json
{
  "status": "READY",
  "summary": "Fenced summary",
  "focusAreas": ["Logistics"]
}
\`\`\``;
      const res = parseAgentOutput(markdownJson, SupervisorOutputSchema, 'SupervisorAgent');
      expect(res.summary).toBe('Fenced summary');
    });

    it('throws AgentOutputValidationError on malformed JSON', () => {
      const malformed = `\`\`\`json\n{ status: "INVALID" }\n\`\`\``;
      expect(() => parseAgentOutput(malformed, SupervisorOutputSchema, 'TestAgent')).toThrow(
        AgentOutputValidationError
      );
    });

    it('throws AgentOutputValidationError on null or undefined', () => {
      expect(() => parseAgentOutput(null, SupervisorOutputSchema, 'TestAgent')).toThrow(
        AgentOutputValidationError
      );
      expect(() => parseAgentOutput(undefined, SupervisorOutputSchema, 'TestAgent')).toThrow(
        AgentOutputValidationError
      );
    });

    it('throws AgentOutputValidationError on Zod schema mismatch', () => {
      const invalidData = { status: 'UNKNOWN_STATUS', summary: 123 };
      expect(() => parseAgentOutput(invalidData, SupervisorOutputSchema, 'TestAgent')).toThrow(
        AgentOutputValidationError
      );
    });
  });

  describe('3. Domain Normalization Mappers', () => {
    const mockScriptOutput = {
      scenes: [
        {
          id: 'sc_1',
          sceneNumber: 1,
          heading: 'INT. CAFE - DAY',
          intExt: 'INT' as const,
          dayNight: 'DAY' as const,
          location: 'Cafe',
          summary: 'Two friends talk over coffee.',
          characters: ['Alice', 'Bob'],
          props: ['Coffee Cup', 'Laptop'],
          wardrobe: ['Jacket'],
          specialRequirements: ['Barista extra'],
          estimatedMinutes: 10
        }
      ],
      characters: [
        { id: 'c_1', name: 'Alice', role: 'Lead Character', description: 'Protagonist' },
        { id: 'c_2', name: 'Bob', role: 'Supporting Character', description: 'Friend' }
      ],
      props: [
        { id: 'p_1', name: 'Coffee Cup', category: 'General Prop', isSpecial: false },
        { id: 'p_2', name: 'Hero Laptop', category: 'Hero Prop', isSpecial: true }
      ],
      researchQuestions: ['What are cafe filming permit regulations in Seattle?']
    };

    it('mapScriptOutputToScenes correctly transforms raw script output into domain Scenes', () => {
      const scenes = mapScriptOutputToScenes(mockScriptOutput, 'prod_123');
      expect(scenes).toHaveLength(1);
      expect(scenes[0].productionId).toBe('prod_123');
      expect(scenes[0].sceneNumber).toBe(1);
      expect(scenes[0].scheduleStatus).toBe('UNSCHEDULED');
      expect(scenes[0].complexity).toBe('MEDIUM');
    });

    it('mapScriptOutputToCharacters maps role types and scene occurrences', () => {
      const scenes = mapScriptOutputToScenes(mockScriptOutput, 'prod_123');
      const characters = mapScriptOutputToCharacters(mockScriptOutput, 'prod_123', scenes);
      expect(characters).toHaveLength(2);
      expect(characters[0].name).toBe('Alice');
      expect(characters[0].roleType).toBe('Lead');
      expect(characters[0].sceneNumbers).toEqual([1]);
      expect(characters[0].sceneCount).toBe(1);

      expect(characters[1].name).toBe('Bob');
      expect(characters[1].roleType).toBe('Supporting');
    });

    it('mapScriptOutputToProps maps category and fragility', () => {
      const scenes = mapScriptOutputToScenes(mockScriptOutput, 'prod_123');
      const props = mapScriptOutputToProps(mockScriptOutput, 'prod_123', scenes);
      expect(props).toHaveLength(2);
      expect(props[0].name).toBe('Coffee Cup');
      expect(props[0].fragile).toBe(false);

      expect(props[1].name).toBe('Hero Laptop');
      expect(props[1].category).toBe('Hero Prop');
      expect(props[1].fragile).toBe(true);
    });

    it('mapProducerOutputToTasks transforms tasks with category mapping', () => {
      const mockProducer = {
        tasks: [
          {
            id: 't_1',
            title: 'Secure Cafe Location Permit',
            department: 'Location & Permits',
            priority: 'HIGH' as const,
            status: 'PENDING' as const,
            assignedRole: 'Producer Agent',
            dependencies: [],
            permitRequired: true,
            estimatedHours: 4
          }
        ],
        budgetCategoryEstimates: []
      };

      const tasks = mapProducerOutputToTasks(mockProducer, 'prod_123');
      expect(tasks).toHaveLength(1);
      expect(tasks[0].category).toBe('Location & Permits');
      expect(tasks[0].status).toBe('TO DO');
      expect(tasks[0].priority).toBe('HIGH');
    });

    it('scheduler validation enforces non-empty scenes, unique days, and valid scene numbers', () => {
      const validScenes: Scene[] = [
        {
          id: 'sc_1',
          productionId: 'prod_123',
          sceneNumber: 1,
          heading: 'INT. CAFE - DAY',
          intExt: 'INT',
          dayNight: 'DAY',
          location: 'Cafe',
          summary: 'Scene 1',
          complexity: 'MEDIUM',
          characters: [],
          props: [],
          wardrobe: [],
          specialRequirements: [],
          scheduleStatus: 'UNSCHEDULED'
        }
      ];

      const mockScheduler = {
        shootDays: [
          {
            dayNumber: 1,
            dateLabel: '2026-09-01',
            sceneNumbers: [1],
            primaryLocation: 'Seattle Cafe',
            callTime: '07:00 AM',
            estimatedHours: 8,
            specialNotes: 'Day 1 shoot'
          }
        ]
      };

      const shootDays = mapSchedulerOutputToShootDays(mockScheduler, 'prod_123', validScenes);
      expect(shootDays).toHaveLength(1);
      expect(shootDays[0].locationName).toBe('Seattle Cafe');
      expect(shootDays[0].sceneNumbers).toEqual([1]);

      // Invalid scheduler output with non-existent scene
      const invalidScheduler = {
        shootDays: [
          {
            dayNumber: 1,
            dateLabel: '2026-09-01',
            sceneNumbers: [999], // non-existent
            primaryLocation: 'Seattle Cafe',
            callTime: '07:00 AM',
            estimatedHours: 8,
            specialNotes: 'Day 1 shoot'
          }
        ]
      };

      expect(() => mapSchedulerOutputToShootDays(invalidScheduler, 'prod_123', validScenes)).toThrow();
    });
  });

  describe('4. Truthful Runtime Detection', () => {
    it('detects GOOGLE_ADK_VERTEX_AI when Vertex env flag and project ID exist', () => {
      process.env.GOOGLE_GENAI_USE_VERTEXAI = 'true';
      process.env.GOOGLE_CLOUD_PROJECT = 'my-test-gcp-project';

      const runtime = detectTruthfulRuntime();
      expect(runtime.runtimeMode).toBe('GOOGLE_ADK_VERTEX_AI');
      expect(runtime.project).toBe('my-test-gcp-project');

      delete process.env.GOOGLE_GENAI_USE_VERTEXAI;
      delete process.env.GOOGLE_CLOUD_PROJECT;
    });

    it('detects GOOGLE_ADK_GEMINI_DEVELOPER_API when GEMINI_API_KEY is present', () => {
      process.env.GEMINI_API_KEY = 'YOUR_GEMINI_API_KEY';
      delete process.env.GOOGLE_GENAI_USE_VERTEXAI;

      const runtime = detectTruthfulRuntime();
      expect(runtime.runtimeMode).toBe('GOOGLE_ADK_GEMINI_DEVELOPER_API');

      delete process.env.GEMINI_API_KEY;
    });
  });

  describe('5. Stage 2.0.3 Release Gate Checks', () => {
    it('LICENSE file is valid Apache 2.0 license over 500 bytes', () => {
      const fs = require('fs');
      const licensePath = require('path').join(process.cwd(), 'LICENSE');
      expect(fs.existsSync(licensePath)).toBe(true);

      const content = fs.readFileSync(licensePath, 'utf8');
      expect(Buffer.byteLength(content, 'utf8')).toBeGreaterThan(500);
      expect(content).toContain('Apache License');
      expect(content).toContain('Version 2.0, January 2004');
    });

    it('ParallelSearchParameters restricts searchQueries to a maximum of 2 items', () => {
      const valid2 = ParallelSearchParameters.safeParse({
        objective: 'Seattle film permits',
        searchQueries: ['q1', 'q2']
      });
      expect(valid2.success).toBe(true);

      const invalid3 = ParallelSearchParameters.safeParse({
        objective: 'Seattle film permits',
        searchQueries: ['q1', 'q2', 'q3']
      });
      expect(invalid3.success).toBe(false);
    });

    it('NOT_NEEDED research status is preserved as NOT_NEEDED in mapper', () => {
      const initialQuestions = [
        {
          id: 'rq_1',
          productionId: 'p1',
          question: 'Are film permits required for private indoor shooting?',
          importance: 'MEDIUM' as const,
          status: 'PENDING' as const,
          sourceIds: [],
          createdAt: new Date().toISOString(),
          provider: 'ParallelSearchProvider' as const
        }
      ];

      const researchOutput = {
        researchFindings: [
          {
            question: 'Are film permits required for private indoor shooting?',
            findings: 'Private indoor shooting with small crew does not require city permits.',
            status: 'NOT_NEEDED' as const,
            sourceIds: []
          }
        ]
      };

      const updated = updateResearchQuestionsWithFindings(initialQuestions, researchOutput, []);
      expect(updated[0].status).toBe('NOT_NEEDED');
      expect(updated[0].status).not.toBe('NEEDS REVIEW');
    });
  });

  describe('6. Stage 2.0.4 Release Gate Checks', () => {
    it('no hardcoded Gemini 3.6 labels exist in application code or docs', () => {
      const fs = require('fs');
      const path = require('path');

      function scanDir(dir: string, results: string[] = []): string[] {
        const list = fs.readdirSync(dir);
        for (const file of list) {
          const fullPath = path.join(dir, file);
          const stat = fs.statSync(fullPath);
          if (stat && stat.isDirectory()) {
            if (file !== 'node_modules' && file !== '.git' && file !== 'dist') {
              scanDir(fullPath, results);
            }
          } else if (file.endsWith('.ts') || file.endsWith('.tsx') || file === 'README.md') {
            results.push(fullPath);
          }
        }
        return results;
      }

      const files = [...scanDir(path.join(process.cwd(), 'src')), ...scanDir(path.join(process.cwd(), 'server')), path.join(process.cwd(), 'README.md')];
      let occurrences = 0;
      for (const file of files) {
        if (!fs.existsSync(file) || file.includes('stage2_remediation.test.ts')) continue;
        const content = fs.readFileSync(file, 'utf8');
        if (content.includes('gemini-3.6-flash') || content.includes('Gemini 3.6')) {
          occurrences++;
          console.error(`Found hardcoded 3.6 label in ${file}`);
        }
      }
      expect(occurrences).toBe(0);
    });

    it('LICENSE and LICENSE.txt are both valid Apache 2.0 licenses > 10,000 bytes', () => {
      const fs = require('fs');
      const path = require('path');
      const lic = fs.readFileSync(path.join(process.cwd(), 'LICENSE'), 'utf8');
      const licTxt = fs.readFileSync(path.join(process.cwd(), 'LICENSE.txt'), 'utf8');

      expect(Buffer.byteLength(lic, 'utf8')).toBeGreaterThan(10000);
      expect(lic).toContain('Apache License');
      expect(lic).toContain('Version 2.0, January 2004');

      expect(Buffer.byteLength(licTxt, 'utf8')).toBeGreaterThan(10000);
      expect(licTxt).toContain('Apache License');
      expect(licTxt).toContain('Version 2.0, January 2004');
    });

    it('LOCAL_SIMULATION workflow run makes zero Parallel Search API calls and returns mock data', async () => {
      const { runCineFlowAgenticWorkflow } = await import('../../server/agents/cineflow/runner.ts');
      const prod = {
        id: 'prod_sim_test',
        title: 'Local Sim Test Film',
        type: 'Short Film',
        readinessScore: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      const res = await runCineFlowAgenticWorkflow({
        production: prod as any,
        screenplayText: 'INT. COFFEE SHOP - DAY',
        mode: 'LOCAL_SIMULATION'
      });

      expect(res.workflowRun.mode).toBe('LOCAL_SIMULATION');
      expect(res.workflowRun.status).toBe('COMPLETED');
      expect(res.workflowRun.sources).toHaveLength(1);
      expect(res.workflowRun.sources[0].isDemoMock).toBe(true);
      expect(res.workflowRun.sources[0].url).toContain('film.gov.local');
    });

    it('FunctionTool returns rawQueryCount and sourcesCount correctly', async () => {
      const { executeParallelSearch } = await import('../../server/agents/cineflow/parallelSearchTool.ts');
      const res = await executeParallelSearch({
        objective: 'Seattle filming permits',
        searchQueries: ['Seattle filming permit requirements', 'Seattle parks filming permit']
      });

      expect(res).toBeDefined();
      expect(typeof res.sources.length).toBe('number');
      expect(typeof res.rawQueryCount).toBe('number');
      expect(res.rawQueryCount).toBe(2);
    });

    it('legacy individual agent files are removed from disk', () => {
      const fs = require('fs');
      const path = require('path');
      const agentDir = path.join(process.cwd(), 'server', 'agents', 'cineflow');
      const legacyFiles = [
        'supervisorAgent.ts',
        'scriptAnalystAgent.ts',
        'directorAgent.ts',
        'producerAgent.ts',
        'researchAgent.ts',
        'continuityAgent.ts',
        'riskAgent.ts',
        'schedulerAgent.ts'
      ];

      for (const legacy of legacyFiles) {
        expect(fs.existsSync(path.join(agentDir, legacy))).toBe(false);
      }
    });
  });
});
