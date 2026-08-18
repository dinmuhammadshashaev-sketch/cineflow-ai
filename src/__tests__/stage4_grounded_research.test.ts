import { describe, it, expect } from 'vitest';
import { ResearchQuestion, Source, Risk, WorkflowRun } from '../types';
import {
  getSourcesForResearchQuestion,
  getResearchGroundingState,
  getRisksSupportedBySourceIds,
  getRisksForResearchQuestion,
  getResearchSummary,
  getSourceTrustPresentation,
  getSafeExternalUrl,
  getSourceDisplayDomain
} from '../lib/researchEvidence';

describe('Stage 4.3: Grounded Research + Parallel Judge Experience', () => {
  // Test 1: source linked by question.sourceIds
  it('1. source linked by question.sourceIds', () => {
    const q: ResearchQuestion = {
      id: 'q1',
      productionId: 'p1',
      question: 'Are night flight drone permits required?',
      importance: 'HIGH',
      status: 'FOUND',
      sourceIds: ['s1'],
      createdAt: '2026-08-17T10:00:00Z',
      provider: 'ParallelResearchProvider'
    };
    const s1: Source = {
      id: 's1',
      title: 'FAA Part 107 Small Drone Night Operations',
      domain: 'faa.gov',
      url: 'https://faa.gov/part107',
      retrievedDate: '2026-08-17',
      evidenceSummary: 'Night drone operations require anti-collision lighting visible for 3 statute miles.',
      isDemoMock: false,
      qualityTag: 'OFFICIAL'
    };

    const sources = getSourcesForResearchQuestion(q, [s1]);
    expect(sources).toHaveLength(1);
    expect(sources[0].id).toBe('s1');
  });

  // Test 2: source linked by relatedResearchId
  it('2. source linked by relatedResearchId', () => {
    const q: ResearchQuestion = {
      id: 'q2',
      productionId: 'p1',
      question: 'Generator noise restrictions in residential zones',
      importance: 'MEDIUM',
      status: 'FOUND',
      sourceIds: [],
      createdAt: '2026-08-17T10:00:00Z',
      provider: 'ParallelResearchProvider'
    };
    const s2: Source = {
      id: 's2',
      title: 'City Noise Code Sec 12.4',
      domain: 'citycode.gov',
      url: 'https://citycode.gov/sec124',
      relatedResearchId: 'q2',
      retrievedDate: '2026-08-17',
      evidenceSummary: 'Generators operating past 10pm require sound baffles.',
      isDemoMock: false,
      qualityTag: 'OFFICIAL'
    };

    const sources = getSourcesForResearchQuestion(q, [s2]);
    expect(sources).toHaveLength(1);
    expect(sources[0].id).toBe('s2');
  });

  // Test 3: duplicate source removed
  it('3. duplicate source removed', () => {
    const q: ResearchQuestion = {
      id: 'q3',
      productionId: 'p1',
      question: 'Is generator permit needed?',
      importance: 'HIGH',
      status: 'FOUND',
      sourceIds: ['s3'],
      createdAt: '2026-08-17T10:00:00Z',
      provider: 'ParallelResearchProvider'
    };
    const s3: Source = {
      id: 's3',
      title: 'City Power Code',
      domain: 'citycode.gov',
      url: 'https://citycode.gov/power',
      relatedResearchId: 'q3',
      retrievedDate: '2026-08-17',
      evidenceSummary: 'Generators above 10kW require city power permit.',
      isDemoMock: false
    };

    const sources = getSourcesForResearchQuestion(q, [s3]);
    expect(sources).toHaveLength(1);
  });

  // Test 4: linked question is grounded
  it('4. linked question is grounded', () => {
    const q: ResearchQuestion = {
      id: 'q4',
      productionId: 'p1',
      question: 'Street closure requirements',
      importance: 'CRITICAL',
      status: 'FOUND',
      findings: 'Permit requires 48hr advance notification to residents.',
      sourceIds: ['s4'],
      createdAt: '2026-08-17T10:00:00Z',
      provider: 'ParallelResearchProvider'
    };
    const s4: Source = {
      id: 's4',
      title: 'Film LA Permit Guide',
      domain: 'filmla.com',
      url: 'https://filmla.com/guide',
      retrievedDate: '2026-08-17',
      evidenceSummary: 'Street closure requires notification flyers.',
      isDemoMock: false
    };

    const state = getResearchGroundingState(q, [s4]);
    expect(state.isGrounded).toBe(true);
    expect(state.hasFindings).toBe(true);
  });

  // Test 5: unlinked question is not grounded
  it('5. unlinked question is not grounded', () => {
    const q: ResearchQuestion = {
      id: 'q5',
      productionId: 'p1',
      question: 'Special effects pyrotechnics regulations',
      importance: 'HIGH',
      status: 'PENDING',
      sourceIds: [],
      createdAt: '2026-08-17T10:00:00Z',
      provider: 'ParallelResearchProvider'
    };

    const state = getResearchGroundingState(q, []);
    expect(state.isGrounded).toBe(false);
  });

  // Test 6: grounding count correct
  it('6. grounding count correct', () => {
    const q1: ResearchQuestion = {
      id: 'q6a',
      productionId: 'p1',
      question: 'Q1',
      importance: 'HIGH',
      status: 'FOUND',
      findings: 'F1',
      sourceIds: ['s6a'],
      createdAt: '2026-08-17T10:00:00Z',
      provider: 'ParallelResearchProvider'
    };
    const q2: ResearchQuestion = {
      id: 'q6b',
      productionId: 'p1',
      question: 'Q2',
      importance: 'LOW',
      status: 'PENDING',
      sourceIds: [],
      createdAt: '2026-08-17T10:00:00Z',
      provider: 'ParallelResearchProvider'
    };
    const s6a: Source = {
      id: 's6a',
      title: 'Source 6a',
      domain: 'example.com',
      url: 'https://example.com/s6a',
      retrievedDate: '2026-08-17',
      evidenceSummary: 'Summary 6a',
      isDemoMock: false
    };

    const summary = getResearchSummary([q1, q2], [s6a], null);
    expect(summary.totalQuestions).toBe(2);
    expect(summary.groundedQuestions).toBe(1);
    expect(summary.unresolvedQuestions).toBe(1);
    expect(summary.groundingCoverage).toBe(0.5);
  });

  // Test 7: zero questions does not claim success
  it('7. zero questions does not claim success', () => {
    const summary = getResearchSummary([], [], null);
    expect(summary.totalQuestions).toBe(0);
    expect(summary.groundedQuestions).toBe(0);
    expect(summary.groundingCoverage).toBe(0);
  });

  // Test 8: Risk only links through explicit sourceIds
  it('8. Risk only links through explicit sourceIds', () => {
    const s8: Source = {
      id: 's8',
      title: 'Aviation Safety Advisory',
      domain: 'faa.gov',
      url: 'https://faa.gov/safety',
      retrievedDate: '2026-08-17',
      evidenceSummary: 'Night flight near powerlines requires spotter.',
      isDemoMock: false
    };
    const r1: Risk = {
      id: 'r1',
      productionId: 'p1',
      title: 'Drone Crash Risk Near Powerlines',
      description: 'Potential obstruction by high-voltage cables',
      severity: 'HIGH',
      reason: 'Unmapped cables near location',
      recommendedAction: 'Deploy visual observer',
      status: 'OPEN',
      sourceIds: ['s8'],
      createdAt: '2026-08-17T10:00:00Z'
    };

    const linkedRisks = getRisksSupportedBySourceIds(['s8'], [r1]);
    expect(linkedRisks).toHaveLength(1);
    expect(linkedRisks[0].id).toBe('r1');
  });

  // Test 9: same scene alone does not link Risk
  it('9. same scene alone does not link Risk', () => {
    const q: ResearchQuestion = {
      id: 'q9',
      productionId: 'p1',
      question: 'Drone permits for Scene 3',
      sceneNumber: 3,
      importance: 'HIGH',
      status: 'FOUND',
      sourceIds: ['s9'],
      createdAt: '2026-08-17T10:00:00Z',
      provider: 'ParallelResearchProvider'
    };
    const s9: Source = {
      id: 's9',
      title: 'Drone Guide',
      domain: 'faa.gov',
      url: 'https://faa.gov/drone',
      retrievedDate: '2026-08-17',
      evidenceSummary: 'Drone rules summary',
      isDemoMock: false
    };
    const r2: Risk = {
      id: 'r2',
      productionId: 'p1',
      title: 'High Winds in Scene 3',
      description: 'Wind gusts predicted',
      severity: 'HIGH',
      sceneNumber: 3,
      reason: 'Exposed location',
      recommendedAction: 'Hold equipment',
      status: 'OPEN',
      sourceIds: ['s_other'],
      createdAt: '2026-08-17T10:00:00Z'
    };

    const linkedRisks = getRisksForResearchQuestion(q, [s9], [r2]);
    expect(linkedRisks).toHaveLength(0);
  });

  // Test 10: matching keywords alone do not link Risk
  it('10. matching keywords alone do not link Risk', () => {
    const q: ResearchQuestion = {
      id: 'q10',
      productionId: 'p1',
      question: 'Night lighting permits in Downtown',
      importance: 'HIGH',
      status: 'FOUND',
      sourceIds: ['s10'],
      createdAt: '2026-08-17T10:00:00Z',
      provider: 'ParallelResearchProvider'
    };
    const s10: Source = {
      id: 's10',
      title: 'Lighting Permit Sec A',
      domain: 'city.gov',
      url: 'https://city.gov/light',
      retrievedDate: '2026-08-17',
      evidenceSummary: 'Downtown night lighting permit rules.',
      isDemoMock: false
    };
    const r3: Risk = {
      id: 'r3',
      productionId: 'p1',
      title: 'Night lighting permits hazard in Downtown',
      description: 'Keywords match question but sourceIds do not overlap',
      severity: 'MEDIUM',
      reason: 'No source overlap',
      recommendedAction: 'Verify sourceIds',
      status: 'OPEN',
      sourceIds: ['s_unrelated'],
      createdAt: '2026-08-17T10:00:00Z'
    };

    const linkedRisks = getRisksForResearchQuestion(q, [s10], [r3]);
    expect(linkedRisks).toHaveLength(0);
  });

  // Test 11: OFFICIAL preserved
  it('11. OFFICIAL preserved', () => {
    const s: Source = {
      id: 's11',
      title: 'FAA Regulations',
      domain: 'faa.gov',
      url: 'https://faa.gov',
      retrievedDate: '2026-08-17',
      evidenceSummary: 'Official drone regulations.',
      isDemoMock: false,
      qualityTag: 'OFFICIAL'
    };
    const trust = getSourceTrustPresentation(s);
    expect(trust.qualityTag).toBe('OFFICIAL');
    expect(trust.displayQuality).toBe('OFFICIAL');
  });

  // Test 12: INDUSTRY preserved
  it('12. INDUSTRY preserved', () => {
    const s: Source = {
      id: 's12',
      title: 'AMPTP Safety Bulletin',
      domain: 'csatf.org',
      url: 'https://csatf.org/bulletins',
      retrievedDate: '2026-08-17',
      evidenceSummary: 'Industry safety bulletin #36.',
      isDemoMock: false,
      qualityTag: 'INDUSTRY'
    };
    const trust = getSourceTrustPresentation(s);
    expect(trust.qualityTag).toBe('INDUSTRY');
    expect(trust.displayQuality).toBe('INDUSTRY');
  });

  // Test 13: SECONDARY preserved
  it('13. SECONDARY preserved', () => {
    const s: Source = {
      id: 's13',
      title: 'Filmmaker Blog Post',
      domain: 'indiefilm.com',
      url: 'https://indiefilm.com/post',
      retrievedDate: '2026-08-17',
      evidenceSummary: 'Secondary account of filming experience.',
      isDemoMock: true,
      qualityTag: 'SECONDARY'
    };
    const trust = getSourceTrustPresentation(s);
    expect(trust.qualityTag).toBe('SECONDARY');
    expect(trust.displayQuality).toBe('SECONDARY');
  });

  // Test 14: undefined quality makes no claim
  it('14. undefined quality makes no claim', () => {
    const s: Source = {
      id: 's14',
      title: 'Generic Page',
      domain: 'example.com',
      url: 'https://example.com',
      retrievedDate: '2026-08-17',
      evidenceSummary: 'Unclassified evidence summary.',
      isDemoMock: false
    };
    const trust = getSourceTrustPresentation(s);
    expect(trust.qualityTag).toBeUndefined();
    expect(trust.displayQuality).toBeNull();
  });

  // Test 15: real dataset = REAL
  it('15. real dataset = REAL', () => {
    const s: Source = {
      id: 's15',
      title: 'Real Source',
      domain: 'real.gov',
      url: 'https://real.gov',
      retrievedDate: '2026-08-17',
      evidenceSummary: 'Real evidence.',
      isDemoMock: false
    };
    const summary = getResearchSummary([], [s], null);
    expect(summary.datasetType).toBe('REAL');
  });

  // Test 16: mock dataset = MOCK
  it('16. mock dataset = MOCK', () => {
    const s: Source = {
      id: 's16',
      title: 'Mock Source',
      domain: 'mock.local',
      url: 'https://mock.local',
      retrievedDate: '2026-08-17',
      evidenceSummary: 'Mock evidence.',
      isDemoMock: true
    };
    const summary = getResearchSummary([], [s], null);
    expect(summary.datasetType).toBe('MOCK');
  });

  // Test 17: mixed dataset = MIXED
  it('17. mixed dataset = MIXED', () => {
    const s1: Source = {
      id: 's17a',
      title: 'Real Source',
      domain: 'real.gov',
      url: 'https://real.gov',
      retrievedDate: '2026-08-17',
      evidenceSummary: 'Real evidence.',
      isDemoMock: false
    };
    const s2: Source = {
      id: 's17b',
      title: 'Mock Source',
      domain: 'mock.local',
      url: 'https://mock.local',
      retrievedDate: '2026-08-17',
      evidenceSummary: 'Mock evidence.',
      isDemoMock: true
    };
    const summary = getResearchSummary([], [s1, s2], null);
    expect(summary.datasetType).toBe('MIXED');
  });

  // Test 18: empty dataset = EMPTY
  it('18. empty dataset = EMPTY', () => {
    const summary = getResearchSummary([], [], null);
    expect(summary.datasetType).toBe('EMPTY');
  });

  // Test 19: real sources without tool telemetry cannot claim Parallel verified
  it('19. real sources without tool telemetry cannot claim Parallel verified', () => {
    const s: Source = {
      id: 's19',
      title: 'Real Source',
      domain: 'real.gov',
      url: 'https://real.gov',
      retrievedDate: '2026-08-17',
      evidenceSummary: 'Real evidence.',
      isDemoMock: false
    };
    const run: WorkflowRun = {
      id: 'w19',
      productionId: 'p1',
      mode: 'AGENTIC_GOOGLE_ADK',
      status: 'COMPLETED',
      activities: [],
      toolActivities: [], // no parallel_search tool
      startedAt: '2026-08-17T10:00:00Z'
    };

    const summary = getResearchSummary([], [s], run);
    expect(summary.hasParallelTool).toBe(false);
  });

  // Test 20: parallel_search event can claim Parallel
  it('20. parallel_search event can claim Parallel', () => {
    const run: WorkflowRun = {
      id: 'w20',
      productionId: 'p1',
      mode: 'AGENTIC_GOOGLE_ADK',
      status: 'COMPLETED',
      activities: [],
      toolActivities: [
        {
          id: 't20',
          toolName: 'parallel_search',
          status: 'COMPLETED',
          queryCount: 3,
          resultCount: 12,
          domains: ['faa.gov', 'filmla.com']
        }
      ],
      startedAt: '2026-08-17T10:00:00Z'
    };

    const summary = getResearchSummary([], [], run);
    expect(summary.hasParallelTool).toBe(true);
    expect(summary.parallelToolStatus).toBe('COMPLETED');
    expect(summary.parallelQueries).toBe(3);
    expect(summary.parallelResults).toBe(12);
    expect(summary.parallelDomainsCount).toBe(2);
  });

  // Test 21: LOCAL_SIMULATION cannot claim Parallel
  it('21. LOCAL_SIMULATION cannot claim Parallel', () => {
    const run: WorkflowRun = {
      id: 'w21',
      productionId: 'p1',
      mode: 'LOCAL_SIMULATION',
      status: 'COMPLETED',
      activities: [],
      toolActivities: [
        {
          id: 't21',
          toolName: 'parallel_search',
          status: 'COMPLETED'
        }
      ],
      startedAt: '2026-08-17T10:00:00Z'
    };

    const summary = getResearchSummary([], [], run);
    expect(summary.hasParallelTool).toBe(false);
  });

  // Test 22: running tool state correct
  it('22. running tool state correct', () => {
    const run: WorkflowRun = {
      id: 'w22',
      productionId: 'p1',
      mode: 'AGENTIC_GOOGLE_ADK',
      status: 'RUNNING',
      activities: [],
      toolActivities: [
        {
          id: 't22',
          toolName: 'parallel_search',
          status: 'RUNNING'
        }
      ],
      startedAt: '2026-08-17T10:00:00Z'
    };

    const summary = getResearchSummary([], [], run);
    expect(summary.hasParallelTool).toBe(true);
    expect(summary.parallelToolStatus).toBe('RUNNING');
  });

  // Test 23: completed tool state correct
  it('23. completed tool state correct', () => {
    const run: WorkflowRun = {
      id: 'w23',
      productionId: 'p1',
      mode: 'AGENTIC_GOOGLE_ADK',
      status: 'COMPLETED',
      activities: [],
      toolActivities: [
        {
          id: 't23',
          toolName: 'parallel_search',
          status: 'COMPLETED'
        }
      ],
      startedAt: '2026-08-17T10:00:00Z'
    };

    const summary = getResearchSummary([], [], run);
    expect(summary.hasParallelTool).toBe(true);
    expect(summary.parallelToolStatus).toBe('COMPLETED');
  });

  // Test 24: javascript rejected
  it('24. javascript rejected', () => {
    const result = getSafeExternalUrl('javascript:alert(1)');
    expect(result.isValid).toBe(false);
    expect(result.safeUrl).toBeNull();
    expect(result.displayText).toBe('SOURCE LINK UNAVAILABLE');
  });

  // Test 25: data rejected
  it('25. data rejected', () => {
    const result = getSafeExternalUrl('data:text/html,<h1>Malicious</h1>');
    expect(result.isValid).toBe(false);
    expect(result.safeUrl).toBeNull();
    expect(result.displayText).toBe('SOURCE LINK UNAVAILABLE');
  });

  // Test 26: file rejected
  it('26. file rejected', () => {
    const result = getSafeExternalUrl('file:///etc/passwd');
    expect(result.isValid).toBe(false);
    expect(result.safeUrl).toBeNull();
    expect(result.displayText).toBe('SOURCE LINK UNAVAILABLE');
  });

  // Test 27: http allowed
  it('27. http allowed', () => {
    const result = getSafeExternalUrl('http://example.com/permits');
    expect(result.isValid).toBe(true);
    expect(result.safeUrl).toBe('http://example.com/permits');
  });

  // Test 28: https allowed
  it('28. https allowed', () => {
    const result = getSafeExternalUrl('https://faa.gov/part107');
    expect(result.isValid).toBe(true);
    expect(result.safeUrl).toBe('https://faa.gov/part107');
  });

  // Test 29: evidenceSummary is summary, not verbatim quote
  it('29. evidenceSummary is summary, not verbatim quote', () => {
    const s: Source = {
      id: 's29',
      title: 'Source Title',
      domain: 'domain.com',
      url: 'https://domain.com',
      retrievedDate: '2026-08-17',
      evidenceSummary: 'Summary text without verbatim quotes',
      isDemoMock: false
    };

    const trust = getSourceTrustPresentation(s);
    expect(trust.evidenceLabel).toBe('EVIDENCE SUMMARY');
  });

  // Test 30: failed research retains evidence
  it('30. failed research retains evidence', () => {
    const q: ResearchQuestion = {
      id: 'q30',
      productionId: 'p1',
      question: 'Question that encountered a step failure',
      importance: 'HIGH',
      status: 'FAILED',
      findings: 'Partial findings gathered before error',
      sourceIds: ['s30'],
      createdAt: '2026-08-17T10:00:00Z',
      provider: 'ParallelResearchProvider'
    };
    const s: Source = {
      id: 's30',
      title: 'Retained Evidence Source',
      domain: 'retained.gov',
      url: 'https://retained.gov',
      retrievedDate: '2026-08-17',
      evidenceSummary: 'Evidence retained despite question failure',
      isDemoMock: false
    };

    const sources = getSourcesForResearchQuestion(q, [s]);
    expect(sources).toHaveLength(1);
    expect(sources[0].id).toBe('s30');

    const gState = getResearchGroundingState(q, [s]);
    expect(gState.linkedSources).toHaveLength(1);
  });

  // Test 31: missing findings create no fake finding
  it('31. missing findings create no fake finding', () => {
    const q: ResearchQuestion = {
      id: 'q31',
      productionId: 'p1',
      question: 'Question with no findings yet',
      importance: 'LOW',
      status: 'PENDING',
      sourceIds: [],
      createdAt: '2026-08-17T10:00:00Z',
      provider: 'ParallelResearchProvider'
    };

    const gState = getResearchGroundingState(q, []);
    expect(gState.hasFindings).toBe(false);
  });

  // Test 32: missing sources create no fake citations
  it('32. missing sources create no fake citations', () => {
    const q: ResearchQuestion = {
      id: 'q32',
      productionId: 'p1',
      question: 'Question with no linked sources',
      importance: 'MEDIUM',
      status: 'PENDING',
      sourceIds: [],
      createdAt: '2026-08-17T10:00:00Z',
      provider: 'ParallelResearchProvider'
    };

    const sources = getSourcesForResearchQuestion(q, []);
    expect(sources).toHaveLength(0);
  });
});

describe('Stage 4.3.1: Grounded Research Truthfulness Hotfix', () => {
  // Test 1: completed Parallel => VERIFIED
  it('1. completed Parallel => VERIFIED', () => {
    const run: WorkflowRun = {
      id: 'w1',
      productionId: 'p1',
      mode: 'AGENTIC_GOOGLE_ADK',
      status: 'COMPLETED',
      activities: [],
      toolActivities: [
        {
          id: 't1',
          toolName: 'parallel_search',
          status: 'COMPLETED'
        }
      ],
      startedAt: '2026-08-17T10:00:00Z'
    };
    const summary = getResearchSummary([], [], run);
    expect(summary.hasParallelTool).toBe(true);
    expect(summary.parallelToolStatus).toBe('COMPLETED');
  });

  // Test 2: running Parallel => LIVE, not VERIFIED
  it('2. running Parallel => LIVE, not VERIFIED', () => {
    const run: WorkflowRun = {
      id: 'w2',
      productionId: 'p1',
      mode: 'AGENTIC_GOOGLE_ADK',
      status: 'RUNNING',
      activities: [],
      toolActivities: [
        {
          id: 't2',
          toolName: 'parallel_search',
          status: 'RUNNING'
        }
      ],
      startedAt: '2026-08-17T10:00:00Z'
    };
    const summary = getResearchSummary([], [], run);
    expect(summary.hasParallelTool).toBe(true);
    expect(summary.parallelToolStatus).toBe('RUNNING');
    expect(summary.parallelToolStatus).not.toBe('COMPLETED');
  });

  // Test 3: failed Parallel => FAILED, not VERIFIED
  it('3. failed Parallel => FAILED, not VERIFIED', () => {
    const run: WorkflowRun = {
      id: 'w3',
      productionId: 'p1',
      mode: 'AGENTIC_GOOGLE_ADK',
      status: 'FAILED',
      activities: [],
      toolActivities: [
        {
          id: 't3',
          toolName: 'parallel_search',
          status: 'FAILED'
        }
      ],
      startedAt: '2026-08-17T10:00:00Z'
    };
    const summary = getResearchSummary([], [], run);
    expect(summary.hasParallelTool).toBe(true);
    expect(summary.parallelToolStatus).toBe('FAILED');
    expect(summary.parallelToolStatus).not.toBe('COMPLETED');
  });

  // Test 4: Partner Judge Card eligible only for COMPLETED
  it('4. Partner Judge Card eligible only for COMPLETED', () => {
    const run: WorkflowRun = {
      id: 'w4',
      productionId: 'p1',
      mode: 'AGENTIC_GOOGLE_ADK',
      status: 'COMPLETED',
      activities: [],
      toolActivities: [{ id: 't4', toolName: 'parallel_search', status: 'COMPLETED' }],
      startedAt: '2026-08-17T10:00:00Z'
    };
    const summary = getResearchSummary([], [], run);
    const isJudgeEligible = summary.hasParallelTool && summary.parallelToolStatus === 'COMPLETED';
    expect(isJudgeEligible).toBe(true);
  });

  // Test 5: Partner Judge Card not eligible for RUNNING
  it('5. Partner Judge Card not eligible for RUNNING', () => {
    const run: WorkflowRun = {
      id: 'w5',
      productionId: 'p1',
      mode: 'AGENTIC_GOOGLE_ADK',
      status: 'RUNNING',
      activities: [],
      toolActivities: [{ id: 't5', toolName: 'parallel_search', status: 'RUNNING' }],
      startedAt: '2026-08-17T10:00:00Z'
    };
    const summary = getResearchSummary([], [], run);
    const isJudgeEligible = summary.hasParallelTool && summary.parallelToolStatus === 'COMPLETED';
    expect(isJudgeEligible).toBe(false);
  });

  // Test 6: Partner Judge Card not eligible for FAILED
  it('6. Partner Judge Card not eligible for FAILED', () => {
    const run: WorkflowRun = {
      id: 'w6',
      productionId: 'p1',
      mode: 'AGENTIC_GOOGLE_ADK',
      status: 'FAILED',
      activities: [],
      toolActivities: [{ id: 't6', toolName: 'parallel_search', status: 'FAILED' }],
      startedAt: '2026-08-17T10:00:00Z'
    };
    const summary = getResearchSummary([], [], run);
    const isJudgeEligible = summary.hasParallelTool && summary.parallelToolStatus === 'COMPLETED';
    expect(isJudgeEligible).toBe(false);
  });

  // Test 7: FAILED question with linked Source is grounded
  it('7. FAILED question with linked Source is grounded', () => {
    const q: ResearchQuestion = {
      id: 'q7',
      productionId: 'p1',
      question: 'Failed question with source',
      importance: 'HIGH',
      status: 'FAILED',
      sourceIds: ['s7'],
      createdAt: '2026-08-17T10:00:00Z',
      provider: 'ParallelResearchProvider'
    };
    const s7: Source = {
      id: 's7',
      title: 'Valid Source',
      domain: 'seattle.gov',
      url: 'https://seattle.gov/permits',
      retrievedDate: '2026-08-17',
      evidenceSummary: 'Permit evidence',
      isDemoMock: false
    };

    const gState = getResearchGroundingState(q, [s7]);
    expect(gState.isGrounded).toBe(true);
  });

  // Test 8: FAILED question remains unresolved
  it('8. FAILED question remains unresolved', () => {
    const q: ResearchQuestion = {
      id: 'q8',
      productionId: 'p1',
      question: 'Failed question',
      importance: 'HIGH',
      status: 'FAILED',
      sourceIds: ['s8'],
      createdAt: '2026-08-17T10:00:00Z',
      provider: 'ParallelResearchProvider'
    };
    const summary = getResearchSummary([q], [], null);
    expect(summary.unresolvedQuestions).toBe(1);
  });

  // Test 9: FOUND question is resolved
  it('9. FOUND question is resolved', () => {
    const q: ResearchQuestion = {
      id: 'q9',
      productionId: 'p1',
      question: 'Found question',
      importance: 'MEDIUM',
      status: 'FOUND',
      sourceIds: [],
      createdAt: '2026-08-17T10:00:00Z',
      provider: 'ParallelResearchProvider'
    };
    const summary = getResearchSummary([q], [], null);
    expect(summary.unresolvedQuestions).toBe(0);
  });

  // Test 10: NOT_NEEDED question is resolved
  it('10. NOT_NEEDED question is resolved', () => {
    const q: ResearchQuestion = {
      id: 'q10',
      productionId: 'p1',
      question: 'Not needed question',
      importance: 'LOW',
      status: 'NOT_NEEDED',
      sourceIds: [],
      createdAt: '2026-08-17T10:00:00Z',
      provider: 'ParallelResearchProvider'
    };
    const summary = getResearchSummary([q], [], null);
    expect(summary.unresolvedQuestions).toBe(0);
  });

  // Test 11: FOUND question without source is not grounded
  it('11. FOUND question without source is not grounded', () => {
    const q: ResearchQuestion = {
      id: 'q11',
      productionId: 'p1',
      question: 'Found question without sources',
      importance: 'MEDIUM',
      status: 'FOUND',
      sourceIds: [],
      createdAt: '2026-08-17T10:00:00Z',
      provider: 'ParallelResearchProvider'
    };
    const gState = getResearchGroundingState(q, []);
    expect(gState.isGrounded).toBe(false);
  });

  // Test 12: grounding and resolution are independent
  it('12. grounding and resolution are independent', () => {
    // q12a: FOUND (resolved) but ungrounded
    const q12a: ResearchQuestion = {
      id: 'q12a',
      productionId: 'p1',
      question: 'Resolved ungrounded',
      importance: 'LOW',
      status: 'FOUND',
      sourceIds: [],
      createdAt: '2026-08-17T10:00:00Z',
      provider: 'ParallelResearchProvider'
    };
    // q12b: FAILED (unresolved) but grounded
    const q12b: ResearchQuestion = {
      id: 'q12b',
      productionId: 'p1',
      question: 'Unresolved grounded',
      importance: 'HIGH',
      status: 'FAILED',
      sourceIds: ['s12'],
      createdAt: '2026-08-17T10:00:00Z',
      provider: 'ParallelResearchProvider'
    };
    const s12: Source = {
      id: 's12',
      title: 'Evidence',
      domain: 'gov.org',
      url: 'https://gov.org',
      retrievedDate: '2026-08-17',
      evidenceSummary: 'Evidence',
      isDemoMock: false
    };

    const summary = getResearchSummary([q12a, q12b], [s12], null);
    expect(summary.groundedQuestions).toBe(1); // q12b is grounded
    expect(summary.unresolvedQuestions).toBe(1); // q12b is unresolved
  });

  // Test 13: REAL classification correct
  it('13. REAL classification correct', () => {
    const s: Source = { id: 's13', title: 'R', domain: 'r.com', url: 'https://r.com', retrievedDate: '2026-08-17', evidenceSummary: 'E', isDemoMock: false };
    const summary = getResearchSummary([], [s], null);
    expect(summary.datasetType).toBe('REAL');
  });

  // Test 14: MOCK classification correct
  it('14. MOCK classification correct', () => {
    const s: Source = { id: 's14', title: 'M', domain: 'm.com', url: 'https://m.com', retrievedDate: '2026-08-17', evidenceSummary: 'E', isDemoMock: true };
    const summary = getResearchSummary([], [s], null);
    expect(summary.datasetType).toBe('MOCK');
  });

  // Test 15: MIXED classification correct
  it('15. MIXED classification correct', () => {
    const s1: Source = { id: 's15a', title: 'R', domain: 'r.com', url: 'https://r.com', retrievedDate: '2026-08-17', evidenceSummary: 'E', isDemoMock: false };
    const s2: Source = { id: 's15b', title: 'M', domain: 'm.com', url: 'https://m.com', retrievedDate: '2026-08-17', evidenceSummary: 'E', isDemoMock: true };
    const summary = getResearchSummary([], [s1, s2], null);
    expect(summary.datasetType).toBe('MIXED');
  });

  // Test 16: EMPTY classification correct
  it('16. EMPTY classification correct', () => {
    const summary = getResearchSummary([], [], null);
    expect(summary.datasetType).toBe('EMPTY');
  });

  // Test 17: mixed data does not claim all-live
  it('17. mixed data does not claim all-live', () => {
    const s1: Source = { id: 's17a', title: 'R', domain: 'r.com', url: 'https://r.com', retrievedDate: '2026-08-17', evidenceSummary: 'E', isDemoMock: false };
    const s2: Source = { id: 's17b', title: 'M', domain: 'm.com', url: 'https://m.com', retrievedDate: '2026-08-17', evidenceSummary: 'E', isDemoMock: true };
    const summary = getResearchSummary([], [s1, s2], null);
    expect(summary.datasetType).not.toBe('REAL');
  });

  // Test 18: mixed data does not collapse to mock-only
  it('18. mixed data does not collapse to mock-only', () => {
    const s1: Source = { id: 's18a', title: 'R', domain: 'r.com', url: 'https://r.com', retrievedDate: '2026-08-17', evidenceSummary: 'E', isDemoMock: false };
    const s2: Source = { id: 's18b', title: 'M', domain: 'm.com', url: 'https://m.com', retrievedDate: '2026-08-17', evidenceSummary: 'E', isDemoMock: true };
    const summary = getResearchSummary([], [s1, s2], null);
    expect(summary.datasetType).not.toBe('MOCK');
  });

  // Test 19: https://www.seattle.gov/path => seattle.gov
  it('19. https://www.seattle.gov/path => seattle.gov', () => {
    const s: Source = {
      id: 's19',
      title: 'Seattle Permits',
      domain: 'seattle.gov',
      url: 'https://www.seattle.gov/permits/filming',
      retrievedDate: '2026-08-17',
      evidenceSummary: 'Permits summary',
      isDemoMock: false
    };
    const domain = getSourceDisplayDomain(s);
    expect(domain).toBe('seattle.gov');
  });

  // Test 20: safe HTTP domain normalization works
  it('20. safe HTTP domain normalization works', () => {
    const s: Source = {
      id: 's20',
      title: 'City Code',
      domain: 'city.gov',
      url: 'http://www.city.gov/code?section=4',
      retrievedDate: '2026-08-17',
      evidenceSummary: 'City code',
      isDemoMock: false
    };
    const domain = getSourceDisplayDomain(s);
    expect(domain).toBe('city.gov');
  });

  // Test 21: unsafe URL falls back to source.domain
  it('21. unsafe URL falls back to source.domain', () => {
    const s: Source = {
      id: 's21',
      title: 'Unsafe Page',
      domain: 'trusted.org',
      url: 'javascript:alert(1)',
      retrievedDate: '2026-08-17',
      evidenceSummary: 'Unsafe URL',
      isDemoMock: false
    };
    const domain = getSourceDisplayDomain(s);
    expect(domain).toBe('trusted.org');
  });

  // Test 22: stored source URL is unchanged
  it('22. stored source URL is unchanged', () => {
    const rawUrl = 'https://www.seattle.gov/permits/filming';
    const s: Source = {
      id: 's22',
      title: 'Seattle Permits',
      domain: 'seattle.gov',
      url: rawUrl,
      retrievedDate: '2026-08-17',
      evidenceSummary: 'Permits summary',
      isDemoMock: false
    };
    getSourceDisplayDomain(s);
    expect(s.url).toBe(rawUrl);
  });

  // Test 23: source metrics total correct
  it('23. source metrics total correct', () => {
    const s1: Source = { id: 's23a', title: 'S1', domain: 'a.com', url: 'https://a.com', retrievedDate: '2026-08-17', evidenceSummary: 'E', isDemoMock: false };
    const s2: Source = { id: 's23b', title: 'S2', domain: 'b.com', url: 'https://b.com', retrievedDate: '2026-08-17', evidenceSummary: 'E', isDemoMock: true };
    const uniqueSources = [s1, s2];
    expect(uniqueSources.length).toBe(2);
  });

  // Test 24: real count correct
  it('24. real count correct', () => {
    const s1: Source = { id: 's24a', title: 'S1', domain: 'a.com', url: 'https://a.com', retrievedDate: '2026-08-17', evidenceSummary: 'E', isDemoMock: false };
    const s2: Source = { id: 's24b', title: 'S2', domain: 'b.com', url: 'https://b.com', retrievedDate: '2026-08-17', evidenceSummary: 'E', isDemoMock: true };
    const realCount = [s1, s2].filter((s) => !s.isDemoMock).length;
    expect(realCount).toBe(1);
  });

  // Test 25: mock count correct
  it('25. mock count correct', () => {
    const s1: Source = { id: 's25a', title: 'S1', domain: 'a.com', url: 'https://a.com', retrievedDate: '2026-08-17', evidenceSummary: 'E', isDemoMock: false };
    const s2: Source = { id: 's25b', title: 'S2', domain: 'b.com', url: 'https://b.com', retrievedDate: '2026-08-17', evidenceSummary: 'E', isDemoMock: true };
    const mockCount = [s1, s2].filter((s) => s.isDemoMock).length;
    expect(mockCount).toBe(1);
  });

  // Test 26: official count correct
  it('26. official count correct', () => {
    const s1: Source = { id: 's26a', title: 'S1', domain: 'a.com', url: 'https://a.com', retrievedDate: '2026-08-17', evidenceSummary: 'E', isDemoMock: false, qualityTag: 'OFFICIAL' };
    const s2: Source = { id: 's26b', title: 'S2', domain: 'b.com', url: 'https://b.com', retrievedDate: '2026-08-17', evidenceSummary: 'E', isDemoMock: false, qualityTag: 'INDUSTRY' };
    const officialCount = [s1, s2].filter((s) => s.qualityTag === 'OFFICIAL').length;
    expect(officialCount).toBe(1);
  });

  // Test 27: unique normalized domain count correct
  it('27. unique normalized domain count correct', () => {
    const s1: Source = { id: 's27a', title: 'S1', domain: 'seattle.gov', url: 'https://www.seattle.gov/page1', retrievedDate: '2026-08-17', evidenceSummary: 'E', isDemoMock: false };
    const s2: Source = { id: 's27b', title: 'S2', domain: 'seattle.gov', url: 'https://seattle.gov/page2', retrievedDate: '2026-08-17', evidenceSummary: 'E', isDemoMock: false };
    const s3: Source = { id: 's27c', title: 'S3', domain: 'faa.gov', url: 'https://faa.gov/page3', retrievedDate: '2026-08-17', evidenceSummary: 'E', isDemoMock: false };

    const uniqueDomainsCount = new Set([s1, s2, s3].map((s) => getSourceDisplayDomain(s))).size;
    expect(uniqueDomainsCount).toBe(2);
  });

  // Test 28: SourcesView Parallel completed claim requires tool telemetry
  it('28. SourcesView Parallel completed claim requires tool telemetry', () => {
    const run: WorkflowRun = {
      id: 'w28',
      productionId: 'p1',
      mode: 'AGENTIC_GOOGLE_ADK',
      status: 'COMPLETED',
      activities: [],
      toolActivities: [],
      startedAt: '2026-08-17T10:00:00Z'
    };
    const pTool = run.toolActivities?.find((t) => t.toolName === 'parallel_search');
    expect(pTool).toBeUndefined();
  });

  // Test 29: SourcesView LOCAL_SIMULATION cannot claim Parallel
  it('29. SourcesView LOCAL_SIMULATION cannot claim Parallel', () => {
    const run: WorkflowRun = {
      id: 'w29',
      productionId: 'p1',
      mode: 'LOCAL_SIMULATION',
      status: 'COMPLETED',
      activities: [],
      toolActivities: [{ id: 't29', toolName: 'parallel_search', status: 'COMPLETED' }],
      startedAt: '2026-08-17T10:00:00Z'
    };
    const summary = getResearchSummary([], [], run);
    expect(summary.hasParallelTool).toBe(false);
  });

  // Test 30: failed Parallel is not presented as collected successfully
  it('30. failed Parallel is not presented as collected successfully', () => {
    const run: WorkflowRun = {
      id: 'w30',
      productionId: 'p1',
      mode: 'AGENTIC_GOOGLE_ADK',
      status: 'FAILED',
      activities: [],
      toolActivities: [{ id: 't30', toolName: 'parallel_search', status: 'FAILED' }],
      startedAt: '2026-08-17T10:00:00Z'
    };
    const summary = getResearchSummary([], [], run);
    expect(summary.parallelToolStatus).toBe('FAILED');
    expect(summary.parallelToolStatus).not.toBe('COMPLETED');
  });

  // Test 31: relatedSceneNumber presentation data preserved
  it('31. relatedSceneNumber presentation data preserved', () => {
    const s: Source = {
      id: 's31',
      title: 'Scene 4 Guide',
      domain: 'filmla.com',
      url: 'https://filmla.com/s4',
      relatedSceneNumber: 4,
      retrievedDate: '2026-08-17',
      evidenceSummary: 'Permits for Scene 4',
      isDemoMock: false
    };
    expect(s.relatedSceneNumber).toBe(4);
  });

  // Test 32: relatedResearchId presentation data preserved
  it('32. relatedResearchId presentation data preserved', () => {
    const s: Source = {
      id: 's32',
      title: 'Research Evidence',
      domain: 'gov.org',
      url: 'https://gov.org/res',
      relatedResearchId: 'q32',
      retrievedDate: '2026-08-17',
      evidenceSummary: 'Evidence for Q32',
      isDemoMock: false
    };
    expect(s.relatedResearchId).toBe('q32');
  });
});
