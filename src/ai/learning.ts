export interface LearningCandidate {
  id: string
  noticing_id: string
  revision_type: 'choko_noticing' | 'caption'
  decision: 'accepted' | 'edited' | 'rejected'
  final_human_text: string
  feedback_reason: string | null
  feedback_categories: string[] | null
  created_at: string
  input_snapshot: Record<string, unknown>
}

export interface ChokoLearningExample {
  noticingId: string
  revisionIds: string[]
  approvedNoticing?: string
  approvedCaption?: string
  feedbackReason?: string
  feedbackCategories: string[]
  score: number
}

type Evidence = { tags?: string[]; environment?: string | null; mood?: string | null; time_of_day?: string | null; light?: string | null; weather?: string | null }

const normalized = (value: unknown) => typeof value === 'string' ? value.trim().toLowerCase() : ''

function relevance(current: Evidence, candidate: LearningCandidate) {
  const snapshot = candidate.input_snapshot ?? {}
  const currentTags = new Set((current.tags ?? []).map(normalized).filter(Boolean))
  const pastTags = Array.isArray(snapshot.tags) ? snapshot.tags.map(normalized) : []
  let score = pastTags.reduce((total, tag) => total + (currentTags.has(tag) ? 3 : 0), 0)
  if (normalized(current.environment) && normalized(current.environment) === normalized(snapshot.environment)) score += 2
  if (normalized(current.mood) && normalized(current.mood) === normalized(snapshot.mood)) score += 2
  for (const field of ['time_of_day', 'light', 'weather'] as const) {
    if (normalized(current[field]) && normalized(current[field]) === normalized(snapshot[field])) score += 1
  }
  if (candidate.decision === 'edited') score += 1
  if ((candidate.feedback_categories ?? []).length || candidate.feedback_reason) score += 1
  return score
}

export function selectLearningExamples(current: Evidence, candidates: LearningCandidate[], limit = 5): ChokoLearningExample[] {
  const groups = new Map<string, LearningCandidate[]>()
  candidates.filter((item) => item.decision !== 'rejected' && item.final_human_text.trim()).forEach((item) => {
    groups.set(item.noticing_id, [...(groups.get(item.noticing_id) ?? []), item])
  })
  return [...groups.entries()].map(([noticingId, revisions]) => {
    const latest = [...revisions].sort((a, b) => b.created_at.localeCompare(a.created_at))
    const noticing = latest.find((item) => item.revision_type === 'choko_noticing')
    const caption = latest.find((item) => item.revision_type === 'caption')
    const feedbackCategories = [...new Set(latest.flatMap((item) => item.feedback_categories ?? []))]
    const feedbackReason = latest.find((item) => item.feedback_reason)?.feedback_reason ?? undefined
    return { noticingId, revisionIds: latest.map((item) => item.id), approvedNoticing: noticing?.final_human_text, approvedCaption: caption?.final_human_text, feedbackReason, feedbackCategories, score: Math.max(...latest.map((item) => relevance(current, item))) }
  }).sort((a, b) => b.score - a.score || a.noticingId.localeCompare(b.noticingId)).slice(0, Math.max(0, limit))
}
