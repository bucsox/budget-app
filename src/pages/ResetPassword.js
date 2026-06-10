import { useState, useEffect } from 'react'
import { supabase } from '../supabaseClient'
import { useNavigate } from 'react-router-dom'

export default function ResetPassword() {
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)
  const [ready, setReady] = useState(false)
  const navigate = useNavigate()

  useEffect(() => {
    // Handle the token from the URL hash
    const hashParams = new URLSearchParams(window.location.hash.substring(1))
    const accessToken = hashParams.get('access_token')
    const refreshToken = hashParams.get('refresh_token')
    const type = hashParams.get('type')

    if (type === 'recovery' && accessToken) {
      supabase.auth.setSession({ access_token: accessToken, refresh_token: refreshToken })
        .then(({ error }) => {
          if (error) setMessage('Invalid or expired reset link. Please request a new one.')
          else setReady(true)
        })
    } else {
      // Also listen for auth state change as fallback
      const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
        if (event === 'PASSWORD_RECOVERY') setReady(true)
      })
      return () => subscription.unsubscribe()
    }
  }, [])

  async function handleReset() {
    if (!password || !confirm) return setMessage('Please fill in both fields.')
    if (password !== confirm) return setMessage('Passwords do not match.')
    if (password.length < 6) return setMessage('Password must be at least 6 characters.')
    setLoading(true)
    const { error } = await supabase.auth.updateUser({ password })
    if (error) setMessage(error.message)
    else {
      setMessage('✅ Password updated! Redirecting...')
      setTimeout(() => navigate('/'), 2000)
    }
    setLoading(false)
  }

  const inputStyle = {
    padding: '10px 12px',
    border: '1px solid var(--border)',
    borderRadius: 8,
    fontSize: 14,
    width: '100%',
    background: 'var(--bg2)',
    color: 'var(--text)'
  }

  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', background: 'var(--bg)' }}>
      <div style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 16, padding: '2.5rem', width: 360, maxWidth: '90vw' }}>
        <div style={{ fontSize: 24, fontWeight: 600, marginBottom: 4, color: 'var(--text)' }}>💰 BudgetApp</div>
        <div style={{ fontSize: 14, color: 'var(--text3)', marginBottom: 24 }}>Set a new password</div>

        {!ready && !message && (
          <div style={{ fontSize: 13, color: 'var(--text3)' }}>Verifying your reset link...</div>
        )}

        {message && !ready && (
          <div style={{ fontSize: 13, color: 'var(--red)', padding: '8px 12px', background: '#FCEBEB', borderRadius: 8 }}>
            {message}
          </div>
        )}

        {ready && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <input
              type="password"
              placeholder="New password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              style={inputStyle}
            />
            <input
              type="password"
              placeholder="Confirm new password"
              value={confirm}
              onChange={e => setConfirm(e.target.value)}
              style={inputStyle}
            />
            {message && (
              <div style={{ fontSize: 13, color: message.startsWith('✅') ? 'var(--green)' : 'var(--red)', padding: '8px 12px', background: message.startsWith('✅') ? '#EAF3DE' : '#FCEBEB', borderRadius: 8 }}>
                {message}
              </div>
            )}
            <button
              onClick={handleReset}
              disabled={loading}
              style={{ padding: '10px', background: 'var(--blue)', color: '#fff', border: 'none', borderRadius: 8, fontSize: 14, cursor: 'pointer', fontWeight: 500 }}>
              {loading ? 'Updating...' : 'Set new password'}
            </button>
            <button
              onClick={() => navigate('/login')}
              style={{ padding: '10px', background: 'transparent', border: '1px solid var(--border)', borderRadius: 8, fontSize: 13, cursor: 'pointer', color: 'var(--text2)' }}>
              Back to sign in
            </button>
          </div>
        )}
      </div>
    </div>
  )
}