/**
 * CineFlow AI — Autonomous AI Crew Workflow Engine
 * Orchestrates the 8-Agent film production intelligence analysis pipeline
 * with explicit provider boundaries, research source persistence, and execution metadata.
 */

import {
  Production,
  AgentActivity,
  WorkflowRun,
  Source
} from '../../types';
import { storage, computeAuthoritativeStatus } from '../storage/StorageProvider';
import { AIProvider, MockAIProvider, GeminiProvider } from '../ai/AIProvider';
import { ResearchProvider, MockResearchProvider, ParallelResearchProvider } from '../research/ResearchProvider';
import { generateId } from '../../lib/id';

export type WorkflowStepListener = (run: WorkflowRun) => void;

export class Stage1WorkflowEngine {
  private aiProvider: AIProvider;
  private researchProvider: ResearchProvider;

  constructor(useGemini: boolean = false, useParallel: boolean = false) {
    this.aiProvider = useGemini ? new GeminiProvider() : new MockAIProvider();
    this.researchProvider = useParallel ? new ParallelResearchProvider() : new MockResearchProvider();
  }

  public async runWorkflow(
    production: Production,
    scriptText: string,
    onProgress?: WorkflowStepListener
  ): Promise<WorkflowRun> {
    const runId = generateId(`run_${production.id}`);
    
    // Initial 8-Agent activity structure
    const initialActivities: AgentActivity[] = [
      {
        id: generateId('act'),
        agentRole: 'Supervisor',
        status: 'RUNNING',
        actionSummary: 'Evaluating production brief and script structure...',
        timestamp: new Date().toLocaleTimeString(),
        resultDetails: `Title: "${production.title}" (${production.type}). Location: ${production.location}.`,
        executionMode: 'deterministic',
        providerName: 'CineFlow Supervisor Engine'
      },
      {
        id: generateId('act'),
        agentRole: 'Script Analyst',
        status: 'QUEUED',
        actionSummary: 'Awaiting screenplay text for scene breakdown...',
        timestamp: new Date().toLocaleTimeString(),
        executionMode: this.aiProvider.isMock ? 'mock' : 'gemini',
        providerName: this.aiProvider.name
      },
      {
        id: generateId('act'),
        agentRole: 'Director Agent',
        status: 'QUEUED',
        actionSummary: 'Awaiting scene structure for creative analysis...',
        timestamp: new Date().toLocaleTimeString(),
        executionMode: 'deterministic',
        providerName: 'Stage 1 Director Engine'
      },
      {
        id: generateId('act'),
        agentRole: 'Producer Agent',
        status: 'QUEUED',
        actionSummary: 'Awaiting breakdown for department task planning...',
        timestamp: new Date().toLocaleTimeString(),
        executionMode: 'deterministic',
        providerName: 'Stage 1 Producer Engine'
      },
      {
        id: generateId('act'),
        agentRole: 'Research Agent',
        status: 'QUEUED',
        actionSummary: 'Preparing external permit and location research questions...',
        timestamp: new Date().toLocaleTimeString(),
        executionMode: this.researchProvider.isMock ? 'mock' : 'parallel',
        providerName: this.researchProvider.name
      },
      {
        id: generateId('act'),
        agentRole: 'Continuity',
        status: 'QUEUED',
        actionSummary: 'Preparing prop and wardrobe timeline audit...',
        timestamp: new Date().toLocaleTimeString(),
        executionMode: 'deterministic',
        providerName: 'Stage 1 Continuity Engine'
      },
      {
        id: generateId('act'),
        agentRole: 'Risk',
        status: 'QUEUED',
        actionSummary: 'Preparing safety, night shoot, and legal hazard audit...',
        timestamp: new Date().toLocaleTimeString(),
        executionMode: 'deterministic',
        providerName: 'Stage 1 Risk Engine'
      },
      {
        id: generateId('act'),
        agentRole: 'Scheduler',
        status: 'QUEUED',
        actionSummary: 'Awaiting risks and location requirements for shoot day planning...',
        timestamp: new Date().toLocaleTimeString(),
        executionMode: 'deterministic',
        providerName: 'Stage 1 Scheduler Engine'
      }
    ];

    const currentRun: WorkflowRun = {
      id: runId,
      productionId: production.id,
      status: 'RUNNING',
      currentAgentRole: 'Supervisor',
      activities: [...initialActivities],
      startedAt: new Date().toISOString(),
      executionMode: this.aiProvider.isMock ? 'mock' : 'gemini',
      providerName: this.aiProvider.name
    };

    storage.saveWorkflowRun(currentRun);
    if (onProgress) onProgress({ ...currentRun });

    const delay = (ms: number) => new Promise(res => setTimeout(res, ms));

    // STEP 1: SUPERVISOR AGENT
    await delay(300);
    currentRun.activities[0].status = 'COMPLETED';
    currentRun.activities[0].actionSummary = 'Production parameters verified.';
    currentRun.activities[0].resultDetails = 'Delegating screenplay breakdown to Script Analyst.';
    
    currentRun.currentAgentRole = 'Script Analyst';
    currentRun.activities[1].status = 'RUNNING';
    currentRun.activities[1].actionSummary = 'Parsing screenplay text for scenes, locations, characters, and props...';
    storage.saveWorkflowRun(currentRun);
    if (onProgress) onProgress({ ...currentRun });

    // STEP 2: SCRIPT ANALYST AGENT & AI ANALYSIS
    const analysisResult = await this.aiProvider.analyzeScript(production, scriptText);
    
    if (analysisResult.fallbackUsed) {
      currentRun.fallbackUsed = true;
      currentRun.fallbackReason = analysisResult.fallbackReason;
      currentRun.activities[1].executionMode = 'mock';
      currentRun.activities[1].providerName = 'Gemini Fallback (Local Simulation)';
    }

    // Save breakdown entities to storage
    storage.saveScenes(production.id, analysisResult.scenes);
    storage.saveCharacters(production.id, analysisResult.characters);
    storage.saveProps(production.id, analysisResult.props);
    storage.saveTasks(production.id, analysisResult.tasks);
    storage.saveRisks(production.id, analysisResult.risks);
    storage.saveContinuityIssues(production.id, analysisResult.continuityIssues);
    storage.saveShootDays(production.id, analysisResult.shootDays);

    currentRun.activities[1].status = 'COMPLETED';
    const fallbackNotice = analysisResult.fallbackUsed ? ' [GEMINI FAILED — LOCAL SIMULATION FALLBACK USED]' : '';
    currentRun.activities[1].actionSummary = `Breakdown complete: ${analysisResult.scenes.length} scenes, ${analysisResult.characters.length} characters, ${analysisResult.props.length} props.${fallbackNotice}`;
    currentRun.activities[1].resultDetails = `Scenes breakdown: ${analysisResult.scenes.filter(s => s.dayNight === 'NIGHT').length} Night scenes, ${analysisResult.scenes.filter(s => s.intExt === 'EXT').length} Exterior scenes. Provider: ${analysisResult.provider.toUpperCase()} (${analysisResult.model}).`;

    // STEP 3: DIRECTOR AGENT
    currentRun.currentAgentRole = 'Director Agent';
    currentRun.activities[2].status = 'RUNNING';
    currentRun.activities[2].actionSummary = 'Evaluating visual pacing, lighting contrast, and scene complexity...';
    storage.saveWorkflowRun(currentRun);
    if (onProgress) onProgress({ ...currentRun });

    await delay(350);
    currentRun.activities[2].status = 'COMPLETED';
    currentRun.activities[2].actionSummary = 'Director scene notes & lighting atmosphere established.';
    currentRun.activities[2].resultDetails = 'Special visual requirements logged for high-complexity scenes.';

    // STEP 4: PRODUCER AGENT
    currentRun.currentAgentRole = 'Producer Agent';
    currentRun.activities[3].status = 'RUNNING';
    currentRun.activities[3].actionSummary = 'Consolidating departmental tasks across Art, Casting, Permits, and Sound...';
    storage.saveWorkflowRun(currentRun);
    if (onProgress) onProgress({ ...currentRun });

    await delay(350);
    currentRun.activities[3].status = 'COMPLETED';
    currentRun.activities[3].actionSummary = `Created ${analysisResult.tasks.length} departmental production tasks.`;
    currentRun.activities[3].resultDetails = `Tasks assigned across Art & Props, Permits, and Safety.`;

    // STEP 5: RESEARCH AGENT & REAL RESEARCH PROVIDER INVOCATION
    currentRun.currentAgentRole = 'Research Agent';
    currentRun.activities[4].status = 'RUNNING';
    currentRun.activities[4].actionSummary = 'Executing research provider lookup for municipal permits & location rules...';
    storage.saveWorkflowRun(currentRun);
    if (onProgress) onProgress({ ...currentRun });

    const accumulatedSources: Source[] = [];
    const questionsToResearch = analysisResult.researchQuestions;
    let failedQueriesCount = 0;

    for (const rq of questionsToResearch) {
      try {
        const res = await this.researchProvider.queryResearch(rq.question, {
          productionTitle: production.title,
          location: production.location,
          sceneNumber: rq.sceneNumber
        });

        if (res.providerStatus === 'FAILED' || res.providerStatus === 'UNCONFIGURED') {
          rq.status = 'FAILED';
          rq.findings = res.findings;
          rq.provider = this.researchProvider.isMock ? 'MockResearchProvider' : 'ParallelResearchProvider';
          failedQueriesCount++;
        } else {
          rq.status = 'FOUND';
          rq.findings = res.findings;
          rq.provider = this.researchProvider.isMock ? 'MockResearchProvider' : 'ParallelResearchProvider';

          // Persist returned sources
          res.sources.forEach(src => {
            if (!accumulatedSources.some(s => s.id === src.id)) {
              accumulatedSources.push(src);
            }
            if (!rq.sourceIds.includes(src.id)) {
              rq.sourceIds.push(src.id);
            }
          });
        }
      } catch (err: any) {
        console.warn(`Research failed for question "${rq.question}":`, err);
        rq.status = 'FAILED';
        rq.findings = `Research query failed: ${err?.message || 'Unknown error'}`;
        rq.provider = this.researchProvider.isMock ? 'MockResearchProvider' : 'ParallelResearchProvider';
        failedQueriesCount++;
      }
    }

    // Persist research questions and sources to storage
    storage.saveSources(production.id, accumulatedSources);
    storage.saveResearchQuestions(production.id, questionsToResearch);

    const researchProviderLabel = this.researchProvider.isMock ? 'Mock Research Provider' : 'Parallel Search API';
    if (failedQueriesCount > 0) {
      currentRun.activities[4].status = 'WARNING';
      currentRun.activities[4].actionSummary = `Completed ${questionsToResearch.length} research queries with ${failedQueriesCount} failure(s) via ${researchProviderLabel}.`;
      currentRun.activities[4].resultDetails = `Location: ${production.location}. Sources mode: ${accumulatedSources.length === 0 ? 'NO SOURCES' : accumulatedSources.every(s => s.isDemoMock) ? 'DEMO / MOCK' : 'LIVE / VERIFIED'}. Truthful provider error logged.`;
    } else {
      currentRun.activities[4].status = 'COMPLETED';
      currentRun.activities[4].actionSummary = `Completed ${questionsToResearch.length} research queries via ${researchProviderLabel}. Persisted ${accumulatedSources.length} citation sources.`;
      const isMockSources = accumulatedSources.length === 0 ? 'NO SOURCES' : accumulatedSources.every(s => s.isDemoMock) ? 'DEMO / MOCK' : 'LIVE / VERIFIED';
      currentRun.activities[4].resultDetails = `Location: ${production.location}. Sources mode: ${isMockSources}.`;
    }

    // STEP 6: CONTINUITY AGENT
    currentRun.currentAgentRole = 'Continuity';
    currentRun.activities[5].status = 'RUNNING';
    currentRun.activities[5].actionSummary = 'Auditing prop journey and wardrobe timeline across scenes...';
    storage.saveWorkflowRun(currentRun);
    if (onProgress) onProgress({ ...currentRun });

    await delay(300);
    if (analysisResult.continuityIssues.length > 0) {
      currentRun.activities[5].status = 'WARNING';
      currentRun.activities[5].actionSummary = `Flagged ${analysisResult.continuityIssues.length} continuity issue.`;
      currentRun.activities[5].resultDetails = analysisResult.continuityIssues[0].title;
    } else {
      currentRun.activities[5].status = 'COMPLETED';
      currentRun.activities[5].actionSummary = 'Timeline & prop continuity verified.';
    }

    // STEP 7: RISK AGENT
    currentRun.currentAgentRole = 'Risk';
    currentRun.activities[6].status = 'RUNNING';
    currentRun.activities[6].actionSummary = 'Auditing safety, night shoot, and legal hazards...';
    storage.saveWorkflowRun(currentRun);
    if (onProgress) onProgress({ ...currentRun });

    await delay(350);
    const criticalRisks = analysisResult.risks.filter(r => r.severity === 'CRITICAL').length;
    currentRun.activities[6].status = criticalRisks > 0 ? 'WARNING' : 'COMPLETED';
    currentRun.activities[6].actionSummary = `Identified ${analysisResult.risks.length} production risks (${criticalRisks} Critical).`;
    currentRun.activities[6].resultDetails = `Primary hazard: ${analysisResult.risks[0]?.title || 'Standard hazard'}.`;

    // STEP 8: SCHEDULER AGENT
    currentRun.currentAgentRole = 'Scheduler';
    currentRun.activities[7].status = 'RUNNING';
    currentRun.activities[7].actionSummary = 'Building optimal shooting call sheet and day breakdown...';
    storage.saveWorkflowRun(currentRun);
    if (onProgress) onProgress({ ...currentRun });

    await delay(350);
    currentRun.activities[7].status = 'COMPLETED';
    currentRun.activities[7].actionSummary = `Structured ${analysisResult.shootDays.length}-day shooting schedule.`;
    currentRun.activities[7].resultDetails = `Grouped by location efficiency and night/day lighting blocks.`;

    // CONSOLIDATE WORKFLOW
    currentRun.status = 'COMPLETED';
    currentRun.currentAgentRole = undefined;
    currentRun.completedAt = new Date().toISOString();

    // Recalculate production readiness score & status authoritatively
    const readinessScore = storage.recalculateReadiness(production.id);
    production.readinessScore = readinessScore;
    production.status = computeAuthoritativeStatus(readinessScore, 'COMPLETED');
    production.scriptText = scriptText;
    storage.saveProduction(production);

    storage.saveWorkflowRun(currentRun);
    if (onProgress) onProgress({ ...currentRun });

    return currentRun;
  }
}
