/**
 * CineFlow AI — Provider Boundary for Script & Production Intelligence
 */

import {
  Production,
  Scene,
  Character,
  Prop,
  ProductionTask,
  ResearchQuestion,
  Risk,
  ContinuityIssue,
  ShootDay
} from '../../types';
import {
  getDemoScenes,
  getDemoCharacters,
  getDemoProps,
  getDemoTasks,
  getDemoResearchQuestions,
  getDemoRisks,
  getDemoContinuityIssues,
  getDemoShootDays,
  DEMO_PRODUCTION_ID
} from '../../data/demoProductionData';
import { generateId } from '../../lib/id';

export interface ScriptAnalysisResult {
  scenes: Scene[];
  characters: Character[];
  props: Prop[];
  tasks: ProductionTask[];
  researchQuestions: ResearchQuestion[];
  risks: Risk[];
  continuityIssues: ContinuityIssue[];
  shootDays: ShootDay[];
  readinessScore: number;
  provider: 'mock' | 'gemini';
  model: string;
  simulated: boolean;
  fallbackUsed?: boolean;
  fallbackReason?: string;
}

export interface AIProvider {
  name: string;
  isMock: boolean;
  analyzeScript(production: Production, scriptText: string): Promise<ScriptAnalysisResult>;
}

export class MockAIProvider implements AIProvider {
  public name = "CineFlow Stage 1 Local Engine (Simulation)";
  public isMock = true;

  public async analyzeScript(production: Production, scriptText: string): Promise<ScriptAnalysisResult> {
    // Demo script or default production
    if (production.id === DEMO_PRODUCTION_ID || scriptText.includes("NEON HARBOR")) {
      return {
        scenes: getDemoScenes(),
        characters: getDemoCharacters(),
        props: getDemoProps(),
        tasks: getDemoTasks(),
        researchQuestions: getDemoResearchQuestions(),
        risks: getDemoRisks(),
        continuityIssues: getDemoContinuityIssues(),
        shootDays: getDemoShootDays(),
        readinessScore: 78,
        provider: 'mock',
        model: 'CineFlow Local Engine (Demo)',
        simulated: true
      };
    }

    // Dynamic fallback for custom scripts
    const rawScenes = scriptText.split(/(?=SCENE\s+\d+|INT\.|EXT\.)/i).filter(s => s.trim().length > 10);
    const sceneList: Scene[] = [];

    rawScenes.forEach((raw, idx) => {
      const num = idx + 1;
      const lines = raw.trim().split('\n');
      const heading = lines[0] || `SCENE ${num}`;
      const isInt = heading.toUpperCase().includes('INT.');
      const isNight = heading.toUpperCase().includes('NIGHT');

      sceneList.push({
        id: generateId(`scene_${production.id}`),
        productionId: production.id,
        sceneNumber: num,
        heading: heading.substring(0, 80),
        intExt: isInt ? 'INT' : 'EXT',
        dayNight: isNight ? 'NIGHT' : 'DAY',
        location: heading.replace(/^(INT\.|EXT\.|INT\/EXT\.)\s*/i, '').replace(/\s*-\s*(NIGHT|DAY|DAWN|DUSK)$/i, '').trim() || 'Location TBD',
        summary: lines.slice(1, 3).join(' ').trim() || 'Dramatic scene action sequence.',
        complexity: (num % 2 === 0) ? 'HIGH' : 'MEDIUM',
        characters: ['Lead Character', 'Supporting Role'],
        props: ['Primary Prop', 'Hero Item'],
        wardrobe: ['Standard Wardrobe'],
        specialRequirements: ['Atmospheric Lighting'],
        directorNotes: `Director Note: Focus on pacing and emotional tension in Scene ${num}.`,
        scheduleStatus: 'SCHEDULED',
        shootDayNumber: Math.ceil(num / 3),
        estimatedMinutes: 35
      });
    });

    if (sceneList.length === 0) {
      sceneList.push({
        id: generateId(`scene_${production.id}`),
        productionId: production.id,
        sceneNumber: 1,
        heading: 'INT. MAIN LOCATION - DAY',
        intExt: 'INT',
        dayNight: 'DAY',
        location: production.location || 'Main Studio Location',
        summary: scriptText.substring(0, 150) || 'Primary film story sequence.',
        complexity: 'MEDIUM',
        characters: ['Lead Character'],
        props: ['Hero Prop'],
        wardrobe: ['Costume 1'],
        specialRequirements: ['Standard Lighting'],
        directorNotes: 'Establish tone and main conflict.',
        scheduleStatus: 'SCHEDULED',
        shootDayNumber: 1,
        estimatedMinutes: 40
      });
    }

    const tasks: ProductionTask[] = [
      {
        id: generateId(`task_${production.id}`),
        productionId: production.id,
        title: `Lock filming permit for ${production.location || 'Primary Location'}`,
        description: 'Submit municipal film office permits and liability insurance.',
        category: 'Location & Permits',
        priority: 'CRITICAL',
        status: 'IN PROGRESS',
        sceneNumber: 1,
        assignedAgent: 'Producer Agent',
        createdAt: new Date().toISOString()
      },
      {
        id: generateId(`task_${production.id}`),
        productionId: production.id,
        title: 'Conduct Cast Auditions & Chemical Reads',
        description: 'Cast lead and supporting roles based on script breakdown.',
        category: 'Casting',
        priority: 'HIGH',
        status: 'TO DO',
        assignedAgent: 'Producer Agent',
        createdAt: new Date().toISOString()
      }
    ];

    const researchQuestions: ResearchQuestion[] = [
      {
        id: generateId(`rq_${production.id}`),
        productionId: production.id,
        question: `What regional film permits and safety regulations apply in ${production.location || 'the target filming area'}?`,
        importance: 'CRITICAL',
        status: 'PENDING',
        findings: undefined,
        sourceIds: [],
        createdAt: new Date().toISOString(),
        provider: 'MockResearchProvider'
      }
    ];

    const risks: Risk[] = [
      {
        id: generateId(`risk_${production.id}`),
        productionId: production.id,
        title: 'Location Clearance & Noise Disturbance Hazard',
        description: 'Outdoor night filming may exceed local noise ordinances.',
        severity: 'HIGH',
        sceneNumber: 1,
        reason: 'Night shooting past 22:00 requires community notification and sound dampening.',
        recommendedAction: 'Notify surrounding residents 7 days prior and obtain late-night permit waiver.',
        status: 'OPEN',
        createdAt: new Date().toISOString()
      }
    ];

    const shootDays: ShootDay[] = [
      {
        id: generateId(`day_${production.id}`),
        productionId: production.id,
        dayNumber: 1,
        locationName: production.location || 'Primary Location',
        sceneNumbers: sceneList.map(s => s.sceneNumber),
        dayNightFocus: 'DAY / NIGHT',
        estimatedHours: 8,
        notes: 'Initial production call day.'
      }
    ];

    return {
      scenes: sceneList,
      characters: [
        {
          id: generateId(`char_${production.id}`),
          productionId: production.id,
          name: 'Lead Character',
          roleType: 'Lead',
          description: 'Protagonist driving the film narrative.',
          castRequirements: 'Ages 25-40, high emotional range.',
          sceneCount: sceneList.length,
          sceneNumbers: sceneList.map(s => s.sceneNumber)
        }
      ],
      props: [
        {
          id: generateId(`prop_${production.id}`),
          productionId: production.id,
          name: 'Primary Hero Prop',
          category: 'Hero Prop',
          description: 'Central story artifact identified from script breakdown.',
          fragile: false,
          sceneNumbers: [1]
        }
      ],
      tasks,
      researchQuestions,
      risks,
      continuityIssues: [],
      shootDays,
      readinessScore: 75,
      provider: 'mock',
      model: 'CineFlow Stage 1 Engine',
      simulated: true
    };
  }
}

export class GeminiProvider implements AIProvider {
  public name = "Gemini Production AI (Google ADK)";
  public isMock = false;

  public async analyzeScript(production: Production, scriptText: string): Promise<ScriptAnalysisResult> {
    try {
      const res = await fetch('/api/analyze-script', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ production, scriptText })
      });

      if (res.ok) {
        const data = await res.json();

        if (data && data.status === 'SUCCESS' && data.analysis) {
          const raw = data.analysis;

          // Normalize IDs and productionId references on raw entities
          const normalizeList = (list: any[], prefix: string) => {
            if (!Array.isArray(list)) return [];
            return list.map((item, idx) => ({
              ...item,
              id: item.id || generateId(`${prefix}_${production.id}_${idx}`),
              productionId: production.id
            }));
          };

          const scenes = normalizeList(raw.scenes, 'scene');
          const characters = normalizeList(raw.characters, 'char');
          const props = normalizeList(raw.props, 'prop');
          const tasks = normalizeList(raw.tasks, 'task');
          const researchQuestions = normalizeList(raw.researchQuestions, 'rq').map(q => ({
            ...q,
            status: q.status || 'PENDING',
            sourceIds: q.sourceIds || [],
            createdAt: q.createdAt || new Date().toISOString(),
            provider: 'MockResearchProvider'
          }));
          const risks = normalizeList(raw.risks, 'risk').map(r => ({
            ...r,
            status: r.status || 'OPEN',
            createdAt: r.createdAt || new Date().toISOString()
          }));
          const continuityIssues = normalizeList(raw.continuityIssues || [], 'cont');
          const shootDays = normalizeList(raw.shootDays || [], 'day');

          return {
            scenes,
            characters,
            props,
            tasks,
            researchQuestions,
            risks,
            continuityIssues,
            shootDays,
            readinessScore: typeof raw.readinessScore === 'number' ? raw.readinessScore : 75,
            provider: 'gemini',
            model: data.model || 'gemini-2.5-flash',
            simulated: false
          };
        }

        // If Gemini was unconfigured or failed on server
        const fallbackReason = data?.error || data?.message || 'Gemini server processing returned empty analysis';
        console.warn('Gemini Provider fallback triggered:', fallbackReason);

        const mockProvider = new MockAIProvider();
        const mockResult = await mockProvider.analyzeScript(production, scriptText);

        return {
          ...mockResult,
          provider: 'gemini',
          model: 'gemini-2.5-flash (Fallback)',
          simulated: true,
          fallbackUsed: true,
          fallbackReason
        };
      }
    } catch (e: any) {
      console.warn("Server-side Gemini endpoint offline/error, falling back to simulation provider:", e);
    }

    const mockProvider = new MockAIProvider();
    const mockResult = await mockProvider.analyzeScript(production, scriptText);

    return {
      ...mockResult,
      provider: 'gemini',
      model: 'gemini-2.5-flash (Fallback)',
      simulated: true,
      fallbackUsed: true,
      fallbackReason: 'Network connection to server analysis endpoint failed'
    };
  }
}
