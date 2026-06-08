import { useState, useEffect } from 'react'
import { supabase } from '../supabaseClient'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, LineChart, Line } from 'recharts'

const PERIOD_OPTIONS = ['Day', 'Week', 'Month']
const COLORS = ['#3266ad','#1D9E75','#EF9F27','#E24B4A','#7F77DD','#5DCAA5','#F4A261','#E76F51']

function getDateRange(period) {
  const now = new Date()
  const start = new Date()
  if (period === 'Day') start.setHours(0, 0, 0, 0)
  else if (period === 'Week') start.setDate(now.getDate() - 7)
  else if (period === 'Month') start.setDate(1)
  return { start, end: now }
}

function getPrevDateRange(period) {
  const now = new Date()
  const start = new Date()
  const end = new Date()
  if (period === 'Day') {
    start.setDate(now.getDate() - 1); start.setHours(0, 0, 0, 0)
    end.setDate(now.getDate() - 1); end.setHours(23, 59, 59, 999)
  } else if (period === 'Week') {
    start.setDate(now.getDate() - 14)
    end.setDate(now.getDate() - 7)
  } else if (period === 'Month') {
    start.setMonth(now.getMonth() - 1); start.setDate(1)
    end.setMonth(now.getMonth()); end.setDate(0)
  }
  return { start, end }
}

export default function Analytics() {
  const [transactions, setTransactions] = useState([])
  const [period, setPeriod] = useState('Month')

  useEffect(() => { fetchTransactions() }, [])

  async function fetchTransactions() {
    const { data } = await supabase.from('transactions').select('*').order('date', { ascending: false })
    setTransactions(data || [])
  }

  const fmt = (n) => '$' + Number(n).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })

  const { start, end } = getDateRange(period)
  const { start: prevStart, end: prevEnd } = getPrevDateRange(period)

  const periodTx = transactions.filter(t => {
    const d = new Date(t.date)
    return d >= start && d <= end
  })

  const prevTx = transactions.filter(t => {
    const d = new Date(t.date)
    return d >= prevStart && d <= prevEnd
  })

  const expenses = periodTx.filter(t => t.type === 'expense')
  const income = periodTx.filter(t => t.type === 'income')
  const prevExpenses = prevTx.filter(t => t.type === 'expense')

  const totalSpent = expenses.reduce((s, t) => s + t.amount, 0)
  const totalIncome = income.reduce((s, t) => s + t.amount, 0)
  const prevTotalSpent = prevExpenses.reduce((s, t) => s + t.amount, 0)
  const diffPct = prevTotalSpent > 0 ? Math.round((totalSpent - prevTotalSpent) / prevTotalSpent * 100) : 0

  const days = period === 'Day' ? 1 : period === 'Week' ? 7 : new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).getDate()
  const avgDaily = totalSpent / days

  // Category breakdown
  const catMap = {}
  expenses.forEach(t => {
    catMap[t.category] = (catMap[t.category] || 0) + t.amount
  })
  const catData = Object.entries(catMap)
    .map(([name, value]) => ({ name, value, pct: Math.round(value / totalSpent * 100) }))
    .sort((a, b) => b.value - a.value)

  // Spending over time chart
  const timeData = []
  if (period === 'Day') {
    for (let h = 0; h < 24; h++) {
      const label = h === 0 ? '12am' : h < 12 ? `${h}am` : h === 12 ? '12pm' : `${h - 12}pm`
      const spent = expenses.filter(t => new Date(t.date).getHours() === h).reduce((s, t) => s + t.amount, 0)
      if (spent > 0) timeData.push({ label, spent })
    }
  } else if (period === 'Week') {
    for (let i = 6; i >= 0; i--) {
      const d = new Date()
      d.setDate(d.getDate() - i)
      const key = d.toISOString().slice(0, 10)
      const label = d.toLocaleString('default', { weekday: 'short' })
      const spent = expenses.filter(t => t.date === key).reduce((s, t) => s + t.amount, 0)
      timeData.push({ label, spent })
    }
  } else {
    const daysInMonth = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).getDate()
    for (let d = 1; d <= daysInMonth; d++) {
      const key = `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`
      const spent = expenses.filter(t => t.date === key).reduce((s, t) => s + t.amount, 0)
      if (d % 5 === 0 || d === 1) timeData.push({ label: `${d}`, spent })
      else timeData.push({ label: '', spent })
    }
  }

  // Biggest transactions
  const biggest = [...expenses].sort((a, b) => b.amount - a.amount).slice(0, 5)

  // Running total for the period
  const runningData = []
  let running = 0
  const sortedExpenses = [...expenses].sort((a, b) => new Date(a.date) - new Date(b.date))
  sortedExpenses.forEach(t => {
    running += t.amount
    runningData.push({ label: t.date.slice(5), total: running })
  })

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
        <h1 style={{ fontSize: 22, fontWeight: 500 }}>Analytics</h1>
        <div style={{ display: 'flex', gap: 4, background: '#f0f0ee', borderRadius: 8, padding: 4 }}>
          {PERIOD_OPTIONS.map(p => (
            <button key={p} onClick={() => setPeriod(p)} style={{ padding: '6px 16px', fontSize: 13, border: 'none', borderRadius: 6, cursor: 'pointer', background: period === p ? '#fff' : 'transparent', color: period === p ? '#2457a0' : '#888', fontWeight: period === p ? 500 : 400, boxShadow: period === p ? '0 1px 3px rgba(0,0,0,0.1)' : 'none' }}>
              {p}
            </button>
          ))}
        </div>
      </div>

      {/* Summary metrics */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 12 }}>
        {[
          { label: `Total spent`, value: fmt(totalSpent), color: '#E24B4A' },
          { label: `Total income`, value: fmt(totalIncome), color: '#1D9E75' },
          { label: `Avg daily spend`, value: fmt(avgDaily), color: '#1a1a1a' },
          { label: `vs prev ${period.toLowerCase()}`, value: `${diffPct > 0 ? '+' : ''}${diffPct}%`, color: diffPct > 0 ? '#E24B4A' : '#1D9E75' },
        ].map(c => (
          <div key={c.label} style={{ background: '#f0f0ee', borderRadius: 10, padding: '1rem' }}>
            <div style={{ fontSize: 12, color: '#888', marginBottom: 6 }}>{c.label}</div>
            <div style={{ fontSize: 20, fontWeight: 500, color: c.color }}>{c.value}</div>
          </div>
        ))}
      </div>

      {/* Spending over time */}
      <div style={{ background: '#fff', border: '1px solid #e5e5e5', borderRadius: 12, padding: '1.25rem' }}>
        <div style={{ fontSize: 14, fontWeight: 500, marginBottom: '1rem' }}>Spending over time</div>
        {timeData.every(d => d.spent === 0)
          ? <div style={{ fontSize: 13, color: '#aaa', textAlign: 'center', padding: '2rem' }}>No expenses in this period</div>
          : <ResponsiveContainer width="100%" height={200}>
              <BarChart data={timeData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0ee" />
                <XAxis dataKey="label" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} tickFormatter={v => '$' + v} />
                <Tooltip formatter={v => fmt(v)} />
                <Bar dataKey="spent" fill="#3266ad" radius={[4, 4, 0, 0]} name="Spent" />
              </BarChart>
            </ResponsiveContainer>
        }
      </div>

      {/* Category breakdown + biggest transactions */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.25rem' }}>
        <div style={{ background: '#fff', border: '1px solid #e5e5e5', borderRadius: 12, padding: '1.25rem' }}>
          <div style={{ fontSize: 14, fontWeight: 500, marginBottom: '1rem' }}>Top categories</div>
          {catData.length === 0
            ? <div style={{ fontSize: 13, color: '#aaa' }}>No expenses yet</div>
            : catData.map((c, i) => (
              <div key={c.name} style={{ marginBottom: 12 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 4 }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span style={{ width: 10, height: 10, borderRadius: '50%', background: COLORS[i % COLORS.length], display: 'inline-block' }} />
                    <span style={{ fontWeight: 500 }}>{c.name}</span>
                  </span>
                  <span style={{ color: '#888' }}>{fmt(c.value)} <span style={{ color: '#aaa' }}>({c.pct}%)</span></span>
                </div>
                <div style={{ background: '#f0f0ee', borderRadius: 4, height: 6 }}>
                  <div style={{ width: c.pct + '%', height: 6, borderRadius: 4, background: COLORS[i % COLORS.length] }} />
                </div>
              </div>
            ))
          }
        </div>

        <div style={{ background: '#fff', border: '1px solid #e5e5e5', borderRadius: 12, padding: '1.25rem' }}>
          <div style={{ fontSize: 14, fontWeight: 500, marginBottom: '1rem' }}>Biggest expenses</div>
          {biggest.length === 0
            ? <div style={{ fontSize: 13, color: '#aaa' }}>No expenses yet</div>
            : biggest.map((t, i) => (
              <div key={t.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: '1px solid #f0f0ee', fontSize: 13 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ width: 22, height: 22, borderRadius: '50%', background: COLORS[i % COLORS.length], display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, color: '#fff', fontWeight: 600, flexShrink: 0 }}>{i + 1}</span>
                  <div>
                    <div style={{ fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 160 }}>{t.description}</div>
                    <div style={{ fontSize: 11, color: '#aaa' }}>{t.category} · {t.date}</div>
                  </div>
                </div>
                <span style={{ fontWeight: 500, color: '#E24B4A', flexShrink: 0 }}>-{fmt(t.amount)}</span>
              </div>
            ))
          }
        </div>
      </div>

      {/* Running total */}
      {runningData.length > 1 && (
        <div style={{ background: '#fff', border: '1px solid #e5e5e5', borderRadius: 12, padding: '1.25rem' }}>
          <div style={{ fontSize: 14, fontWeight: 500, marginBottom: '1rem' }}>Cumulative spending</div>
          <ResponsiveContainer width="100%" height={180}>
            <LineChart data={runningData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0ee" />
              <XAxis dataKey="label" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} tickFormatter={v => '$' + v} />
              <Tooltip formatter={v => fmt(v)} />
              <Line type="monotone" dataKey="total" stroke="#E24B4A" strokeWidth={2} dot={false} name="Total spent" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  )
}