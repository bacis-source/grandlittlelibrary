import { ArrowRight, Search, SlidersHorizontal, Trash2 } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { NoticingCard } from '../components/NoticingCard'
import { listNoticings } from '../lib/noticings'
import { filterNoticings } from '../lib/validation'
import type { Noticing, NoticingStatus } from '../types'

export function LibraryPage() {
  const [params] = useSearchParams(); const [items, setItems] = useState<Noticing[]>([]); const [query, setQuery] = useState(''); const [status, setStatus] = useState<'all' | NoticingStatus>(() => (params.get('status') as NoticingStatus | null) ?? 'all'); const [sort, setSort] = useState('newest')
  useEffect(() => { listNoticings().then(setItems) }, [])
  const shown = useMemo(() => { let next = filterNoticings(items, query); if (status !== 'all') next = next.filter((x) => x.status === status); if (params.get('filter') === 'favorite') next = next.filter((x) => x.is_favorite); return [...next].sort((a, b) => sort === 'oldest' ? a.created_at.localeCompare(b.created_at) : b.created_at.localeCompare(a.created_at)) }, [items, query, status, sort, params])
  const reviewQueue = items.filter((item) => item.status === 'draft' || item.status === 'unreviewed').sort((a, b) => a.created_at.localeCompare(b.created_at))
  return <div className="page"><div className="page-title library-title"><div><p className="kicker">Every small wonder</p><h1>{params.get('filter') === 'favorite' ? 'Favorites' : 'The library'}</h1><p>{items.length} moments kept safe.</p></div><div className="library-actions">{reviewQueue.length > 0 && <Link className="primary compact" to={`/noticings/${reviewQueue[0].id}/edit?review=1`}>Review next <span>{reviewQueue.length}</span><ArrowRight size={16}/></Link>}<Link className="secondary compact" to="/trash"><Trash2 size={16}/> Bin</Link></div></div><section className="toolbar"><label className="search"><Search size={19}/><input aria-label="Search noticings" placeholder="Search observations, titles and tags…" value={query} onChange={(e) => setQuery(e.target.value)}/></label><label><SlidersHorizontal size={17}/><select aria-label="Filter status" value={status} onChange={(e) => setStatus(e.target.value as typeof status)}><option value="all">All statuses</option><option value="draft">Draft</option><option value="unreviewed">Unreviewed</option><option value="reviewed">Reviewed</option><option value="ready">Ready</option><option value="archived">Archived</option></select></label><select aria-label="Sort" value={sort} onChange={(e) => setSort(e.target.value)}><option value="newest">Newest first</option><option value="oldest">Oldest first</option></select></section>{shown.length ? <div className="grid">{shown.map((item) => <NoticingCard key={item.id} item={item}/>)}</div> : <div className="empty"><h2>No moments found.</h2><p>Try changing your search or filters.</p></div>}</div>
}
