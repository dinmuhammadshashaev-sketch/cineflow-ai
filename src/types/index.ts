/**
 * CineFlow AI — Core Domain Data Models & Types
 */

export type ProductionType = 
  | 'Short Film' 
  | 'Feature Film' 
  | 'Commercial' 
  | 'Music Video' 
  | 'Documentary' 
  | 'Other';

export type ProductionStatus = 
  | 'Draft' 
  | 'Analyzing' 
  | 'Planning' 
  | 'Production Ready' 
  | 'In Production';

export interface Production {
  id: string;
  title: string;
  type: ProductionType;
  description: string;
  location: string;
  budget: number;
  currency: string;
  targetShootingDates: string;
  shootingDaysCount: number;
  notes: string;
  createdAt: string;
  updatedAt: string;
  scriptText: string;
  readinessScore: number; // 0-100 calculated deterministically
  status: ProductionStatus;
  scenes?: Scene[];
  characters?: Character[];
  props?: Prop[];
  tasks?: ProductionTask[];
  researchQuestions?: ResearchQuestion[];
  sources?: Source[];
  continuityIssues?: ContinuityIssue[];
  risks?: Risk[];
  shootDays?: ShootDay[];
}

export type IntExt = 'INT' | 'EXT' | 'INT/EXT';
export type DayNight = 'DAY' | 'NIGHT' | 'DAWN' | 'DUSK';
export type SceneComplexity = 'LOW' | 'MEDIUM' | 'HIGH' | 'EXTREME';
export type SceneScheduleStatus = 'UNSCHEDULED' | 'SCHEDULED' | 'COMPLETED';

export interface Scene {
  id: string;
  productionId: string;
  sceneNumber: number;
  heading: string; // e.g., "INT. METRO STATION - NIGHT"
  intExt: IntExt;
  dayNight: DayNight;
  location: string;
  summary: string;
  complexity: SceneComplexity;
  characters: string[];
  props: string[];
  wardrobe: string[];
  specialRequirements: string[];
  directorNotes?: string;
  scheduleStatus: SceneScheduleStatus;
  shootDayNumber?: number;
  estimatedMinutes?: number;
}

export interface Character {
  id: string;
  productionId: string;
  name: string;
  roleType: 'Lead' | 'Supporting' | 'Background / Extra' | 'Featured Voice';
  description: string;
  castRequirements: string;
  sceneCount: number;
  sceneNumbers: number[];
}

export interface Prop {
  id: string;
  productionId: string;
  name: string;
  category: 'Hero Prop' | 'Set Dressing' | 'Vehicle' | 'Special Effect / SFX' | 'Costume Acc.' | 'General';
  description: string;
  fragile: boolean;
  sceneNumbers: number[];
}

export type TaskCategory = 
  | 'Script Breakdown' 
  | 'Casting' 
  | 'Location & Permits' 
  | 'Art & Props' 
  | 'Camera & Lighting' 
  | 'Sound' 
  | 'Schedule & Logistics' 
  | 'Safety & Legal';

export type TaskPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
export type TaskStatus = 'BACKLOG' | 'TO DO' | 'IN PROGRESS' | 'BLOCKED' | 'DONE';

export interface ProductionTask {
  id: string;
  productionId: string;
  title: string;
  description: string;
  category: TaskCategory;
  priority: TaskPriority;
  status: TaskStatus;
  sceneNumber?: number;
  assignedAgent?: string;
  dependencies?: string[];
  createdAt: string;
}

export type AgentRole = 
  | 'Supervisor' 
  | 'Script Analyst' 
  | 'Director' 
  | 'Director Agent'
  | 'Producer' 
  | 'Producer Agent'
  | 'Research' 
  | 'Research Agent'
  | 'Continuity' 
  | 'Continuity Agent'
  | 'Risk' 
  | 'Risk Agent'
  | 'Scheduler'
  | 'Scheduler Agent';

export type ActivityStatus = 'QUEUED' | 'RUNNING' | 'COMPLETED' | 'WARNING' | 'FAILED';

export interface Agent {
  id: string;
  role: AgentRole;
  name: string;
  title: string;
  description: string;
  status: ActivityStatus;
  lastActivityText?: string;
  tasksCompletedCount: number;
  avatarColor: string;
}

export type ExecutionMode = 'mock' | 'gemini' | 'deterministic' | 'parallel' | 'AGENTIC_GOOGLE_ADK' | 'LOCAL_SIMULATION';

export interface AgentActivity {
  id: string;
  agentRole: AgentRole;
  agentName?: string;
  status: ActivityStatus;
  actionSummary: string;
  timestamp: string;
  resultDetails?: string;
  durationMs?: number;
  executionMode?: ExecutionMode;
  providerName?: string;
  modelName?: string;
}

export type WorkflowActivity = AgentActivity;

export interface WorkflowToolActivity {
  id: string;
  toolName: string;
  agentRole?: AgentRole;
  status: 'RUNNING' | 'COMPLETED' | 'FAILED';
  provider?: string;
  summary?: string;
  timestamp?: string;
  completedAt?: string;
  durationMs?: number;
  queryCount?: number;
  resultCount?: number;
  domains?: string[];
}

export interface WorkflowRun {
  id: string;
  productionId: string;
  mode?: 'AGENTIC_GOOGLE_ADK' | 'LOCAL_SIMULATION';
  status: 'QUEUED' | 'RUNNING' | 'COMPLETED' | 'FAILED';
  currentAgentRole?: AgentRole;
  activities: AgentActivity[];
  toolActivities?: WorkflowToolActivity[];
  sources?: Source[];
  metadata?: {
    model?: string;
    runtimeMode?: string;
  };
  startedAt: string;
  completedAt?: string;
  executionMode?: ExecutionMode;
  providerName?: string;
  modelName?: string;
  fallbackUsed?: boolean;
  fallbackReason?: string;
}

export type Task = ProductionTask;
export type ResearchSource = Source;

export type ResearchStatus = 'PENDING' | 'SEARCHING' | 'FOUND' | 'NEEDS REVIEW' | 'FAILED' | 'NOT_NEEDED';

export interface ResearchQuestion {
  id: string;
  productionId: string;
  question: string;
  sceneNumber?: number;
  importance: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  status: ResearchStatus;
  findings?: string;
  sourceIds: string[];
  createdAt: string;
  provider: 'MockResearchProvider' | 'ParallelResearchProvider' | 'ParallelSearchProvider';
}

export interface Source {
  id: string;
  title: string;
  domain: string;
  url: string;
  relatedResearchId?: string;
  relatedSceneNumber?: number;
  retrievedDate: string;
  evidenceSummary: string;
  isDemoMock: boolean;
  qualityTag?: 'OFFICIAL' | 'INDUSTRY' | 'SECONDARY';
}

export type RiskSeverity = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
export type RiskStatus = 'OPEN' | 'IN_REVIEW' | 'MITIGATED' | 'RESOLVED';

export interface Risk {
  id: string;
  productionId: string;
  title: string;
  description: string;
  severity: RiskSeverity;
  sceneNumber?: number;
  reason: string;
  recommendedAction: string;
  status: RiskStatus;
  sourceIds?: string[];
  createdAt: string;
}

export interface ContinuityIssue {
  id: string;
  productionId: string;
  title: string;
  description: string;
  category: 'Wardrobe' | 'Prop' | 'Character' | 'Timeline' | 'Location' | 'Lighting';
  sceneNumbers: number[];
  severity: 'LOW' | 'MEDIUM' | 'HIGH';
  status: 'OPEN' | 'RESOLVED';
  recommendation: string;
}

export interface ShootDay {
  id: string;
  productionId: string;
  dayNumber: number;
  date?: string;
  locationName: string;
  sceneNumbers: number[];
  dayNightFocus: string;
  estimatedHours: number;
  notes?: string;
  warnings?: string[];
}

export interface SystemSettings {
  aiProviderType: 'mock' | 'gemini';
  researchProviderType: 'mock' | 'parallel';
  theme: 'cinematic-dark' | 'studio-light';
  autoRunWorkflow: boolean;
}
