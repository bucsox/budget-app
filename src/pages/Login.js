import { useState } from 'react'
import { supabase } from '../supabaseClient'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isSignUp, setIsSignUp] = useState(false)
  const [isForgot, setIsForgot] = useState(false)
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')

  async function handleSubmit() {
    setLoading(true)
    setMessage('')

    if (isForgot) {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`
      })
      if (error) setMessage(error.message)
      else setMessage('✅ Check your email for a password reset link!')
      setLoading(false)
      return
    }

    const { error } = isSignUp
      ? await supabase.auth.signUp({ email, password })
      : await supabase.auth.signInWithPassword({ email, password })

    if (error) setMessage(error.message)
    else if (isSignUp) setMessage('✅ Check your email to confirm your account!')
    setLoading(false)
  }

  const inputStyle = { padding: '10px 12px', border: '1px solid var(--border)', borderRadius: 8, fontSize: 14, width: '100%', background: 'var(--bg2)', color: 'var(--text)' }

  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', background: 'var(--bg)' }}>
      <div style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 16, padding: '2.5rem', width: 360, maxWidth: '90vw' }}>
        <div style={{ fontSize: 24, fontWeight: 600, marginBottom: 4, color: 'var(--text)' }}>💰 BudgetApp</div>
        <div style={{ fontSize: 14, color: 'var(--text3)', marginBottom: 24 }}>
          {isForgot ? 'Reset your password' : isSignUp ? 'Create your account' : 'Sign in to your account'}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            style={inputStyle}
          />

          {!isForgot && (
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              style={inputStyle}
            />
          )}

          {message && (
            <div style={{ fontSize: 13, color: message.startsWith('✅') ? 'var(--green)' : 'var(--red)', padding: '8px 12px', background: message.startsWith('✅') ? '#EAF3DE' : '#FCEBEB', borderRadius: 8 }}>
              {message}
            </div>
          )}

          <button
            onClick={handleSubmit}
            disabled={loading}
            style={{ padding: '10px', background: 'var(--blue)', color: '#fff', border: 'none', borderRadius: 8, fontSize: 14, cursor: 'pointer', fontWeight: 500 }}>
            {loading ? 'Please wait...' : isForgot ? 'Send reset link' : isSignUp ? 'Create account' : 'Sign in'}
          </button>

          {!isForgot && (
            <button
              onClick={() => { setIsSignUp(!isSignUp); setMessage('') }}
              style={{ padding: '10px', background: 'transparent', border: '1px solid var(--border)', borderRadius: 8, fontSize: 13, cursor: 'pointer', color: 'var(--text2)' }}>
              {isSignUp ? 'Already have an account? Sign in' : "Don't have an account? Sign up"}
            </button>
          )}

          <button
            onClick={() => { setIsForgot(!isForgot); setMessage('') }}
            style={{ background: 'none', border: 'none', fontSize: 13, color: 'var(--blue)', cursor: 'pointer', textAlign: 'center', padding: '4px' }}>
            {isForgot ? '← Back to sign in' : 'Forgot your password?'}
          </button>
        </div>
      </div>
    </div>
  )
}