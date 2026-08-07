import { describe, expect, it } from 'vitest'
import { chokoAIResultSchema } from './schema'
import { CHOKO_PROMPT_VERSION } from './prompt-versions'

const valid = { literal_observation: 'A web holds drops of dew.', overlooked_detail: 'One thread only appears where the light crosses it.', choko_noticing: 'The web was almost invisible until the morning light found it.', caption: 'For a moment, the smallest threads held the whole morning. The web had been there all along, waiting for the light to make it visible.', confidence: 0.87, uncertainties: [] }
describe('Choko structured output', () => {
  it('accepts a grounded structured response', () => expect(chokoAIResultSchema.parse(valid)).toEqual(valid))
  it('rejects a noticing longer than 30 words', () => expect(() => chokoAIResultSchema.parse({ ...valid, choko_noticing: Array(31).fill('word').join(' ') })).toThrow())
  it('rejects malformed or unbounded confidence', () => expect(() => chokoAIResultSchema.parse({ ...valid, confidence: 2 })).toThrow())
  it('records a stable prompt version', () => expect(CHOKO_PROMPT_VERSION).toBe('choko-vision-v1'))
})
