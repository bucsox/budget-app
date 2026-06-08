import { useState, useEffect } from 'react'
import { supabase } from '../supabaseClient'

const TYPES = ['Checking','Savings','Credit Card','Investment','Cash']
const icons = { Checking: '🏦', Savings: '🐷', 'Credit Card': '💳', Investment: '📈', Cash: '💵' }

export default function Accounts() {
  const [accounts, setAccounts] = useState([])
  const [showForm, setShowForm] = useState(false)
  const [editingAccount, setEditingAccount] = useState(null)
  const [deleteConfirm, setDeleteConfirm] = useState(null)
  const [form, setForm] = useState({ name: '', type: 'Checking', balance: '' })

  useEffect(() => { fetchAccounts() }, [])

  async function fetchAccounts() {
    const { data } = await supabase.from('accounts').select('*').order('created_at')
    setAccounts(data || [])
  }

  async function handleSave() {
    if (!form.name || form.balance === '') return
    const { data: { user } } = await supabase.auth.getUser()
    const rawBalance = parseFloat(form.balance)
    const balance = form.type === 'Credit Card' ? -Math.abs(rawBalance) : rawBalance

    if (editingAccount) {
      await supabase.from('accounts')
        .update({ name: form.name, type: form.type, balance })
        .eq('id', editingAccount.id)
    } else {
      await supabase.from('accounts')
        .insert({ name: form.name, type: form.type, balance, user_id: user.id })
    }

    cancelForm()
    fetchAccounts()
  }

  async function handleDelete(id) {
    await supabase.from('accounts').delete().eq('id', id)
    setDeleteConfirm(null)
    fetchAccounts()
  }

  function startEdit(account) {
    setEditingAccount(account)
    setForm({
      name: account.name,
      type: account.type,
      balance: Math.abs(account.balance).toString()
    })
    setShowForm(true)
    setDeleteConfirm(null)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  function cancelForm() {
    setShowForm(false)
    setEditingAccount(null)
    setForm({ name: '', type: 'Checking', balance: '' })
  }

  const fmt = (n) => '$' + n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })
  const inputStyle = { padding: '8px 10px', border: '1px solid #e5e5e5', borderRadius: 8, fontSize: 13, width: '100%' }
  const totalAssets = accounts.filter(a => a.balance > 0).reduce((s, a) => s + a.balance, 0)
  const totalLiabilities = accounts.filter(a => a.balance < 0).reduce((s, a) => s + a.balance, 0)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1 style={{ fontSize: 22, fontWeight: 500 }}>Accounts</h1>
        {!showForm && (
          <button
            onClick={() => { setEditingAccount(null); setShowForm(true) }}
            style={{ padding: '8px 16px', background: '#2457a0', color: '#fff', border: 'none', borderRadius: 8, fontSize: 13, cursor: 'pointer', fontWeight: 500 }}>
            + Add account
          </button>
        )}
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
        <div style={{ background: '#fff', border: '1px solid #2457a0', borderRadius: 12, padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{ fontSize: 14, fontWeight: 500 }}>
            {editingAccount ? `Editing: ${editingAccount.name}` : 'New account'}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 10 }}>
            <div>
              <label style={{ fontSize: 12, color: '#888', display: 'block', marginBottom: 4 }}>Account name</label>
              <input
                type="text"
                value={form.name}
                onChange={e => setForm({ ...form, name: e.target.value })}
                style={inputStyle}
                placeholder="e.g. Navy Federal Checking"
              />
            </div>
            <div>
              <label style={{ fontSize: 12, color: '#888', display: 'block', marginBottom: 4 }}>Type</label>
              <select
                value={form.type}
                onChange={e => setForm({ ...form, type: e.target.value })}
                style={inputStyle}>
                {TYPES.map(t => <option key={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label style={{ fontSize: 12, color: '#888', display: 'block', marginBottom: 4 }}>
                Balance ($) {form.type === 'Credit Card' ? '— enter amount owed' : ''}
              </label>
              <input
                type="number"
                value={form.balance}
                onChange={e => setForm({ ...form, balance: e.target.value })}
                style={inputStyle}
                placeholder="0.00"
              />
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
            <button onClick={cancelForm} style={{ padding: '7px 14px', border: '1px solid #e5e5e5', borderRadius: 8, background: 'transparent', fontSize: 13, cursor: 'pointer' }}>
              Cancel
            </button>
            <button onClick={handleSave} style={{ padding: '7px 14px', background: '#2457a0', color: '#fff', border: 'none', borderRadius: 8, fontSize: 13, cursor: 'pointer', fontWeight: 500 }}>
              {editingAccount ? 'Save changes' : 'Add account'}
            </button>
          </div>
        </div>
      )}

      <div style={{ background: '#fff', border: '1px solid #e5e5e5', borderRadius: 12, padding: '1.25rem' }}>
        <div style={{ fontSize: 14, fontWeight: 500, marginBottom: '1rem' }}>All accounts</div>
        {accounts.length === 0
          ? <div style={{ fontSize: 13, color: '#aaa' }}>No accounts yet</div>
          : accounts.map(a => (
            <div key={a.id}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: deleteConfirm === a.id ? 'none' : '1px solid #f0f0ee', fontSize: 13 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{ width: 36, height: 36, borderRadius: 10, background: a.balance < 0 ? '#FCEBEB' : '#EAF3DE', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>
                    {icons[a.type] || '💰'}
                  </div>
                  <div>
                    <div style={{ fontWeight: 500 }}>{a.name}</div>
                    <div style={{ fontSize: 11, color: '#aaa' }}>{a.type}</div>
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontWeight: 500, color: a.balance < 0 ? '#E24B4A' : '#1a1a1a' }}>
                    {fmt(a.balance)}
                  </span>
                  <button
                    onClick={() => startEdit(a)}
                    style={{ background: '#f0f0ee', border: 'none', borderRadius: 6, padding: '4px 10px', fontSize: 12, cursor: 'pointer', color: '#555' }}>
                    Edit
                  </button>
                  <button
                    onClick={() => setDeleteConfirm(a.id)}
                    style={{ background: '#FCEBEB', border: 'none', borderRadius: 6, padding: '4px 10px', fontSize: 12, cursor: 'pointer', color: '#A32D2D' }}>
                    Delete
                  </button>
                </div>
              </div>

              {deleteConfirm === a.id && (
                <div style={{ background: '#FCEBEB', border: '1px solid #F7C1C1', borderRadius: 8, padding: '10px 14px', marginBottom: 8, fontSize: 13, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
                  <span>Delete <strong>{a.name}</strong>? This cannot be undone.</span>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button onClick={() => setDeleteConfirm(null)} style={{ padding: '5px 12px', border: '1px solid #e5e5e5', borderRadius: 6, background: '#fff', fontSize: 12, cursor: 'pointer' }}>
                      Cancel
                    </button>
                    <button onClick={() => handleDelete(a.id)} style={{ padding: '5px 12px', background: '#A32D2D', color: '#fff', border: 'none', borderRadius: 6, fontSize: 12, cursor: 'pointer' }}>
                      Yes, delete
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
      </div>
    </div>
  )
}