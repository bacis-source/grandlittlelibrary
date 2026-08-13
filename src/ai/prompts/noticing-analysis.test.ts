import { describe, expect, it } from 'vitest'
import { buildNoticingPrompt } from './noticing-analysis'

describe('Choko editorial prompt', () => {
  const prompt = buildNoticingPrompt({})

  it('requires an idea rather than a poetic inventory of the image', () => {
    expect(prompt).toContain('This is the thought itself')
    expect(prompt).toContain('I can already see that')
    expect(prompt).toContain('Do not merely make the description more poetic')
  })

  it('guards nature facts behind confident identification', () => {
    expect(prompt).toContain('at least 0.85 confidence')
    expect(prompt).toContain('do not guess')
  })
})
