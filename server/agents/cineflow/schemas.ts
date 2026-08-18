import { z } from 'zod';

export const ScriptAnalystOutputSchema = z.object({
  scenes: z.array(
    z.object({
      id: z.string(),
      sceneNumber: z.number(),
      heading: z.string(),
      intExt: z.enum(['INT', 'EXT', 'INT/EXT']),
      dayNight: z.enum(['DAY', 'NIGHT', 'DUSK', 'DAWN']),
      location: z.string(),
      summary: z.string(),
      characters: z.array(z.string()),
      props: z.array(z.string()),
      wardrobe: z.array(z.string()),
      specialRequirements: z.array(z.string()),
      estimatedMinutes: z.number().default(15)
    })
  ),
  characters: z.array(
    z.object({
      id: z.string(),
      name: z.string(),
      role: z.string(),
      description: z.string()
    })
  ),
  props: z.array(
    z.object({
      id: z.string(),
      name: z.string(),
      category: z.string(),
      isSpecial: z.boolean()
    })
  ),
  researchQuestions: z.array(z.string())
});

export const DirectorOutputSchema = z.object({
  directorNotes: z.string(),
  creativeComplexity: z.enum(['LOW', 'MEDIUM', 'HIGH', 'VERY_HIGH']),
  lightingConsiderations: z.array(z.string()),
  sceneDependencies: z.array(
    z.object({
      sceneNumber: z.number(),
      dependentOnSceneNumber: z.number(),
      reason: z.string()
    })
  ),
  visualStyleNotes: z.string()
});

export const ProducerOutputSchema = z.object({
  tasks: z.array(
    z.object({
      id: z.string(),
      title: z.string(),
      department: z.string(),
      priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']),
      status: z.enum(['PENDING', 'IN_PROGRESS', 'COMPLETED']),
      assignedRole: z.string(),
      dependencies: z.array(z.string()).default([]),
      permitRequired: z.boolean().default(false),
      estimatedHours: z.number().default(2)
    })
  ),
  budgetCategoryEstimates: z.array(
    z.object({
      category: z.string(),
      estimatedCost: z.string(),
      notes: z.string()
    })
  )
});

export const ResearchOutputSchema = z.object({
  researchFindings: z.array(
    z.object({
      question: z.string(),
      findings: z.string(),
      status: z.enum(['FOUND', 'FAILED', 'NOT_NEEDED']),
      sourceIds: z.array(z.string())
    })
  )
});

export const ContinuityOutputSchema = z.object({
  issues: z.array(
    z.object({
      id: z.string(),
      type: z.enum(['WARDROBE', 'PROP', 'CHARACTER_STATE', 'TIMELINE', 'LOCATION']),
      severity: z.enum(['MINOR', 'MODERATE', 'CRITICAL']),
      sceneNumbers: z.array(z.number()),
      description: z.string(),
      recommendedFix: z.string()
    })
  )
});

export const RiskOutputSchema = z.object({
  risks: z.array(
    z.object({
      id: z.string(),
      title: z.string(),
      description: z.string(),
      severity: z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']),
      category: z.string(),
      scene: z.string(),
      reason: z.string(),
      recommendedAction: z.string(),
      sourceIds: z.array(z.string()).default([])
    })
  )
});

export const SchedulerOutputSchema = z.object({
  shootDays: z.array(
    z.object({
      dayNumber: z.number(),
      dateLabel: z.string(),
      sceneNumbers: z.array(z.number()),
      primaryLocation: z.string(),
      callTime: z.string(),
      estimatedHours: z.number(),
      specialNotes: z.string()
    })
  )
});

export const SupervisorOutputSchema = z.object({
  status: z.enum(['READY', 'NEEDS_RESEARCH', 'COMPLEX_PRODUCTION']),
  summary: z.string(),
  focusAreas: z.array(z.string())
});

export type ScriptAnalystOutput = z.infer<typeof ScriptAnalystOutputSchema>;
export type DirectorOutput = z.infer<typeof DirectorOutputSchema>;
export type ProducerOutput = z.infer<typeof ProducerOutputSchema>;
export type ResearchOutput = z.infer<typeof ResearchOutputSchema>;
export type ContinuityOutput = z.infer<typeof ContinuityOutputSchema>;
export type RiskOutput = z.infer<typeof RiskOutputSchema>;
export type SchedulerOutput = z.infer<typeof SchedulerOutputSchema>;
export type SupervisorOutput = z.infer<typeof SupervisorOutputSchema>;
