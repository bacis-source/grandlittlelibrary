import { describe, expect, it } from 'vitest'
import { chokoAIResultSchema } from './schema'
import { CHOKO_PROMPT_VERSION } from './prompt-versions'

const valid = { response_mode: 'visual_wonder' as const, subject_identification: 'spider web', subject_confidence: 0.92, insight_basis: 'Low morning light makes one strand visible.', suggested_title: 'Morning threads', suggested_tags: ['web', 'dew', 'morning-light'], literal_observation: 'A web holds drops of dew.', overlooked_detail: 'One thread only appears where the light crosses it.', choko_noticing: 'Light does not create the web; it briefly lets us see the patient work that darkness kept hidden.', caption: 'One strand catches the low morning light while the rest of the web almost disappears. The structure was complete before it became visible, a small reminder that attention often arrives after the work is done.', confidence: 0.87, uncertainties: [] }
describe('Choko structured output', () => {
  it('accepts a grounded structured response', () => expect(chokoAIResultSchema.parse(valid)).toEqual(valid))
  it('rejects a noticing longer than 30 words', () => expect(() => chokoAIResultSchema.parse({ ...valid, choko_noticing: Array(31).fill('word').join(' ') })).toThrow())
  it('rejects malformed or unbounded confidence', () => expect(() => chokoAIResultSchema.parse({ ...valid, confidence: 2 })).toThrow())
  it('records a stable prompt version', () => expect(CHOKO_PROMPT_VERSION).toBe('choko-vision-v4'))
})
