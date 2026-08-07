import { ArrowLeft, RotateCcw, Trash2 } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { listDeletedNoticings, permanentlyDeleteNoticing, restoreNoticing } from '../lib/noticings'
import type { Noticing } from '../types'

export function TrashPage() {
  const [items, setItems] = useState<Noticing[]>([])
  const [busy, setBusy] = useState<string>()
  const [error, setError] = useState('')
  useEffect(() => { listDeletedNoticings().then(setItems).catch((cause: Error) => setError(cause.message)) }, [])
  async function restore(item: Noticing) { setBusy(item.id); await restoreNoticing(item.id); setItems((current) => current.filter((entry) => entry.id !== item.id)); setBusy(undefined) }
  async function purge(item: Noticing) { if (!window.confirm('Permanently delete this noticing and every original file? This cannot be undone.')) return; setBusy(item.id); await permanentlyDeleteNoticing(item.id); setItems((current) => current.filter((entry) => entry.id !== item.id)); setBusy(undefined) }
  return <div className="page trash-page"><Link className="back" to="/library"><ArrowLeft size={17}/> Library</Link><div className="page-title"><p className="kicker">Recover or remove</p><h1>Bin</h1><p>Deleted noticings stay private here until you restore or permanently remove them.</p></div>{error && <p className="error">{error}</p>}{items.length ? <div className="trash-list">{items.map((item) => { const asset = item.noticing_assets?.find((entry) => entry.is_primary) ?? item.noticing_assets?.[0]; return <article key={item.id}>{asset?.signed_url ? <img src={asset.signed_url} alt=""/> : <div className="media-placeholder">No preview</div>}<div><h2>{item.title || 'Untitled noticing'}</h2><p>{item.observation_text || 'Draft without an observation'}</p><small>Deleted {item.deleted_at ? new Date(item.deleted_at).toLocaleDateString('en-GB') : ''}</small></div><div><button className="secondary compact" disabled={busy === item.id} onClick={() => restore(item)}><RotateCcw size={16}/> Restore</button><button className="secondary compact danger" disabled={busy === item.id} onClick={() => purge(item)}><Trash2 size={16}/> Delete forever</button></div></article>})}</div> : <div className="empty"><h2>The bin is empty.</h2><p>Deleted moments will appear here for recovery.</p></div>}</div>
}
