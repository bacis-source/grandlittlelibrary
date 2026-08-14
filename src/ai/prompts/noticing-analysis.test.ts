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

  it('uses approved examples as style guidance, never current-photo facts', () => {
    const learned = buildNoticingPrompt({ learningExamples: [{ noticingId: 'n1', revisionIds: ['r1'], approvedNoticing: 'Approved thought', feedbackCategories: ['too_descriptive'], score: 3 }] })
    expect(learned).toContain('style and preference evidence only')
    expect(learned).toContain('Never copy their wording')
    expect(learned).toContain('current photograph and human evidence always outrank')
  })
})
