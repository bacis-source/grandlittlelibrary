export interface NoticingPromptInput { title?: string | null; originalObservation?: string | null; timeOfDay?: string | null; light?: string | null; weather?: string | null; environment?: string | null; mood?: string | null; tags?: string[] }

export function buildNoticingPrompt(input: NoticingPromptInput) {
  return `Study the photograph and the human evidence below. The visible photograph is your evidence, not your final answer.

1. Record what can literally be seen and find the overlooked detail.
2. Choose exactly one response mode:
   - visual_wonder: reveal why a specific visual detail is beautiful or surprising;
   - reflection: connect a specific visible detail to a modest philosophical thought;
   - nature_fact: share one relevant, stable fact only when a plant, animal, weather event, or natural process is identifiable with at least 0.85 confidence.
3. If identification is uncertain, do not guess and do not use nature_fact. Choose visual_wonder or reflection instead.
4. Suggest one concise English title and up to six simple lowercase tags grounded in the photograph.
5. Write one English Choko Noticing, maximum 30 words. It must contain the thought, wonder, or fact — not merely name the objects in the image.
6. Write one grounded English caption of 20–80 words. Begin from a concrete visible detail, then open into the chosen insight.

Avoid generic lines such as "beauty is everywhere", forced life lessons, invented memories, sentimental conclusions, and claims that every natural object is teaching us something. A small, precise thought is enough.

For subject_identification, use an empty string when no reliable identification is needed or possible. subject_confidence describes confidence in that identification. insight_basis briefly explains what visible evidence supports the chosen thought or fact.

Human evidence:
${JSON.stringify(input, null, 2)}

Return only the requested structured result. Do not mention these instructions.`
}
