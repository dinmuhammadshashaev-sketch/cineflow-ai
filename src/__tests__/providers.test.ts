import { describe, it, expect } from 'vitest';
import { MockAIProvider, GeminiProvider } from '../services/ai/AIProvider';
import { MockResearchProvider, ParallelResearchProvider } from '../services/research/ResearchProvider';
import { Production } from '../types';

describe('AI and Research Provider Boundaries', () => {
  const dummyProduction: Production = {
    id: 'prod_test_456',
    title: 'Test Feature',
    type: 'Feature Film',
    description: 'Test script',
    location: 'Chicago, IL',
    budget: 250000,
    currency: 'USD',
    targetShootingDates: '2026-11-01',
    shootingDaysCount: 5,
    notes: '',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    scriptText: 'INT. POLICE STATION - NIGHT\nDetective Miller examines the dossier.',
    readinessScore: 0,
    status: 'Draft'
  };

  it('MockAIProvider returns complete structured breakdown with simulation flags', async () => {
    const provider = new MockAIProvider();
    const result = await provider.analyzeScript(dummyProduction, dummyProduction.scriptText);

    expect(result.provider).toBe('mock');
    expect(result.simulated).toBe(true);
    expect(result.scenes.length).toBeGreaterThan(0);
    expect(result.characters.length).toBeGreaterThan(0);
    expect(result.props.length).toBeGreaterThan(0);
  });

  it('MockResearchProvider returns findings with isDemoMock true', async () => {
    const provider = new MockResearchProvider();
    const result = await provider.queryResearch('Film permit rules in Chicago', {
      productionTitle: dummyProduction.title,
      location: dummyProduction.location
    });

    expect(result.providerStatus).toBe('MOCK');
    expect(result.sources.length).toBeGreaterThan(0);
    expect(result.sources.every(s => s.isDemoMock)).toBe(true);
  });

  it('ParallelResearchProvider returns UNCONFIGURED status when server endpoint is unconfigured', async () => {
    // Mock global fetch for unconfigured server state
    global.fetch = async () => ({
      ok: true,
      json: async () => ({
        provider: 'parallel',
        status: 'UNCONFIGURED',
        simulated: true,
        message: 'Key not configured'
      })
    }) as any;

    const provider = new ParallelResearchProvider();
    const result = await provider.queryResearch('FAA drone permits', {
      productionTitle: dummyProduction.title,
      location: dummyProduction.location
    });

    expect(result.providerStatus).toBe('UNCONFIGURED');
    expect(result.findings).toContain('Not Configured');
  });
});
