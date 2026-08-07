import { Mic, Square, Trash2 } from 'lucide-react'
import { useRef, useState } from 'react'

export function VoiceRecorder({ onChange }: { onChange: (file: File | null) => void }) {
  const recorder = useRef<MediaRecorder | null>(null)
  const chunks = useRef<Blob[]>([])
  const [recording, setRecording] = useState(false)
  const [url, setUrl] = useState<string>()
  async function start() {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
    const candidates = ['audio/mp4', 'audio/webm;codecs=opus', 'audio/webm']
    const mimeType = candidates.find((type) => MediaRecorder.isTypeSupported(type))
    recorder.current = new MediaRecorder(stream, mimeType ? { mimeType } : undefined)
    chunks.current = []
    recorder.current.ondataavailable = (event) => chunks.current.push(event.data)
    recorder.current.onstop = () => {
      const type = recorder.current?.mimeType || 'audio/webm'
      const blob = new Blob(chunks.current, { type })
      const ext = type.includes('mp4') ? 'm4a' : 'webm'
      const file = new File([blob], `voice-note-${Date.now()}.${ext}`, { type })
      setUrl(URL.createObjectURL(blob)); onChange(file); stream.getTracks().forEach((track) => track.stop())
    }
    recorder.current.start(); setRecording(true)
  }
  function stop() { recorder.current?.stop(); setRecording(false) }
  function clear() { if (url) URL.revokeObjectURL(url); setUrl(undefined); onChange(null) }
  if (!navigator.mediaDevices || !window.MediaRecorder) return <p className="hint">Voice recording is not supported in this browser.</p>
  return <div className="recorder">{url && <audio src={url} controls/>}<div>{recording ? <button type="button" className="secondary" onClick={stop}><Square size={17}/> Stop recording</button> : <button type="button" className="secondary" onClick={start}><Mic size={17}/> {url ? 'Record again' : 'Add voice note'}</button>}{url && <button type="button" className="icon-button" onClick={clear} aria-label="Delete recording"><Trash2 size={18}/></button>}</div></div>
}
