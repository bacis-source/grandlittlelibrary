import { z } from 'zod'

export const noticingSchema = z.object({
  title: z.string().trim().max(160).optional(),
  observation_text: z.string().trim().min(1, 'Tell us why you stopped.').max(5000),
  location_name: z.string().trim().max(240).optional(),
  captured_at: z.string().optional(),
  weather: z.string().trim().max(100).optional(),
  time_of_day: z.string().trim().max(100).optional(),
  light_condition: z.string().trim().max(100).optional(),
  environment_type: z.string().trim().max(100).optional(),
  mood: z.string().trim().max(100).optional(),
  status: z.enum(['draft', 'unreviewed', 'reviewed', 'ready', 'archived']),
  tags: z.array(z.string().trim().min(1).max(60)).max(20),
})

const IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif']
const VIDEO_TYPES = ['video/mp4', 'video/quicktime']
export const AUDIO_TYPES = ['audio/webm', 'audio/mp4', 'audio/ogg', 'audio/mpeg', 'audio/wav']
export const limits = { image: 25 * 1024 * 1024, video: 500 * 1024 * 1024, audio: 25 * 1024 * 1024 }

export function classifyFile(file: File): 'image' | 'video' | 'audio' | null {
  if (IMAGE_TYPES.includes(file.type)) return 'image'
  if (VIDEO_TYPES.includes(file.type)) return 'video'
  if (AUDIO_TYPES.includes(file.type)) return 'audio'
  return null
}

export function validateFiles(files: File[]): string[] {
  const errors: string[] = []
  const visual = files.filter((f) => classifyFile(f) !== 'audio')
  const images = visual.filter((f) => classifyFile(f) === 'image')
  const videos = visual.filter((f) => classifyFile(f) === 'video')
  if (images.length > 10) errors.push('Choose no more than 10 images.')
  if (videos.length > 1 || (videos.length && images.length)) errors.push('Choose several images or one video, not both.')
  files.forEach((file) => {
    const kind = classifyFile(file)
    if (!kind) errors.push(`${file.name} is not a supported file type.`)
    else if (file.size > limits[kind]) errors.push(`${file.name} is larger than the ${limits[kind] / 1024 / 1024} MB limit.`)
  })
  return errors
}

export function normalizeTag(value: string) {
  return value.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
}

export function filterNoticings<T extends { title: string | null; observation_text: string | null; tags?: { name: string }[] }>(items: T[], query: string) {
  const needle = query.trim().toLowerCase()
  if (!needle) return items
  return items.filter((item) => [item.title, item.observation_text, ...(item.tags?.map((tag) => tag.name) ?? [])].some((value) => value?.toLowerCase().includes(needle)))
}
