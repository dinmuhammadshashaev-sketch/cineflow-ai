import { describe, it, expect } from 'vitest';
import {
  computeDeterministicReadiness,
  computeAuthoritativeStatus,
  storage
} from '../services/storage/StorageProvider';
import { Production, Risk, ProductionTask, ResearchQuestion, ShootDay } from '../types';

describe('StorageProvider Deterministic Readiness & Status Logic', () => {
  const dummyProduction: Production = {
    id: 'prod_test_123',
    title: 'Test Production',
    type: 'Short Film',
    description: 'A test script',
    location: 'Studio A',
    budget: 10000,
    currency: 'USD',
    targetShootingDates: '2026-10-15',
    shootingDaysCount: 2,
    notes: '',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    scriptText: 'INT. COFFEE SHOP - DAY\nAlice talks to Bob.',
    readinessScore: 0,
    status: 'Draft'
  };

  it('calculates readiness score deterministically based on production assets', () => {
    const risks: Risk[] = [
      {
        id: 'risk_1',
        productionId: 'prod_test_123',
        title: 'Noise Hazard',
        description: 'Loud streets',
        severity: 'HIGH',
        reason: 'Traffic noise',
        recommendedAction: 'Obtain sound dampening',
        status: 'OPEN',
        createdAt: new Date().toISOString()
      }
    ];

    const tasks: ProductionTask[] = [
      {
        id: 'task_1',
        productionId: 'prod_test_123',
        title: 'Permit application',
        description: 'Submit form',
        category: 'Location & Permits',
        priority: 'CRITICAL',
        status: 'DONE',
        createdAt: new Date().toISOString()
      }
    ];

    const researchQuestions: ResearchQuestion[] = [
      {
        id: 'rq_1',
        productionId: 'prod_test_123',
        question: 'Is filming permit required?',
        importance: 'HIGH',
        status: 'FOUND',
        sourceIds: [],
        createdAt: new Date().toISOString(),
        provider: 'MockResearchProvider'
      }
    ];

    const shootDays: ShootDay[] = [
      {
        id: 'day_1',
        productionId: 'prod_test_123',
        dayNumber: 1,
        locationName: 'Studio A',
        sceneNumbers: [1],
        dayNightFocus: 'DAY',
        estimatedHours: 8
      }
    ];

    const score = computeDeterministicReadiness({
      risks,
      tasks,
      research: researchQuestions,
      shootDays
    });

    expect(score).toBeGreaterThanOrEqual(0);
    expect(score).toBeLessThanOrEqual(100);
    expect(Number.isInteger(score)).toBe(true);
  });

  it('computes authoritative production status accurately based on readiness score and workflow status', () => {
    expect(computeAuthoritativeStatus(10, undefined)).toBe('Draft');
    expect(computeAuthoritativeStatus(10, 'RUNNING')).toBe('Analyzing');
    expect(computeAuthoritativeStatus(85, 'COMPLETED')).toBe('Production Ready');
  });

  it('safely performs prefix-based resetAllData without touching non-cineflow keys', () => {
    // Mock localStorage
    const localStore: Record<string, string> = {
      'cineflow_v1_active_prod': 'prod_test_123',
      'cineflow_v1_custom_key': 'temp_data',
      'other_app_user_token': 'secret123'
    };

    global.localStorage = {
      getItem: (k: string) => localStore[k] || null,
      setItem: (k: string, v: string) => { localStore[k] = v; },
      removeItem: (k: string) => { delete localStore[k]; },
      clear: () => { Object.keys(localStore).forEach(k => delete localStore[k]); },
      key: (i: number) => Object.keys(localStore)[i] || null,
      get length() { return Object.keys(localStore).length; }
    } as any;

    storage.resetAllData();

    // Custom non-seeded cineflow key was cleared
    expect(localStore['cineflow_v1_custom_key']).toBeUndefined();
    // Non-cineflow key was untouched
    expect(localStore['other_app_user_token']).toBe('secret123');
  });
});
