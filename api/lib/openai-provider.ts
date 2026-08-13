import { chokoAIResultSchema } from '../../src/ai/schema.js'
import type { ChokoAIInput, ChokoAIProvider, ChokoAIProviderResult } from './choko-ai-provider.js'

const jsonSchema = {
  type: 'object', additionalProperties: false,
  properties: {
    response_mode: { type: 'string', enum: ['visual_wonder', 'reflection', 'nature_fact'] }, subject_identification: { type: 'string' }, subject_confidence: { type: 'number', minimum: 0, maximum: 1 }, insight_basis: { type: 'string' },
    suggested_title: { type: 'string' }, suggested_tags: { type: 'array', items: { type: 'string' }, maxItems: 6 }, literal_observation: { type: 'string' }, overlooked_detail: { type: 'string' }, choko_noticing: { type: 'string' }, caption: { type: 'string' }, confidence: { type: 'number', minimum: 0, maximum: 1 }, uncertainties: { type: 'array', items: { type: 'string' } },
  },
  required: ['response_mode', 'subject_identification', 'subject_confidence', 'insight_basis', 'suggested_title', 'suggested_tags', 'literal_observation', 'overlooked_detail', 'choko_noticing', 'caption', 'confidence', 'uncertainties'],
}

function outputText(payload: Record<string, unknown>) {
  if (typeof payload.output_text === 'string') return payload.output_text
  const output = Array.isArray(payload.output) ? payload.output : []
  for (const item of output as Array<{ content?: Array<{ type?: string; text?: string }> }>) {
    const part = item.content?.find((entry) => entry.type === 'output_text')
    if (part?.text) return part.text
  }
  throw new Error('The AI provider returned no structured text.')
}

export class OpenAIChokoProvider implements ChokoAIProvider {
  constructor(private apiKey: string, private model = process.env.CHOKO_AI_MODEL || 'gpt-5.6-terra') {}

  async analyzeNoticing(input: ChokoAIInput): Promise<ChokoAIProviderResult> {
    let lastError: Error | undefined
    for (let attempt = 0; attempt < 2; attempt += 1) {
      try {
        const response = await fetch('https://api.openai.com/v1/responses', {
          method: 'POST', headers: { Authorization: `Bearer ${this.apiKey}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({
            model: this.model, store: false, safety_identifier: input.safetyIdentifier,
            reasoning: { effort: 'medium' },
            instructions: input.systemPrompt,
            input: [{ role: 'user', content: [{ type: 'input_text', text: input.prompt }, { type: 'input_image', image_url: input.imageDataUrl, detail: 'high' }] }],
            text: { format: { type: 'json_schema', name: 'choko_vision_result', strict: true, schema: jsonSchema } },
          }),
        })
        if (!response.ok) throw new Error(`AI provider request failed (${response.status}).`)
        const payload = await response.json() as Record<string, unknown>
        const result = chokoAIResultSchema.parse(JSON.parse(outputText(payload)))
        return { provider: 'openai', model: this.model, result }
      } catch (cause) {
        lastError = cause instanceof Error ? cause : new Error('AI analysis failed.')
      }
    }
    throw lastError ?? new Error('AI analysis failed.')
  }
}
