import { useState, useEffect, useRef } from 'react'
import { supabase } from '../supabaseClient'

const CATEGORIES = ['Housing','Food','Transport','Health','Entertainment','Utilities','Salary','Freelance','Other']

function guessCategory(nfcuCategory, description) {
  const cat = (nfcuCategory || '').toLowerCase()
  const d = (description || '').toLowerCase()
  if (cat.includes('food') || cat.includes('dining') || cat.includes('restaurant') || cat.includes('grocery')) return 'Food'
  if (cat.includes('transport') || cat.includes('auto') || cat.includes('gas') || cat.includes('fuel')) return 'Transport'
  if (cat.includes('health') || cat.includes('medical') || cat.includes('pharmacy')) return 'Health'
  if (cat.includes('entertainment') || cat.includes('subscription') || cat.includes('streaming')) return 'Entertainment'
  if (cat.includes('util') || cat.includes('electric') || cat.includes('water') || cat.includes('internet')) return 'Utilities'
  if (cat.includes('income') || cat.includes('payroll') || cat.includes('deposit')) return 'Salary'
  if (d.includes('rent') || d.includes('mortgage')) return 'Housing'
  if (d.includes('grocery') || d.includes('walmart') || d.includes('kroger') || d.includes('publix')) return 'Food'
  if (d.includes('netflix') || d.includes('spotify') || d.includes('hulu') || d.includes('disney')) return 'Entertainment'
  if (d.includes('shell') || d.includes('exxon') || d.includes('bp') || d.includes('uber') || d.includes('lyft')) return 'Transport'
  if (d.includes('cvs') || d.includes('walgreen') || d.includes('doctor') || d.includes('hospital')) return 'Health'
  if (d.includes('electric') || d.includes('water') || d.includes('internet') || d.includes('phone')) return 'Utilities'
  if (d.includes('salary') || d.includes('payroll') || d.includes('direct deposit')) return 'Salary'
  return 'Other'
}

function parseCSVLine(line) {
  const result = []
  let current = ''
  let inQuotes = false
  for (let i = 0; i < line.length; i++) {
    if (line[i] === '"') { inQuotes = !inQuotes }
    else if (line[i] === ',' && !inQuotes) { result.push(current.trim()); current = '' }
    else { current += line[i] }
  }
  result.push(current.trim())
  return result
}

export default function Transactions() {
  const [transactions, setTransactions] = useState([])
  const [filter, setFilter] = useState('all')
  const [showForm, setShowForm] = useState(false)
  const [deleteConfirm, setDeleteConfirm] = useState(null)
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
    setDeleteConfirm(null)
    fetchTransactions()
  }

  async function handleCSVImport(e) {
    const file = e.target.files[0]
    if (!file) return
    setImporting(true)
    setImportResult(null)

    const text = await file.text()
    const lines = text.split('\n').filter(l => l.trim())
    const rawHeaders = parseCSVLine(lines[0])
    const headers = rawHeaders.map(h => h.toLowerCase().replace(/"/g, '').trim())

    const { data: { user } } = await supabase.auth.getUser()

    let imported = 0
    let skipped = 0
    const rows = []

    for (let i = 1; i < lines.length; i++) {
      const cols = parseCSVLine(lines[i])
      if (cols.length < 3) { skipped++; continue }

      const row = {}
      headers.forEach((h, idx) => { row[h] = (cols[idx] || '').replace(/"/g, '').trim() })

      // Map Navy Federal columns exactly
      const postingDate = row['posting date'] || row['transaction date'] || ''
      const description = row['description'] || row['memo'] || ''
      const rawAmount = row['amount'] || ''
      const indicator = (row['credit debit indicator'] || '').toLowerCase()
      const nfcuCategory = row['category'] || ''

      if (!postingDate || !rawAmount) { skipped++; continue }

      const amount = Math.abs(parseFloat(rawAmount.replace(/[$,]/g, '')) || 0)
      if (amount === 0) { skipped++; continue }

      // Navy Federal uses "credit" for money coming in, "debit" for money going out
      const type = indicator === 'credit' ? 'income' : 'expense'
      const category = guessCategory(nfcuCategory, description)

      // Parse date — handle MM/DD/YYYY format
      let date = postingDate
      if (postingDate.includes('/')) {
        const parts = postingDate.split('/')
        if (parts.length === 3) {
          date = `${parts[2]}-${parts[0].padStart(2, '0')}-${parts[1].padStart(2, '0')}`
        }
      }

      rows.push({
        user_id: user.id,
        type,
        description: description || 'Imported transaction',
        amount,
        date,
        category,
        account: 'Checking'
      })
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
        {filtered.length === 0
          ? <div style={{ fontSize: 13, color: '#aaa' }}>No transactions yet</div>
          : filtered.map(t => (
            <div key={t.id}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: deleteConfirm === t.id ? 'none' : '1px solid #f0f0ee', fontSize: 13 }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{t.description}</div>
                  <div style={{ fontSize: 11, color: '#aaa' }}>{t.category} · {t.account} · {t.date}</div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
                  <span style={{ fontWeight: 500, color: t.type === 'income' ? '#1D9E75' : '#E24B4A' }}>
                    {t.type === 'income' ? '+' : '-'}{fmt(t.amount)}
                  </span>
                  <button onClick={() => setDeleteConfirm(t.id)} style={{ background: '#FCEBEB', border: 'none', borderRadius: 6, padding: '4px 10px', fontSize: 12, cursor: 'pointer', color: '#A32D2D' }}>
                    Delete
                  </button>
                </div>
              </div>
              {deleteConfirm === t.id && (
                <div style={{ background: '#FCEBEB', border: '1px solid #F7C1C1', borderRadius: 8, padding: '10px 14px', marginBottom: 8, fontSize: 13, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span>Delete <strong>{t.description}</strong>?</span>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button onClick={() => setDeleteConfirm(null)} style={{ padding: '5px 12px', border: '1px solid #e5e5e5', borderRadius: 6, background: '#fff', fontSize: 12, cursor: 'pointer' }}>Cancel</button>
                    <button onClick={() => handleDelete(t.id)} style={{ padding: '5px 12px', background: '#A32D2D', color: '#fff', border: 'none', borderRadius: 6, fontSize: 12, cursor: 'pointer' }}>Yes, delete</button>
                  </div>
                </div>
              )}
            </div>
          ))}
      </div>
    </div>
  )
}