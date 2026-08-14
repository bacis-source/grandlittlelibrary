import { zodResolver } from '@hookform/resolvers/zod'
import { ArrowLeft, ArrowRight, Check, ImagePlus, SkipForward, X } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { useForm } from 'react-hook-form'
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { VoiceRecorder } from '../components/VoiceRecorder'
import { useAuth } from '../AuthContext'
import { createNoticing, getNextReviewId, getNoticing, listReviewQueue, updateNoticing } from '../lib/noticings'
import { latestGeneration, latestRevision, saveEditorialRevision } from '../lib/choko-ai'
import { inferTimeOfDay, noticingSchema, validateFiles } from '../lib/validation'
import type { AIGeneration, EditorialRevision, NoticingAsset, NoticingInput } from '../types'

const DRAFT_KEY = 'choko-noticing-form-draft'
const defaults: NoticingInput = { observation_text: '', status: 'unreviewed', tags: [] }

export function NoticingFormPage() {
  const { id } = useParams()
  const [searchParams] = useSearchParams()
  const editing = Boolean(id)
  const reviewing = editing && searchParams.get('review') === '1'
  const navigate = useNavigate()
  const { session } = useAuth()
  const [files, setFiles] = useState<File[]>([])
  const [primaryIndex, setPrimaryIndex] = useState(0)
  const [fileError, setFileError] = useState('')
  const [submitError, setSubmitError] = useState('')
  const [tagText, setTagText] = useState('')
  const [saving, setSaving] = useState(false)
  const [uploadLabel, setUploadLabel] = useState('')
  const [existingMedia, setExistingMedia] = useState<Pick<NoticingAsset, 'signed_url' | 'asset_type'>>()
  const [reviewQueue, setReviewQueue] = useState<string[]>([])
  const [noticingGeneration, setNoticingGeneration] = useState<AIGeneration>()
  const [captionGeneration, setCaptionGeneration] = useState<AIGeneration>()
  const [noticingRevision, setNoticingRevision] = useState<EditorialRevision>()
  const [captionRevision, setCaptionRevision] = useState<EditorialRevision>()
  const [captionText, setCaptionText] = useState('')
  const { register, handleSubmit, reset, setValue, watch, formState: { errors } } = useForm<NoticingInput>({ resolver: zodResolver(noticingSchema), defaultValues: defaults })
  const capturedAt = watch('captured_at')
  const automaticTimeOfDay = inferTimeOfDay(capturedAt)

  useEffect(() => {
    if (id) {
      getNoticing(id).then((item) => {
        const generatedNoticing = latestGeneration(item.ai_generations ?? [], 'choko_noticing')
        const generatedCaption = latestGeneration(item.ai_generations ?? [], 'caption')
        const revisedNoticing = latestRevision(item.editorial_revisions ?? [], 'choko_noticing')
        const revisedCaption = latestRevision(item.editorial_revisions ?? [], 'caption')
        const generated = generatedNoticing?.structured_output
        const tags = item.tags?.length ? item.tags.map((tag) => tag.name) : reviewing ? generated?.suggested_tags ?? [] : []
        setNoticingGeneration(generatedNoticing); setCaptionGeneration(generatedCaption)
        setNoticingRevision(revisedNoticing); setCaptionRevision(revisedCaption)
        setCaptionText(revisedCaption?.final_human_text ?? generatedCaption?.generated_text ?? '')
        setTagText(tags.join(', '))
        reset({ title: item.title || (reviewing ? generated?.suggested_title ?? '' : ''), observation_text: item.observation_text || (reviewing ? generated?.choko_noticing ?? '' : ''), location_name: item.location_name ?? '', captured_at: item.captured_at?.slice(0, 16) ?? '', weather: item.weather ?? '', time_of_day: item.time_of_day ?? '', light_condition: item.light_condition ?? '', environment_type: item.environment_type ?? '', mood: item.mood ?? '', status: item.status, tags })
        setExistingMedia(item.noticing_assets?.find((asset) => asset.is_primary) ?? item.noticing_assets?.[0])
      })
      if (reviewing) listReviewQueue().then(setReviewQueue)
      return
    }
    const stored = sessionStorage.getItem(DRAFT_KEY)
    if (!stored) return
    try {
      const draft = JSON.parse(stored) as { values: NoticingInput; tagText: string }
      reset(draft.values)
      setTagText(draft.tagText)
    } catch { sessionStorage.removeItem(DRAFT_KEY) }
  }, [id, reset, reviewing])

  useEffect(() => {
    if (editing) return
    const subscription = watch((values) => sessionStorage.setItem(DRAFT_KEY, JSON.stringify({ values, tagText })))
    return () => subscription.unsubscribe()
  }, [editing, tagText, watch])

  const previews = useMemo(() => files.map((file) => ({ file, url: URL.createObjectURL(file) })), [files])
  const visualFiles = files.filter((file) => !file.type.startsWith('audio/'))

  function choose(next: File[]) {
    const errors = validateFiles(next)
    setFileError(errors.join(' '))
    if (!errors.length) { setFiles(next); setPrimaryIndex(0) }
  }

  function removeFile(index: number) {
    choose(files.filter((_, fileIndex) => fileIndex !== index))
    if (index === primaryIndex) setPrimaryIndex(0)
    else if (index < primaryIndex) setPrimaryIndex((current) => current - 1)
  }

  async function submit(input: NoticingInput) {
    if (!editing && !visualFiles.length) { setFileError('Add at least one image or video.'); return }
    if (!session?.user) return
    setSaving(true); setSubmitError('')
    try {
      const payload = { ...input, time_of_day: inferTimeOfDay(input.captured_at) || input.time_of_day, tags: tagText.split(',').map((tag) => tag.trim()).filter(Boolean) }
      let nextId = id
      if (id) {
        await updateNoticing(id, reviewing ? { ...payload, status: 'reviewed' } : payload, session.user)
        if (reviewing) {
          const decisions: Promise<EditorialRevision>[] = []
          if (noticingGeneration && payload.observation_text.trim() && noticingRevision?.final_human_text !== payload.observation_text.trim()) decisions.push(saveEditorialRevision({ noticingId: id, userId: session.user.id, generation: noticingGeneration, finalText: payload.observation_text, decision: payload.observation_text.trim() === noticingGeneration.generated_text ? 'accepted' : 'edited' }))
          if (captionGeneration && captionText.trim() && captionRevision?.final_human_text !== captionText.trim()) decisions.push(saveEditorialRevision({ noticingId: id, userId: session.user.id, generation: captionGeneration, finalText: captionText, decision: captionText.trim() === captionGeneration.generated_text ? 'accepted' : 'edited' }))
          await Promise.all(decisions)
        }
      }
      else {
        const primary = visualFiles[primaryIndex]
        const ordered = [primary, ...files.filter((file) => file !== primary)]
        nextId = await createNoticing(payload, ordered, session.user, ({ index, total, filename }) => setUploadLabel(`Uploading ${index + 1} of ${total}: ${filename}`))
      }
      sessionStorage.removeItem(DRAFT_KEY)
      if (reviewing && id) {
        const next = getNextReviewId(reviewQueue, id)
        navigate(next ? `/noticings/${next}/edit?review=1` : '/library?status=reviewed')
      } else navigate(`/noticings/${nextId}`)
    } catch (error) {
      const message = error instanceof Error ? error.message : typeof error === 'object' && error && 'message' in error ? String(error.message) : 'Could not save this noticing.'
      setSubmitError(message)
    }
    finally { setSaving(false); setUploadLabel('') }
  }

  function discard() { sessionStorage.removeItem(DRAFT_KEY); navigate('/library') }

  function skip() {
    if (!id) return
    const next = getNextReviewId(reviewQueue, id)
    navigate(next ? `/noticings/${next}/edit?review=1` : '/library')
  }

  const reviewPosition = id ? reviewQueue.indexOf(id) + 1 : 0

  return <div className="page form-page"><Link className="back" to={editing && id ? `/noticings/${id}` : '/library'}><ArrowLeft size={17}/> Back</Link>{reviewing && <section className="review-progress"><div><p className="kicker">Review next</p><strong>{reviewQueue.length ? `${reviewPosition} of ${reviewQueue.length}` : 'Opening queue…'}</strong></div><div className="review-progress-track"><span style={{ width: reviewQueue.length ? `${(reviewPosition / reviewQueue.length) * 100}%` : '0%' }}/></div></section>}<div className="page-title"><p className="kicker">{reviewing ? 'One moment at a time' : editing ? 'Keep the moment true' : 'A new small wonder'}</p><h1>{reviewing ? 'Review this noticing' : editing ? 'Edit noticing' : 'What made you stop?'}</h1><p>{reviewing ? 'Everything Choko prepared is gathered here. Keep, edit or skip.' : 'The observation is the heart of every noticing.'}</p></div>{reviewing && existingMedia?.signed_url && <div className="review-preview">{existingMedia.asset_type === 'video' ? <video src={existingMedia.signed_url} controls/> : <img src={existingMedia.signed_url} alt="Original photograph for this noticing"/>}</div>}<form onSubmit={handleSubmit(submit)}>
    {!editing && <section className="form-section"><div className="section-copy"><span>01</span><div><h2>Original moment</h2><p>Add up to 10 images or one video. Tap an image to make it primary.</p></div></div><label className="dropzone"><ImagePlus/><strong>Choose from your camera roll</strong><span>JPEG, PNG, WebP, HEIC, MP4 or MOV</span><input type="file" accept="image/jpeg,image/png,image/webp,image/heic,image/heif,video/mp4,video/quicktime" multiple onChange={(event) => choose(Array.from(event.target.files ?? []))}/></label>{fileError && <p className="error">{fileError}</p>}<div className="preview-row">{previews.map(({ file, url }, index) => <div className={`preview ${index === primaryIndex && !file.type.startsWith('audio/') ? 'primary-preview' : ''}`} key={url} onClick={() => !file.type.startsWith('audio/') && setPrimaryIndex(index)}>{file.type.startsWith('video/') ? <video src={url}/> : file.type.startsWith('audio/') ? null : <img src={url} alt=""/>}<button type="button" onClick={(event) => { event.stopPropagation(); removeFile(index) }} aria-label={`Remove ${file.name}`}><X/></button>{index === primaryIndex && !file.type.startsWith('audio/') && <span><Check size={11}/> Primary</span>}</div>)}</div></section>}
    <section className="form-section"><div className="section-copy"><span>{editing ? '01' : '02'}</span><div><h2>Your observation</h2><p>Keep the first thought simple and honest.</p></div></div><label className="observation">Why did you stop?<textarea rows={5} autoFocus={!editing} placeholder="The spider web looked invisible until the sun touched it…" {...register('observation_text')}/>{errors.observation_text && <small className="error">{errors.observation_text.message}</small>}</label>{!editing && <VoiceRecorder onChange={(file) => setFiles((current) => [...current.filter((item) => !item.type.startsWith('audio/')), ...(file ? [file] : [])])}/>}</section>
    {reviewing && captionGeneration && <section className="form-section review-editorial"><div className="section-copy"><span>02</span><div><h2>Editorial caption</h2><p>Choko’s suggestion is ready to keep or make your own.</p></div></div><label>Caption<textarea rows={6} value={captionText} onChange={(event) => setCaptionText(event.target.value)}/><small>{captionText.trim() === captionGeneration.generated_text ? 'Choko’s original suggestion' : 'Your edited version'}</small></label>{noticingGeneration && <div className="review-ai-context"><span>Choko confidence {Math.round(noticingGeneration.confidence * 100)}%</span>{noticingGeneration.uncertainties?.length > 0 && <span>{noticingGeneration.uncertainties.join(' · ')}</span>}</div>}</section>}
    <section className="form-section"><div className="section-copy"><span>{editing ? '02' : '03'}</span><div><h2>Context</h2><p>Optional details make moments easier to rediscover.</p></div></div><div className="form-grid"><label>Title<input {...register('title')} placeholder="Morning web"/></label><label>Captured at<input type="datetime-local" {...register('captured_at')}/>{automaticTimeOfDay && <small>Time of day: {automaticTimeOfDay} · added automatically</small>}</label><label>Place<input {...register('location_name')} placeholder="The lower meadow"/></label><label>Light<input {...register('light_condition')} placeholder="Soft backlight"/></label><label>Weather<input {...register('weather')} placeholder="Misty"/></label><label>Environment<input {...register('environment_type')} placeholder="Meadow"/></label><label>Mood<input {...register('mood')} placeholder="Quiet wonder"/></label><label className="wide">Tags<input value={tagText} onChange={(event) => { setTagText(event.target.value); setValue('tags', event.target.value.split(',').filter(Boolean)) }} placeholder="mist, spider-web, sunrise"/><small>Separate tags with commas.</small></label>{!reviewing && <label>Status<select {...register('status')}><option value="draft">Draft</option><option value="unreviewed">Unreviewed</option><option value="reviewed">Reviewed</option><option value="ready">Ready</option><option value="archived">Archived</option></select></label>}</div></section>
    {uploadLabel && <div className="upload-progress" role="status"><span className="spin">◌</span><strong>{uploadLabel}</strong><small>Keep this page open until every original is safe.</small></div>}{submitError && <p className="error">{submitError}</p>}<div className="form-actions">{reviewing ? <button type="button" className="secondary" onClick={skip}><SkipForward size={17}/> Skip for now</button> : <button type="button" className="secondary" onClick={discard}>{editing ? 'Cancel' : 'Discard draft'}</button>}<button className="primary" disabled={saving}>{saving ? 'Keeping it safe…' : reviewing ? <>Save & review next <ArrowRight size={17}/></> : editing ? 'Save changes' : 'Save noticing'}</button></div></form></div>
}
