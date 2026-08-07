import { Heart, Sparkles } from 'lucide-react'
import { Link } from 'react-router-dom'
import type { Noticing } from '../types'

export function NoticingCard({ item }: { item: Noticing }) {
  const primary = item.noticing_assets?.find((asset) => asset.is_primary) ?? item.noticing_assets?.find((asset) => asset.asset_type !== 'audio')
  return <Link to={`/noticings/${item.id}`} className="card">
    <div className="card-media">{primary?.signed_url ? primary.asset_type === 'video' ? <video src={primary.signed_url} muted/> : <img src={primary.signed_url} alt=""/> : <div className="media-placeholder">No preview</div>}
      <button className={`floating-heart ${item.is_favorite ? 'active' : ''}`} aria-label={item.is_favorite ? 'Favorite' : 'Not favorite'}><Heart fill={item.is_favorite ? 'currentColor' : 'none'}/></button>
    </div>
    <div className="card-body"><div className="eyebrow"><span>{item.captured_at ? new Date(item.captured_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : 'Date unknown'}</span><span className={`status status-${item.status}`}>{item.status}</span></div><p>{item.observation_text || item.title || 'A quiet moment'}</p><div className="tag-row">{item.tags?.slice(0, 3).map((tag) => <span key={tag.id}>#{tag.name}</span>)}{item.ready_for_editorial && <span className="ready"><Sparkles size={13}/> Editorial</span>}{item.published_status !== 'never_published' && <span>Published</span>}</div></div>
  </Link>
}
