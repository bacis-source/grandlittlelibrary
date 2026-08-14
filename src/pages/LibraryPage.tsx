import { ArrowRight, CheckCircle2, Clock3, Search, SlidersHorizontal, Sparkles, Trash2 } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { NoticingCard } from '../components/NoticingCard'
import { listNoticings } from '../lib/noticings'
import { matchesReviewFilter, reviewOverview, type ReviewFilter } from '../lib/review-overview'
import { filterNoticings } from '../lib/validation'
import type { Noticing, NoticingStatus } from '../types'

export function LibraryPage() {
  const [params] = useSearchParams()
  const [items, setItems] = useState<Noticing[]>([])
  const [query, setQuery] = useState('')
  const [status, setStatus] = useState<'all' | NoticingStatus>(() => (params.get('status') as NoticingStatus | null) ?? 'all')
  const [reviewFilter, setReviewFilter] = useState<ReviewFilter>('all')
  const [sort, setSort] = useState('newest')

  useEffect(() => { listNoticings().then(setItems) }, [])
  const overview = useMemo(() => reviewOverview(items), [items])
  const reviewQueue = [...overview.waiting].sort((a, b) => a.created_at.localeCompare(b.created_at))
  const shown = useMemo(() => {
    let next = filterNoticings(items, query).filter((item) => matchesReviewFilter(item, reviewFilter))
    if (status !== 'all') next = next.filter((item) => item.status === status)
    if (params.get('filter') === 'favorite') next = next.filter((item) => item.is_favorite)
    return [...next].sort((a, b) => sort === 'oldest' ? a.created_at.localeCompare(b.created_at) : b.created_at.localeCompare(a.created_at))
  }, [items, query, status, sort, params, reviewFilter])

  function chooseReviewFilter(filter: ReviewFilter) {
    setReviewFilter(filter)
    setStatus('all')
  }

  return <div className="page">
    <div className="page-title library-title"><div><p className="kicker">Every small wonder</p><h1>{params.get('filter') === 'favorite' ? 'Favorites' : 'The library'}</h1><p>{items.length} moments kept safe.</p></div><div className="library-actions">{reviewQueue.length > 0 && <Link className="primary compact" to={`/noticings/${reviewQueue[0].id}/edit?review=1`}>Review next <span>{reviewQueue.length}</span><ArrowRight size={16}/></Link>}<Link className="secondary compact" to="/trash"><Trash2 size={16}/> Bin</Link></div></div>
    <section className="review-overview" aria-label="Review progress">
      <header><div><p className="kicker">Your review desk</p><h2>{overview.waiting.length ? `${overview.waiting.length} moments still waiting` : 'Everything is reviewed'}</h2></div><strong>{overview.percent}%</strong></header>
      <div className="review-overview-track" role="progressbar" aria-label="Review progress" aria-valuemin={0} aria-valuemax={100} aria-valuenow={overview.percent}><span style={{ width: `${overview.percent}%` }}/></div>
      <div className="review-filters">
        <button className={reviewFilter === 'all' ? 'active' : ''} onClick={() => chooseReviewFilter('all')}><span>All active</span><strong>{overview.total}</strong></button>
        <button className={reviewFilter === 'waiting' ? 'active' : ''} onClick={() => chooseReviewFilter('waiting')}><Clock3/><span>To review</span><strong>{overview.waiting.length}</strong></button>
        <button className={reviewFilter === 'reviewed' ? 'active' : ''} onClick={() => chooseReviewFilter('reviewed')}><CheckCircle2/><span>Reviewed</span><strong>{overview.reviewed.length}</strong></button>
        <button className={reviewFilter === 'editorial' ? 'active' : ''} onClick={() => chooseReviewFilter('editorial')}><Sparkles/><span>Editorial ready</span><strong>{overview.editorial.length}</strong></button>
      </div>
    </section>
    <section className="toolbar"><label className="search"><Search size={19}/><input aria-label="Search noticings" placeholder="Search observations, titles and tags…" value={query} onChange={(event) => setQuery(event.target.value)}/></label><label><SlidersHorizontal size={17}/><select aria-label="Filter status" value={status} onChange={(event) => { setStatus(event.target.value as typeof status); setReviewFilter('all') }}><option value="all">All statuses</option><option value="draft">Draft</option><option value="unreviewed">Unreviewed</option><option value="reviewed">Reviewed</option><option value="ready">Ready</option><option value="archived">Archived</option></select></label><select aria-label="Sort" value={sort} onChange={(event) => setSort(event.target.value)}><option value="newest">Newest first</option><option value="oldest">Oldest first</option></select></section>
    {shown.length ? <div className="grid">{shown.map((item) => <NoticingCard key={item.id} item={item}/>)}</div> : <div className="empty"><h2>No moments found.</h2><p>Try changing your search or filters.</p></div>}
  </div>
}
