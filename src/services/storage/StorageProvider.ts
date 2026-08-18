/**
 * CineFlow AI — Storage Provider
 * Manages local persistence, schema versioning, corrupt data safety, cascading deletions,
 * CineFlow-only resets, and authoritative readiness/status calculations.
 */

import {
  Production,
  Scene,
  Character,
  Prop,
  ProductionTask,
  ResearchQuestion,
  Source,
  Risk,
  ContinuityIssue,
  ShootDay,
  SystemSettings,
  WorkflowRun
} from '../../types';
import {
  getDemoProduction,
  getDemoScenes,
  getDemoCharacters,
  getDemoProps,
  getDemoTasks,
  getDemoResearchQuestions,
  getDemoSources,
  getDemoRisks,
  getDemoContinuityIssues,
  getDemoShootDays,
  DEMO_PRODUCTION_ID
} from '../../data/demoProductionData';

const STORAGE_VERSION = "cineflow_v1";
const KEYS = {
  VERSION: `${STORAGE_VERSION}_version`,
  PRODUCTIONS: `${STORAGE_VERSION}_productions`,
  SCENES: `${STORAGE_VERSION}_scenes`,
  CHARACTERS: `${STORAGE_VERSION}_characters`,
  PROPS: `${STORAGE_VERSION}_props`,
  TASKS: `${STORAGE_VERSION}_tasks`,
  RESEARCH: `${STORAGE_VERSION}_research`,
  SOURCES: `${STORAGE_VERSION}_sources`,
  RISKS: `${STORAGE_VERSION}_risks`,
  CONTINUITY: `${STORAGE_VERSION}_continuity`,
  SHOOT_DAYS: `${STORAGE_VERSION}_shoot_days`,
  SETTINGS: `${STORAGE_VERSION}_settings`,
  ACTIVE_PROD_ID: `${STORAGE_VERSION}_active_id`,
  WORKFLOW_RUNS: `${STORAGE_VERSION}_workflow_runs`
};

/**
 * Pure deterministic readiness calculation
 */
export function computeDeterministicReadiness(data: {
  scenes?: Scene[];
  tasks?: ProductionTask[];
  research?: ResearchQuestion[];
  risks?: Risk[];
  shootDays?: ShootDay[];
}): number {
  const scenes = data.scenes || [];
  const tasks = data.tasks || [];
  const research = data.research || [];
  const risks = data.risks || [];

  if (scenes.length === 0) return 10;

  let deductions = 0;

  // Open critical risks
  const openCritical = risks.filter(r => r.status !== 'RESOLVED' && r.severity === 'CRITICAL').length;
  deductions += openCritical * 15;

  // Open high risks
  const openHigh = risks.filter(r => r.status !== 'RESOLVED' && r.severity === 'HIGH').length;
  deductions += openHigh * 8;

  // Open medium risks
  const openMedium = risks.filter(r => r.status !== 'RESOLVED' && r.severity === 'MEDIUM').length;
  deductions += openMedium * 3;

  // Pending/searching research questions
  const pendingResearch = research.filter(r => r.status === 'PENDING' || r.status === 'SEARCHING').length;
  deductions += pendingResearch * 5;

  // Unscheduled scenes
  const unscheduled = scenes.filter(s => s.scheduleStatus === 'UNSCHEDULED').length;
  deductions += unscheduled * 3;

  // Task completion ratio
  if (tasks.length > 0) {
    const doneTasks = tasks.filter(t => t.status === 'DONE').length;
    const incompleteRatio = (tasks.length - doneTasks) / tasks.length;
    deductions += Math.round(incompleteRatio * 15);
  }

  return Math.max(0, Math.min(100, 100 - deductions));
}

/**
 * Pure authoritative production status definition
 */
export function computeAuthoritativeStatus(readinessScore: number, workflowRunStatus?: string): Production['status'] {
  if (workflowRunStatus === 'RUNNING') return 'Analyzing';
  if (readinessScore >= 80) return 'Production Ready';
  if (workflowRunStatus === 'COMPLETED' || readinessScore >= 40) return 'Planning';
  return 'Draft';
}

export class StorageProvider {
  private memoryStore: Record<string, string> = {};

  constructor() {
    this.initStorage();
  }

  public init() {
    this.initStorage();
  }

  private setItem(key: string, value: string): void {
    this.memoryStore[key] = value;
    try {
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem(key, value);
      }
    } catch {}
  }

  private getItem(key: string): string | null {
    try {
      if (typeof localStorage !== 'undefined') {
        const item = localStorage.getItem(key);
        if (item !== null) return item;
      }
    } catch {}
    return this.memoryStore[key] || null;
  }

  private removeItem(key: string): void {
    delete this.memoryStore[key];
    try {
      if (typeof localStorage !== 'undefined') {
        localStorage.removeItem(key);
      }
    } catch {}
  }

  private initStorage() {
    try {
      const storedVersion = this.getItem(KEYS.VERSION);
      if (!storedVersion) {
        this.seedDemoData();
      }
    } catch (e) {
      console.warn("LocalStorage unaccessible or disabled, using memory storage fallback:", e);
    }
  }

  public seedDemoData() {
    try {
      const demoProd = getDemoProduction();
      const demoScenes = getDemoScenes();
      const demoChars = getDemoCharacters();
      const demoProps = getDemoProps();
      const demoTasks = getDemoTasks();
      const demoResearch = getDemoResearchQuestions();
      const demoSources = getDemoSources();
      const demoRisks = getDemoRisks();
      const demoContinuity = getDemoContinuityIssues();
      const demoShootDays = getDemoShootDays();

      this.setItem(KEYS.VERSION, STORAGE_VERSION);
      this.setItem(KEYS.PRODUCTIONS, JSON.stringify([demoProd]));
      this.setItem(KEYS.SCENES, JSON.stringify({ [DEMO_PRODUCTION_ID]: demoScenes }));
      this.setItem(KEYS.CHARACTERS, JSON.stringify({ [DEMO_PRODUCTION_ID]: demoChars }));
      this.setItem(KEYS.PROPS, JSON.stringify({ [DEMO_PRODUCTION_ID]: demoProps }));
      this.setItem(KEYS.TASKS, JSON.stringify({ [DEMO_PRODUCTION_ID]: demoTasks }));
      this.setItem(KEYS.RESEARCH, JSON.stringify({ [DEMO_PRODUCTION_ID]: demoResearch }));
      this.setItem(KEYS.SOURCES, JSON.stringify({ [DEMO_PRODUCTION_ID]: demoSources }));
      this.setItem(KEYS.RISKS, JSON.stringify({ [DEMO_PRODUCTION_ID]: demoRisks }));
      this.setItem(KEYS.CONTINUITY, JSON.stringify({ [DEMO_PRODUCTION_ID]: demoContinuity }));
      this.setItem(KEYS.SHOOT_DAYS, JSON.stringify({ [DEMO_PRODUCTION_ID]: demoShootDays }));
      this.setItem(KEYS.ACTIVE_PROD_ID, DEMO_PRODUCTION_ID);

      const defaultSettings: SystemSettings = {
        aiProviderType: 'mock',
        researchProviderType: 'mock',
        theme: 'cinematic-dark',
        autoRunWorkflow: true
      };
      this.setItem(KEYS.SETTINGS, JSON.stringify(defaultSettings));
    } catch (err) {
      console.error("Failed to seed demo data to localStorage:", err);
    }
  }

  /**
   * Safe CineFlow-only reset. Does NOT touch unrelated localStorage keys.
   */
  public resetAllData() {
    this.memoryStore = {};
    try {
      if (typeof localStorage !== 'undefined') {
        const keysToRemove: string[] = [];
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (key && key.startsWith('cineflow_v1')) {
            keysToRemove.push(key);
          }
        }
        keysToRemove.forEach(k => localStorage.removeItem(k));
      }
      this.seedDemoData();
    } catch (err) {
      console.error("Error resetting CineFlow data:", err);
    }
  }

  // PRODUCTIONS
  public getProductions(): Production[] {
    try {
      const data = this.getItem(KEYS.PRODUCTIONS);
      if (!data) return [getDemoProduction()];
      const parsed = JSON.parse(data);
      return Array.isArray(parsed) ? parsed : [getDemoProduction()];
    } catch {
      return [getDemoProduction()];
    }
  }

  public getProduction(id: string): Production | null {
    const list = this.getProductions();
    return list.find(p => p.id === id) || null;
  }

  public getProductionById(id: string): Production | null {
    return this.getProduction(id);
  }

  public saveProduction(prod: Production): void {
    const list = this.getProductions();
    const index = list.findIndex(p => p.id === prod.id);
    if (index >= 0) {
      list[index] = prod;
    } else {
      list.unshift(prod);
    }
    this.setItem(KEYS.PRODUCTIONS, JSON.stringify(list));
  }

  /**
   * Cascading production deletion removing all child entities
   */
  public deleteProduction(id: string): void {
    let list = this.getProductions();
    list = list.filter(p => p.id !== id);
    this.setItem(KEYS.PRODUCTIONS, JSON.stringify(list));

    const removeFromMap = (key: string) => {
      try {
        const map = JSON.parse(this.getItem(key) || '{}');
        delete map[id];
        this.setItem(key, JSON.stringify(map));
      } catch (e) {
        console.warn(`Error removing production ${id} from ${key}:`, e);
      }
    };

    removeFromMap(KEYS.SCENES);
    removeFromMap(KEYS.CHARACTERS);
    removeFromMap(KEYS.PROPS);
    removeFromMap(KEYS.TASKS);
    removeFromMap(KEYS.RESEARCH);
    removeFromMap(KEYS.SOURCES);
    removeFromMap(KEYS.RISKS);
    removeFromMap(KEYS.CONTINUITY);
    removeFromMap(KEYS.SHOOT_DAYS);
    removeFromMap(KEYS.WORKFLOW_RUNS);

    if (this.getActiveProductionId() === id) {
      if (list.length > 0) {
        this.setActiveProductionId(list[0].id);
      } else {
        this.seedDemoData();
      }
    }
  }

  public getActiveProductionId(): string {
    return this.getItem(KEYS.ACTIVE_PROD_ID) || DEMO_PRODUCTION_ID;
  }

  public setActiveProductionId(id: string): void {
    this.setItem(KEYS.ACTIVE_PROD_ID, id);
  }

  // SCENES
  public getScenes(productionId: string): Scene[] {
    try {
      const map = JSON.parse(this.getItem(KEYS.SCENES) || '{}');
      return map[productionId] !== undefined ? map[productionId] : (productionId === DEMO_PRODUCTION_ID ? getDemoScenes() : []);
    } catch {
      return productionId === DEMO_PRODUCTION_ID ? getDemoScenes() : [];
    }
  }

  public saveScenes(productionId: string, scenes: Scene[]): void {
    const map = JSON.parse(this.getItem(KEYS.SCENES) || '{}');
    map[productionId] = scenes;
    this.setItem(KEYS.SCENES, JSON.stringify(map));
  }

  // CHARACTERS & PROPS
  public getCharacters(productionId: string): Character[] {
    try {
      const map = JSON.parse(this.getItem(KEYS.CHARACTERS) || '{}');
      return map[productionId] !== undefined ? map[productionId] : (productionId === DEMO_PRODUCTION_ID ? getDemoCharacters() : []);
    } catch {
      return productionId === DEMO_PRODUCTION_ID ? getDemoCharacters() : [];
    }
  }

  public saveCharacters(productionId: string, chars: Character[]): void {
    const map = JSON.parse(this.getItem(KEYS.CHARACTERS) || '{}');
    map[productionId] = chars;
    this.setItem(KEYS.CHARACTERS, JSON.stringify(map));
  }

  public getProps(productionId: string): Prop[] {
    try {
      const map = JSON.parse(this.getItem(KEYS.PROPS) || '{}');
      return map[productionId] !== undefined ? map[productionId] : (productionId === DEMO_PRODUCTION_ID ? getDemoProps() : []);
    } catch {
      return productionId === DEMO_PRODUCTION_ID ? getDemoProps() : [];
    }
  }

  public saveProps(productionId: string, props: Prop[]): void {
    const map = JSON.parse(this.getItem(KEYS.PROPS) || '{}');
    map[productionId] = props;
    this.setItem(KEYS.PROPS, JSON.stringify(map));
  }

  // TASKS
  public getTasks(productionId: string): ProductionTask[] {
    try {
      const map = JSON.parse(this.getItem(KEYS.TASKS) || '{}');
      return map[productionId] !== undefined ? map[productionId] : (productionId === DEMO_PRODUCTION_ID ? getDemoTasks() : []);
    } catch {
      return productionId === DEMO_PRODUCTION_ID ? getDemoTasks() : [];
    }
  }

  public saveTasks(productionId: string, tasks: ProductionTask[]): void {
    const map = JSON.parse(this.getItem(KEYS.TASKS) || '{}');
    map[productionId] = tasks;
    this.setItem(KEYS.TASKS, JSON.stringify(map));
  }

  public saveTask(productionId: string, task: ProductionTask): void {
    const tasks = this.getTasks(productionId);
    tasks.unshift(task);
    this.saveTasks(productionId, tasks);
  }

  public updateTaskStatus(productionId: string, taskId: string, status: ProductionTask['status']): void {
    const tasks = this.getTasks(productionId);
    const index = tasks.findIndex(t => t.id === taskId);
    if (index >= 0) {
      tasks[index].status = status;
      this.saveTasks(productionId, tasks);
      this.recalculateReadiness(productionId);
    }
  }

  // RESEARCH QUESTIONS & SOURCES
  public getResearchQuestions(productionId: string): ResearchQuestion[] {
    try {
      const map = JSON.parse(this.getItem(KEYS.RESEARCH) || '{}');
      return map[productionId] !== undefined ? map[productionId] : (productionId === DEMO_PRODUCTION_ID ? getDemoResearchQuestions() : []);
    } catch {
      return productionId === DEMO_PRODUCTION_ID ? getDemoResearchQuestions() : [];
    }
  }

  public getResearch(productionId: string): ResearchQuestion[] {
    return this.getResearchQuestions(productionId);
  }

  public saveResearchQuestions(productionId: string, questions: ResearchQuestion[]): void {
    const map = JSON.parse(this.getItem(KEYS.RESEARCH) || '{}');
    map[productionId] = questions;
    this.setItem(KEYS.RESEARCH, JSON.stringify(map));
  }

  public getSources(productionId: string): Source[] {
    try {
      const map = JSON.parse(this.getItem(KEYS.SOURCES) || '{}');
      const rawSources: Source[] = map[productionId] !== undefined ? map[productionId] : (productionId === DEMO_PRODUCTION_ID ? getDemoSources() : []);
      const uniqueSources: Source[] = [];
      const seenIds = new Set<string>();
      for (const src of rawSources) {
        if (src && src.id && !seenIds.has(src.id)) {
          seenIds.add(src.id);
          uniqueSources.push(src);
        }
      }
      return uniqueSources;
    } catch {
      return productionId === DEMO_PRODUCTION_ID ? getDemoSources() : [];
    }
  }

  public saveSources(productionId: string, sources: Source[]): void {
    const map = JSON.parse(this.getItem(KEYS.SOURCES) || '{}');
    const uniqueSources: Source[] = [];
    const seenIds = new Set<string>();
    for (const src of sources) {
      if (src && src.id && !seenIds.has(src.id)) {
        seenIds.add(src.id);
        uniqueSources.push(src);
      }
    }
    map[productionId] = uniqueSources;
    this.setItem(KEYS.SOURCES, JSON.stringify(map));
  }

  // RISKS
  public getRisks(productionId: string): Risk[] {
    try {
      const map = JSON.parse(this.getItem(KEYS.RISKS) || '{}');
      return map[productionId] !== undefined ? map[productionId] : (productionId === DEMO_PRODUCTION_ID ? getDemoRisks() : []);
    } catch {
      return productionId === DEMO_PRODUCTION_ID ? getDemoRisks() : [];
    }
  }

  public saveRisks(productionId: string, risks: Risk[]): void {
    const map = JSON.parse(this.getItem(KEYS.RISKS) || '{}');
    map[productionId] = risks;
    this.setItem(KEYS.RISKS, JSON.stringify(map));
  }

  public updateRiskStatus(productionId: string, riskId: string, status: Risk['status']): void {
    const risks = this.getRisks(productionId);
    const index = risks.findIndex(r => r.id === riskId);
    if (index >= 0) {
      risks[index].status = status;
      this.saveRisks(productionId, risks);
      this.recalculateReadiness(productionId);
    }
  }

  // CONTINUITY
  public getContinuityIssues(productionId: string): ContinuityIssue[] {
    try {
      const map = JSON.parse(this.getItem(KEYS.CONTINUITY) || '{}');
      return map[productionId] !== undefined ? map[productionId] : (productionId === DEMO_PRODUCTION_ID ? getDemoContinuityIssues() : []);
    } catch {
      return productionId === DEMO_PRODUCTION_ID ? getDemoContinuityIssues() : [];
    }
  }

  public getContinuity(productionId: string): ContinuityIssue[] {
    return this.getContinuityIssues(productionId);
  }

  public saveContinuityIssues(productionId: string, issues: ContinuityIssue[]): void {
    const map = JSON.parse(this.getItem(KEYS.CONTINUITY) || '{}');
    map[productionId] = issues;
    this.setItem(KEYS.CONTINUITY, JSON.stringify(map));
  }

  // SHOOT DAYS
  public getShootDays(productionId: string): ShootDay[] {
    try {
      const map = JSON.parse(this.getItem(KEYS.SHOOT_DAYS) || '{}');
      return map[productionId] !== undefined ? map[productionId] : (productionId === DEMO_PRODUCTION_ID ? getDemoShootDays() : []);
    } catch {
      return productionId === DEMO_PRODUCTION_ID ? getDemoShootDays() : [];
    }
  }

  public saveShootDays(productionId: string, days: ShootDay[]): void {
    const map = JSON.parse(this.getItem(KEYS.SHOOT_DAYS) || '{}');
    map[productionId] = days;
    this.setItem(KEYS.SHOOT_DAYS, JSON.stringify(map));
  }

  /**
   * Atomically save authoritative workflow result including production and child collections
   */
  public saveAgenticWorkflowResult(
    production: Production,
    workflowRun: WorkflowRun
  ): void {
    const productionId = production.id;
    this.saveProduction(production);

    if (production.scenes !== undefined) {
      this.saveScenes(productionId, production.scenes);
    }
    if (production.characters !== undefined) {
      this.saveCharacters(productionId, production.characters);
    }
    if (production.props !== undefined) {
      this.saveProps(productionId, production.props);
    }
    if (production.tasks !== undefined) {
      this.saveTasks(productionId, production.tasks);
    }
    if (production.researchQuestions !== undefined) {
      this.saveResearchQuestions(productionId, production.researchQuestions);
    }
    if (production.sources !== undefined) {
      this.saveSources(productionId, production.sources);
    }
    if (production.continuityIssues !== undefined) {
      this.saveContinuityIssues(productionId, production.continuityIssues);
    }
    if (production.risks !== undefined) {
      this.saveRisks(productionId, production.risks);
    }
    if (production.shootDays !== undefined) {
      this.saveShootDays(productionId, production.shootDays);
    }

    if (workflowRun) {
      this.saveWorkflowRun(workflowRun);
    }

    this.recalculateReadiness(productionId);
  }

  // SETTINGS
  public getSettings(): SystemSettings {
    try {
      const s = this.getItem(KEYS.SETTINGS);
      if (s) return JSON.parse(s);
    } catch {}
    return {
      aiProviderType: 'mock',
      researchProviderType: 'mock',
      theme: 'cinematic-dark',
      autoRunWorkflow: true
    };
  }

  public saveSettings(settings: SystemSettings): void {
    this.setItem(KEYS.SETTINGS, JSON.stringify(settings));
  }

  // WORKFLOW RUNS
  public getLatestWorkflowRun(productionId: string): WorkflowRun | null {
    try {
      const runsMap = JSON.parse(this.getItem(KEYS.WORKFLOW_RUNS) || '{}');
      return runsMap[productionId] || null;
    } catch {
      return null;
    }
  }

  public saveWorkflowRun(run: WorkflowRun): void {
    try {
      const runsMap = JSON.parse(this.getItem(KEYS.WORKFLOW_RUNS) || '{}');
      runsMap[run.productionId] = run;
      this.setItem(KEYS.WORKFLOW_RUNS, JSON.stringify(runsMap));
    } catch (e) {
      console.error("Error saving workflow run:", e);
    }
  }

  public recalculateReadinessScore(productionId: string): number {
    return this.recalculateReadiness(productionId);
  }

  /**
   * Deterministic Readiness Score & Authoritative Status Calculation
   */
  public recalculateReadiness(productionId: string): number {
    const prod = this.getProduction(productionId);
    if (!prod) return 0;

    const risks = this.getRisks(productionId);
    const tasks = this.getTasks(productionId);
    const research = this.getResearchQuestions(productionId);
    const scenes = this.getScenes(productionId);
    const shootDays = this.getShootDays(productionId);
    const latestRun = this.getLatestWorkflowRun(productionId);

    const score = computeDeterministicReadiness({
      scenes,
      tasks,
      research,
      risks,
      shootDays
    });

    prod.readinessScore = score;
    prod.status = computeAuthoritativeStatus(score, latestRun?.status);

    this.saveProduction(prod);
    return score;
  }
}

export const storage = new StorageProvider();
