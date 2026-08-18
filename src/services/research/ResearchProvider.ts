/**
 * CineFlow AI — Research Provider Boundary (Parallel Search API Integration Architecture)
 */

import { Source } from '../../types';
import { getDemoSources } from '../../data/demoProductionData';
import { generateId } from '../../lib/id';

export type ResearchProviderStatus = 'UNCONFIGURED' | 'MOCK' | 'READY' | 'RUNNING' | 'FAILED';

export interface SearchResult {
  id: string;
  title: string;
  url: string;
  domain: string;
  snippet: string;
  retrievedAt: string;
}

export interface ResearchProvider {
  name: string;
  isMock: boolean;
  status: ResearchProviderStatus;
  queryResearch(
    question: string,
    context: { productionTitle: string; location: string; sceneNumber?: number }
  ): Promise<{
    findings: string;
    sources: Source[];
    providerStatus: ResearchProviderStatus;
  }>;
}

export class MockResearchProvider implements ResearchProvider {
  public name = "CineFlow Local Research Engine (Demo)";
  public isMock = true;
  public status: ResearchProviderStatus = 'MOCK';

  public async queryResearch(
    question: string,
    context: { productionTitle: string; location: string; sceneNumber?: number }
  ): Promise<{
    findings: string;
    sources: Source[];
    providerStatus: ResearchProviderStatus;
  }> {
    const demoSources = getDemoSources();
    const source1: Source = {
      id: generateId('src_mock'),
      title: `Regional Municipal Permitting Guide — ${context.location || 'Local Office'}`,
      domain: 'film.permits.local',
      url: 'https://filmcommission.org/permit-guide',
      relatedSceneNumber: context.sceneNumber,
      retrievedDate: new Date().toISOString().split('T')[0],
      evidenceSummary: `Verified regulatory standards for: ${question}`,
      isDemoMock: true
    };

    return {
      findings: `[DEMO / MOCK] Verified municipal regulations for "${question}" in ${context.location || 'filming area'}. Commercial filming requires municipal notice and liability insurance.`,
      sources: [source1, ...demoSources.slice(1, 2)],
      providerStatus: 'MOCK'
    };
  }
}

export class ParallelResearchProvider implements ResearchProvider {
  public name = "Parallel Search API";
  public isMock = false;
  public status: ResearchProviderStatus = 'UNCONFIGURED';

  public async queryResearch(
    question: string,
    context: { productionTitle: string; location: string; sceneNumber?: number }
  ): Promise<{
    findings: string;
    sources: Source[];
    providerStatus: ResearchProviderStatus;
  }> {
    try {
      const res = await fetch('/api/research', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question, context })
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        this.status = 'FAILED';
        return {
          findings: `[Parallel Search API Error] Server returned HTTP ${res.status}: ${errData.error || res.statusText}`,
          sources: [],
          providerStatus: 'FAILED'
        };
      }

      const data = await res.json();

      if (data.status === 'SUCCESS' && Array.isArray(data.sources)) {
        this.status = 'READY';
        return {
          findings: data.findings || `Live Parallel Search completed: ${question}`,
          sources: data.sources.map((s: any, idx: number) => ({
            ...s,
            id: s.id || generateId(`src_par_${idx}`),
            relatedSceneNumber: context.sceneNumber,
            isDemoMock: false
          })),
          providerStatus: 'READY'
        };
      }

      if (data.status === 'UNCONFIGURED') {
        this.status = 'UNCONFIGURED';
        return {
          findings: `[Parallel Search API Error] PARALLEL_API_KEY is Not Configured on the server.`,
          sources: [],
          providerStatus: 'UNCONFIGURED'
        };
      }

      this.status = 'FAILED';
      return {
        findings: `[Parallel Search API Error] ${data.error || 'Research query failed.'}`,
        sources: [],
        providerStatus: 'FAILED'
      };
    } catch (e: any) {
      console.warn("Parallel Search API query failed:", e?.message || e);
      this.status = 'FAILED';
      return {
        findings: `[Parallel Search API Error] ${e?.message || 'Network request failed'}`,
        sources: [],
        providerStatus: 'FAILED'
      };
    }
  }
}
