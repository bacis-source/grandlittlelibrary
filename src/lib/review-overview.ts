import type { Noticing } from '../types'

export type ReviewFilter = 'all' | 'waiting' | 'reviewed' | 'editorial'

export function reviewOverview(items: Noticing[]) {
  const active = items.filter((item) => item.status !== 'archived')
  const waiting = active.filter((item) => item.status === 'draft' || item.status === 'unreviewed')
  const reviewed = active.filter((item) => item.status === 'reviewed' || item.status === 'ready')
  const editorial = active.filter((item) => item.status === 'ready' || item.ready_for_editorial)
  const total = waiting.length + reviewed.length
  return { waiting, reviewed, editorial, total, percent: total ? Math.round((reviewed.length / total) * 100) : 100 }
}

export function matchesReviewFilter(item: Noticing, filter: ReviewFilter) {
  if (filter === 'waiting') return item.status === 'draft' || item.status === 'unreviewed'
  if (filter === 'reviewed') return item.status === 'reviewed' || item.status === 'ready'
  if (filter === 'editorial') return item.status === 'ready' || item.ready_for_editorial
  return true
}
