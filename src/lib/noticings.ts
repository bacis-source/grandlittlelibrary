import type { User } from '@supabase/supabase-js'
import { supabase } from './supabase'
import { classifyFile, normalizeTag } from './validation'
import type { Noticing, NoticingInput } from '../types'

const BUCKET = 'noticing-assets'
const select = '*, noticing_assets(*), noticing_tags(tags(id,name,normalized_name)), publication_records(id,platform,published_at,caption)'

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
  const { data, error } = await supabase.from('noticings').select(select).is('deleted_at', null).order('created_at', { ascending: false })
  if (error) throw error
  return Promise.all((data ?? []).map((row) => addSignedUrls(shape(row))))
}

export async function getNoticing(id: string) {
  const { data, error } = await supabase.from('noticings').select(select).eq('id', id).is('deleted_at', null).single()
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

export async function createNoticing(input: NoticingInput, files: File[], user: User) {
  const { tags, ...values } = input
  const { data, error } = await supabase.from('noticings').insert({ ...values, user_id: user.id, original_observation_text: input.observation_text }).select().single()
  if (error) throw error
  try {
    await saveTags(data.id, user, tags)
    for (const [index, file] of files.entries()) {
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
  const { error } = await supabase.from('noticings').update(values).eq('id', id)
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
