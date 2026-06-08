import { useState, useEffect } from 'react'
import { supabase } from '../supabaseClient'

const TYPES = ['Checking','Savings','Credit Card','Investment','Cash']

export default function Accounts() {
  const [accounts, setAccounts] = useState([])
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ name: '', type: 'Checking', balance: '' })

  useEffect(() => { fetchAccounts() }, [])

  async function fetchAccounts() {
    const { data } = await supabase.from('accounts').select('*').order('created_at')
    setAccounts(data || [])
  }

  async function handleAdd() {
    if (!form.name || !form.balance) return
    const { data: { user } } = await supabase.auth.getUser()
    const rawBalance = parseFloat(form.balance)
    const balance = form.type === 'Credit Card' ? -Math.abs(rawBalance) : rawBalance
    await supabase.from('accounts').insert({ ...form, balance, user_id: user.id })
    setShowForm(false)
    setForm({ name: '', type: 'Checking', balance: '' })
    fetchAccounts()
  }

  async function handleDelete(id) {
    await supabase.from('accounts').delete().eq('id', id)
    fetchAccounts()
  }

  const fmt = (n) => '$' + n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })
  const inputStyle = { padding: '8px 10px', border: '1px solid #e5e5e5', borderRadius: 8, fontSize: 13, width: '100%' }
  const totalAssets = accounts.filter(a => a.balance > 0).reduce((s, a) => s + a.balance, 0)
  const totalLiabilities = accounts.filter(a => a.balance < 0).reduce((s, a) => s + a.balance, 0)
  const icons = { Checking: '🏦', Savings: '🐷', 'Credit Card': '💳', Investment: '📈', Cash: '💵' }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1 style={{ fontSize: 22, fontWeight: 500 }}>Accounts</h1>
        <button onClick={() => setShowForm(!showForm)} style={{ padding: '8px 16px', background: '#2457a0', color: '#fff', border: 'none', borderRadius: 8, fontSize: 13, cursor: 'pointer', fontWeight: 500 }}>
          + Add account
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 12 }}>
        {[
          { label: 'Net worth', value: fmt(totalAssets + totalLiabilities), color: '#1a1a1a' },
          { label: 'Total assets', value: fmt(totalAssets), color: '#1D9E75' },
          { label: 'Total liabilities', value: fmt(totalLiabilities), color: '#E24B4A' },
        ].map(c => (
          <div key={c.label} style={{ background: '#f0f0ee', borderRadius: 10, padding: '1rem' }}>
            <div style={{ fontSize: 12, color: '#888', marginBottom: 6 }}>{c.label}</div>
            <div style={{ fontSize: 22, fontWeight: 500, color: c.color }}>{c.value}</div>
          </div>
        ))}
      </div>

      {showForm && (
        <div style={{ background: '#fff', border: '1px solid #e5e5e5', borderRadius: 12, padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div style={{ fontSize: 14, fontWeight: 500 }}>New account</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <div><label style={{ fontSize: 12, color: '#888' }}>Account name</label>
              <input type="text" value={form.name} onChange={e => setForm({...form, name: e.target.value})} style={inputStyle} placeholder="e.g. Chase Checking" />
            </div>
            <div><label style={{ fontSize: 12, color: '#888' }}>Type</label>
              <select value={form.type} onChange={e => setForm({...form, type: e.target.value})} style={inputStyle}>
                {TYPES.map(t => <option key={t}>{t}</option>)}
              </select>
            </div>
            <div><label style={{ fontSize: 12, color: '#888' }}>Balance ($)</label>
              <input type="number" value={form.balance} onChange={e => setForm({...form, balance: e.target.value})} style={inputStyle} placeholder="0.00" />
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
            <button onClick={() => setShowForm(false)} style={{ padding: '7px 14px', border: '1px solid #e5e5e5', borderRadius: 8, background: 'transparent', fontSize: 13, cursor: 'pointer' }}>Cancel</button>
            <button onClick={handleAdd} style={{ padding: '7px 14px', background: '#2457a0', color: '#fff', border: 'none', borderRadius: 8, fontSize: 13, cursor: 'pointer', fontWeight: 500 }}>Save</button>
          </div>
        </div>
      )}

      <div style={{ background: '#fff', border: '1px solid #e5e5e5', borderRadius: 12, padding: '1.25rem' }}>
        <div style={{ fontSize: 14, fontWeight: 500, marginBottom: '1rem' }}>All accounts</div>
        {accounts.length === 0 ? <div style={{ fontSize: 13, color: '#aaa' }}>No accounts yet</div> :
        accounts.map(a => (
          <div key={a.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: '1px solid #f0f0ee', fontSize: 13 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ width: 36, height: 36, borderRadius: 10, background: a.balance < 0 ? '#FCEBEB' : '#EAF3DE', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>
                {icons[a.type] || '💰'}
              </div>
              <div>
                <div style={{ fontWeight: 500 }}>{a.name}</div>
                <div style={{ fontSize: 11, color: '#aaa' }}>{a.type}</div>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <span style={{ fontWeight: 500, color: a.balance < 0 ? '#E24B4A' : '#1a1a1a' }}>{fmt(a.balance)}</span>
              <button onClick={() => handleDelete(a.id)} style={{ background: 'none', border: 'none', color: '#ccc', cursor: 'pointer', fontSize: 16 }}>×</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}