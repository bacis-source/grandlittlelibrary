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
export interface NoticingNote { id: string; noticing_id: string; user_id: string; note_type: string; content: string; created_at: string; updated_at: string }
export type AIGenerationType = 'choko_noticing' | 'caption'
export type EditorialDecision = 'accepted' | 'edited' | 'rejected'
export type FeedbackCategory = 'too_poetic' | 'too_generic' | 'too_long' | 'too_short' | 'too_explanatory' | 'too_motivational' | 'invented_detail' | 'missed_main_detail' | 'wrong_tone' | 'too_cute' | 'too_serious' | 'better_wording' | 'other'
export interface AIGeneration { id: string; generation_group_id: string; noticing_id: string; user_id: string; generation_type: AIGenerationType; model_provider: string; model_name: string; prompt_version: string; input_snapshot: Record<string, unknown>; generated_text: string; structured_output: ChokoAIResult; confidence: number; uncertainties: string[]; created_at: string }
export interface EditorialRevision { id: string; noticing_id: string; user_id: string; ai_generation_id: string | null; revision_type: AIGenerationType; decision: EditorialDecision; original_ai_text: string | null; final_human_text: string; feedback_reason: string | null; feedback_categories: FeedbackCategory[]; created_at: string }
export interface ChokoAIResult { suggested_title?: string; suggested_tags?: string[]; literal_observation: string; overlooked_detail: string; choko_noticing: string; caption: string; confidence: number; uncertainties: string[] }
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
  noticing_notes?: NoticingNote[]
  ai_generations?: AIGeneration[]
  editorial_revisions?: EditorialRevision[]
  deleted_at?: string | null
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
