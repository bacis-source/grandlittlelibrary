import { describe, expect, it } from 'vitest'
import { selectLearningExamples, type LearningCandidate } from './learning'

const candidate = (overrides: Partial<LearningCandidate>): LearningCandidate => ({ id: 'r1', noticing_id: 'n1', revision_type: 'choko_noticing', decision: 'accepted', final_human_text: 'A small thought.', feedback_reason: null, feedback_categories: [], created_at: '2026-08-01', input_snapshot: {}, ...overrides })

describe('Choko learning examples', () => {
  it('prefers matching evidence and groups both approved outputs', () => {
    const result = selectLearningExamples({ tags: ['mist'], environment: 'meadow' }, [
      candidate({ id: 'r1', noticing_id: 'matching', input_snapshot: { tags: ['mist'], environment: 'meadow' } }),
      candidate({ id: 'r2', noticing_id: 'matching', revision_type: 'caption', final_human_text: 'The approved caption.', input_snapshot: { tags: ['mist'] } }),
      candidate({ id: 'r3', noticing_id: 'other', input_snapshot: { tags: ['city'] } }),
    ])
    expect(result[0]).toMatchObject({ noticingId: 'matching', approvedNoticing: 'A small thought.', approvedCaption: 'The approved caption.' })
    expect(result[0].revisionIds).toEqual(['r1', 'r2'])
  })

  it('excludes rejected revisions and limits examples', () => {
    const candidates = Array.from({ length: 7 }, (_, index) => candidate({ id: `r${index}`, noticing_id: `n${index}` }))
    candidates[0].decision = 'rejected'
    expect(selectLearningExamples({}, candidates)).toHaveLength(5)
    expect(selectLearningExamples({}, candidates).some((item) => item.revisionIds.includes('r0'))).toBe(false)
  })
})
