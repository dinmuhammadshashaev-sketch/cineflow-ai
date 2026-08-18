import { ResearchQuestion, Source, Risk, WorkflowRun } from '../types';

export function getSourcesForResearchQuestion(
  question: ResearchQuestion,
  sources: Source[]
): Source[] {
  if (!sources || !Array.isArray(sources)) return [];
  const qSourceIds = new Set(question?.sourceIds || []);

  const matched = sources.filter(
    (s) => qSourceIds.has(s.id) || (s.relatedResearchId && s.relatedResearchId === question.id)
  );

  const seen = new Set<string>();
  const unique: Source[] = [];
  for (const s of matched) {
    if (s.id && !seen.has(s.id)) {
      seen.add(s.id);
      unique.push(s);
    }
  }
  return unique;
}

export interface GroundingState {
  isGrounded: boolean;
  linkedSources: Source[];
  hasFindings: boolean;
}

export function getResearchGroundingState(
  question: ResearchQuestion,
  sources: Source[]
): GroundingState {
  const linkedSources = getSourcesForResearchQuestion(question, sources);
  const hasFindings = Boolean(question?.findings && question.findings.trim().length > 0);
  const isGrounded = Boolean(linkedSources.length > 0);

  return {
    isGrounded,
    linkedSources,
    hasFindings
  };
}

export function getRisksSupportedBySourceIds(
  sourceIds: string[],
  risks: Risk[]
): Risk[] {
  if (!sourceIds || sourceIds.length === 0 || !risks || !Array.isArray(risks)) return [];
  const targetIds = new Set(sourceIds);

  const matched = risks.filter((r) => {
    if (!r.sourceIds || !Array.isArray(r.sourceIds) || r.sourceIds.length === 0) {
      return false;
    }
    return r.sourceIds.some((id) => targetIds.has(id));
  });

  const seen = new Set<string>();
  const unique: Risk[] = [];
  for (const r of matched) {
    if (r.id && !seen.has(r.id)) {
      seen.add(r.id);
      unique.push(r);
    }
  }
  return unique;
}

export function getRisksForResearchQuestion(
  question: ResearchQuestion,
  sources: Source[],
  risks: Risk[]
): Risk[] {
  const linkedSources = getSourcesForResearchQuestion(question, sources);
  const sourceIds = Array.from(
    new Set([
      ...(question.sourceIds || []),
      ...linkedSources.map((s) => s.id)
    ])
  );
  return getRisksSupportedBySourceIds(sourceIds, risks);
}

export type DatasetType = 'REAL' | 'MOCK' | 'MIXED' | 'EMPTY';

export interface ResearchSummary {
  totalQuestions: number;
  groundedQuestions: number;
  realSourcesCount: number;
  officialSourcesCount: number;
  unresolvedQuestions: number;
  groundingCoverage: number;
  datasetType: DatasetType;
  hasParallelTool: boolean;
  parallelToolStatus?: 'RUNNING' | 'COMPLETED' | 'FAILED' | null;
  parallelQueries?: number;
  parallelResults?: number;
  parallelDomainsCount?: number;
}

export function getResearchSummary(
  research: ResearchQuestion[],
  sources: Source[],
  workflowRun: WorkflowRun | null
): ResearchSummary {
  const totalQuestions = research ? research.length : 0;
  let groundedQuestions = 0;
  let unresolvedQuestions = 0;

  if (research && Array.isArray(research)) {
    for (const q of research) {
      const gState = getResearchGroundingState(q, sources);
      if (gState.isGrounded) {
        groundedQuestions++;
      }

      const isResolved = q.status === 'FOUND' || q.status === 'NOT_NEEDED';
      if (!isResolved) {
        unresolvedQuestions++;
      }
    }
  }

  const uniqueSources = sources
    ? Array.from(new Map<string, Source>(sources.map((s) => [s.id, s])).values())
    : [];

  let realSourcesCount = 0;
  let mockSourcesCount = 0;
  let officialSourcesCount = 0;

  for (const s of uniqueSources) {
    if (s.isDemoMock) {
      mockSourcesCount++;
    } else {
      realSourcesCount++;
    }

    if (s.qualityTag === 'OFFICIAL') {
      officialSourcesCount++;
    }
  }

  let datasetType: DatasetType = 'EMPTY';
  if (uniqueSources.length === 0) {
    datasetType = 'EMPTY';
  } else if (realSourcesCount > 0 && mockSourcesCount > 0) {
    datasetType = 'MIXED';
  } else if (realSourcesCount > 0) {
    datasetType = 'REAL';
  } else {
    datasetType = 'MOCK';
  }

  const groundingCoverage = totalQuestions > 0 ? groundedQuestions / totalQuestions : 0;

  let hasParallelTool = false;
  let parallelToolStatus: 'RUNNING' | 'COMPLETED' | 'FAILED' | null = null;
  let parallelQueries: number | undefined;
  let parallelResults: number | undefined;
  let parallelDomainsCount: number | undefined;

  if (workflowRun && workflowRun.mode === 'AGENTIC_GOOGLE_ADK' && workflowRun.toolActivities) {
    const pTool = workflowRun.toolActivities.find((t) => t.toolName === 'parallel_search');
    if (pTool) {
      hasParallelTool = true;
      parallelToolStatus = pTool.status;
      parallelQueries = pTool.queryCount;
      parallelResults = pTool.resultCount;
      if (pTool.domains) {
        parallelDomainsCount = pTool.domains.length;
      }
    }
  }

  return {
    totalQuestions,
    groundedQuestions,
    realSourcesCount,
    officialSourcesCount,
    unresolvedQuestions,
    groundingCoverage,
    datasetType,
    hasParallelTool,
    parallelToolStatus,
    parallelQueries,
    parallelResults,
    parallelDomainsCount
  };
}

export interface SourceTrustPresentation {
  qualityTag?: 'OFFICIAL' | 'INDUSTRY' | 'SECONDARY';
  isReal: boolean;
  datasetTypeLabel: string;
  displayQuality: string | null;
  evidenceLabel: string;
}

export function getSourceTrustPresentation(source: Source): SourceTrustPresentation {
  const isReal = !source.isDemoMock;
  const datasetTypeLabel = source.isDemoMock ? 'DEMO / MOCK SOURCE' : 'REAL WEB SOURCE';
  const displayQuality = source.qualityTag || null;
  const evidenceLabel = 'EVIDENCE SUMMARY';

  return {
    qualityTag: source.qualityTag,
    isReal,
    datasetTypeLabel,
    displayQuality,
    evidenceLabel
  };
}

export interface SafeUrlResult {
  isValid: boolean;
  safeUrl: string | null;
  displayText: string;
}

export function getSafeExternalUrl(url: string | undefined | null): SafeUrlResult {
  if (!url || typeof url !== 'string') {
    return { isValid: false, safeUrl: null, displayText: 'SOURCE LINK UNAVAILABLE' };
  }

  const trimmed = url.trim();
  if (trimmed.length === 0) {
    return { isValid: false, safeUrl: null, displayText: 'SOURCE LINK UNAVAILABLE' };
  }

  try {
    const parsed = new URL(trimmed);
    if (parsed.protocol === 'http:' || parsed.protocol === 'https:') {
      return { isValid: true, safeUrl: trimmed, displayText: trimmed };
    }
  } catch (_e) {
    // URL parsing failed
  }

  return { isValid: false, safeUrl: null, displayText: 'SOURCE LINK UNAVAILABLE' };
}

export function getSourceDisplayDomain(source: Source): string {
  if (source?.url && typeof source.url === 'string') {
    const trimmed = source.url.trim();
    if (trimmed.length > 0) {
      try {
        const parsed = new URL(trimmed);
        if (parsed.protocol === 'http:' || parsed.protocol === 'https:') {
          let hostname = parsed.hostname;
          if (hostname.toLowerCase().startsWith('www.')) {
            hostname = hostname.slice(4);
          }
          if (hostname.length > 0) {
            return hostname;
          }
        }
      } catch (_e) {
        // Fall back to source.domain
      }
    }
  }
  return source?.domain || 'UNKNOWN DOMAIN';
}
