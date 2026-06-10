import { useState, useEffect } from 'react'
import { supabase } from '../supabaseClient'
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts'

const COLORS = ['#3266ad','#1D9E75','#EF9F27','#E24B4A','#7F77DD','#5DCAA5']

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
  const cardStyle = { background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 12, padding: '1.25rem' }

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

      {/* Metrics */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 12 }}>
        {[
          { label: '6-month income', value: fmt(totalIncome), color: 'var(--green)' },
          { label: '6-month expenses', value: fmt(totalExpenses), color: 'var(--red)' },
          { label: 'Avg savings rate', value: Math.round(avgSavings) + '%', color: 'var(--blue)' },
          { label: 'Net saved', value: fmt(totalIncome - totalExpenses), color: 'var(--text)' },
        ].map(c => (
          <div key={c.label} style={{ background: 'var(--bg3)', borderRadius: 10, padding: '1rem' }}>
            <div style={{ fontSize: 12, color: 'var(--text3)', marginBottom: 6 }}>{c.label}</div>
            <div style={{ fontSize: 20, fontWeight: 500, color: c.color }}>{c.value}</div>
          </div>
        ))}
      </div>

      {/* Monthly breakdown — chart on desktop, cards on mobile */}
      <div style={cardStyle}>
        <div style={{ fontSize: 14, fontWeight: 500, marginBottom: '1rem' }}>Monthly income vs expenses</div>
        <div className="desktop-only">
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={months}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="label" tick={{ fontSize: 12, fill: 'var(--text3)' }} />
              <YAxis tick={{ fontSize: 12, fill: 'var(--text3)' }} tickFormatter={v => '$' + v} />
              <Tooltip formatter={v => fmt(v)} />
              <Bar dataKey="income" fill="#1D9E75" radius={[4,4,0,0]} name="Income" />
              <Bar dataKey="expenses" fill="#E24B4A" radius={[4,4,0,0]} name="Expenses" />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="mobile-only" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {months.map(m => (
            <div key={m.label} style={{ padding: '10px 0', borderBottom: '1px solid var(--border)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                <span style={{ fontWeight: 500, color: 'var(--text)', fontSize: 13 }}>{m.label}</span>
                <span style={{ fontSize: 12, color: m.savings >= 0 ? 'var(--green)' : 'var(--red)' }}>{m.savings}% saved</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
                <span style={{ color: 'var(--green)' }}>+{fmt(m.income)}</span>
                <span style={{ color: 'var(--red)' }}>-{fmt(m.expenses)}</span>
                <span style={{ color: 'var(--text)', fontWeight: 500 }}>Net: {fmt(m.income - m.expenses)}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Savings rate — chart on desktop, cards on mobile */}
      <div style={cardStyle}>
        <div style={{ fontSize: 14, fontWeight: 500, marginBottom: '1rem' }}>Monthly savings rate</div>
        <div className="desktop-only">
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={months}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="label" tick={{ fontSize: 12, fill: 'var(--text3)' }} />
              <YAxis tick={{ fontSize: 12, fill: 'var(--text3)' }} tickFormatter={v => v + '%'} />
              <Tooltip formatter={v => v + '%'} />
              <Line type="monotone" dataKey="savings" stroke="var(--blue)" strokeWidth={2} dot={{ r: 4 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
        <div className="mobile-only" style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {months.map(m => (
            <div key={m.label} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ fontSize: 12, color: 'var(--text3)', width: 30 }}>{m.label}</span>
              <div style={{ flex: 1, background: 'var(--bg3)', borderRadius: 4, height: 8 }}>
                <div style={{ width: Math.max(0, m.savings) + '%', height: 8, borderRadius: 4, background: m.savings >= 0 ? 'var(--blue)' : 'var(--red)' }} />
              </div>
              <span style={{ fontSize: 12, fontWeight: 500, color: m.savings >= 0 ? 'var(--blue)' : 'var(--red)', width: 40, textAlign: 'right' }}>{m.savings}%</span>
            </div>
          ))}
        </div>
      </div>

      {/* Category breakdown — chart on desktop, list on mobile */}
      <div style={cardStyle}>
        <div style={{ fontSize: 14, fontWeight: 500, marginBottom: '1rem' }}>Expenses by category</div>
        {catData.length === 0
          ? <div style={{ fontSize: 13, color: 'var(--text4)' }}>No data yet</div>
          : <>
            <div className="desktop-only">
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={catData} layout="vertical">
                  <XAxis type="number" tick={{ fontSize: 12, fill: 'var(--text3)' }} tickFormatter={v => '$' + v} />
                  <YAxis type="category" dataKey="name" tick={{ fontSize: 12, fill: 'var(--text3)' }} width={90} />
                  <Tooltip formatter={v => fmt(v)} />
                  <Bar dataKey="value" fill="var(--blue)" radius={[0,4,4,0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="mobile-only" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {catData.map((c, i) => (
                <div key={c.name} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{ width: 10, height: 10, borderRadius: '50%', background: COLORS[i % COLORS.length], flexShrink: 0, display: 'inline-block' }} />
                  <span style={{ fontSize: 13, color: 'var(--text)', width: 100, flexShrink: 0 }}>{c.name}</span>
                  <div style={{ flex: 1, background: 'var(--bg3)', borderRadius: 4, height: 8 }}>
                    <div style={{ width: Math.round(c.value / catData[0].value * 100) + '%', height: 8, borderRadius: 4, background: COLORS[i % COLORS.length] }} />
                  </div>
                  <span style={{ fontSize: 12, fontWeight: 500, color: 'var(--text)', width: 70, textAlign: 'right', flexShrink: 0 }}>{fmt(c.value)}</span>
                </div>
              ))}
            </div>
          </>
        }
      </div>

      {/* YTD — desktop only */}
      <div className="desktop-only" style={cardStyle}>
        <div style={{ fontSize: 14, fontWeight: 500, marginBottom: '1rem' }}>Year-to-date cumulative</div>
        <ResponsiveContainer width="100%" height={200}>
          <LineChart data={ytd}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
            <XAxis dataKey="label" tick={{ fontSize: 12, fill: 'var(--text3)' }} />
            <YAxis tick={{ fontSize: 12, fill: 'var(--text3)' }} tickFormatter={v => '$' + v.toLocaleString()} />
            <Tooltip formatter={v => fmt(v)} />
            <Line type="monotone" dataKey="income" stroke="#1D9E75" strokeWidth={2} dot={{ r: 3 }} name="Income" />
            <Line type="monotone" dataKey="expenses" stroke="#E24B4A" strokeWidth={2} dot={{ r: 3 }} name="Expenses" />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* YTD mobile summary */}
      <div className="mobile-only" style={cardStyle}>
        <div style={{ fontSize: 14, fontWeight: 500, marginBottom: '1rem' }}>Year-to-date summary</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {ytd.map(m => (
            <div key={m.label} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, padding: '8px 0', borderBottom: '1px solid var(--border)' }}>
              <span style={{ fontWeight: 500, color: 'var(--text)' }}>{m.label}</span>
              <span style={{ color: 'var(--green)' }}>+{fmt(m.income)}</span>
              <span style={{ color: 'var(--red)' }}>-{fmt(m.expenses)}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}