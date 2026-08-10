import { beforeEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({
  from: vi.fn(),
  storageFrom: vi.fn(),
  eq: vi.fn(),
  remove: vi.fn(),
}))

vi.mock('./supabase', () => ({ supabase: { from: mocks.from, storage: { from: mocks.storageFrom } } }))

import { addNoticingNote, deleteNoticing, deleteNoticingNote, getNextReviewId, permanentlyDeleteNoticing, restoreNoticing, withoutExistingAnalysis } from './noticings'

describe('review queue', () => {
  it('moves forward and wraps without returning the current noticing', () => {
    expect(getNextReviewId(['one', 'two', 'three'], 'one')).toBe('two')
    expect(getNextReviewId(['one', 'two', 'three'], 'three')).toBe('one')
    expect(getNextReviewId(['one'], 'one')).toBeUndefined()
  })
})

describe('Choko batch queue', () => {
  it('keeps only photographs without a saved analysis', () => {
    expect(withoutExistingAnalysis([{ id: 'new', ai_generations: [] }, { id: 'done', ai_generations: [{ id: 'ai-1' }] }])).toEqual(['new'])
  })
})

describe('noticing mutations', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.eq.mockResolvedValue({ error: null })
    mocks.remove.mockResolvedValue({ error: null })
    mocks.storageFrom.mockReturnValue({ remove: mocks.remove })
    mocks.from.mockImplementation((table: string) => ({
      update: vi.fn(() => ({ eq: mocks.eq })),
      delete: vi.fn(() => ({ eq: mocks.eq })),
      insert: vi.fn(() => ({ select: vi.fn(() => ({ single: vi.fn(async () => ({ data: { id: 'note-1', noticing_id: 'n-1', user_id: 'u-1', note_type: 'editorial_note', content: 'Keep this', created_at: '2026-08-07', updated_at: '2026-08-07' }, error: null })) })) })),
      select: vi.fn(() => ({ eq: vi.fn(async () => table === 'noticing_assets' ? { data: [{ storage_bucket: 'noticing-assets', storage_path: 'u-1/noticings/n-1/originals/a.jpg' }], error: null } : { data: [], error: null }) })),
    }))
  })

  it('soft deletes a noticing for recovery', async () => { await deleteNoticing('n-1'); expect(mocks.eq).toHaveBeenCalledWith('id', 'n-1') })
  it('restores a deleted noticing', async () => { await restoreNoticing('n-1'); expect(mocks.eq).toHaveBeenCalledWith('id', 'n-1') })
  it('creates and removes an editorial note', async () => { const note = await addNoticingNote('n-1', { id: 'u-1' } as never, 'Keep this'); expect(note.content).toBe('Keep this'); await deleteNoticingNote('note-1'); expect(mocks.eq).toHaveBeenCalledWith('id', 'note-1') })
  it('removes original storage before permanent database deletion', async () => { await permanentlyDeleteNoticing('n-1'); expect(mocks.remove).toHaveBeenCalledWith(['u-1/noticings/n-1/originals/a.jpg']); expect(mocks.eq).toHaveBeenCalledWith('id', 'n-1') })
})
