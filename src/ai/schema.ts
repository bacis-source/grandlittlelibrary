import { z } from 'zod'

export const chokoAIResultSchema = z.object({
  response_mode: z.enum(['visual_wonder', 'reflection', 'nature_fact']).optional(),
  subject_identification: z.string().trim().max(160).optional(),
  subject_confidence: z.number().min(0).max(1).optional(),
  insight_basis: z.string().trim().min(1).max(500).optional(),
  suggested_title: z.string().trim().min(1).max(100).optional(),
  suggested_tags: z.array(z.string().trim().min(1).max(40)).max(6).optional(),
  literal_observation: z.string().trim().min(1).max(1000),
  overlooked_detail: z.string().trim().min(1).max(1000),
  choko_noticing: z.string().trim().min(1).max(240).refine((text) => text.split(/\s+/).length <= 30, 'Choko Noticing must be 30 words or fewer'),
  caption: z.string().trim().min(1).max(1000).refine((text) => { const words = text.split(/\s+/).length; return words >= 20 && words <= 80 }, 'Caption must be 20–80 words'),
  confidence: z.number().min(0).max(1),
  uncertainties: z.array(z.string().trim().min(1).max(240)).max(10),
}).strict()

export type ChokoAIResult = z.infer<typeof chokoAIResultSchema>
