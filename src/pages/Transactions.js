import { useState, useEffect, useRef } from 'react'
import { supabase } from '../supabaseClient'

const CATEGORIES = ['Housing','Food','Transport','Health','Entertainment','Utilities','Salary','Freelance','Other']

function guessCategory(description) {
  const d = description.toLowerCase()
  if (d.includes('rent') || d.includes('mortgage')) return 'Housing'
  if (d.includes('grocery') || d.includes('food') || d.includes('restaurant') || d.includes('mcdonald') || d.includes('starbucks') || d.includes('walmart') || d.includes('kroger') || d.includes('publix')) return 'Food'
  if (d.includes('gas') || d.includes('shell') || d.includes('bp') || d.includes('exxon') || d.includes('uber') || d.includes('lyft') || d.includes('parking')) return 'Transport'
  if (d.includes('netflix') || d.includes('spotify') || d.includes('hulu') || d.includes('disney') || d.includes('amazon prime')) return 'Entertainment'
  if (d.includes('electric') || d.includes('water') || d.includes('internet') || d.includes('phone') || d.includes('utility')) return 'Utilities'
  if (d.includes('doctor') || d.includes('pharmacy') || d.includes('cvs') || d.includes('walgreen') || d.includes('hospital') || d.includes('medical')) return 'Health'
  if (d.includes('salary') || d.includes('payroll') || d.includes('direct deposit') || d.includes('ach deposit')) return 'Salary'
  if (d.includes('freelance') || d.includes('invoice') || d.includes('payment received')) return 'Freelance'
  return 'Other'
}

export default function Transactions() {
  const [transactions, setTransactions] = useState([])
  const [filter, setFilter] = useState('all')
  const [showForm, setShowForm] = useState(false)
  const [importing, setImporting] = useState(false)
  const [importResult, setImportResult] = useState(null)
  const [form, setForm] = useState({ type: 'expense', description: '', amount: '', date: new Date().toISOString().slice(0, 10), category: 'Food', account: 'Checking' })
  const fileRef = useRef()

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
    setForm({ type: 'expense', description: '', amount: '', date: new Date().toISOString().slice(0, 10), category: 'Food', account: 'Checking' })
    fetchTransactions()
  }

  async function handleDelete(id) {
    await supabase.from('transactions').delete().eq('id', id)
    fetchTransactions()
  }

  async function handleCSVImport(e) {
    const file = e.target.files[0]
    if (!file) return
    setImporting(true)
    setImportResult(null)

    const text = await file.text()
    const lines = text.split('\n').filter(l => l.trim())
    const headers = lines[0].split(',').map(h => h.trim().toLowerCase().replace(/"/g, ''))

    const { data: { user } } = await supabase.auth.getUser()

    let imported = 0
    let skipped = 0
    const rows = []

    for (let i = 1; i < lines.length; i++) {
      const cols = lines[i].match(/(".*?"|[^,]+)(?=\s*,|\s*$)/g)
      if (!cols) continue
      const row = {}
      headers.forEach((h, idx) => {
        row[h] = cols[idx] ? cols[idx].replace(/"/g, '').trim() : ''
      })

      const dateKey = headers.find(h => h.includes('date'))
      const descKey = headers.find(h => h.includes('desc') || h.includes('memo') || h.includes('transaction') || h.includes('name'))
      const amtKey = headers.find(h => h.includes('amount') || h.includes('debit') || h.includes('credit'))
      const typeKey = headers.find(h => h.includes('type') || h.includes('credit') || h.includes('debit'))

      if (!dateKey || !descKey || !amtKey) { skipped++; continue }

      const rawAmount = parseFloat(row[amtKey]?.replace(/[$,]/g, '')) || 0
      if (rawAmount === 0) { skipped++; continue }

      const amount = Math.abs(rawAmount)
      const type = rawAmount < 0 ? 'expense' : 'income'
      const description = row[descKey] || 'Imported transaction'
      const date = row[dateKey] || new Date().toISOString().slice(0, 10)
      const category = guessCategory(description)

      rows.push({ user_id: user.id, type, description, amount, date, category, account: 'Checking' })
      imported++
    }

    if (rows.length > 0) {
      await supabase.from('transactions').insert(rows)
    }

    setImporting(false)
    setImportResult({ imported, skipped })
    fileRef.current.value = ''
    fetchTransactions()
  }

  const fmt = (n) => '$' + n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })
  const filtered = filter === 'all' ? transactions : transactions.filter(t => t.type === filter)
  const inputStyle = { padding: '8px 10px', border: '1px solid #e5e5e5', borderRadius: 8, fontSize: 13, width: '100%' }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
        <h1 style={{ fontSize: 22, fontWeight: 500 }}>Transactions</h1>
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={() => fileRef.current.click()} style={{ padding: '8px 14px', background: '#fff', color: '#2457a0', border: '1px solid #2457a0', borderRadius: 8, fontSize: 13, cursor: 'pointer', fontWeight: 500 }}>
            {importing ? 'Importing...' : '📥 Import CSV'}
          </button>
          <input ref={fileRef} type="file" accept=".csv" style={{ display: 'none' }} onChange={handleCSVImport} />
          <button onClick={() => setShowForm(!showForm)} style={{ padding: '8px 14px', background: '#2457a0', color: '#fff', border: 'none', borderRadius: 8, fontSize: 13, cursor: 'pointer', fontWeight: 500 }}>
            + Add
          </button>
        </div>
      </div>

      {importResult && (
        <div style={{ background: importResult.imported > 0 ? '#EAF3DE' : '#FCEBEB', border: `1px solid ${importResult.imported > 0 ? '#C0DD97' : '#F7C1C1'}`, borderRadius: 10, padding: '12px 16px', fontSize: 13 }}>
          {importResult.imported > 0
            ? `✅ Successfully imported ${importResult.imported} transactions!${importResult.skipped > 0 ? ` (${importResult.skipped} rows skipped)` : ''}`
            : `❌ No transactions could be imported. Make sure it's a valid Navy Federal CSV file.`}
        </div>
      )}

      {showForm && (
        <div style={{ background: '#fff', border: '1px solid #e5e5e5', borderRadius: 12, padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div style={{ fontSize: 14, fontWeight: 500 }}>New transaction</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 10 }}>
            <div><label style={{ fontSize: 12, color: '#888' }}>Type</label>
              <select value={form.type} onChange={e => setForm({ ...form, type: e.target.value })} style={inputStyle}>
                <option value="expense">Expense</option>
                <option value="income">Income</option>
              </select>
            </div>
            <div><label style={{ fontSize: 12, color: '#888' }}>Amount ($)</label>
              <input type="number" value={form.amount} onChange={e => setForm({ ...form, amount: e.target.value })} style={inputStyle} placeholder="0.00" />
            </div>
            <div><label style={{ fontSize: 12, color: '#888' }}>Description</label>
              <input type="text" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} style={inputStyle} placeholder="e.g. Grocery run" />
            </div>
            <div><label style={{ fontSize: 12, color: '#888' }}>Date</label>
              <input type="date" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} style={inputStyle} />
            </div>
            <div><label style={{ fontSize: 12, color: '#888' }}>Category</label>
              <select value={form.category} onChange={e => setForm({ ...form, category: e.target.value })} style={inputStyle}>
                {CATEGORIES.map(c => <option key={c}>{c}</option>)}
              </select>
            </div>
            <div><label style={{ fontSize: 12, color: '#888' }}>Account</label>
              <select value={form.account} onChange={e => setForm({ ...form, account: e.target.value })} style={inputStyle}>
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
          {['all', 'income', 'expense'].map(f => (
            <button key={f} onClick={() => setFilter(f)} style={{ padding: '5px 14px', fontSize: 13, border: 'none', borderRadius: 20, cursor: 'pointer', background: filter === f ? '#2457a0' : '#f0f0ee', color: filter === f ? '#fff' : '#555', fontWeight: filter === f ? 500 : 400 }}>
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>
        {filtered.length === 0 ? <div style={{ fontSize: 13, color: '#aaa' }}>No transactions yet</div> :
          filtered.map(t => (
            <div key={t.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: '1px solid #f0f0ee', fontSize: 13 }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{t.description}</div>
                <div style={{ fontSize: 11, color: '#aaa' }}>{t.category} · {t.account} · {t.date}</div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0 }}>
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