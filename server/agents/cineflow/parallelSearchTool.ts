import { FunctionTool, Context } from '@google/adk';
import { z } from 'zod';
import { ResearchSource } from '../../../src/types/index.js';

export const ParallelSearchParameters = z.object({
  objective: z
    .string()
    .min(1)
    .describe('The research objective or question to answer'),

  searchQueries: z
    .array(z.string().min(1))
    .min(1)
    .max(2)
    .optional()
    .describe('1-2 consolidated search query strings.'),

  location: z
    .string()
    .optional()
    .describe('Filming location hint e.g. Seattle, WA')
});

export interface ParallelSearchArgs {
  objective: string;
  searchQueries?: string[];
  context?: {
    location?: string;
    filmTitle?: string;
  };
}

export interface ParallelSearchResult {
  findings: string;
  sources: ResearchSource[];
  providerStatus: 'SUCCESS' | 'UNCONFIGURED' | 'FAILED';
  rawQueryCount: number;
}

export async function executeParallelSearch(args: ParallelSearchArgs): Promise<ParallelSearchResult> {
  const apiKey = process.env.PARALLEL_API_KEY;

  if (!apiKey) {
    return {
      findings: 'Parallel Search API key is not configured on the server.',
      sources: [],
      providerStatus: 'UNCONFIGURED',
      rawQueryCount: args.searchQueries?.length || 0
    };
  }

  const queries = args.searchQueries && args.searchQueries.length > 0
    ? args.searchQueries
    : [args.objective];

  const allSources: ResearchSource[] = [];
  const querySummaries: string[] = [];

  const queryPromises = queries.map(async (q, idx) => {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 4000); // 4s timeout

      const response = await fetch('https://api.parallel.ai/v1/search', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey
        },
        body: JSON.stringify({
          objective: `${args.objective} - ${q}`,
          search_queries: [q]
        }),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errText = await response.text().catch(() => '');
        console.warn(`Parallel Search API returned status ${response.status}:`, errText);
        return {
          sources: [],
          summary: `Query "${q}" failed with HTTP status ${response.status}`
        };
      }

      const data = await response.json();
      const results = Array.isArray(data.results) ? data.results : (Array.isArray(data.data) ? data.data : []);
      const querySources: ResearchSource[] = [];

      results.forEach((item: Record<string, unknown>, i: number) => {
        let domain = 'external';
        const itemUrl = typeof item.url === 'string' ? item.url : '';
        const itemTitle = typeof item.title === 'string' ? item.title : '';
        const itemPublishDate = typeof item.publish_date === 'string' ? item.publish_date : new Date().toISOString().split('T')[0];

        if (itemUrl) {
          try {
            domain = new URL(itemUrl).hostname.replace(/^www\./, '');
          } catch {
            domain = itemUrl;
          }
        }

        const excerpts = Array.isArray(item.excerpts) ? item.excerpts.join(' \n\n ') : itemTitle;
        const dLower = domain.toLowerCase();
        const tLower = itemTitle.toLowerCase();

        let qualityTag: 'OFFICIAL' | 'INDUSTRY' | 'SECONDARY' = 'SECONDARY';
        if (
          dLower.endsWith('.gov') ||
          dLower.includes('gov') ||
          dLower.endsWith('.org') ||
          tLower.includes('official') ||
          tLower.includes('city of') ||
          tLower.includes('permit') ||
          tLower.includes('department')
        ) {
          qualityTag = 'OFFICIAL';
        } else if (
          dLower.includes('film') ||
          dLower.includes('giggster') ||
          dLower.includes('production') ||
          dLower.includes('variety') ||
          dLower.includes('hollywood') ||
          dLower.includes('wrap')
        ) {
          qualityTag = 'INDUSTRY';
        }

        if (itemUrl) {
          querySources.push({
            id: `src_par_${idx}_${i}_${Date.now()}`,
            title: itemTitle || `Research Result for ${q}`,
            domain,
            url: itemUrl,
            retrievedDate: itemPublishDate,
            evidenceSummary: excerpts.slice(0, 800),
            isDemoMock: false,
            qualityTag
          });
        }
      });

      return {
        sources: querySources,
        summary: `Query "${q}" returned ${results.length} results.`
      };
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : String(err);
      console.warn(`Parallel Search execution exception for query "${q}":`, errMsg);
      return {
        sources: [],
        summary: `Query "${q}" error: ${errMsg}`
      };
    }
  });

  const queryResults = await Promise.all(queryPromises);
  queryResults.forEach(res => {
    allSources.push(...res.sources);
    querySummaries.push(res.summary);
  });

  // Deduplicate sources by URL
  const uniqueSourcesMap = new Map<string, ResearchSource>();
  allSources.forEach(s => {
    if (!uniqueSourcesMap.has(s.url)) {
      uniqueSourcesMap.set(s.url, s);
    }
  });
  const sources = Array.from(uniqueSourcesMap.values());

  const findingsText = sources.length > 0
    ? `Live Parallel Search retrieved ${sources.length} authoritative sources across ${queries.length} queries.\n\n` +
      sources.map(s => `• [${s.qualityTag}] ${s.title} (${s.domain}): ${s.evidenceSummary.slice(0, 200)}...`).join('\n')
    : `Parallel search completed for ${queries.length} queries. No external sources were returned. ${querySummaries.join('; ')}`;

  return {
    findings: findingsText,
    sources,
    providerStatus: sources.length > 0 ? 'SUCCESS' : (apiKey ? 'FAILED' : 'UNCONFIGURED'),
    rawQueryCount: queries.length
  };
}

/**
 * Official Google ADK FunctionTool wrapping Parallel Search
 */
export const parallelSearchFunctionTool = new FunctionTool({
  name: 'parallel_search',
  description: 'Searches live real-time web using Parallel Search API to verify permits, production rules, location requirements, weather, or equipment requirements.',
  parameters: ParallelSearchParameters,
  execute: async (args: z.infer<typeof ParallelSearchParameters>, tool_context?: Context) => {
    // Fail-closed check: If ADK Context state is missing in controlled mode, reject invocation
    if (!tool_context?.state && process.env.CINEFLOW_BYPASS_BUDGET !== 'true' && process.env.NODE_ENV !== 'test') {
      return {
        status: 'FAILED',
        findings: 'Parallel Search failed: ADK Context state unavailable in controlled mode.',
        sourcesCount: 0,
        rawQueryCount: 0,
        sources: []
      };
    }

    // Stage 3 budget enforcement: MAX 1 TOOL INVOCATION, MAX 2 QUERIES PER WORKFLOW RUN
    let callsUsed = 0;
    let queriesUsed = 0;

    if (tool_context?.state) {
      callsUsed = Number(tool_context.state.get('temp:parallelToolCallsUsed') ?? 0);
      queriesUsed = Number(tool_context.state.get('temp:parallelQueriesUsed') ?? 0);
    }

    if (callsUsed >= 1) {
      return {
        status: 'FAILED',
        findings: 'Parallel Search invocation limit reached (max 1 call per workflow run).',
        sourcesCount: 0,
        rawQueryCount: 0,
        sources: []
      };
    }

    const objective = args?.objective || 'Film production research';
    let searchQueries = Array.isArray(args?.searchQueries) && args.searchQueries.length > 0
      ? args.searchQueries
      : [objective];

    // Cap queries to remaining budget (max 2 total)
    const maxAllowedQueries = Math.max(0, 2 - queriesUsed);
    if (searchQueries.length > maxAllowedQueries) {
      searchQueries = searchQueries.slice(0, maxAllowedQueries);
    }

    if (searchQueries.length === 0) {
      return {
        status: 'FAILED',
        findings: 'Parallel Search total query limit reached (max 2 queries per workflow run).',
        sourcesCount: 0,
        rawQueryCount: 0,
        sources: []
      };
    }

    // RESERVE BUDGET BEFORE EXTERNAL PROVIDER REQUEST
    if (tool_context?.state) {
      tool_context.state.set('temp:parallelToolCallsUsed', callsUsed + 1);
      tool_context.state.set('temp:parallelQueriesUsed', queriesUsed + searchQueries.length);
    }

    const res = await executeParallelSearch({
      objective,
      searchQueries,
      context: { location: args?.location }
    });

    return {
      status: res.providerStatus,
      findings: res.findings,
      sourcesCount: res.sources.length,
      rawQueryCount: res.rawQueryCount,
      sources: res.sources.map(s => ({
        id: s.id,
        title: s.title,
        domain: s.domain,
        url: s.url,
        retrievedDate: s.retrievedDate,
        evidenceSummary: s.evidenceSummary,
        qualityTag: s.qualityTag,
        isDemoMock: false
      }))
    };
  }
});
