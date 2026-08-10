import { useState, type FormEvent } from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '../AuthContext'
import { isConfigured, supabase } from '../lib/supabase'

export function LoginPage() {
  const { session } = useAuth(); const [email, setEmail] = useState(''); const [password, setPassword] = useState(''); const [error, setError] = useState(''); const [busy, setBusy] = useState(false)
  if (session) return <Navigate to="/" replace />
  async function submit(event: FormEvent) { event.preventDefault(); setBusy(true); setError(''); const { error } = await supabase.auth.signInWithPassword({ email, password }); if (error) setError(error.message); setBusy(false) }
  return <div className="login-page"><section className="login-panel"><div className="brand login-brand"><span className="brand-mark">C</span><span>Choko Studio<br/><small>Library</small></span></div><div><p className="kicker">Private field notes</p><h1>A quiet place for<br/>the moments that<br/>made you stop.</h1></div><form onSubmit={submit}><label>Email<input type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)}/></label><label>Password<input type="password" autoComplete="current-password" required value={password} onChange={(e) => setPassword(e.target.value)}/></label>{!isConfigured && <p className="notice">Add your Supabase environment variables to connect this library.</p>}{error && <p className="error" role="alert">{error}</p>}<button className="primary" disabled={busy || !isConfigured}>{busy ? 'Opening library…' : 'Enter the library'}</button></form><p className="login-foot">Grand Little Views — with Choko Von Snack</p></section><aside className="login-art"><div className="sun"/><p>Notice the grand<br/>in the little.</p></aside></div>
}
