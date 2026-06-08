import { useState, useEffect } from 'react'
import { supabase } from '../supabaseClient'

const CATEGORIES = ['Housing','Food','Transport','Health','Entertainment','Utilities','Salary','Freelance','Other']

export default function Transactions() {
  const [transactions, setTransactions] = useState([])
  const [filter, setFilter] = useState('all')
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ type:'expense', description:'', amount:'', date: new Date().toISOString().slice(0,10), category:'Food', account:'Checking' })

  useEffect(() => { fetchTransactions() }, [])

  async function fetchTransactions() {
    const { data } = await supabase.from('transactions').select('*').order('date', { ascending: false })
    setTransactions(data || [])
  }

  async function handleAdd() {
    if (!form.description || !form.amount) return
    const { data: { user } } = await supabase.auth.getUser()
    await supabase.from('transactions').insert({ ...form, amount: parseFloat(form.amount), user_id: user.id })
    setShowForm(false)
    setForm({ type:'expense', description:'', amount:'', date: new Date().toISOString().slice(0,10), category:'Food', account:'Checking' })
    fetchTransactions()
  }

  async function handleDelete(id) {
    await supabase.from('transactions').delete().eq('id', id)
    fetchTransactions()
  }

  const fmt = (n) => '$' + n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })
  const filtered = filter === 'all' ? transactions : transactions.filter(t => t.type === filter)

  const inputStyle = { padding: '8px 10px', border: '1px solid #e5e5e5', borderRadius: 8, fontSize: 13, width: '100%' }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1 style={{ fontSize: 22, fontWeight: 500 }}>Transactions</h1>
        <button onClick={() => setShowForm(!showForm)} style={{ padding: '8px 16px', background: '#2457a0', color: '#fff', border: 'none', borderRadius: 8, fontSize: 13, cursor: 'pointer', fontWeight: 500 }}>
          + Add
        </button>
      </div>

      {showForm && (
        <div style={{ background: '#fff', border: '1px solid #e5e5e5', borderRadius: 12, padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div style={{ fontSize: 14, fontWeight: 500 }}>New transaction</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <div><label style={{ fontSize: 12, color: '#888' }}>Type</label>
              <select value={form.type} onChange={e => setForm({...form, type: e.target.value})} style={inputStyle}>
                <option value="expense">Expense</option>
                <option value="income">Income</option>
              </select>
            </div>
            <div><label style={{ fontSize: 12, color: '#888' }}>Amount ($)</label>
              <input type="number" value={form.amount} onChange={e => setForm({...form, amount: e.target.value})} style={inputStyle} placeholder="0.00" />
            </div>
            <div><label style={{ fontSize: 12, color: '#888' }}>Description</label>
              <input type="text" value={form.description} onChange={e => setForm({...form, description: e.target.value})} style={inputStyle} placeholder="e.g. Grocery run" />
            </div>
            <div><label style={{ fontSize: 12, color: '#888' }}>Date</label>
              <input type="date" value={form.date} onChange={e => setForm({...form, date: e.target.value})} style={inputStyle} />
            </div>
            <div><label style={{ fontSize: 12, color: '#888' }}>Category</label>
              <select value={form.category} onChange={e => setForm({...form, category: e.target.value})} style={inputStyle}>
                {CATEGORIES.map(c => <option key={c}>{c}</option>)}
              </select>
            </div>
            <div><label style={{ fontSize: 12, color: '#888' }}>Account</label>
              <select value={form.account} onChange={e => setForm({...form, account: e.target.value})} style={inputStyle}>
                <option>Checking</option><option>Savings</option><option>Credit Card</option>
              </select>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
            <button onClick={() => setShowForm(false)} style={{ padding: '7px 14px', border: '1px solid #e5e5e5', borderRadius: 8, background: 'transparent', fontSize: 13, cursor: 'pointer' }}>Cancel</button>
            <button onClick={handleAdd} style={{ padding: '7px 14px', background: '#2457a0', color: '#fff', border: 'none', borderRadius: 8, fontSize: 13, cursor: 'pointer', fontWeight: 500 }}>Save</button>
          </div>
        </div>
      )}

      <div style={{ background: '#fff', border: '1px solid #e5e5e5', borderRadius: 12, padding: '1.25rem' }}>
        <div style={{ display: 'flex', gap: 4, marginBottom: '1rem' }}>
          {['all','income','expense'].map(f => (
            <button key={f} onClick={() => setFilter(f)} style={{ padding: '5px 14px', fontSize: 13, border: 'none', borderRadius: 20, cursor: 'pointer', background: filter===f ? '#2457a0' : '#f0f0ee', color: filter===f ? '#fff' : '#555', fontWeight: filter===f ? 500 : 400 }}>
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>
        {filtered.length === 0 ? <div style={{ fontSize: 13, color: '#aaa' }}>No transactions yet</div> :
        filtered.map(t => (
          <div key={t.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: '1px solid #f0f0ee', fontSize: 13 }}>
            <div>
              <div style={{ fontWeight: 500 }}>{t.description}</div>
              <div style={{ fontSize: 11, color: '#aaa' }}>{t.category} · {t.account} · {t.date}</div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <span style={{ fontWeight: 500, color: t.type === 'income' ? '#1D9E75' : '#E24B4A' }}>
                {t.type === 'income' ? '+' : '-'}{fmt(t.amount)}
              </span>
              <button onClick={() => handleDelete(t.id)} style={{ background: 'none', border: 'none', color: '#ccc', cursor: 'pointer', fontSize: 16 }}>×</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}