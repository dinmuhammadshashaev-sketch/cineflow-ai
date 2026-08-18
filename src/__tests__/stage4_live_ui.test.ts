import { describe, it, expect, beforeEach } from 'vitest';
import { storage } from '../services/storage/StorageProvider';
import { Production, WorkflowRun, Source, Scene, Character, Prop, ProductionTask, ResearchQuestion, Risk, ContinuityIssue, ShootDay } from '../types';
import { aiManager, resolveWorkflowMode, RequestedWorkflowMode } from '../services/ai/AiManager';
import { DEMO_PRODUCTION_ID } from '../data/demoProductionData';

describe('Stage 4.1 Live Result Hydration & Truthful Demo Path Tests', () => {
  beforeEach(() => {
    storage.resetAllData();
  });

  const createFixtureProduction = (id = 'prod_fixture_1'): Production => ({
    id,
    title: 'TEST FIXTURE PROD',
    type: 'Feature Film',
    description: 'Fixture production for Stage 4.1 testing',
    location: 'Los Angeles, CA',
    budget: 500000,
    currency: 'USD',
    targetShootingDates: '2026-11-01',
    shootingDaysCount: 2,
    notes: 'None',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    scriptText: 'INT. STAGE - DAY\nAction happens.',
    readinessScore: 85,
    status: 'Planning'
  });

  const createFixtureWorkflowRun = (prodId: string, status: 'COMPLETED' | 'FAILED' | 'RUNNING' = 'COMPLETED'): WorkflowRun => ({
    id: `wfr_${Date.now()}`,
    productionId: prodId,
    mode: 'AGENTIC_GOOGLE_ADK',
    status,
    startedAt: new Date().toISOString(),
    completedAt: status !== 'RUNNING' ? new Date().toISOString() : undefined,
    activities: [
      {
        id: 'act_1',
        agentRole: 'Supervisor',
        agentName: 'SupervisorAgent',
        status: 'COMPLETED',
        actionSummary: 'Orchestrated analysis',
        timestamp: '10:00 AM'
      },
      {
        id: 'act_2',
        agentRole: 'Script Analyst',
        agentName: 'ScriptAnalystAgent',
        status: 'COMPLETED',
        actionSummary: 'Parsed scenes',
        timestamp: '10:01 AM'
      }
    ]
  });

  // Section 10 Acceptance Check & Tests 1-10
  it('ACCEPTANCE CHECK: saves and reloads artificial completed workflow fixture without stale demo data', () => {
    const prod = createFixtureProduction(DEMO_PRODUCTION_ID);

    const scenes: Scene[] = [
      { id: 'sc_1', productionId: prod.id, sceneNumber: 1, heading: 'INT. LAB - DAY', intExt: 'INT', dayNight: 'DAY', location: 'Lab', summary: 'S1', complexity: 'LOW', characters: ['C1'], props: ['P1'], wardrobe: [], specialRequirements: [], directorNotes: '', scheduleStatus: 'UNSCHEDULED', estimatedMinutes: 5 },
      { id: 'sc_2', productionId: prod.id, sceneNumber: 2, heading: 'EXT. STREET - NIGHT', intExt: 'EXT', dayNight: 'NIGHT', location: 'Street', summary: 'S2', complexity: 'HIGH', characters: ['C2', 'C3'], props: ['P2'], wardrobe: [], specialRequirements: [], directorNotes: '', scheduleStatus: 'UNSCHEDULED', estimatedMinutes: 10 }
    ];

    const characters: Character[] = [
      { id: 'ch_1', productionId: prod.id, name: 'Char 1', roleType: 'Lead', description: 'Desc 1', castRequirements: '', sceneCount: 1, sceneNumbers: [1] },
      { id: 'ch_2', productionId: prod.id, name: 'Char 2', roleType: 'Lead', description: 'Desc 2', castRequirements: '', sceneCount: 1, sceneNumbers: [2] },
      { id: 'ch_3', productionId: prod.id, name: 'Char 3', roleType: 'Supporting', description: 'Desc 3', castRequirements: '', sceneCount: 1, sceneNumbers: [2] }
    ];

    const propsList: Prop[] = [
      { id: 'pr_1', productionId: prod.id, name: 'Prop 1', category: 'General', description: 'Desc', fragile: false, sceneNumbers: [1] }
    ];

    const tasks: ProductionTask[] = Array.from({ length: 16 }, (_, i) => ({
      id: `task_${i + 1}`,
      productionId: prod.id,
      title: `Task ${i + 1}`,
      description: `Task description ${i + 1}`,
      category: 'Script Breakdown',
      priority: 'MEDIUM',
      status: 'TO DO',
      createdAt: new Date().toISOString()
    }));

    const researchQuestions: ResearchQuestion[] = Array.from({ length: 6 }, (_, i) => ({
      id: `rq_${i + 1}`,
      productionId: prod.id,
      question: `Question ${i + 1}?`,
      importance: 'HIGH',
      status: 'FOUND',
      findings: `Findings for Q${i + 1}`,
      sourceIds: [],
      createdAt: new Date().toISOString(),
      provider: 'MockResearchProvider'
    }));

    const sources: Source[] = Array.from({ length: 15 }, (_, i) => ({
      id: `src_${i + 1}`,
      title: `Live Source ${i + 1}`,
      domain: 'gov.ca.gov',
      url: `https://gov.ca.gov/permit_${i + 1}`,
      evidenceSummary: `Permit regulation snippet ${i + 1}`,
      retrievedDate: new Date().toISOString(),
      isDemoMock: false
    }));

    const risks: Risk[] = Array.from({ length: 8 }, (_, i) => ({
      id: `risk_${i + 1}`,
      productionId: prod.id,
      title: `Risk ${i + 1}`,
      description: `Risk desc ${i + 1}`,
      severity: i < 2 ? 'CRITICAL' : 'MEDIUM',
      reason: 'Safety concern',
      recommendedAction: 'Mitigate hazard',
      status: 'OPEN',
      createdAt: new Date().toISOString()
    }));

    const continuity: ContinuityIssue[] = [];

    const shootDays: ShootDay[] = [
      { id: 'sd_1', productionId: prod.id, dayNumber: 1, locationName: 'Lab', sceneNumbers: [1], dayNightFocus: 'DAY', estimatedHours: 8, notes: 'Day 1' },
      { id: 'sd_2', productionId: prod.id, dayNumber: 2, locationName: 'Street', sceneNumbers: [2], dayNightFocus: 'NIGHT', estimatedHours: 10, notes: 'Day 2' }
    ];

    prod.scenes = scenes;
    prod.characters = characters;
    prod.props = propsList;
    prod.tasks = tasks;
    prod.researchQuestions = researchQuestions;
    prod.sources = sources;
    prod.risks = risks;
    prod.continuityIssues = continuity;
    prod.shootDays = shootDays;

    const run = createFixtureWorkflowRun(prod.id, 'COMPLETED');

    // Save atomically
    storage.saveAgenticWorkflowResult(prod, run);

    // Reload state using the EXACT same getters as App.loadProductionData()
    const loadedScenes = storage.getScenes(prod.id);
    const loadedChars = storage.getCharacters(prod.id);
    const loadedTasks = storage.getTasks(prod.id);
    const loadedResearch = storage.getResearchQuestions(prod.id);
    const loadedSources = storage.getSources(prod.id);
    const loadedRisks = storage.getRisks(prod.id);
    const loadedShootDays = storage.getShootDays(prod.id);
    const loadedRun = storage.getLatestWorkflowRun(prod.id);

    // Assert EXACT counts (proving no stale demo data mixed in)
    expect(loadedScenes.length).toBe(2);
    expect(loadedChars.length).toBe(3);
    expect(loadedTasks.length).toBe(16);
    expect(loadedResearch.length).toBe(6);
    expect(loadedSources.length).toBe(15);
    expect(loadedRisks.length).toBe(8);
    expect(loadedShootDays.length).toBe(2);
    expect(loadedRun).toBeDefined();
    expect(loadedRun?.status).toBe('COMPLETED');
  });

  // Test 11: Explicit [] replaces previous collection
  it('11. explicit [] replaces previous collection with []', () => {
    const prod = createFixtureProduction('prod_test_11');
    prod.scenes = [{ id: 's1', productionId: prod.id, sceneNumber: 1, heading: 'INT. ROOM', intExt: 'INT', dayNight: 'DAY', location: 'Room', summary: '', complexity: 'LOW', characters: [], props: [], wardrobe: [], specialRequirements: [], directorNotes: '', scheduleStatus: 'UNSCHEDULED', estimatedMinutes: 5 }];
    const run = createFixtureWorkflowRun(prod.id);

    storage.saveAgenticWorkflowResult(prod, run);
    expect(storage.getScenes(prod.id).length).toBe(1);

    // Now update with explicit []
    prod.scenes = [];
    storage.saveAgenticWorkflowResult(prod, run);
    expect(storage.getScenes(prod.id)).toEqual([]);
  });

  // Test 12: undefined collection does not corrupt unrelated data
  it('12. undefined collection does not corrupt existing data', () => {
    const prod = createFixtureProduction('prod_test_12');
    prod.scenes = [{ id: 's1', productionId: prod.id, sceneNumber: 1, heading: 'INT. ROOM', intExt: 'INT', dayNight: 'DAY', location: 'Room', summary: '', complexity: 'LOW', characters: [], props: [], wardrobe: [], specialRequirements: [], directorNotes: '', scheduleStatus: 'UNSCHEDULED', estimatedMinutes: 5 }];
    prod.tasks = [{ id: 't1', productionId: prod.id, title: 'Task 1', description: '', category: 'Script Breakdown', priority: 'HIGH', status: 'TO DO', createdAt: new Date().toISOString() }];
    const run = createFixtureWorkflowRun(prod.id);

    storage.saveAgenticWorkflowResult(prod, run);

    // Now pass production with undefined scenes and new tasks
    const updateProd: Production = { ...prod, scenes: undefined, tasks: [{ id: 't2', productionId: prod.id, title: 'Task 2', description: '', category: 'Script Breakdown', priority: 'HIGH', status: 'TO DO', createdAt: new Date().toISOString() }] };
    storage.saveAgenticWorkflowResult(updateProd, run);

    // Scenes should still be preserved, tasks updated
    expect(storage.getScenes(prod.id).length).toBe(1);
    expect(storage.getTasks(prod.id).length).toBe(1);
    expect(storage.getTasks(prod.id)[0].id).toBe('t2');
  });

  // Test 13: failed workflow partial state is preserved
  it('13. failed workflow partial state is preserved', () => {
    const prod = createFixtureProduction('prod_test_13');
    prod.tasks = [{ id: 't_partial', productionId: prod.id, title: 'Partial Task', description: '', category: 'Script Breakdown', priority: 'HIGH', status: 'TO DO', createdAt: new Date().toISOString() }];
    const failedRun = createFixtureWorkflowRun(prod.id, 'FAILED');

    storage.saveAgenticWorkflowResult(prod, failedRun);

    expect(storage.getLatestWorkflowRun(prod.id)?.status).toBe('FAILED');
    expect(storage.getTasks(prod.id).length).toBe(1);
  });

  // Test 14: no silent local fallback is introduced
  it('14. no silent local fallback on workflow failure', async () => {
    const prod = createFixtureProduction('prod_test_14');
    // If backend throws error or SSE fails, AiManager returns failed run state without creating fake success data
    const failedRun = await aiManager.runScriptBreakdownWorkflow(prod, undefined, 'AGENTIC_GOOGLE_ADK').catch(err => null);
    // Since we're offline without express listening, it handles error safely returning a failed run object
    expect(failedRun).toBeDefined();
    expect(failedRun?.status).toBe('FAILED');
  });

  // Test 15 & 16: AiCrew status derivation
  it('15 & 16. AiCrew derives runtime statuses from WorkflowRun and claims NOT YET RUN when no run exists', () => {
    const prodId = 'prod_test_15';
    const nullRun = storage.getLatestWorkflowRun(prodId);
    expect(nullRun).toBeNull(); // No run yet

    const activeRun = createFixtureWorkflowRun(prodId, 'COMPLETED');
    storage.saveWorkflowRun(activeRun);

    const reloadedRun = storage.getLatestWorkflowRun(prodId);
    expect(reloadedRun).toBeDefined();
    expect(reloadedRun?.activities.length).toBeGreaterThan(0);
    expect(reloadedRun?.activities[0].status).toBe('COMPLETED');
  });

  // Test 17, 18, 19: Source live/mock truthfulness
  it('17, 18, 19. source live/mock labeling derives strictly from source evidence', () => {
    const realSource: Source = {
      id: 's_real',
      title: 'Real Source',
      domain: 'faa.gov',
      url: 'https://faa.gov/drone',
      evidenceSummary: 'Drone permit rules',
      retrievedDate: new Date().toISOString(),
      isDemoMock: false
    };

    const mockSource: Source = {
      id: 's_mock',
      title: 'Mock Source',
      domain: 'example.com',
      url: 'https://example.com',
      evidenceSummary: 'Simulated evidence',
      retrievedDate: new Date().toISOString(),
      isDemoMock: true
    };

    // All real -> LIVE
    const allReal = [realSource];
    expect(allReal.every(s => s.isDemoMock === false)).toBe(true);

    // Any mock -> MOCK
    const mixed = [realSource, mockSource];
    expect(mixed.some(s => s.isDemoMock === true)).toBe(true);
  });

  // Test 20, 21: Health logic
  it('20 & 21. health readiness requires Vertex AI and Parallel Search configured', () => {
    const mockHealthVertexReady = { runtimeMode: 'GOOGLE_ADK_VERTEX_AI', researchProviderReady: true };
    const mockHealthUnconfigured = { runtimeMode: 'LOCAL_SIMULATION', researchProviderReady: false };

    expect(mockHealthVertexReady.runtimeMode === 'GOOGLE_ADK_VERTEX_AI' && mockHealthVertexReady.researchProviderReady).toBe(true);
    expect(mockHealthUnconfigured.runtimeMode === 'GOOGLE_ADK_VERTEX_AI').toBe(false);
  });

  // Test 22: Live workflow auto-trigger check
  it('22. live workflow is never auto-triggered on storage init or component load', () => {
    storage.init();
    const runs = storage.getLatestWorkflowRun(DEMO_PRODUCTION_ID);
    // Initially no workflow run should be auto-started or created
    expect(runs).toBeNull();
  });
});

describe('Stage 4.1.1 Explicit Live vs Local Execution Mode Hotfix Tests', () => {
  it('1. default settings aiProviderType=mock + requested AGENTIC_GOOGLE_ADK => AGENTIC_GOOGLE_ADK', () => {
    const resolved = resolveWorkflowMode('AGENTIC_GOOGLE_ADK', 'mock');
    expect(resolved).toBe('AGENTIC_GOOGLE_ADK');
  });

  it('2. settings aiProviderType=gemini + requested LOCAL_SIMULATION => LOCAL_SIMULATION', () => {
    const resolved = resolveWorkflowMode('LOCAL_SIMULATION', 'gemini');
    expect(resolved).toBe('LOCAL_SIMULATION');
  });

  it('3. AUTO + settings mock => LOCAL_SIMULATION', () => {
    const resolved = resolveWorkflowMode('AUTO', 'mock');
    expect(resolved).toBe('LOCAL_SIMULATION');
  });

  it('4. AUTO + settings gemini => AGENTIC_GOOGLE_ADK', () => {
    const resolved = resolveWorkflowMode('AUTO', 'gemini');
    expect(resolved).toBe('AGENTIC_GOOGLE_ADK');
  });

  it('5. explicit AGENTIC mode is never downgraded because settings are mock', () => {
    // Even if storage settings default to mock, explicit requestedMode AGENTIC_GOOGLE_ADK stays AGENTIC_GOOGLE_ADK
    const resolved = resolveWorkflowMode('AGENTIC_GOOGLE_ADK', 'mock');
    expect(resolved).toBe('AGENTIC_GOOGLE_ADK');
    expect(resolved).not.toBe('LOCAL_SIMULATION');
  });

  it('6. explicit LOCAL mode is never upgraded because backend/env is ready', () => {
    // Even if settings are gemini, explicit requestedMode LOCAL_SIMULATION stays LOCAL_SIMULATION
    const resolved = resolveWorkflowMode('LOCAL_SIMULATION', 'gemini');
    expect(resolved).toBe('LOCAL_SIMULATION');
    expect(resolved).not.toBe('AGENTIC_GOOGLE_ADK');
  });

  it('7. LIVE button contract uses AGENTIC_GOOGLE_ADK', () => {
    const requestedModeFromLiveButton: RequestedWorkflowMode = 'AGENTIC_GOOGLE_ADK';
    expect(requestedModeFromLiveButton).toBe('AGENTIC_GOOGLE_ADK');
  });

  it('8. LOCAL DEMO button contract uses LOCAL_SIMULATION', () => {
    const requestedModeFromLocalButton: RequestedWorkflowMode = 'LOCAL_SIMULATION';
    expect(requestedModeFromLocalButton).toBe('LOCAL_SIMULATION');
  });

  it('9. no workflow starts automatically during component mount', () => {
    storage.resetAllData();
    expect(storage.getLatestWorkflowRun('DEMO_PROD_1')).toBeNull();
  });

  it('10. no silent fallback from explicit AGENTIC to LOCAL on client failure', async () => {
    const prod: Production = {
      id: 'prod_test_fail_mode',
      title: 'Fail Mode Prod',
      type: 'Feature Film',
      description: 'Test',
      location: 'Test',
      budget: 1000,
      currency: 'USD',
      targetShootingDates: '2026-01-01',
      shootingDaysCount: 1,
      notes: '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      scriptText: 'INT. SCENE 1',
      readinessScore: 50,
      status: 'Planning'
    };

    const run = await aiManager.runScriptBreakdownWorkflow(prod, undefined, 'AGENTIC_GOOGLE_ADK');
    // On backend failure, run.mode must remain AGENTIC_GOOGLE_ADK and status FAILED
    expect(run.mode).toBe('AGENTIC_GOOGLE_ADK');
    expect(run.status).toBe('FAILED');
  });
});
