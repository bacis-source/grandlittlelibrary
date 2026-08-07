import { ArrowRight, Heart, Image, Sparkles } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { NoticingCard } from '../components/NoticingCard'
import { listNoticings } from '../lib/noticings'
import type { Noticing } from '../types'

export function DashboardPage() {
  const [items, setItems] = useState<Noticing[]>([]); const [error, setError] = useState('')
  useEffect(() => { listNoticings().then(setItems).catch((e: Error) => setError(e.message)) }, [])
  return <div className="page"><div className="hero-row"><div><p className="kicker">Your field notes</p><h1>Good morning.</h1><p>What small wonder found you today?</p></div><Link className="primary compact" to="/new">New noticing <ArrowRight size={18}/></Link></div>{error && <p className="error">{error}</p>}<section className="stats"><article><Image/><strong>{items.length}</strong><span>Noticings</span></article><article><Heart/><strong>{items.filter((x) => x.is_favorite).length}</strong><span>Favorites</span></article><article><Sparkles/><strong>{items.filter((x) => x.ready_for_editorial).length}</strong><span>Editorial ready</span></article><article><span className="never">○</span><strong>{items.filter((x) => x.published_status === 'never_published').length}</strong><span>Never published</span></article></section><div className="section-heading"><div><p className="kicker">Recent moments</p><h2>Latest noticings</h2></div><Link to="/library">View the library <ArrowRight size={16}/></Link></div>{items.length ? <div className="grid">{items.slice(0, 6).map((item) => <NoticingCard key={item.id} item={item}/>)}</div> : <div className="empty"><span>✦</span><h2>Your first noticing is waiting.</h2><p>Add an image or video and the thought that made you stop.</p><Link className="primary compact" to="/new">Create a noticing</Link></div>}</div>
}
