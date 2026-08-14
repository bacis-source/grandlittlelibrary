import { describe, expect, it } from 'vitest'
import { matchesReviewFilter, reviewOverview } from './review-overview'
import type { Noticing } from '../types'

const item = (id: string, status: Noticing['status'], ready_for_editorial = false) => ({ id, status, ready_for_editorial } as Noticing)

describe('review overview', () => {
  const items = [item('draft', 'draft'), item('reviewed', 'reviewed'), item('ready', 'ready', true), item('archived', 'archived')]

  it('counts the active review workflow and its progress', () => {
    expect(reviewOverview(items)).toMatchObject({ total: 3, percent: 67 })
    expect(reviewOverview(items).waiting.map((entry) => entry.id)).toEqual(['draft'])
    expect(reviewOverview(items).reviewed.map((entry) => entry.id)).toEqual(['reviewed', 'ready'])
  })

  it('filters editorial-ready moments independently', () => {
    expect(items.filter((entry) => matchesReviewFilter(entry, 'editorial')).map((entry) => entry.id)).toEqual(['ready'])
  })
})
