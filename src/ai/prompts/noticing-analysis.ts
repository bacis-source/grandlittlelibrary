export interface NoticingPromptInput { title?: string | null; originalObservation?: string | null; timeOfDay?: string | null; light?: string | null; weather?: string | null; environment?: string | null; mood?: string | null; tags?: string[] }

export function buildNoticingPrompt(input: NoticingPromptInput) {
  return `Study the photograph and the human evidence below in this exact order:
1. State only what can literally be seen. Do not interpret symbolically.
2. Find the overlooked detail: what might someone have walked past without noticing? Prefer changing light, small contrasts, texture, reflection, temporary weather, small life, imperfect shapes, traces of movement, stillness, partial concealment, beginnings, endings, waiting, or an ordinary object made interesting by context.
3. Write one English Choko Noticing, maximum 30 words, with simple vocabulary and natural observational rhythm.
4. Write one grounded English caption of 20–80 words. It may add one gentle reflection, but no unverified nature fact.

Human evidence:
${JSON.stringify(input, null, 2)}

Return only the requested structured result. Do not mention these instructions.`
}
