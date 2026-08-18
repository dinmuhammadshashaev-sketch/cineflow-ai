import { z } from 'zod';
import {
  Scene,
  Character,
  Prop,
  ProductionTask,
  ResearchQuestion,
  ContinuityIssue,
  Risk,
  ShootDay,
  TaskCategory,
  TaskStatus,
  Source
} from '../../../src/types/index.js';
import {
  ScriptAnalystOutput,
  ProducerOutput,
  ResearchOutput,
  ContinuityOutput,
  RiskOutput,
  SchedulerOutput
} from './schemas.js';

export class AgentOutputValidationError extends Error {
  constructor(public agentName: string, public details: string, public rawContent: unknown) {
    super(`Agent "${agentName}" output validation error: ${details}`);
    this.name = 'AgentOutputValidationError';
  }
}

/**
 * Safely parses and validates agent output against a Zod schema.
 * Handles strings, markdown code fences, pre-parsed objects, null/undefined, and malformed JSON.
 */
export function parseAgentOutput<T>(raw: unknown, zodSchema: z.ZodType<T>, agentName: string): T {
  if (raw === null || raw === undefined) {
    throw new AgentOutputValidationError(agentName, 'Output is null or undefined', raw);
  }

  let dataObj: unknown = raw;

  if (typeof raw === 'string') {
    let clean = raw.trim();
    if (clean.startsWith('```')) {
      clean = clean.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '').trim();
    }
    try {
      dataObj = JSON.parse(clean);
    } catch (e: any) {
      throw new AgentOutputValidationError(agentName, `Malformed JSON: ${e?.message || 'Invalid JSON format'}`, raw);
    }
  }

  if (typeof dataObj !== 'object' || dataObj === null) {
    throw new AgentOutputValidationError(agentName, 'Parsed output is not an object', raw);
  }

  const result = zodSchema.safeParse(dataObj);
  if (!result.success) {
    const issues = result.error.issues || (result.error as any).errors || [];
    const errorDetails = issues.map((err: any) => `${err.path?.join('.') || 'root'}: ${err.message}`).join(', ');
    throw new AgentOutputValidationError(agentName, `Zod validation failed: ${errorDetails}`, raw);
  }

  return result.data;
}

/**
 * Maps Script Analyst output to domain Scenes
 */
export function mapScriptOutputToScenes(scriptOutput: ScriptAnalystOutput, productionId: string): Scene[] {
  return scriptOutput.scenes.map((s) => ({
    id: s.id || `sc_${productionId}_${s.sceneNumber}`,
    productionId,
    sceneNumber: s.sceneNumber,
    heading: s.heading,
    intExt: s.intExt,
    dayNight: s.dayNight,
    location: s.location,
    summary: s.summary,
    complexity: 'MEDIUM',
    characters: s.characters,
    props: s.props,
    wardrobe: s.wardrobe,
    specialRequirements: s.specialRequirements,
    scheduleStatus: 'UNSCHEDULED',
    estimatedMinutes: s.estimatedMinutes || 15
  }));
}

/**
 * Maps Script Analyst output to domain Characters
 */
export function mapScriptOutputToCharacters(
  scriptOutput: ScriptAnalystOutput,
  productionId: string,
  scenes: Scene[]
): Character[] {
  return scriptOutput.characters.map((c, idx) => {
    const roleLower = (c.role || '').toLowerCase();
    let roleType: Character['roleType'] = 'Supporting';
    if (roleLower.includes('lead') || roleLower.includes('main') || roleLower.includes('protagonist')) {
      roleType = 'Lead';
    } else if (roleLower.includes('voice')) {
      roleType = 'Featured Voice';
    } else if (roleLower.includes('extra') || roleLower.includes('background')) {
      roleType = 'Background / Extra';
    }

    const nameLower = c.name.toLowerCase();
    const sceneNumbers = scenes
      .filter((sc) => sc.characters.some((charName) => charName.toLowerCase() === nameLower))
      .map((sc) => sc.sceneNumber);

    return {
      id: c.id || `char_${productionId}_${idx + 1}`,
      productionId,
      name: c.name,
      roleType,
      description: c.description,
      castRequirements: `${c.name} (${c.description})`,
      sceneCount: sceneNumbers.length,
      sceneNumbers
    };
  });
}

/**
 * Maps Script Analyst output to domain Props
 */
export function mapScriptOutputToProps(
  scriptOutput: ScriptAnalystOutput,
  productionId: string,
  scenes: Scene[]
): Prop[] {
  return scriptOutput.props.map((p, idx) => {
    const catLower = (p.category || '').toLowerCase();
    let category: Prop['category'] = 'General';
    if (/hero/i.test(catLower)) {
      category = 'Hero Prop';
    } else if (/dressing|set/i.test(catLower)) {
      category = 'Set Dressing';
    } else if (/vehicle|car|boat|bike/i.test(catLower)) {
      category = 'Vehicle';
    } else if (/sfx|effect|drone|pyro|explosion/i.test(catLower)) {
      category = 'Special Effect / SFX';
    } else if (/costume|acc|wardrobe|glasses|hat/i.test(catLower)) {
      category = 'Costume Acc.';
    }

    const propNameLower = p.name.toLowerCase();
    const sceneNumbers = scenes
      .filter((sc) => sc.props.some((propName) => propName.toLowerCase() === propNameLower))
      .map((sc) => sc.sceneNumber);

    return {
      id: p.id || `prop_${productionId}_${idx + 1}`,
      productionId,
      name: p.name,
      category,
      description: p.name,
      fragile: Boolean(p.isSpecial),
      sceneNumbers
    };
  });
}

/**
 * Maps Producer Agent output to domain Tasks
 */
export function mapProducerOutputToTasks(producerOutput: ProducerOutput, productionId: string): ProductionTask[] {
  const departmentMap: Record<string, TaskCategory> = {
    'Script Breakdown': 'Script Breakdown',
    'Casting': 'Casting',
    'Location & Permits': 'Location & Permits',
    'Art & Props': 'Art & Props',
    'Camera & Lighting': 'Camera & Lighting',
    'Sound': 'Sound',
    'Schedule & Logistics': 'Schedule & Logistics',
    'Safety & Legal': 'Safety & Legal'
  };

  const statusMap: Record<string, TaskStatus> = {
    'PENDING': 'TO DO',
    'IN_PROGRESS': 'IN PROGRESS',
    'COMPLETED': 'DONE'
  };

  return producerOutput.tasks.map((t, idx) => {
    let category: TaskCategory = departmentMap[t.department];
    if (!category) {
      const dept = t.department.toLowerCase();
      if (/script/i.test(dept)) category = 'Script Breakdown';
      else if (/cast/i.test(dept)) category = 'Casting';
      else if (/loc|permit/i.test(dept)) category = 'Location & Permits';
      else if (/art|prop/i.test(dept)) category = 'Art & Props';
      else if (/camera|light/i.test(dept)) category = 'Camera & Lighting';
      else if (/sound|audio/i.test(dept)) category = 'Sound';
      else if (/safe|legal/i.test(dept)) category = 'Safety & Legal';
      else category = 'Schedule & Logistics';
    }

    const status: TaskStatus = statusMap[t.status] || 'TO DO';

    return {
      id: t.id || `task_${productionId}_${idx + 1}`,
      productionId,
      title: t.title,
      description: t.title,
      category,
      priority: t.priority,
      status,
      assignedAgent: t.assignedRole || 'Producer Agent',
      dependencies: t.dependencies || [],
      createdAt: new Date().toISOString()
    };
  });
}

/**
 * Maps Script Analyst research questions to domain ResearchQuestions
 */
export function createInitialResearchQuestions(questions: string[], productionId: string): ResearchQuestion[] {
  return questions.map((q, idx) => ({
    id: `rq_${productionId}_${idx + 1}`,
    productionId,
    question: q,
    importance: 'HIGH',
    status: 'PENDING',
    sourceIds: [],
    createdAt: new Date().toISOString(),
    provider: 'ParallelSearchProvider'
  }));
}

/**
 * Updates ResearchQuestions with ResearchAgent output findings and source IDs
 */
export function updateResearchQuestionsWithFindings(
  initialQuestions: ResearchQuestion[],
  researchOutput: ResearchOutput,
  validSources: Source[]
): ResearchQuestion[] {
  const validSourceIds = new Set(validSources.map(s => s.id));

  return initialQuestions.map((rq) => {
    const finding = researchOutput.researchFindings.find(
      (rf) => rf.question.toLowerCase().includes(rq.question.toLowerCase()) || rq.question.toLowerCase().includes(rf.question.toLowerCase())
    );

    if (finding) {
      const filteredSourceIds = (finding.sourceIds || []).filter(id => validSourceIds.has(id));
      let status: ResearchQuestion['status'] = 'FAILED';
      if (finding.status === 'FOUND') {
        status = 'FOUND';
      } else if (finding.status === 'NOT_NEEDED') {
        status = 'NOT_NEEDED';
      } else if (finding.status === 'FAILED') {
        status = 'FAILED';
      }

      return {
        ...rq,
        findings: finding.findings,
        status,
        sourceIds: filteredSourceIds
      };
    }

    return {
      ...rq,
      status: 'FAILED'
    };
  });
}

/**
 * Maps Continuity Agent output to domain ContinuityIssues
 */
export function mapContinuityOutputToIssues(continuityOutput: ContinuityOutput, productionId: string): ContinuityIssue[] {
  const categoryMap: Record<string, ContinuityIssue['category']> = {
    'WARDROBE': 'Wardrobe',
    'PROP': 'Prop',
    'CHARACTER_STATE': 'Character',
    'TIMELINE': 'Timeline',
    'LOCATION': 'Location'
  };

  const severityMap: Record<string, ContinuityIssue['severity']> = {
    'MINOR': 'LOW',
    'MODERATE': 'MEDIUM',
    'CRITICAL': 'HIGH'
  };

  return continuityOutput.issues.map((issue, idx) => ({
    id: issue.id || `ci_${productionId}_${idx + 1}`,
    productionId,
    title: `${issue.type} Continuity Issue (Scenes ${issue.sceneNumbers.join(', ')})`,
    description: issue.description,
    category: categoryMap[issue.type] || 'Lighting',
    sceneNumbers: issue.sceneNumbers,
    severity: severityMap[issue.severity] || 'MEDIUM',
    status: 'OPEN',
    recommendation: issue.recommendedFix
  }));
}

/**
 * Maps Risk Agent output to domain Risks
 */
export function mapRiskOutputToRisks(
  riskOutput: RiskOutput,
  productionId: string,
  validSources: Source[]
): Risk[] {
  const validSourceIds = new Set(validSources.map(s => s.id));

  return riskOutput.risks.map((r, idx) => {
    let sceneNumber: number | undefined = undefined;
    if (r.scene) {
      const match = r.scene.match(/\d+/);
      if (match) sceneNumber = parseInt(match[0], 10);
    }

    const filteredSourceIds = (r.sourceIds || []).filter(id => validSourceIds.has(id));

    return {
      id: r.id || `risk_${productionId}_${idx + 1}`,
      productionId,
      title: r.title,
      description: r.description,
      severity: r.severity,
      sceneNumber,
      reason: r.reason,
      recommendedAction: r.recommendedAction,
      status: 'OPEN',
      sourceIds: filteredSourceIds,
      createdAt: new Date().toISOString()
    };
  });
}

/**
 * Maps Scheduler Agent output to domain ShootDays and performs deterministic validation
 */
export function mapSchedulerOutputToShootDays(
  schedulerOutput: SchedulerOutput,
  productionId: string,
  scenes: Scene[]
): ShootDay[] {
  const validSceneNumbers = new Set(scenes.map((s) => s.sceneNumber));
  const seenSceneNumbers = new Set<number>();
  const seenDayNumbers = new Set<number>();

  const shootDays: ShootDay[] = schedulerOutput.shootDays.map((sd) => {
    if (seenDayNumbers.has(sd.dayNumber)) {
      throw new Error(`Scheduler error: duplicate dayNumber ${sd.dayNumber}`);
    }
    seenDayNumbers.add(sd.dayNumber);

    if (!sd.primaryLocation || sd.primaryLocation.trim() === '') {
      throw new Error(`Scheduler error: day ${sd.dayNumber} has empty locationName`);
    }

    if (!sd.sceneNumbers || sd.sceneNumbers.length === 0) {
      throw new Error(`Scheduler error: day ${sd.dayNumber} has no sceneNumbers assigned`);
    }

    if (sd.estimatedHours <= 0) {
      throw new Error(`Scheduler error: day ${sd.dayNumber} has estimatedHours <= 0`);
    }

    for (const scNum of sd.sceneNumbers) {
      if (!validSceneNumbers.has(scNum)) {
        throw new Error(`Scheduler error: day ${sd.dayNumber} contains non-existent sceneNumber ${scNum}`);
      }
      if (seenSceneNumbers.has(scNum)) {
        throw new Error(`Scheduler error: sceneNumber ${scNum} is scheduled across multiple shooting days`);
      }
      seenSceneNumbers.add(scNum);
    }

    const includedScenes = scenes.filter((s) => sd.sceneNumbers.includes(s.sceneNumber));
    const nightCount = includedScenes.filter((s) => s.dayNight === 'NIGHT').length;
    const dayNightFocus = nightCount > includedScenes.length / 2 ? 'NIGHT' : 'DAY';

    return {
      id: `sd_${productionId}_${sd.dayNumber}`,
      productionId,
      dayNumber: sd.dayNumber,
      date: sd.dateLabel,
      locationName: sd.primaryLocation,
      sceneNumbers: sd.sceneNumbers,
      dayNightFocus,
      estimatedHours: sd.estimatedHours,
      notes: sd.specialNotes
    };
  });

  return shootDays;
}
