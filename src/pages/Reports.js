import { useState, useEffect } from 'react'
import { supabase } from '../supabaseClient'
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts'

export default function Reports() {
  const [transactions, setTransactions] = useState([])

  useEffect(() => {
    async function fetch() {
      const { data } = await supabase.from('transactions').select('*').order('date')
      setTransactions(data || [])
    }
    fetch()
  }, [])

  const fmt = (n) => '$' + n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })

  const months = []
  for (let i = 5; i >= 0; i--) {
    const d = new Date()
    d.setMonth(d.getMonth() - i)
    const key = d.toISOString().slice(0, 7)
    const label = d.toLocaleString('default', { month: 'short' })
    const income = transactions.filter(t => t.date.startsWith(key) && t.type === 'income').reduce((s, t) => s + t.amount, 0)
    const expenses = transactions.filter(t => t.date.startsWith(key) && t.type === 'expense').reduce((s, t) => s + t.amount, 0)
    const savings = income > 0 ? Math.round((income - expenses) / income * 100) : 0
    months.push({ label, income, expenses, savings })
  }

  const catMap = {}
  transactions.filter(t => t.type === 'expense').forEach(t => {
    catMap[t.category] = (catMap[t.category] || 0) + t.amount
  })
  const catData = Object.entries(catMap).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value)

  const ytd = []
  let runIncome = 0, runExpenses = 0
  months.forEach(m => {
    runIncome += m.income
    runExpenses += m.expenses
    ytd.push({ label: m.label, income: runIncome, expenses: runExpenses })
  })

  const totalIncome = months.reduce((s, m) => s + m.income, 0)
  const totalExpenses = months.reduce((s, m) => s + m.expenses, 0)
  const avgSavings = months.filter(m => m.savings > 0).reduce((s, m) => s + m.savings, 0) / (months.filter(m => m.savings > 0).length || 1)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <h1 style={{ fontSize: 22, fontWeight: 500 }}>Reports</h1>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 12 }}>
        {[
          { label: '6-month income', value: fmt(totalIncome), color: '#1D9E75' },
          { label: '6-month expenses', value: fmt(totalExpenses), color: '#E24B4A' },
          { label: 'Avg savings rate', value: Math.round(avgSavings) + '%', color: '#3266ad' },
          { label: 'Net saved', value: fmt(totalIncome - totalExpenses), color: '#1a1a1a' },
        ].map(c => (
          <div key={c.label} style={{ background: '#f0f0ee', borderRadius: 10, padding: '1rem' }}>
            <div style={{ fontSize: 12, color: '#888', marginBottom: 6 }}>{c.label}</div>
            <div style={{ fontSize: 22, fontWeight: 500, color: c.color }}>{c.value}</div>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem' }}>
        <div style={{ background: '#fff', border: '1px solid #e5e5e5', borderRadius: 12, padding: '1.25rem' }}>
          <div style={{ fontSize: 14, fontWeight: 500, marginBottom: '1rem' }}>Monthly savings rate</div>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={months}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0ee" />
              <XAxis dataKey="label" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} tickFormatter={v => v + '%'} />
              <Tooltip formatter={v => v + '%'} />
              <Line type="monotone" dataKey="savings" stroke="#3266ad" strokeWidth={2} dot={{ r: 4 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
        <div style={{ background: '#fff', border: '1px solid #e5e5e5', borderRadius: 12, padding: '1.25rem' }}>
          <div style={{ fontSize: 14, fontWeight: 500, marginBottom: '1rem' }}>Expenses by category</div>
          {catData.length === 0 ? <div style={{ fontSize: 13, color: '#aaa', marginTop: 60, textAlign: 'center' }}>No data yet</div> :
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={catData} layout="vertical">
              <XAxis type="number" tick={{ fontSize: 12 }} tickFormatter={v => '$' + v} />
              <YAxis type="category" dataKey="name" tick={{ fontSize: 12 }} width={80} />
              <Tooltip formatter={v => fmt(v)} />
              <Bar dataKey="value" fill="#85B7EB" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>}
        </div>
      </div>

      <div style={{ background: '#fff', border: '1px solid #e5e5e5', borderRadius: 12, padding: '1.25rem' }}>
        <div style={{ fontSize: 14, fontWeight: 500, marginBottom: '1rem' }}>Year-to-date cumulative</div>
        <ResponsiveContainer width="100%" height={200}>
          <LineChart data={ytd}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0ee" />
            <XAxis dataKey="label" tick={{ fontSize: 12 }} />
            <YAxis tick={{ fontSize: 12 }} tickFormatter={v => '$' + v.toLocaleString()} />
            <Tooltip formatter={v => fmt(v)} />
            <Line type="monotone" dataKey="income" stroke="#1D9E75" strokeWidth={2} dot={{ r: 4 }} name="Income" />
            <Line type="monotone" dataKey="expenses" stroke="#E24B4A" strokeWidth={2} dot={{ r: 4 }} name="Expenses" />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}