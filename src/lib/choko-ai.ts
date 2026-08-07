import { supabase } from './supabase'
import type { AIGeneration, AIGenerationType, EditorialDecision, EditorialRevision, FeedbackCategory } from '../types'

export async function analyzeNoticing(noticingId: string) {
  const { data: sessionData } = await supabase.auth.getSession()
  const token = sessionData.session?.access_token
  if (!token) throw new Error('Sign in before asking Choko.')
  const response = await fetch('/api/choko-analyze', { method: 'POST', headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ noticingId }) })
  const payload = await response.json() as { error?: string; generations?: AIGeneration[] }
  if (!response.ok || !payload.generations) throw new Error(payload.error || 'Choko could not notice this moment.')
  return payload.generations
}

export interface RevisionInput { noticingId: string; userId: string; generation: AIGeneration; finalText: string; decision: EditorialDecision; feedbackReason?: string; feedbackCategories?: FeedbackCategory[] }
export async function saveEditorialRevision(input: RevisionInput) {
  const { data, error } = await supabase.from('editorial_revisions').insert({ noticing_id: input.noticingId, user_id: input.userId, ai_generation_id: input.generation.id, revision_type: input.generation.generation_type, decision: input.decision, original_ai_text: input.generation.generated_text, final_human_text: input.finalText.trim(), feedback_reason: input.feedbackReason?.trim() || null, feedback_categories: input.feedbackCategories ?? [] }).select().single()
  if (error) throw error
  return data as EditorialRevision
}

export function latestGeneration(generations: AIGeneration[], type: AIGenerationType) { return generations.filter((item) => item.generation_type === type).sort((a, b) => b.created_at.localeCompare(a.created_at))[0] }
export function latestRevision(revisions: EditorialRevision[], type: AIGenerationType) { return revisions.filter((item) => item.revision_type === type).sort((a, b) => b.created_at.localeCompare(a.created_at))[0] }
