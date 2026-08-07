import type { ChokoAIResult } from '../../src/ai/schema.js'

export interface ChokoAIInput {
  prompt: string
  systemPrompt: string
  imageDataUrl: string
  safetyIdentifier: string
}

export interface ChokoAIProviderResult {
  provider: string
  model: string
  result: ChokoAIResult
}

export interface ChokoAIProvider {
  analyzeNoticing(input: ChokoAIInput): Promise<ChokoAIProviderResult>
}
