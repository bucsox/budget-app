import { useState, useEffect } from 'react'
import { supabase } from '../supabaseClient'

export default function Recurring() {
  const [recurring, setRecurring] = useState([])
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ name: '', amount: '', frequency: 'Monthly', due_date: '' })

  useEffect(() => { fetchRecurring() }, [])

  async function fetchRecurring() {
    const { data } = await supabase.from('recurring').select('*').order('created_at')
    setRecurring(data || [])
  }

  async function handleAdd() {
    if (!form.name || !form.amount) return
    const { data: { user } } = await supabase.auth.getUser()
    await supabase.from('recurring').insert({ ...form, amount: parseFloat(form.amount), user_id: user.id })
    setShowForm(false)
    setForm({ name: '', amount: '', frequency: 'Monthly', due_date: '' })
    fetchRecurring()
  }

  async function handleDelete(id) {
    await supabase.from('recurring').delete().eq('id', id)
    fetchRecurring()
  }

  const fmt = (n) => '$' + n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })
  const inputStyle = { padding: '8px 10px', border: '1px solid #e5e5e5', borderRadius: 8, fontSize: 13, width: '100%' }

  const monthlyTotal = recurring.reduce((s, r) => {
    if (r.frequency === 'Monthly') return s + r.amount
    if (r.frequency === 'Weekly') return s + r.amount * 4
    if (r.frequency === 'Annual') return s + r.amount / 12
    return s
  }, 0)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1 style={{ fontSize: 22, fontWeight: 500 }}>Recurring bills</h1>
        <button onClick={() => setShowForm(!showForm)} style={{ padding: '8px 16px', background: '#2457a0', color: '#fff', border: 'none', borderRadius: 8, fontSize: 13, cursor: 'pointer', fontWeight: 500 }}>
          + Add
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 12 }}>
        {[
          { label: 'Monthly total', value: fmt(monthlyTotal), color: '#E24B4A' },
          { label: 'Annual total', value: fmt(monthlyTotal * 12), color: '#E24B4A' },
          { label: 'Active bills', value: recurring.length, color: '#1a1a1a' },
        ].map(c => (
          <div key={c.label} style={{ background: '#f0f0ee', borderRadius: 10, padding: '1rem' }}>
            <div style={{ fontSize: 12, color: '#888', marginBottom: 6 }}>{c.label}</div>
            <div style={{ fontSize: 22, fontWeight: 500, color: c.color }}>{c.value}</div>
          </div>
        ))}
      </div>

      {showForm && (
        <div style={{ background: '#fff', border: '1px solid #e5e5e5', borderRadius: 12, padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div style={{ fontSize: 14, fontWeight: 500 }}>New recurring bill</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <div><label style={{ fontSize: 12, color: '#888' }}>Name</label>
              <input type="text" value={form.name} onChange={e => setForm({...form, name: e.target.value})} style={inputStyle} placeholder="e.g. Netflix" />
            </div>
            <div><label style={{ fontSize: 12, color: '#888' }}>Amount ($)</label>
              <input type="number" value={form.amount} onChange={e => setForm({...form, amount: e.target.value})} style={inputStyle} placeholder="0.00" />
            </div>
            <div><label style={{ fontSize: 12, color: '#888' }}>Frequency</label>
              <select value={form.frequency} onChange={e => setForm({...form, frequency: e.target.value})} style={inputStyle}>
                <option>Monthly</option>
                <option>Weekly</option>
                <option>Annual</option>
              </select>
            </div>
            <div><label style={{ fontSize: 12, color: '#888' }}>Next due date</label>
              <input type="date" value={form.due_date} onChange={e => setForm({...form, due_date: e.target.value})} style={inputStyle} />
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
            <button onClick={() => setShowForm(false)} style={{ padding: '7px 14px', border: '1px solid #e5e5e5', borderRadius: 8, background: 'transparent', fontSize: 13, cursor: 'pointer' }}>Cancel</button>
            <button onClick={handleAdd} style={{ padding: '7px 14px', background: '#2457a0', color: '#fff', border: 'none', borderRadius: 8, fontSize: 13, cursor: 'pointer', fontWeight: 500 }}>Save</button>
          </div>
        </div>
      )}

      <div style={{ background: '#fff', border: '1px solid #e5e5e5', borderRadius: 12, padding: '1.25rem' }}>
        <div style={{ fontSize: 14, fontWeight: 500, marginBottom: '1rem' }}>Subscriptions & bills</div>
        {recurring.length === 0 ? <div style={{ fontSize: 13, color: '#aaa' }}>No recurring bills yet</div> :
        recurring.map(r => {
          const annual = r.frequency === 'Annual' ? r.amount : r.frequency === 'Weekly' ? r.amount * 52 : r.amount * 12
          return (
            <div key={r.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: '1px solid #f0f0ee', fontSize: 13 }}>
              <div>
                <div style={{ fontWeight: 500 }}>{r.name}</div>
                <div style={{ fontSize: 11, color: '#aaa' }}>{r.frequency} · {r.due_date ? 'Due ' + r.due_date : 'No due date'}</div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontWeight: 500, color: '#E24B4A' }}>-{fmt(r.amount)}/mo</div>
                  <div style={{ fontSize: 11, color: '#aaa' }}>{fmt(annual)}/yr</div>
                </div>
                <button onClick={() => handleDelete(r.id)} style={{ background: 'none', border: 'none', color: '#ccc', cursor: 'pointer', fontSize: 16 }}>×</button>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}