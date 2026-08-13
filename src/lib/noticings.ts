import type { User } from '@supabase/supabase-js'
import { supabase } from './supabase'
import { classifyFile, normalizeTag } from './validation'
import type { Noticing, NoticingInput } from '../types'
import { CHOKO_PROMPT_VERSION } from '../ai/prompt-versions'

const BUCKET = 'noticing-assets'
const baseSelect = '*, noticing_assets(*), noticing_tags(tags(id,name,normalized_name)), noticing_notes(*), publication_records(id,platform,published_at,caption)'
const detailSelect = `${baseSelect}, ai_generations(*), editorial_revisions(*)`

function shape(row: Record<string, unknown>): Noticing {
  const relations = (row.noticing_tags as { tags: Noticing['tags'] extends (infer T)[] | undefined ? T : never }[] | undefined) ?? []
  return { ...row, tags: relations.map((r) => r.tags).filter(Boolean) } as unknown as Noticing
}

async function addSignedUrls(item: Noticing) {
  const assets = await Promise.all((item.noticing_assets ?? []).map(async (asset) => {
    const { data } = await supabase.storage.from(asset.storage_bucket).createSignedUrl(asset.storage_path, 3600)
    return { ...asset, signed_url: data?.signedUrl }
  }))
  return { ...item, noticing_assets: assets.sort((a, b) => a.sort_order - b.sort_order) }
}

export async function listNoticings() {
  const { data, error } = await supabase.from('noticings').select(baseSelect).is('deleted_at', null).order('created_at', { ascending: false })
  if (error) throw error
  return Promise.all((data ?? []).map((row) => addSignedUrls(shape(row))))
}

export async function listReviewQueue() {
  const { data, error } = await supabase.from('noticings').select('id').is('deleted_at', null).in('status', ['draft', 'unreviewed']).order('created_at', { ascending: true })
  if (error) throw error
  return (data ?? []).map((item) => item.id as string)
}

export async function listChokoBatchCandidates() {
  const { data, error } = await supabase.from('noticings').select('id,created_at,ai_generations(id,prompt_version),noticing_assets(id,asset_type)').is('deleted_at', null).in('status', ['draft', 'unreviewed']).order('created_at', { ascending: true })
  if (error) throw error
  return withoutExistingAnalysis(data ?? [])
}

export function withoutExistingAnalysis(items: Array<{ id: string; ai_generations?: Array<{ id: string; prompt_version?: string }> | null; noticing_assets?: Array<{ id: string; asset_type: string }> | null }>) {
  return items.filter((item) => !item.ai_generations?.some((generation) => generation.prompt_version === CHOKO_PROMPT_VERSION) && item.noticing_assets?.some((asset) => asset.asset_type === 'image')).map((item) => item.id)
}

export function getNextReviewId(queue: string[], currentId: string) {
  if (queue.length < 2) return undefined
  const currentIndex = queue.indexOf(currentId)
  return queue[(currentIndex < 0 ? 0 : currentIndex + 1) % queue.length]
}

export async function getNoticing(id: string) {
  const { data, error } = await supabase.from('noticings').select(detailSelect).eq('id', id).is('deleted_at', null).single()
  if (error) throw error
  return addSignedUrls(shape(data))
}

async function saveTags(noticingId: string, user: User, names: string[]) {
  await supabase.from('noticing_tags').delete().eq('noticing_id', noticingId)
  for (const rawName of [...new Set(names.map(normalizeTag).filter(Boolean))]) {
    const { data: tag, error } = await supabase.from('tags').upsert({ user_id: user.id, name: rawName, normalized_name: rawName }, { onConflict: 'user_id,normalized_name' }).select('id').single()
    if (error) throw error
    const { error: linkError } = await supabase.from('noticing_tags').insert({ noticing_id: noticingId, tag_id: tag.id, user_id: user.id })
    if (linkError) throw linkError
  }
}

export interface UploadProgress { index: number; total: number; filename: string }

function databaseValues(input: Omit<NoticingInput, 'tags'>) {
  return { ...input, captured_at: input.captured_at || null }
}

export async function createNoticing(input: NoticingInput, files: File[], user: User, onProgress?: (progress: UploadProgress) => void) {
  const { tags, ...values } = input
  const { data, error } = await supabase.from('noticings').insert({ ...databaseValues(values), user_id: user.id, original_observation_text: input.observation_text }).select().single()
  if (error) throw error
  try {
    await saveTags(data.id, user, tags)
    for (const [index, file] of files.entries()) {
      onProgress?.({ index, total: files.length, filename: file.name })
      const kind = classifyFile(file)
      if (!kind) continue
      const assetId = crypto.randomUUID()
      const safe = file.name.replace(/[^a-zA-Z0-9._-]/g, '_')
      const folder = kind === 'audio' ? 'audio' : 'originals'
      const path = `${user.id}/noticings/${data.id}/${folder}/${assetId}-${safe}`
      const { error: uploadError } = await supabase.storage.from(BUCKET).upload(path, file, { contentType: file.type, upsert: false })
      if (uploadError) throw uploadError
      const { error: assetError } = await supabase.from('noticing_assets').insert({ id: assetId, noticing_id: data.id, user_id: user.id, asset_type: kind, storage_bucket: BUCKET, storage_path: path, original_filename: file.name, mime_type: file.type, file_size_bytes: file.size, sort_order: index, is_primary: index === 0 && kind !== 'audio' })
      if (assetError) throw assetError
    }
    return data.id as string
  } catch (cause) {
    await supabase.from('noticings').update({ status: 'draft' }).eq('id', data.id)
    throw cause
  }
}

export async function updateNoticing(id: string, input: NoticingInput, user: User) {
  const { tags, ...values } = input
  const { error } = await supabase.from('noticings').update(databaseValues(values)).eq('id', id)
  if (error) throw error
  await saveTags(id, user, tags)
}

export async function patchNoticing(id: string, values: Partial<Pick<Noticing, 'is_favorite' | 'ready_for_editorial' | 'status'>>) {
  const { error } = await supabase.from('noticings').update(values).eq('id', id)
  if (error) throw error
}

export async function deleteNoticing(id: string) {
  const { error } = await supabase.from('noticings').update({ deleted_at: new Date().toISOString() }).eq('id', id)
  if (error) throw error
}

export async function listDeletedNoticings() {
  const { data, error } = await supabase.from('noticings').select(baseSelect).not('deleted_at', 'is', null).order('deleted_at', { ascending: false })
  if (error) throw error
  return Promise.all((data ?? []).map((row) => addSignedUrls(shape(row))))
}

export async function restoreNoticing(id: string) {
  const { error } = await supabase.from('noticings').update({ deleted_at: null }).eq('id', id)
  if (error) throw error
}

export async function permanentlyDeleteNoticing(id: string) {
  const { data: assets, error: assetsError } = await supabase.from('noticing_assets').select('storage_bucket,storage_path').eq('noticing_id', id)
  if (assetsError) throw assetsError
  const byBucket = new Map<string, string[]>()
  for (const asset of assets ?? []) byBucket.set(asset.storage_bucket, [...(byBucket.get(asset.storage_bucket) ?? []), asset.storage_path])
  for (const [bucket, paths] of byBucket) {
    if (!paths.length) continue
    const { error } = await supabase.storage.from(bucket).remove(paths)
    if (error) throw error
  }
  const { error } = await supabase.from('noticings').delete().eq('id', id)
  if (error) throw error
}

export async function addNoticingNote(noticingId: string, user: User, content: string) {
  const { data, error } = await supabase.from('noticing_notes').insert({ noticing_id: noticingId, user_id: user.id, note_type: 'editorial_note', content }).select().single()
  if (error) throw error
  return data
}

export async function deleteNoticingNote(noteId: string) {
  const { error } = await supabase.from('noticing_notes').delete().eq('id', noteId)
  if (error) throw error
}

export type BulkImportState = 'queued' | 'uploading' | 'done' | 'error'
export interface BulkImportProgress { index: number; state: BulkImportState; noticingId?: string; error?: string }

export async function bulkImportImages(files: File[], user: User, onProgress: (progress: BulkImportProgress) => void) {
  const imported: string[] = []
  for (const [index, file] of files.entries()) {
    onProgress({ index, state: 'uploading' })
    let noticingId: string | undefined
    try {
      const { data: noticing, error: noticingError } = await supabase.from('noticings').insert({
        user_id: user.id,
        title: null,
        observation_text: null,
        original_observation_text: null,
        status: 'draft',
      }).select('id').single()
      if (noticingError) throw noticingError
      noticingId = noticing.id as string

      const assetId = crypto.randomUUID()
      const safe = file.name.replace(/[^a-zA-Z0-9._-]/g, '_')
      const path = `${user.id}/noticings/${noticingId}/originals/${assetId}-${safe}`
      const { error: uploadError } = await supabase.storage.from(BUCKET).upload(path, file, { contentType: file.type, upsert: false })
      if (uploadError) throw uploadError
      const { error: assetError } = await supabase.from('noticing_assets').insert({
        id: assetId,
        noticing_id: noticingId,
        user_id: user.id,
        asset_type: 'image',
        storage_bucket: BUCKET,
        storage_path: path,
        original_filename: file.name,
        mime_type: file.type,
        file_size_bytes: file.size,
        sort_order: 0,
        is_primary: true,
      })
      if (assetError) {
        await supabase.storage.from(BUCKET).remove([path])
        throw assetError
      }
      imported.push(noticingId)
      onProgress({ index, state: 'done', noticingId })
    } catch (cause) {
      if (noticingId) await supabase.from('noticings').update({ deleted_at: new Date().toISOString() }).eq('id', noticingId)
      onProgress({ index, state: 'error', noticingId, error: cause instanceof Error ? cause.message : 'Upload failed' })
    }
  }
  return imported
}
