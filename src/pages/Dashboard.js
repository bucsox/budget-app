import { useState, useEffect } from 'react'
import { supabase } from '../supabaseClient'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'

const COLORS = ['#3266ad','#1D9E75','#EF9F27','#E24B4A','#7F77DD','#5DCAA5']

export default function Dashboard() {
  const [transactions, setTransactions] = useState([])
  const [accounts, setAccounts] = useState([])

  useEffect(() => {
    fetchData()
  }, [])

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
  const pieData = Object.entries(catMap).map(([name, value]) => ({ name, value }))

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

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <h1 style={{ fontSize: 22, fontWeight: 500 }}>Dashboard</h1>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 12 }}>
        {[
          { label: 'Total balance', value: fmt(totalBalance), color: '#1a1a1a' },
          { label: 'Income this month', value: fmt(income), color: '#1D9E75' },
          { label: 'Expenses this month', value: fmt(expenses), color: '#E24B4A' },
          { label: 'Net savings', value: fmt(savings), color: savings >= 0 ? '#1D9E75' : '#E24B4A' },
        ].map(c => (
          <div key={c.label} style={{ background: '#f0f0ee', borderRadius: 10, padding: '1rem' }}>
            <div style={{ fontSize: 12, color: '#888', marginBottom: 6 }}>{c.label}</div>
            <div style={{ fontSize: 22, fontWeight: 500, color: c.color }}>{c.value}</div>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem' }}>
        <div style={{ background: '#fff', border: '1px solid #e5e5e5', borderRadius: 12, padding: '1.25rem' }}>
          <div style={{ fontSize: 14, fontWeight: 500, marginBottom: '1rem' }}>Income vs expenses</div>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={months}>
              <XAxis dataKey="label" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} tickFormatter={v => '$' + v} />
              <Tooltip formatter={v => fmt(v)} />
              <Bar dataKey="income" fill="#1D9E75" radius={[4,4,0,0]} />
              <Bar dataKey="expenses" fill="#E24B4A" radius={[4,4,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div style={{ background: '#fff', border: '1px solid #e5e5e5', borderRadius: 12, padding: '1.25rem' }}>
          <div style={{ fontSize: 14, fontWeight: 500, marginBottom: '1rem' }}>Spending by category</div>
          {pieData.length === 0 ? <div style={{ fontSize: 13, color: '#aaa', marginTop: 60, textAlign: 'center' }}>No expenses this month</div> :
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={70} label={({ name, percent }) => `${name} ${(percent*100).toFixed(0)}%`} labelLine={false}>
                {pieData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Pie>
              <Tooltip formatter={v => fmt(v)} />
            </PieChart>
          </ResponsiveContainer>}
        </div>
      </div>

      <div style={{ background: '#fff', border: '1px solid #e5e5e5', borderRadius: 12, padding: '1.25rem' }}>
        <div style={{ fontSize: 14, fontWeight: 500, marginBottom: '1rem' }}>Recent transactions</div>
        {transactions.slice(0, 5).length === 0 ? <div style={{ fontSize: 13, color: '#aaa' }}>No transactions yet</div> :
        transactions.slice(0, 5).map(t => (
          <div key={t.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: '1px solid #f0f0ee', fontSize: 13 }}>
            <div>
              <div style={{ fontWeight: 500 }}>{t.description}</div>
              <div style={{ fontSize: 11, color: '#aaa' }}>{t.category} · {t.account} · {t.date}</div>
            </div>
            <span style={{ fontWeight: 500, color: t.type === 'income' ? '#1D9E75' : '#E24B4A' }}>
              {t.type === 'income' ? '+' : '-'}{fmt(t.amount)}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}