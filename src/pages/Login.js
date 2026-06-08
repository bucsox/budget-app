import { useState } from 'react'
import { supabase } from '../supabaseClient'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isSignUp, setIsSignUp] = useState(false)
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')

  async function handleSubmit() {
    setLoading(true)
    setMessage('')
    const { error } = isSignUp
      ? await supabase.auth.signUp({ email, password })
      : await supabase.auth.signInWithPassword({ email, password })
    if (error) setMessage(error.message)
    else if (isSignUp) setMessage('Check your email to confirm your account!')
    setLoading(false)
  }

  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', background: '#f5f5f3' }}>
      <div style={{ background: '#fff', border: '1px solid #e5e5e5', borderRadius: 16, padding: '2.5rem', width: 360 }}>
        <div style={{ fontSize: 24, fontWeight: 600, marginBottom: 8 }}>💰 BudgetApp</div>
        <div style={{ fontSize: 14, color: '#888', marginBottom: 2 }}>{isSignUp ? 'Create your account' : 'Sign in to your account'}</div>
        <div style={{ marginTop: 24, display: 'flex', flexDirection: 'column', gap: 12 }}>
          <input type="email" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)}
            style={{ padding: '10px 12px', border: '1px solid #e5e5e5', borderRadius: 8, fontSize: 14 }} />
          <input type="password" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)}
            style={{ padding: '10px 12px', border: '1px solid #e5e5e5', borderRadius: 8, fontSize: 14 }} />
          {message && <div style={{ fontSize: 13, color: message.includes('Check') ? 'green' : 'red' }}>{message}</div>}
          <button onClick={handleSubmit} disabled={loading}
            style={{ padding: '10px', background: '#2457a0', color: '#fff', border: 'none', borderRadius: 8, fontSize: 14, cursor: 'pointer', fontWeight: 500 }}>
            {loading ? 'Please wait...' : isSignUp ? 'Create account' : 'Sign in'}
          </button>
          <button onClick={() => setIsSignUp(!isSignUp)}
            style={{ padding: '10px', background: 'transparent', border: '1px solid #e5e5e5', borderRadius: 8, fontSize: 13, cursor: 'pointer', color: '#555' }}>
            {isSignUp ? 'Already have an account? Sign in' : "Don't have an account? Sign up"}
          </button>
        </div>
      </div>
    </div>
  )
}