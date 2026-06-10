import { useState, useEffect } from 'react'
import { supabase } from '../supabaseClient'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'

const COLORS = ['#3266ad','#1D9E75','#EF9F27','#E24B4A','#7F77DD','#5DCAA5']

export default function Dashboard() {
  const [transactions, setTransactions] = useState([])
  const [accounts, setAccounts] = useState([])

  useEffect(() => { fetchData() }, [])

  async function fetchData() {
    const { data: tx } = await supabase.from('transactions').select('*').order('date', { ascending: false })
    const { data: ac } = await supabase.from('accounts').select('*')
    setTransactions(tx || [])
    setAccounts(ac || [])
  }

  const totalBalance = accounts.reduce((sum, a) => sum + a.balance, 0)
  const thisMonth = new Date().toISOString().slice(0, 7)
  const monthTx = transactions.filter(t => t.date.startsWith(thisMonth))
  const income = monthTx.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0)
  const expenses = monthTx.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0)
  const savings = income - expenses

  const catMap = {}
  monthTx.filter(t => t.type === 'expense').forEach(t => {
    catMap[t.category] = (catMap[t.category] || 0) + t.amount
  })
  const pieData = Object.entries(catMap).map(([name, value]) => ({ name, value })).sort((a,b) => b.value - a.value)

  const months = []
  for (let i = 5; i >= 0; i--) {
    const d = new Date()
    d.setMonth(d.getMonth() - i)
    const key = d.toISOString().slice(0, 7)
    const label = d.toLocaleString('default', { month: 'short' })
    const inc = transactions.filter(t => t.date.startsWith(key) && t.type === 'income').reduce((s, t) => s + t.amount, 0)
    const exp = transactions.filter(t => t.date.startsWith(key) && t.type === 'expense').reduce((s, t) => s + t.amount, 0)
    months.push({ label, income: inc, expenses: exp })
  }

  const fmt = (n) => '$' + n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })

  const cardStyle = { background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 12, padding: '1.25rem' }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <h1 style={{ fontSize: 22, fontWeight: 500 }}>Dashboard</h1>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 12 }}>
        {[
          { label: 'Total balance', value: fmt(totalBalance), color: 'var(--text)' },
          { label: 'Income this month', value: fmt(income), color: 'var(--green)' },
          { label: 'Expenses this month', value: fmt(expenses), color: 'var(--red)' },
          { label: 'Net savings', value: fmt(savings), color: savings >= 0 ? 'var(--green)' : 'var(--red)' },
        ].map(c => (
          <div key={c.label} style={{ background: 'var(--bg3)', borderRadius: 10, padding: '1rem' }}>
            <div style={{ fontSize: 12, color: 'var(--text3)', marginBottom: 6 }}>{c.label}</div>
            <div style={{ fontSize: 20, fontWeight: 500, color: c.color }}>{c.value}</div>
          </div>
        ))}
      </div>

      {/* Desktop charts */}
      <div className="desktop-only" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem' }}>
        <div style={cardStyle}>
          <div style={{ fontSize: 14, fontWeight: 500, marginBottom: '1rem' }}>Income vs expenses</div>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={months}>
              <XAxis dataKey="label" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} tickFormatter={v => '$' + v} />
              <Tooltip formatter={v => fmt(v)} />
              <Bar dataKey="income" fill="#1D9E75" radius={[4,4,0,0]} name="Income" />
              <Bar dataKey="expenses" fill="#E24B4A" radius={[4,4,0,0]} name="Expenses" />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div style={cardStyle}>
          <div style={{ fontSize: 14, fontWeight: 500, marginBottom: '1rem' }}>Spending by category</div>
          {pieData.length === 0
            ? <div style={{ fontSize: 13, color: 'var(--text4)', marginTop: 60, textAlign: 'center' }}>No expenses this month</div>
            : <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={70}>
                    {pieData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                  <Tooltip formatter={v => fmt(v)} />
                </PieChart>
              </ResponsiveContainer>
          }
        </div>
      </div>

      {/* Mobile summary cards instead of charts */}
      <div className="mobile-only">
        <div style={cardStyle}>
          <div style={{ fontSize: 14, fontWeight: 500, marginBottom: '1rem' }}>This month by category</div>
          {pieData.length === 0
            ? <div style={{ fontSize: 13, color: 'var(--text4)' }}>No expenses this month</div>
            : pieData.map((c, i) => (
              <div key={c.name} style={{ marginBottom: 10 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 3 }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span style={{ width: 10, height: 10, borderRadius: '50%', background: COLORS[i % COLORS.length], display: 'inline-block' }} />
                    {c.name}
                  </span>
                  <span style={{ fontWeight: 500 }}>{fmt(c.value)}</span>
                </div>
                <div style={{ background: 'var(--bg3)', borderRadius: 4, height: 6 }}>
                  <div style={{ width: Math.round(c.value / expenses * 100) + '%', height: 6, borderRadius: 4, background: COLORS[i % COLORS.length] }} />
                </div>
              </div>
            ))
          }
        </div>
      </div>

      <div style={cardStyle}>
        <div style={{ fontSize: 14, fontWeight: 500, marginBottom: '1rem' }}>Recent transactions</div>
        {transactions.slice(0, 5).length === 0
          ? <div style={{ fontSize: 13, color: 'var(--text4)' }}>No transactions yet</div>
          : transactions.slice(0, 5).map(t => (
            <div key={t.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: '1px solid var(--border)', fontSize: 13 }}>
              <div>
                <div style={{ fontWeight: 500, color: 'var(--text)' }}>{t.description}</div>
                <div style={{ fontSize: 11, color: 'var(--text4)' }}>{t.category} · {t.date}</div>
              </div>
              <span style={{ fontWeight: 500, color: t.type === 'income' ? 'var(--green)' : 'var(--red)' }}>
                {t.type === 'income' ? '+' : '-'}{fmt(t.amount)}
              </span>
            </div>
          ))
        }
      </div>
    </div>
  )
}