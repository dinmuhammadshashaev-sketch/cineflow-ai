import { describe, it, expect } from 'vitest';
import {
  isDemoProduction,
  getDashboardMetrics,
  getDashboardRunSummary,
  getDashboardPriorityActions,
  getProductionPlanStatus,
  READINESS_SCORE_EXPLANATION,
  DEMO_PRODUCTION_ID
} from '../lib/dashboard';
import {
  Production,
  Scene,
  ProductionTask,
  ResearchQuestion,
  Risk,
  ContinuityIssue,
  ShootDay,
  Source,
  WorkflowRun
} from '../types';

describe('Stage 4.4: Judge-Ready Production Dashboard Tests', () => {
  const dummyProd: Production = {
    id: 'prod_user_999',
    title: 'User Film Project',
    type: 'Short Film',
    description: 'A custom user movie',
    location: 'Los Angeles, CA',
    budget: 50000,
    currency: 'USD',
    targetShootingDates: '2026-09-01',
    shootingDaysCount: 3,
    notes: '',
    createdAt: '2026-08-17T00:00:00Z',
    updatedAt: '2026-08-17T00:00:00Z',
    scriptText: 'INT. COFFEE SHOP - DAY',
    readinessScore: 75,
    status: 'Planning'
  };

  const demoProd: Production = {
    ...dummyProd,
    id: DEMO_PRODUCTION_ID,
    title: 'NEON HARBOR'
  };

  const mockScenes: Scene[] = [
    {
      id: 'sc1',
      productionId: dummyProd.id,
      sceneNumber: 1,
      heading: 'INT. METRO - NIGHT',
      intExt: 'INT',
      dayNight: 'NIGHT',
      location: 'Metro Station',
      summary: 'Opening scene',
      scheduleStatus: 'SCHEDULED',
      complexity: 'MEDIUM',
      characters: ['ECHO'],
      props: [],
      wardrobe: [],
      specialRequirements: []
    },
    {
      id: 'sc2',
      productionId: dummyProd.id,
      sceneNumber: 2,
      heading: 'EXT. ALLEYWAY - NIGHT',
      intExt: 'EXT',
      dayNight: 'NIGHT',
      location: 'Alley',
      summary: 'Chase scene',
      scheduleStatus: 'UNSCHEDULED',
      complexity: 'HIGH',
      characters: ['ECHO'],
      props: [],
      wardrobe: [],
      specialRequirements: []
    }
  ];

  const mockTasks: ProductionTask[] = [
    {
      id: 't1',
      productionId: dummyProd.id,
      title: 'Location Permit',
      category: 'Location & Permits',
      priority: 'CRITICAL',
      status: 'BLOCKED',
      description: 'Metro permit pending approval',
      createdAt: '2026-08-17T00:00:00Z'
    },
    {
      id: 't2',
      productionId: dummyProd.id,
      title: 'Stunt Coordinator',
      category: 'Script Breakdown',
      priority: 'MEDIUM',
      status: 'IN PROGRESS',
      description: 'Hire stunt team',
      createdAt: '2026-08-17T00:00:00Z'
    },
    {
      id: 't3',
      productionId: dummyProd.id,
      title: 'Catering Contract',
      category: 'Schedule & Logistics',
      priority: 'LOW',
      status: 'DONE',
      description: 'Signed catering agreement',
      createdAt: '2026-08-17T00:00:00Z'
    }
  ];

  const mockResearch: ResearchQuestion[] = [
    {
      id: 'rq1',
      productionId: dummyProd.id,
      question: 'Metro night filming rules',
      importance: 'CRITICAL',
      status: 'SEARCHING',
      findings: 'Requires transit police detail',
      sourceIds: ['s1'],
      createdAt: '2026-08-17T00:00:00Z',
      provider: 'ParallelResearchProvider'
    },
    {
      id: 'rq2',
      productionId: dummyProd.id,
      question: 'Drone camera flight restrictions',
      importance: 'HIGH',
      status: 'PENDING',
      findings: 'Pending FAA review',
      sourceIds: [],
      createdAt: '2026-08-17T00:00:00Z',
      provider: 'ParallelResearchProvider'
    },
    {
      id: 'rq3',
      productionId: dummyProd.id,
      question: 'Prop firearm ordinance',
      importance: 'LOW',
      status: 'NOT_NEEDED',
      findings: 'No firearms in script',
      sourceIds: [],
      createdAt: '2026-08-17T00:00:00Z',
      provider: 'ParallelResearchProvider'
    }
  ];

  const mockRisks: Risk[] = [
    {
      id: 'r1',
      productionId: dummyProd.id,
      title: 'High-voltage Metro track hazard',
      description: 'Filming near third rail',
      severity: 'CRITICAL',
      reason: 'Safety regulation',
      recommendedAction: 'Hire safety observer and request power shutoff',
      status: 'OPEN',
      createdAt: '2026-08-17T00:00:00Z'
    },
    {
      id: 'r2',
      productionId: dummyProd.id,
      title: 'Rain delay during exterior shot',
      description: 'Forecast indicates 40% precipitation',
      severity: 'MEDIUM',
      reason: 'Weather',
      recommendedAction: 'Reserve rain cover tents',
      status: 'RESOLVED',
      createdAt: '2026-08-17T00:00:00Z'
    }
  ];

  const mockContinuity: ContinuityIssue[] = [
    {
      id: 'c1',
      productionId: dummyProd.id,
      title: 'Actor jacket mismatch in Sc 1 vs 2',
      description: 'Leather jacket wetness continuity',
      category: 'Wardrobe',
      sceneNumbers: [1, 2],
      severity: 'HIGH',
      status: 'OPEN',
      recommendation: 'Spray jacket between takes'
    }
  ];

  const mockShootDays: ShootDay[] = [
    {
      id: 'sd1',
      productionId: dummyProd.id,
      dayNumber: 1,
      locationName: 'Metro Station',
      sceneNumbers: [1],
      dayNightFocus: 'NIGHT',
      estimatedHours: 10
    },
    {
      id: 'sd2',
      productionId: dummyProd.id,
      dayNumber: 2,
      locationName: 'Alleyway',
      sceneNumbers: [2],
      dayNightFocus: 'NIGHT',
      estimatedHours: 8
    }
  ];

  const mockSources: Source[] = [
    {
      id: 's1',
      title: 'Metro Transit Authority Filming Guidelines',
      domain: 'metro.net',
      url: 'https://metro.net/filming-permits',
      retrievedDate: '2026-08-17T00:00:00Z',
      evidenceSummary: 'Night permits require 14 days advance notice.',
      isDemoMock: false,
      qualityTag: 'OFFICIAL'
    },
    {
      id: 's2',
      title: 'City Film Office Guide',
      domain: 'cityfilmoffice.gov',
      url: 'https://cityfilmoffice.gov/guide',
      retrievedDate: '2026-08-17T00:00:00Z',
      evidenceSummary: 'Sample mock permit rules.',
      isDemoMock: true,
      qualityTag: 'SECONDARY'
    }
  ];

  // 1. no production => onboarding state
  it('1. no production => onboarding state', () => {
    const metrics = getDashboardMetrics(null, [], [], [], [], [], []);
    expect(metrics.hasProduction).toBe(false);
    expect(getProductionPlanStatus(null, null)).toBe('NO_PRODUCTION');
  });

  // 2. no production => no fake readiness metrics
  it('2. no production => no fake readiness metrics', () => {
    const metrics = getDashboardMetrics(null, [], [], [], [], [], []);
    expect(metrics.readinessScore).toBe(0);
    expect(metrics.sceneCount).toBe(0);
    expect(metrics.taskCount).toBe(0);
  });

  // 3. real production scene count comes from data
  it('3. real production scene count comes from data', () => {
    const metrics = getDashboardMetrics(dummyProd, mockScenes, [], [], [], [], []);
    expect(metrics.sceneCount).toBe(2);
  });

  // 4. task count comes from data
  it('4. task count comes from data', () => {
    const metrics = getDashboardMetrics(dummyProd, [], mockTasks, [], [], [], []);
    expect(metrics.taskCount).toBe(3);
  });

  // 5. risk count comes from data
  it('5. risk count comes from data', () => {
    const metrics = getDashboardMetrics(dummyProd, [], [], [], mockRisks, [], []);
    expect(metrics.openRiskCount).toBe(1); // 1 OPEN, 1 RESOLVED
  });

  // 6. shoot-day count comes from data
  it('6. shoot-day count comes from data', () => {
    const metrics = getDashboardMetrics(dummyProd, [], [], [], [], mockShootDays, []);
    expect(metrics.shootDayCount).toBe(2);
  });

  // 7. real source count comes from Source.isDemoMock === false
  it('7. real source count comes from Source.isDemoMock === false', () => {
    const metrics = getDashboardMetrics(dummyProd, [], [], [], [], [], mockSources);
    expect(metrics.realSourceCount).toBe(1);
    expect(metrics.totalSourceCount).toBe(2);
  });

  // 8. AGENTIC run => LIVE provenance
  it('8. AGENTIC run => LIVE provenance', () => {
    const liveRun: WorkflowRun = {
      id: 'run_live_100',
      productionId: dummyProd.id,
      mode: 'AGENTIC_GOOGLE_ADK',
      status: 'RUNNING',
      activities: [],
      startedAt: '2026-08-17T00:00:00Z'
    };
    const summary = getDashboardRunSummary(liveRun);
    expect(summary.isLive).toBe(true);
    expect(summary.provenanceLabel).toBe('LIVE');
    expect(summary.subLabel).toContain('Google ADK');
  });

  // 9. LOCAL run => LOCAL DEMO provenance
  it('9. LOCAL run => LOCAL DEMO provenance', () => {
    const localRun: WorkflowRun = {
      id: 'run_local_100',
      productionId: dummyProd.id,
      mode: 'LOCAL_SIMULATION',
      status: 'COMPLETED',
      activities: [],
      startedAt: '2026-08-17T00:00:00Z'
    };
    const summary = getDashboardRunSummary(localRun);
    expect(summary.isLocal).toBe(true);
    expect(summary.provenanceLabel).toBe('LOCAL DEMO');
    expect(summary.subLabel).toContain('Simulation');
  });

  // 10. null run => NO AI CREW RUN YET
  it('10. null run => NO AI CREW RUN YET', () => {
    const summary = getDashboardRunSummary(null);
    expect(summary.hasRun).toBe(false);
    expect(summary.provenanceLabel).toBe('NO AI CREW RUN YET');
  });

  // 11. incomplete run cannot claim production plan ready
  it('11. incomplete run cannot claim production plan ready', () => {
    const partialRun: WorkflowRun = {
      id: 'run_part_100',
      productionId: dummyProd.id,
      mode: 'AGENTIC_GOOGLE_ADK',
      status: 'RUNNING',
      activities: [
        {
          id: 'a1',
          agentRole: 'Supervisor',
          status: 'COMPLETED',
          actionSummary: 'Done',
          timestamp: '2026-08-17T00:00:00Z'
        }
      ],
      startedAt: '2026-08-17T00:00:00Z'
    };
    const planStatus = getProductionPlanStatus(dummyProd, partialRun);
    expect(planStatus).not.toBe('PRODUCTION_PLAN_READY');
  });

  // 12. 8/8 completed run can claim ready
  it('12. 8/8 completed run can claim ready', () => {
    const completedRun: WorkflowRun = {
      id: 'run_full_100',
      productionId: dummyProd.id,
      mode: 'AGENTIC_GOOGLE_ADK',
      status: 'COMPLETED',
      activities: [
        { id: 'a1', agentRole: 'Supervisor', status: 'COMPLETED', actionSummary: 'Done', timestamp: '2026-08-17T00:00:00Z' },
        { id: 'a2', agentRole: 'Script Analyst', status: 'COMPLETED', actionSummary: 'Done', timestamp: '2026-08-17T00:00:00Z' },
        { id: 'a3', agentRole: 'Director', status: 'COMPLETED', actionSummary: 'Done', timestamp: '2026-08-17T00:00:00Z' },
        { id: 'a4', agentRole: 'Producer', status: 'COMPLETED', actionSummary: 'Done', timestamp: '2026-08-17T00:00:00Z' },
        { id: 'a5', agentRole: 'Research', status: 'COMPLETED', actionSummary: 'Done', timestamp: '2026-08-17T00:00:00Z' },
        { id: 'a6', agentRole: 'Continuity', status: 'COMPLETED', actionSummary: 'Done', timestamp: '2026-08-17T00:00:00Z' },
        { id: 'a7', agentRole: 'Risk', status: 'COMPLETED', actionSummary: 'Done', timestamp: '2026-08-17T00:00:00Z' },
        { id: 'a8', agentRole: 'Scheduler', status: 'COMPLETED', actionSummary: 'Done', timestamp: '2026-08-17T00:00:00Z' }
      ],
      startedAt: '2026-08-17T00:00:00Z'
    };
    const planStatus = getProductionPlanStatus(dummyProd, completedRun);
    expect(planStatus).toBe('PRODUCTION_PLAN_READY');
  });

  // 13. failed run displays interrupted
  it('13. failed run displays interrupted', () => {
    const failedRun: WorkflowRun = {
      id: 'run_fail_100',
      productionId: dummyProd.id,
      mode: 'AGENTIC_GOOGLE_ADK',
      status: 'FAILED',
      activities: [
        { id: 'a1', agentRole: 'Supervisor', status: 'COMPLETED', actionSummary: 'Done', timestamp: '2026-08-17T00:00:00Z' },
        { id: 'a2', agentRole: 'Script Analyst', status: 'FAILED', actionSummary: 'Syntax error in script', timestamp: '2026-08-17T00:00:00Z' }
      ],
      startedAt: '2026-08-17T00:00:00Z'
    };
    const planStatus = getProductionPlanStatus(dummyProd, failedRun);
    expect(planStatus).toBe('INTERRUPTED');
  });

  // 14. completed-agent count uses fixed 8-agent pipeline
  it('14. completed-agent count uses fixed 8-agent pipeline', () => {
    const partialRun: WorkflowRun = {
      id: 'run_part_200',
      productionId: dummyProd.id,
      mode: 'AGENTIC_GOOGLE_ADK',
      status: 'RUNNING',
      activities: [
        { id: 'a1', agentRole: 'Supervisor', status: 'COMPLETED', actionSummary: 'Done', timestamp: '2026-08-17T00:00:00Z' },
        { id: 'a2', agentRole: 'Script Analyst', status: 'COMPLETED', actionSummary: 'Done', timestamp: '2026-08-17T00:00:00Z' }
      ],
      startedAt: '2026-08-17T00:00:00Z'
    };
    const summary = getDashboardRunSummary(partialRun);
    expect(summary.completedAgentsCount).toBe(2);
    expect(summary.totalAgents).toBe(8);
  });

  // 15. failed-agent role is truthful
  it('15. failed-agent role is truthful', () => {
    const failedRun: WorkflowRun = {
      id: 'run_fail_200',
      productionId: dummyProd.id,
      mode: 'AGENTIC_GOOGLE_ADK',
      status: 'FAILED',
      activities: [
        { id: 'a1', agentRole: 'Supervisor', status: 'COMPLETED', actionSummary: 'Done', timestamp: '2026-08-17T00:00:00Z' },
        { id: 'a2', agentRole: 'Research', status: 'FAILED', actionSummary: 'API quota exceeded', timestamp: '2026-08-17T00:00:00Z' }
      ],
      startedAt: '2026-08-17T00:00:00Z'
    };
    const summary = getDashboardRunSummary(failedRun);
    expect(summary.failedAgentRole).toBe('Research');
  });

  // 16. Parallel verified requires completed parallel_search telemetry
  it('16. Parallel verified requires completed parallel_search telemetry', () => {
    const verifiedRun: WorkflowRun = {
      id: 'run_par_100',
      productionId: dummyProd.id,
      mode: 'AGENTIC_GOOGLE_ADK',
      status: 'COMPLETED',
      activities: [],
      toolActivities: [
        {
          id: 't1',
          toolName: 'parallel_search',
          agentRole: 'Research',
          status: 'COMPLETED',
          timestamp: '2026-08-17T00:00:00Z'
        }
      ],
      startedAt: '2026-08-17T00:00:00Z'
    };
    const summary = getDashboardRunSummary(verifiedRun);
    expect(summary.isParallelVerified).toBe(true);
  });

  // 17. no tool event cannot claim Parallel
  it('17. no tool event cannot claim Parallel', () => {
    const noToolRun: WorkflowRun = {
      id: 'run_notool_100',
      productionId: dummyProd.id,
      mode: 'AGENTIC_GOOGLE_ADK',
      status: 'COMPLETED',
      activities: [],
      toolActivities: [],
      startedAt: '2026-08-17T00:00:00Z'
    };
    const summary = getDashboardRunSummary(noToolRun);
    expect(summary.isParallelVerified).toBe(false);
  });

  // 18. local simulation cannot claim Parallel
  it('18. local simulation cannot claim Parallel', () => {
    const simRunWithTool: WorkflowRun = {
      id: 'run_sim_100',
      productionId: dummyProd.id,
      mode: 'LOCAL_SIMULATION',
      status: 'COMPLETED',
      activities: [],
      toolActivities: [
        {
          id: 't1',
          toolName: 'parallel_search',
          agentRole: 'Research',
          status: 'COMPLETED',
          timestamp: '2026-08-17T00:00:00Z'
        }
      ],
      startedAt: '2026-08-17T00:00:00Z'
    };
    const summary = getDashboardRunSummary(simRunWithTool);
    expect(summary.isParallelVerified).toBe(false);
  });

  // 19. demo production classification deterministic
  it('19. demo production classification deterministic', () => {
    expect(isDemoProduction(demoProd)).toBe(true);
  });

  // 20. real production not accidentally classified demo
  it('20. real production not accidentally classified demo', () => {
    expect(isDemoProduction(dummyProd)).toBe(false);
  });

  // 21. critical open Risk is priority
  it('21. critical open Risk is priority', () => {
    const actions = getDashboardPriorityActions(mockRisks, [], [], []);
    const riskAction = actions.find((a) => a.type === 'RISK' && a.severity === 'CRITICAL');
    expect(riskAction).toBeDefined();
    expect(riskAction?.title).toBe('High-voltage Metro track hazard');
  });

  // 22. resolved Risk is not urgent
  it('22. resolved Risk is not urgent', () => {
    const actions = getDashboardPriorityActions(mockRisks, [], [], []);
    const resolvedAction = actions.find((a) => a.title.includes('Rain delay'));
    expect(resolvedAction).toBeUndefined();
  });

  // 23. critical unresolved ResearchQuestion is priority
  it('23. critical unresolved ResearchQuestion is priority', () => {
    const actions = getDashboardPriorityActions([], mockResearch, [], []);
    const rqAction = actions.find((a) => a.type === 'RESEARCH' && a.severity === 'CRITICAL');
    expect(rqAction).toBeDefined();
    expect(rqAction?.title).toBe('Metro night filming rules');
  });

  // 24. NOT_NEEDED ResearchQuestion is not urgent
  it('24. NOT_NEEDED ResearchQuestion is not urgent', () => {
    const actions = getDashboardPriorityActions([], mockResearch, [], []);
    const notNeededAction = actions.find((a) => a.title.includes('Prop firearm ordinance'));
    expect(notNeededAction).toBeUndefined();
  });

  // 25. blocked production task can become priority
  it('25. blocked production task can become priority', () => {
    const actions = getDashboardPriorityActions([], [], mockTasks, []);
    const taskAction = actions.find((a) => a.type === 'TASK' && a.status === 'BLOCKED');
    expect(taskAction).toBeDefined();
    expect(taskAction?.title).toBe('Location Permit');
  });

  // 26. priority list has deterministic ordering
  it('26. priority list has deterministic ordering', () => {
    const actions = getDashboardPriorityActions(mockRisks, mockResearch, mockTasks, mockContinuity);
    expect(actions.length).toBeGreaterThan(0);
    expect(actions[0].severity).toBe('CRITICAL');
  });

  // 27. priority list does not fabricate entries
  it('27. priority list does not fabricate entries', () => {
    const actions = getDashboardPriorityActions([], [], [], []);
    expect(actions).toEqual([]);
  });

  // 28. readiness explanation is truthful and accurate
  it('28. readiness explanation matches deterministic formula', () => {
    expect(READINESS_SCORE_EXPLANATION).toContain('open production risks');
    expect(READINESS_SCORE_EXPLANATION).toContain('pending research questions');
    expect(READINESS_SCORE_EXPLANATION).toContain('unscheduled scenes');
    expect(READINESS_SCORE_EXPLANATION).toContain('task completion progress');
  });
});
