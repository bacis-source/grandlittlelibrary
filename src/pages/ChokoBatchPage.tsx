import { ArrowLeft, Check, Eye, LoaderCircle, Pause, Play, RotateCcw } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { analyzeNoticing } from '../lib/choko-ai'
import { listChokoBatchCandidates } from '../lib/noticings'

interface FailedItem { id: string; message: string }

export function ChokoBatchPage() {
  const [queue, setQueue] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [running, setRunning] = useState(false)
  const [completed, setCompleted] = useState(0)
  const [failed, setFailed] = useState<FailedItem[]>([])
  const [current, setCurrent] = useState(0)
  const [loadError, setLoadError] = useState('')
  const pauseRequested = useRef(false)
  const total = completed + queue.length

  async function load() {
    setLoading(true); setLoadError('')
    try { setQueue(await listChokoBatchCandidates()) }
    catch (cause) { setLoadError(cause instanceof Error ? cause.message : 'The inbox could not be opened.') }
    finally { setLoading(false) }
  }

  useEffect(() => { load() }, [])

  async function start() {
    if (running || !queue.length) return
    pauseRequested.current = false
    setRunning(true); setFailed([])
    const finished = new Set<string>()
    for (const [index, id] of queue.entries()) {
      if (pauseRequested.current) break
      setCurrent(index + 1)
      try {
        await analyzeNoticing(id)
        finished.add(id)
        setCompleted((value) => value + 1)
      } catch (cause) {
        setFailed((items) => [...items, { id, message: cause instanceof Error ? cause.message : 'Analysis failed.' }])
      }
    }
    setQueue((items) => items.filter((id) => !finished.has(id)))
    setCurrent(0); setRunning(false)
  }

  function pause() { pauseRequested.current = true }

  const percent = total ? Math.round((completed / total) * 100) : 100
  return <div className="page batch-page">
    <Link className="back" to="/"><ArrowLeft size={17}/> Home</Link>
    <div className="page-title"><p className="kicker">Choko Vision</p><h1>Analyze the inbox</h1><p>Choko looks beyond description for visual wonder, a grounded reflection, or a reliable nature fact. Nothing is accepted or published automatically.</p></div>
    {loading ? <div className="batch-loading"><LoaderCircle className="spin"/> Counting photographs…</div> : loadError ? <div className="empty"><p className="error">{loadError}</p><button className="secondary compact" onClick={load}><RotateCcw size={16}/> Try again</button></div> : !queue.length ? <div className="batch-complete"><Check/><h2>The inbox is analyzed.</h2><p>{completed ? `${completed} photographs were analyzed in this session.` : 'There are no unreviewed photographs waiting for Choko.'}</p><Link className="primary compact" to="/library">Open Review next</Link></div> : <>
      <section className="batch-status"><div className="batch-orbit"><Eye/></div><div><p className="kicker">{running ? 'Choko is noticing' : completed ? 'Ready to continue' : 'Ready when you are'}</p><strong>{running ? `Photo ${current} of ${queue.length}` : `${queue.length} photographs waiting`}</strong><p>{completed} completed in this session · {failed.length} need another try</p></div><span>{percent}%</span><div className="batch-track"><i style={{ width: `${percent}%` }}/></div></section>
      <section className="batch-explainer"><article><span>1</span><div><h2>Saved one by one</h2><p>Every successful analysis is stored immediately.</p></div></article><article><span>2</span><div><h2>Safe to pause</h2><p>Pause after the current photo and continue later.</p></div></article><article><span>3</span><div><h2>You stay editor</h2><p>Review, edit or reject every suggestion afterward.</p></div></article></section>
      {failed.length > 0 && <details className="batch-errors"><summary>{failed.length} photograph{failed.length === 1 ? '' : 's'} need another try</summary>{failed.map((item) => <p key={item.id}>{item.message}</p>)}</details>}
      <div className="batch-actions">{running ? <button className="secondary" onClick={pause}><Pause size={18}/> Pause after this photo</button> : <button className="primary" onClick={start}><Play size={18}/> {completed ? 'Continue analysis' : `Analyze ${queue.length} photographs`}</button>}</div>
      <p className="batch-note">Analysis uses your OpenAI API credits. Keep this page open while Choko works. You can safely pause and return later; photographs already analyzed with Choko's current voice will not be analyzed again.</p>
    </>}
  </div>
}
