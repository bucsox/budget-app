import { useState, useEffect } from 'react'
import { supabase } from '../supabaseClient'

const CATEGORIES = ['Housing','Food','Transport','Health','Entertainment','Utilities','Other']

export default function Budgets() {
  const [budgets, setBudgets] = useState([])
  const [transactions, setTransactions] = useState([])
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ category: 'Housing', monthly_limit: '' })

  useEffect(() => { fetchData() }, [])

  async function fetchData() {
    const { data: b } = await supabase.from('budgets').select('*')
    const { data: t } = await supabase.from('transactions').select('*')
    setBudgets(b || [])
    setTransactions(t || [])
  }

  async function handleAdd() {
    if (!form.monthly_limit) return
    const { data: { user } } = await supabase.auth.getUser()
    await supabase.from('budgets').insert({ ...form, monthly_limit: parseFloat(form.monthly_limit), user_id: user.id })
    setShowForm(false)
    setForm({ category: 'Housing', monthly_limit: '' })
    fetchData()
  }

  async function handleDelete(id) {
    await supabase.from('budgets').delete().eq('id', id)
    fetchData()
  }

  const thisMonth = new Date().toISOString().slice(0, 7)
  const fmt = (n) => '$' + n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })
  const inputStyle = { padding: '8px 10px', border: '1px solid var(--border)', borderRadius: 8, fontSize: 13, width: '100%', background: 'var(--bg2)', color: 'var(--text)' }
  const cardStyle = { background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 12, padding: '1.25rem' }

  const totalBudgeted = budgets.reduce((s, b) => s + b.monthly_limit, 0)
  const totalSpent = budgets.reduce((s, b) => {
    const spent = transactions.filter(t => t.category === b.category && t.type === 'expense' && t.date.startsWith(thisMonth)).reduce((sum, t) => sum + t.amount, 0)
    return s + spent
  }, 0)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1 style={{ fontSize: 22, fontWeight: 500 }}>Budgets</h1>
        <button onClick={() => setShowForm(!showForm)} style={{ padding: '8px 16px', background: 'var(--blue)', color: '#fff', border: 'none', borderRadius: 8, fontSize: 13, cursor: 'pointer', fontWeight: 500 }}>
          + Add budget
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 12 }}>
        {[
          { label: 'Total budgeted', value: fmt(totalBudgeted), color: 'var(--text)' },
          { label: 'Total spent', value: fmt(totalSpent), color: 'var(--red)' },
          { label: 'Remaining', value: fmt(totalBudgeted - totalSpent), color: totalBudgeted - totalSpent >= 0 ? 'var(--green)' : 'var(--red)' },
        ].map(c => (
          <div key={c.label} style={{ background: 'var(--bg3)', borderRadius: 10, padding: '1rem' }}>
            <div style={{ fontSize: 12, color: 'var(--text3)', marginBottom: 6 }}>{c.label}</div>
            <div style={{ fontSize: 20, fontWeight: 500, color: c.color }}>{c.value}</div>
          </div>
        ))}
      </div>

      {showForm && (
        <div style={{ ...cardStyle, border: '1px solid var(--blue)' }}>
          <div style={{ fontSize: 14, fontWeight: 500, marginBottom: 12, color: 'var(--text)' }}>New budget</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 10 }}>
            <div>
              <label style={{ fontSize: 12, color: 'var(--text3)', display: 'block', marginBottom: 4 }}>Category</label>
              <select value={form.category} onChange={e => setForm({ ...form, category: e.target.value })} style={inputStyle}>
                {CATEGORIES.map(c => <option key={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label style={{ fontSize: 12, color: 'var(--text3)', display: 'block', marginBottom: 4 }}>Monthly limit ($)</label>
              <input type="number" value={form.monthly_limit} onChange={e => setForm({ ...form, monthly_limit: e.target.value })} style={inputStyle} placeholder="0.00" />
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 12 }}>
            <button onClick={() => setShowForm(false)} style={{ padding: '7px 14px', border: '1px solid var(--border)', borderRadius: 8, background: 'transparent', fontSize: 13, cursor: 'pointer', color: 'var(--text)' }}>Cancel</button>
            <button onClick={handleAdd} style={{ padding: '7px 14px', background: 'var(--blue)', color: '#fff', border: 'none', borderRadius: 8, fontSize: 13, cursor: 'pointer', fontWeight: 500 }}>Save</button>
          </div>
        </div>
      )}

      <div style={cardStyle}>
        <div style={{ fontSize: 14, fontWeight: 500, marginBottom: '1rem', color: 'var(--text)' }}>Budget progress — {new Date().toLocaleString('default', { month: 'long' })}</div>
        {budgets.length === 0
          ? <div style={{ fontSize: 13, color: 'var(--text4)' }}>No budgets yet — add one above!</div>
          : budgets.map(b => {
            const spent = transactions.filter(t => t.category === b.category && t.type === 'expense' && t.date.startsWith(thisMonth)).reduce((s, t) => s + t.amount, 0)
            const pct = Math.min(100, Math.round(spent / b.monthly_limit * 100))
            const color = pct >= 90 ? 'var(--red)' : pct >= 70 ? '#EF9F27' : 'var(--green)'
            const remaining = b.monthly_limit - spent
            return (
              <div key={b.id} style={{ marginBottom: '1.25rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 13, marginBottom: 6 }}>
                  <span style={{ fontWeight: 500, color: 'var(--text)' }}>{b.category}</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <span style={{ color: 'var(--text3)' }}>{fmt(spent)} <span style={{ color: 'var(--text4)' }}>/ {fmt(b.monthly_limit)}</span></span>
                    <button onClick={() => handleDelete(b.id)} style={{ background: '#FCEBEB', border: 'none', borderRadius: 6, padding: '3px 8px', fontSize: 12, cursor: 'pointer', color: '#A32D2D' }}>Remove</button>
                  </div>
                </div>
                <div style={{ background: 'var(--bg3)', borderRadius: 4, height: 8 }}>
                  <div style={{ width: pct + '%', height: 8, borderRadius: 4, background: color, transition: 'width 0.3s' }} />
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'var(--text4)', marginTop: 4 }}>
                  <span>{pct}% used</span>
                  <span style={{ color: remaining >= 0 ? 'var(--green)' : 'var(--red)', fontWeight: 500 }}>
                    {remaining >= 0 ? `${fmt(remaining)} left` : `${fmt(Math.abs(remaining))} over budget!`}
                  </span>
                </div>
              </div>
            )
          })
        }
      </div>
    </div>
  )
}