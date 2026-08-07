import { ArrowLeft, Check, ImagePlus, LoaderCircle, RotateCcw, X } from 'lucide-react'
import { useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../AuthContext'
import { bulkImportImages, type BulkImportState } from '../lib/noticings'
import { validateBulkImages } from '../lib/validation'

interface ImportItem { file: File; url: string; state: BulkImportState; error?: string }

export function BulkImportPage() {
  const { session } = useAuth()
  const navigate = useNavigate()
  const [items, setItems] = useState<ImportItem[]>([])
  const [selectionError, setSelectionError] = useState('')
  const [importing, setImporting] = useState(false)
  const done = items.filter((item) => item.state === 'done').length
  const failed = items.filter((item) => item.state === 'error').length

  const totalSize = useMemo(() => items.reduce((sum, item) => sum + item.file.size, 0), [items])

  function choose(files: File[]) {
    items.forEach((item) => URL.revokeObjectURL(item.url))
    const errors = validateBulkImages(files)
    setSelectionError(errors.join(' '))
    if (!errors.length) setItems(files.map((file) => ({ file, url: URL.createObjectURL(file), state: 'queued' })))
  }

  function remove(index: number) {
    setItems((current) => {
      URL.revokeObjectURL(current[index].url)
      return current.filter((_, itemIndex) => itemIndex !== index)
    })
  }

  async function startImport() {
    if (!session?.user || !items.length) return
    setImporting(true)
    const files = items.map((item) => item.file)
    const imported = await bulkImportImages(files, session.user, ({ index, state, error }) => {
      setItems((current) => current.map((item, itemIndex) => itemIndex === index ? { ...item, state, error } : item))
    })
    setImporting(false)
    if (imported.length === files.length) navigate('/library?status=draft')
  }

  function retryFailed() {
    const retry = items.filter((item) => item.state === 'error').map((item) => item.file)
    choose(retry)
  }

  return <div className="page import-page">
    <Link className="back" to="/"><ArrowLeft size={17}/> Home</Link>
    <div className="page-title"><p className="kicker">Bring in your archive</p><h1>Import to the inbox</h1><p>Each photo becomes its own private draft. Add the observation when you review it.</p></div>
    {!items.length ? <section className="form-section import-picker">
      <label className="dropzone"><ImagePlus/><strong>Choose photos from your phone</strong><span>Up to 50 JPEG, PNG, WebP or HEIC images · 25 MB each</span><input type="file" accept="image/jpeg,image/png,image/webp,image/heic,image/heif" multiple onChange={(event) => choose(Array.from(event.target.files ?? []))}/></label>
      {selectionError && <p className="error" role="alert">{selectionError}</p>}
      <div className="import-explainer"><span>1</span><p><strong>Choose a batch</strong><br/>Start with 25–50 photos so your phone can upload reliably.</p><span>2</span><p><strong>Keep every moment separate</strong><br/>One original photo becomes one draft Noticing.</p><span>3</span><p><strong>Review later</strong><br/>Open the draft inbox to add observations, tags and context.</p></div>
    </section> : <>
      <section className="import-summary"><div><strong>{items.length}</strong><span>photos selected</span></div><div><strong>{(totalSize / 1024 / 1024).toFixed(1)} MB</strong><span>total</span></div><div><strong>{done}/{items.length}</strong><span>imported</span></div></section>
      <section className="import-grid" aria-live="polite">{items.map((item, index) => <article className={`import-item import-${item.state}`} key={`${item.file.name}-${item.file.lastModified}`}>
        <img src={item.url} alt=""/>
        <div className="import-state">{item.state === 'queued' && <span>{index + 1}</span>}{item.state === 'uploading' && <LoaderCircle className="spin"/>}{item.state === 'done' && <Check/>}{item.state === 'error' && <span>!</span>}</div>
        {!importing && item.state === 'queued' && <button type="button" onClick={() => remove(index)} aria-label={`Remove ${item.file.name}`}><X/></button>}
        <p title={item.file.name}>{item.file.name}</p>{item.error && <small>{item.error}</small>}
      </article>)}</section>
      <div className="import-actions">{failed > 0 && !importing && <button className="secondary" onClick={retryFailed}><RotateCcw size={17}/> Retry {failed} failed</button>}<button className="primary" disabled={importing || done === items.length} onClick={startImport}>{importing ? `Importing ${done + 1} of ${items.length}…` : `Import ${items.length} photos`}</button></div>
    </>}
  </div>
}
