import { Check, Eye, RefreshCw } from 'lucide-react'
import { useMemo, useState } from 'react'
import { analyzeNoticing, latestGeneration, latestRevision, saveEditorialRevision } from '../lib/choko-ai'
import type { AIGeneration, AIGenerationType, EditorialRevision, FeedbackCategory } from '../types'

const feedbackOptions: Array<{ value: FeedbackCategory; label: string }> = [
  { value: 'too_descriptive', label: 'Too descriptive' }, { value: 'too_poetic', label: 'Too poetic' }, { value: 'too_generic', label: 'Too generic' }, { value: 'too_long', label: 'Too long' }, { value: 'too_short', label: 'Too short' }, { value: 'too_explanatory', label: 'Too explanatory' }, { value: 'too_motivational', label: 'Too motivational' }, { value: 'invented_detail', label: 'Invented detail' }, { value: 'wrong_fact', label: 'Wrong fact' }, { value: 'missed_main_detail', label: 'Missed the detail' }, { value: 'wrong_tone', label: 'Wrong tone' }, { value: 'too_cute', label: 'Too cute' }, { value: 'too_serious', label: 'Too serious' }, { value: 'better_wording', label: 'Better wording' }, { value: 'other', label: 'Other' },
]

interface Props { noticingId: string; userId: string; initialGenerations?: AIGeneration[]; initialRevisions?: EditorialRevision[] }
export function ChokoVisionPanel({ noticingId, userId, initialGenerations = [], initialRevisions = [] }: Props) {
  const [generations, setGenerations] = useState(initialGenerations)
  const [revisions, setRevisions] = useState(initialRevisions)
  const [state, setState] = useState<'idle' | 'analyzing' | 'ready' | 'error'>(initialGenerations.length ? 'ready' : 'idle')
  const [error, setError] = useState('')
  const [editing, setEditing] = useState<AIGenerationType | null>(null)
  const [draft, setDraft] = useState('')
  const [reason, setReason] = useState('')
  const [categories, setCategories] = useState<FeedbackCategory[]>([])
  const [saving, setSaving] = useState(false)
  const noticing = useMemo(() => latestGeneration(generations, 'choko_noticing'), [generations])
  const caption = useMemo(() => latestGeneration(generations, 'caption'), [generations])
  const acceptedNoticing = useMemo(() => latestRevision(revisions, 'choko_noticing'), [revisions])
  const acceptedCaption = useMemo(() => latestRevision(revisions, 'caption'), [revisions])

  async function generate() { setState('analyzing'); setError(''); try { const next = await analyzeNoticing(noticingId); setGenerations((current) => [...current, ...next]); setState('ready'); setEditing(null) } catch (cause) { setError(cause instanceof Error ? cause.message : 'Choko could not notice this moment.'); setState('error') } }
  function beginEdit(generation: AIGeneration) { setEditing(generation.generation_type); setDraft(generation.generated_text); setReason(''); setCategories([]) }
  function toggleCategory(category: FeedbackCategory) { setCategories((current) => current.includes(category) ? current.filter((item) => item !== category) : [...current, category]) }
  async function save(generation: AIGeneration, finalText: string, decision: 'accepted' | 'edited') { if (!finalText.trim()) return; setSaving(true); setError(''); try { const revision = await saveEditorialRevision({ noticingId, userId, generation, finalText, decision, feedbackReason: reason, feedbackCategories: categories }); setRevisions((current) => [...current, revision]); setEditing(null); setReason(''); setCategories([]) } catch (cause) { setError(cause instanceof Error ? cause.message : 'The editorial decision could not be saved.') } finally { setSaving(false) } }

  if (!noticing || !caption) return <section className="choko-vision"><header><span><Eye/></span><div><p className="kicker">Choko Vision</p><h2>Choko noticed…</h2></div></header><p className="choko-intro">A quiet second look at the photograph and your original observation. Nothing is sent until you ask.</p>{error && <p className="error" role="alert">{error}</p>}<button className="primary" disabled={state === 'analyzing'} onClick={generate}>{state === 'analyzing' ? <><RefreshCw className="spin"/> Choko is noticing…</> : <><Eye/> Let Choko notice this</>}</button>{state === 'error' && <p className="ai-state">AI error · Your Noticing was not changed.</p>}</section>

  return <section className="choko-vision"><header><span><Eye/></span><div><p className="kicker">Choko Vision</p><h2>Choko noticed…</h2></div><button className="secondary compact" disabled={state === 'analyzing'} onClick={generate}><RefreshCw className={state === 'analyzing' ? 'spin' : ''}/> {state === 'analyzing' ? 'Noticing…' : 'Regenerate'}</button></header>{error && <p className="error" role="alert">{error}</p>}
    <Suggestion title="Choko Noticing" generation={noticing} revision={acceptedNoticing} editing={editing} draft={draft} onDraft={setDraft} onEdit={beginEdit} onAccept={() => save(noticing, noticing.generated_text, 'accepted')} onSave={() => save(noticing, draft, draft.trim() === noticing.generated_text ? 'accepted' : 'edited')} onCancel={() => setEditing(null)} saving={saving} reason={reason} setReason={setReason} categories={categories} toggleCategory={toggleCategory}/>
    <Suggestion title="Suggested caption" generation={caption} revision={acceptedCaption} editing={editing} draft={draft} onDraft={setDraft} onEdit={beginEdit} onAccept={() => save(caption, caption.generated_text, 'accepted')} onSave={() => save(caption, draft, draft.trim() === caption.generated_text ? 'accepted' : 'edited')} onCancel={() => setEditing(null)} saving={saving} reason={reason} setReason={setReason} categories={categories} toggleCategory={toggleCategory}/>
    <footer><span>{noticing.model_provider} · {noticing.model_name}</span><span>Prompt {noticing.prompt_version}</span></footer>
  </section>
}

interface SuggestionProps { title: string; generation: AIGeneration; revision?: EditorialRevision; editing: AIGenerationType | null; draft: string; onDraft(value: string): void; onEdit(generation: AIGeneration): void; onAccept(): void; onSave(): void; onCancel(): void; saving: boolean; reason: string; setReason(value: string): void; categories: FeedbackCategory[]; toggleCategory(value: FeedbackCategory): void }
function Suggestion(props: SuggestionProps) {
  const active = props.editing === props.generation.generation_type
  return <article className="ai-suggestion"><div className="ai-suggestion-heading"><p>{props.title}</p>{props.revision && <span className={`decision decision-${props.revision.decision}`}><Check/> {props.revision.decision === 'edited' ? 'Human edited' : 'Accepted'}</span>}</div><blockquote>{props.generation.generated_text}</blockquote>{props.revision && <div className="human-version"><span>Your editorial version</span><p>{props.revision.final_human_text}</p>{props.revision.feedback_reason && <small>“{props.revision.feedback_reason}”</small>}</div>}
    {!active ? <div className="ai-actions"><button className="secondary compact" onClick={() => props.onEdit(props.generation)}>Edit</button><button className="secondary compact" disabled={props.saving} onClick={props.onAccept}><Check/> Accept</button></div> : <div className="revision-editor"><label>Your version<textarea rows={props.generation.generation_type === 'caption' ? 5 : 3} value={props.draft} onChange={(event) => props.onDraft(event.target.value)}/></label><fieldset><legend>What made your version better? <span>Optional</span></legend><div className="feedback-chips">{feedbackOptions.map((option) => <button type="button" className={props.categories.includes(option.value) ? 'selected' : ''} key={option.value} onClick={() => props.toggleCategory(option.value)}>{option.label}</button>)}</div></fieldset><label>Why is your version better? <span>Optional, but useful to Choko</span><textarea rows={2} value={props.reason} onChange={(event) => props.setReason(event.target.value)} placeholder="Too poetic, missed the small detail, sounded generic, wrong tone, too long, better wording…"/></label><div className="ai-actions"><button className="secondary compact" onClick={props.onCancel}>Cancel</button><button className="primary compact" disabled={props.saving || !props.draft.trim()} onClick={props.onSave}>{props.saving ? 'Saving…' : 'Save feedback'}</button></div></div>}
  </article>
}
