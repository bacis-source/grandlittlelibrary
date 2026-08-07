import { describe, expect, it } from 'vitest'
import migration from '../../supabase/migrations/0003_choko_vision.sql?raw'
describe('Choko learning data security', () => {
  it('enables RLS on both learning tables', () => { expect(migration).toContain('alter table public.ai_generations enable row level security'); expect(migration).toContain('alter table public.editorial_revisions enable row level security') })
  it('scopes generation and revision policies to auth.uid()', () => { expect(migration).toContain('own_ai_generations_select'); expect(migration).toContain('own_editorial_revisions_select'); expect(migration.match(/auth\.uid\(\)/g)?.length).toBeGreaterThanOrEqual(8) })
  it('keeps evidence append-only by defining no update policy', () => { expect(migration).not.toContain('own_ai_generations_update'); expect(migration).not.toContain('own_editorial_revisions_update') })
})
