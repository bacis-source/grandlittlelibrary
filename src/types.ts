export type NoticingStatus = 'draft' | 'unreviewed' | 'reviewed' | 'ready' | 'archived'
export type PublishedStatus = 'never_published' | 'scheduled' | 'published' | 'retired'
export type AssetType = 'image' | 'video' | 'audio'

export interface NoticingAsset {
  id: string
  noticing_id: string
  user_id: string
  asset_type: AssetType
  storage_bucket: string
  storage_path: string
  original_filename: string
  mime_type: string
  file_size_bytes: number | null
  width: number | null
  height: number | null
  duration_seconds: number | null
  sort_order: number
  is_primary: boolean
  created_at: string
  signed_url?: string
}

export interface Tag { id: string; name: string; normalized_name: string }
export interface PublicationRecord { id: string; platform: string; published_at: string | null; caption: string | null }
export interface Noticing {
  id: string
  user_id: string
  title: string | null
  observation_text: string | null
  original_observation_text: string | null
  location_name: string | null
  latitude: number | null
  longitude: number | null
  captured_at: string | null
  season: string | null
  weather: string | null
  time_of_day: string | null
  light_condition: string | null
  environment_type: string | null
  mood: string | null
  status: NoticingStatus
  is_favorite: boolean
  ready_for_editorial: boolean
  rights_confirmed: boolean
  rights_note: string | null
  published_status: PublishedStatus
  created_at: string
  updated_at: string
  noticing_assets?: NoticingAsset[]
  tags?: Tag[]
  publication_records?: PublicationRecord[]
}

export interface NoticingInput {
  title?: string
  observation_text: string
  location_name?: string
  captured_at?: string
  weather?: string
  time_of_day?: string
  light_condition?: string
  environment_type?: string
  mood?: string
  status: NoticingStatus
  tags: string[]
}
