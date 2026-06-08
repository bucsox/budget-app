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
  const inputStyle = { padding: '8px 10px', border: '1px solid #e5e5e5', borderRadius: 8, fontSize: 13, width: '100%' }

  const totalBudgeted = budgets.reduce((s, b) => s + b.monthly_limit, 0)
  const totalSpent = budgets.reduce((s, b) => {
    const spent = transactions.filter(t => t.category === b.category && t.type === 'expense' && t.date.startsWith(thisMonth)).reduce((sum, t) => sum + t.amount, 0)
    return s + spent
  }, 0)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1 style={{ fontSize: 22, fontWeight: 500 }}>Budgets</h1>
        <button onClick={() => setShowForm(!showForm)} style={{ padding: '8px 16px', background: '#2457a0', color: '#fff', border: 'none', borderRadius: 8, fontSize: 13, cursor: 'pointer', fontWeight: 500 }}>
          + Add budget
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 12 }}>
        {[
          { label: 'Total budgeted', value: fmt(totalBudgeted), color: '#1a1a1a' },
          { label: 'Total spent', value: fmt(totalSpent), color: '#E24B4A' },
          { label: 'Remaining', value: fmt(totalBudgeted - totalSpent), color: '#1D9E75' },
        ].map(c => (
          <div key={c.label} style={{ background: '#f0f0ee', borderRadius: 10, padding: '1rem' }}>
            <div style={{ fontSize: 12, color: '#888', marginBottom: 6 }}>{c.label}</div>
            <div style={{ fontSize: 22, fontWeight: 500, color: c.color }}>{c.value}</div>
          </div>
        ))}
      </div>

      {showForm && (
        <div style={{ background: '#fff', border: '1px solid #e5e5e5', borderRadius: 12, padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div style={{ fontSize: 14, fontWeight: 500 }}>New budget</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <div><label style={{ fontSize: 12, color: '#888' }}>Category</label>
              <select value={form.category} onChange={e => setForm({...form, category: e.target.value})} style={inputStyle}>
                {CATEGORIES.map(c => <option key={c}>{c}</option>)}
              </select>
            </div>
            <div><label style={{ fontSize: 12, color: '#888' }}>Monthly limit ($)</label>
              <input type="number" value={form.monthly_limit} onChange={e => setForm({...form, monthly_limit: e.target.value})} style={inputStyle} placeholder="0.00" />
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
            <button onClick={() => setShowForm(false)} style={{ padding: '7px 14px', border: '1px solid #e5e5e5', borderRadius: 8, background: 'transparent', fontSize: 13, cursor: 'pointer' }}>Cancel</button>
            <button onClick={handleAdd} style={{ padding: '7px 14px', background: '#2457a0', color: '#fff', border: 'none', borderRadius: 8, fontSize: 13, cursor: 'pointer', fontWeight: 500 }}>Save</button>
          </div>
        </div>
      )}

      <div style={{ background: '#fff', border: '1px solid #e5e5e5', borderRadius: 12, padding: '1.25rem' }}>
        <div style={{ fontSize: 14, fontWeight: 500, marginBottom: '1rem' }}>Budget progress</div>
        {budgets.length === 0 ? <div style={{ fontSize: 13, color: '#aaa' }}>No budgets yet</div> :
        budgets.map(b => {
          const spent = transactions.filter(t => t.category === b.category && t.type === 'expense' && t.date.startsWith(thisMonth)).reduce((s, t) => s + t.amount, 0)
          const pct = Math.min(100, Math.round(spent / b.monthly_limit * 100))
          const color = pct >= 90 ? '#E24B4A' : pct >= 70 ? '#EF9F27' : '#1D9E75'
          return (
            <div key={b.id} style={{ marginBottom: '1rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 4 }}>
                <span style={{ fontWeight: 500 }}>{b.category}</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <span style={{ color: '#888' }}>{fmt(spent)} / {fmt(b.monthly_limit)}</span>
                  <button onClick={() => handleDelete(b.id)} style={{ background: 'none', border: 'none', color: '#ccc', cursor: 'pointer', fontSize: 16 }}>×</button>
                </div>
              </div>
              <div style={{ background: '#f0f0ee', borderRadius: 4, height: 8 }}>
                <div style={{ width: pct + '%', height: 8, borderRadius: 4, background: color, transition: 'width 0.3s' }} />
              </div>
              <div style={{ fontSize: 11, color: '#aaa', marginTop: 3 }}>{pct}% used · {fmt(b.monthly_limit - spent)} remaining</div>
            </div>
          )
        })}
      </div>
    </div>
  )
}