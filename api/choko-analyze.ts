import { createHash, randomUUID } from 'node:crypto'
import { createClient } from '@supabase/supabase-js'
import { z } from 'zod'
import { CHOKO_PROMPT_VERSION } from '../src/ai/prompt-versions.js'
import { CHOKO_SYSTEM_PROMPT } from '../src/ai/prompts/choko-system.js'
import { buildNoticingPrompt } from '../src/ai/prompts/noticing-analysis.js'
import { OpenAIChokoProvider } from './lib/openai-provider.js'

interface RequestLike { method?: string; headers: Record<string, string | string[] | undefined>; body?: unknown }
interface ResponseLike { status(code: number): ResponseLike; json(value: unknown): void; setHeader(name: string, value: string): void }
const bodySchema = z.object({ noticingId: z.string().uuid() }).strict()

export default async function handler(req: RequestLike, res: ResponseLike) {
  res.setHeader('Cache-Control', 'no-store')
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed.' })
  const authorization = typeof req.headers.authorization === 'string' ? req.headers.authorization : ''
  if (!authorization.startsWith('Bearer ')) return res.status(401).json({ error: 'Sign in before asking Choko.' })
  const parsedBody = bodySchema.safeParse(req.body)
  if (!parsedBody.success) return res.status(400).json({ error: 'A valid Noticing is required.' })
  const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL
  const supabaseKey = process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY
  if (!supabaseUrl || !supabaseKey || !process.env.OPENAI_API_KEY) return res.status(503).json({ error: 'Choko Vision is not configured yet.' })

  const supabase = createClient(supabaseUrl, supabaseKey, { global: { headers: { Authorization: authorization } }, auth: { persistSession: false } })
  const { data: authData, error: authError } = await supabase.auth.getUser(authorization.slice(7))
  if (authError || !authData.user) return res.status(401).json({ error: 'Your session is no longer valid.' })
  try {
    const { data: noticing, error } = await supabase.from('noticings').select('id,user_id,title,original_observation_text,time_of_day,light_condition,weather,environment_type,mood,noticing_assets(id,asset_type,storage_bucket,storage_path,is_primary),noticing_tags(tags(name))').eq('id', parsedBody.data.noticingId).is('deleted_at', null).single()
    if (error || !noticing || noticing.user_id !== authData.user.id) return res.status(404).json({ error: 'Noticing not found.' })
    const assets = noticing.noticing_assets as Array<{ asset_type: string; storage_bucket: string; storage_path: string; is_primary: boolean }>
    const image = assets.find((asset) => asset.asset_type === 'image' && asset.is_primary) ?? assets.find((asset) => asset.asset_type === 'image')
    if (!image) return res.status(422).json({ error: 'Choko needs a photograph to notice.' })
    const { data: blob, error: downloadError } = await supabase.storage.from(image.storage_bucket).download(image.storage_path)
    if (downloadError || !blob) throw new Error('The primary photograph could not be opened.')
    const imageDataUrl = `data:${blob.type || 'image/jpeg'};base64,${Buffer.from(await blob.arrayBuffer()).toString('base64')}`
    const tagLinks = noticing.noticing_tags as unknown as Array<{ tags: { name: string } | Array<{ name: string }> | null }>
    const tags = (tagLinks ?? []).map((entry) => Array.isArray(entry.tags) ? entry.tags[0]?.name : entry.tags?.name).filter((name): name is string => Boolean(name))
    const inputSnapshot = { title: noticing.title, original_observation: noticing.original_observation_text, time_of_day: noticing.time_of_day, light: noticing.light_condition, weather: noticing.weather, environment: noticing.environment_type, mood: noticing.mood, tags }
    const provider = new OpenAIChokoProvider(process.env.OPENAI_API_KEY)
    const generated = await provider.analyzeNoticing({ systemPrompt: CHOKO_SYSTEM_PROMPT, prompt: buildNoticingPrompt({ title: noticing.title, originalObservation: noticing.original_observation_text, timeOfDay: noticing.time_of_day, light: noticing.light_condition, weather: noticing.weather, environment: noticing.environment_type, mood: noticing.mood, tags }), imageDataUrl, safetyIdentifier: createHash('sha256').update(authData.user.id).digest('hex') })
    const groupId = randomUUID()
    const shared = { generation_group_id: groupId, noticing_id: noticing.id, user_id: authData.user.id, model_provider: generated.provider, model_name: generated.model, prompt_version: CHOKO_PROMPT_VERSION, input_snapshot: inputSnapshot, structured_output: generated.result, confidence: generated.result.confidence, uncertainties: generated.result.uncertainties }
    const { data: rows, error: insertError } = await supabase.from('ai_generations').insert([{ ...shared, generation_type: 'choko_noticing', generated_text: generated.result.choko_noticing }, { ...shared, generation_type: 'caption', generated_text: generated.result.caption }]).select()
    if (insertError) throw insertError
    return res.status(200).json({ result: generated.result, generations: rows })
  } catch (cause) {
    const message = cause instanceof Error ? cause.message : 'Choko could not notice this moment.'
    return res.status(500).json({ error: message })
  }
}
