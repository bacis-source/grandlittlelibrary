import { ArrowLeft, Edit3, Heart, MapPin, MessageSquare, Sparkles, Trash2 } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useAuth } from '../AuthContext'
import { addNoticingNote, deleteNoticing, deleteNoticingNote, getNoticing, patchNoticing } from '../lib/noticings'
import type { Noticing } from '../types'
import { ChokoVisionPanel } from '../components/ChokoVisionPanel'

export function DetailPage() {
  const { id = '' } = useParams()
  const navigate = useNavigate()
  const { session } = useAuth()
  const [item, setItem] = useState<Noticing>()
  const [error, setError] = useState('')
  const [noteContent, setNoteContent] = useState('')
  const [savingNote, setSavingNote] = useState(false)
  useEffect(() => { getNoticing(id).then(setItem).catch((cause: Error) => setError(cause.message)) }, [id])
  if (error) return <div className="page"><p className="error">{error}</p></div>
  if (!item) return <div className="page loading">Opening this moment…</div>
  const visuals = item.noticing_assets?.filter((asset) => asset.asset_type !== 'audio') ?? []
  const audio = item.noticing_assets?.filter((asset) => asset.asset_type === 'audio') ?? []
  async function toggle(values: Partial<Pick<Noticing, 'is_favorite' | 'ready_for_editorial'>>) { await patchNoticing(id, values); setItem({ ...item!, ...values }) }
  async function remove() { if (window.confirm('Move this noticing to the bin? Originals will be kept for recovery.')) { await deleteNoticing(id); navigate('/library') } }
  async function saveNote() { if (!session?.user || !noteContent.trim()) return; setSavingNote(true); const note = await addNoticingNote(id, session.user, noteContent.trim()); setItem({ ...item!, noticing_notes: [...(item!.noticing_notes ?? []), note] }); setNoteContent(''); setSavingNote(false) }
  async function removeNote(noteId: string) { await deleteNoticingNote(noteId); setItem({ ...item!, noticing_notes: item!.noticing_notes?.filter((note) => note.id !== noteId) }) }

  return <div className="detail-page">
    <div className="detail-nav"><Link className="back" to="/library"><ArrowLeft size={17}/> Library</Link><div><Link className="secondary compact" to={`/noticings/${id}/edit`}><Edit3 size={16}/> Edit</Link><button className="icon-button danger" onClick={remove} aria-label="Delete noticing"><Trash2/></button></div></div>
    <section className="asset-viewer">{visuals.map((asset) => <div key={asset.id} className="asset">{asset.signed_url ? asset.asset_type === 'video' ? <video src={asset.signed_url} controls/> : <img src={asset.signed_url} alt={item.title ?? 'Original noticing'}/> : <p>Preview unavailable. The original is preserved.</p>}</div>)}</section>
    <div className="detail-content"><article><div className="eyebrow"><span className={`status status-${item.status}`}>{item.status}</span><span>{item.published_status.replace('_', ' ')}</span></div><h1>{item.title || 'Untitled noticing'}</h1><blockquote>{item.observation_text || 'No observation yet.'}</blockquote>{item.original_observation_text && item.original_observation_text !== item.observation_text && <div className="original-note"><strong>Original observation</strong><p>{item.original_observation_text}</p></div>}<div className="tag-row">{item.tags?.map((tag) => <span key={tag.id}>#{tag.name}</span>)}</div>{audio.map((asset) => asset.signed_url && <audio key={asset.id} src={asset.signed_url} controls/>)}<div className="action-row"><button className={`secondary ${item.is_favorite ? 'selected' : ''}`} onClick={() => toggle({ is_favorite: !item.is_favorite })}><Heart fill={item.is_favorite ? 'currentColor' : 'none'}/> Favorite</button><button className={`secondary ${item.ready_for_editorial ? 'selected' : ''}`} onClick={() => toggle({ ready_for_editorial: !item.ready_for_editorial })}><Sparkles/> Editorial ready</button></div>
      {session?.user && <ChokoVisionPanel noticingId={id} userId={session.user.id} initialGenerations={item.ai_generations} initialRevisions={item.editorial_revisions}/>}<section className="notes-section"><div><MessageSquare/><h2>Editorial notes</h2></div>{item.noticing_notes?.map((note) => <article key={note.id}><p>{note.content}</p><span>{new Date(note.created_at).toLocaleDateString('en-GB')}</span><button onClick={() => removeNote(note.id)} aria-label="Delete note"><Trash2/></button></article>)}<label>Add a private note<textarea rows={3} value={noteContent} onChange={(event) => setNoteContent(event.target.value)} placeholder="An idea for later editorial work…"/></label><button className="secondary compact" disabled={savingNote || !noteContent.trim()} onClick={saveNote}>{savingNote ? 'Saving…' : 'Add note'}</button></section>
    </article><aside className="metadata"><h2>About this moment</h2><dl>{item.captured_at && <><dt>Date</dt><dd>{new Date(item.captured_at).toLocaleString('en-GB')}</dd></>}{item.location_name && <><dt>Place</dt><dd><MapPin size={14}/>{item.location_name}</dd></>}{[['Time of day', item.time_of_day], ['Light', item.light_condition], ['Weather', item.weather], ['Environment', item.environment_type], ['Mood', item.mood]].map(([label, value]) => value && <div key={label}><dt>{label}</dt><dd>{value}</dd></div>)}</dl><hr/><h2>Rights</h2><p>{item.rights_confirmed ? 'Original photograph by account owner' : item.rights_note || 'Rights need review'}</p><hr/><h2>Publication history</h2>{item.publication_records?.length ? item.publication_records.map((record) => <p key={record.id}>{record.platform} · {record.published_at ? new Date(record.published_at).toLocaleDateString() : 'Not dated'}</p>) : <p>Never published.</p>}</aside></div>
  </div>
}
