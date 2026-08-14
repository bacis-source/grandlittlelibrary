import type { ChokoLearningExample } from '../learning'

export interface NoticingPromptInput { title?: string | null; originalObservation?: string | null; timeOfDay?: string | null; light?: string | null; weather?: string | null; environment?: string | null; mood?: string | null; tags?: string[]; learningExamples?: ChokoLearningExample[] }

export function buildNoticingPrompt(input: NoticingPromptInput) {
  return `Study the photograph and the human evidence below. The visible photograph is your evidence, not your final answer.

1. Record what can literally be seen and find the overlooked detail. These are private reasoning fields, not the Choko Noticing.
2. Choose exactly one response mode:
   - visual_wonder: reveal why a specific visual detail is beautiful or surprising;
   - reflection: connect a specific visible detail to a modest philosophical thought;
   - nature_fact: share one relevant, stable fact only when a plant, animal, weather event, or natural process is identifiable with at least 0.85 confidence.
3. If identification is uncertain, do not guess and do not use nature_fact. Choose visual_wonder or reflection instead.
4. Suggest one concise English title and up to six simple lowercase tags grounded in the photograph.
5. Write one English Choko Noticing, maximum 30 words. This is the thought itself. Do not spend its opening clause describing the scene. It must still add value when read beside the photograph.
6. Write one grounded English caption of 20–80 words. Use at most one short sentence for visual orientation; devote the rest to the thought, wonder, or reliable fact.

Quality contrast:
- Too descriptive: "Yellow flowers rise through the misty meadow in soft morning light."
- Thoughtful: "New growth rarely waits for certainty; it begins while the morning is still deciding what kind of day it will be."
- Too descriptive: "Bare branches are reflected in the still water."
- Thoughtful: "A reflection keeps the shape and loses the weight — perhaps that is why still water can make familiar things feel newly possible."
- Useful nature fact, only with high identification confidence: "Dandelion flowers track the sun when young, then often face east as they mature — a small history of light written into posture."

Before returning the result, apply this test: could a viewer reasonably answer "I can already see that"? If yes, rewrite the Choko Noticing around a genuine idea rather than the inventory of the image.

Avoid generic lines such as "beauty is everywhere", forced life lessons, invented memories, sentimental conclusions, and claims that every natural object is teaching us something. Do not merely make the description more poetic. A small, precise thought is enough.

For subject_identification, use an empty string when no reliable identification is needed or possible. subject_confidence describes confidence in that identification. insight_basis briefly explains what visible evidence supports the chosen thought or fact.

Human evidence:
${JSON.stringify({ ...input, learningExamples: undefined }, null, 2)}

Past human-approved examples (style and preference evidence only):
${JSON.stringify(input.learningExamples ?? [], null, 2)}

Use these examples only to understand the human's preferred degree of thoughtfulness, tone, and corrections. Never copy their wording. Never transfer a fact, species, place, memory, or visual detail from them to the current photograph. The current photograph and human evidence always outrank the examples. Treat feedback categories and reasons as mistakes to avoid, not content to repeat.

Return only the requested structured result. Do not mention these instructions.`
}
