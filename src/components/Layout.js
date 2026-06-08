import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { supabase } from '../supabaseClient'

const links = [
  { to: '/', label: 'Dashboard', icon: '📊' },
  { to: '/transactions', label: 'Transactions', icon: '💸' },
  { to: '/budgets', label: 'Budgets', icon: '🎯' },
  { to: '/accounts', label: 'Accounts', icon: '🏦' },
  { to: '/recurring', label: 'Recurring', icon: '🔁' },
  { to: '/reports', label: 'Reports', icon: '📈' },
]

export default function Layout() {
  const navigate = useNavigate()

  async function handleLogout() {
    await supabase.auth.signOut()
    navigate('/login')
  }

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      <aside style={{ width: 210, background: '#fff', borderRight: '1px solid #e5e5e5', display: 'flex', flexDirection: 'column', padding: '1.5rem 0' }}>
        <div style={{ padding: '0 1.25rem 1.5rem', fontSize: 18, fontWeight: 600 }}>
          💰 BudgetApp
        </div>
        <nav style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 2 }}>
          {links.map(l => (
            <NavLink
              key={l.to}
              to={l.to}
              end={l.to === '/'}
              style={({ isActive }) => ({
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                padding: '9px 1.25rem',
                fontSize: 14,
                color: isActive ? '#2457a0' : '#555',
                background: isActive ? '#e8f0fb' : 'transparent',
                borderRight: isActive ? '3px solid #2457a0' : '3px solid transparent',
                fontWeight: isActive ? 500 : 400,
                textDecoration: 'none'
              })}
            >
              <span>{l.icon}</span> {l.label}
            </NavLink>
          ))}
        </nav>
        <button
          onClick={handleLogout}
          style={{ margin: '0 1rem', padding: '8px', fontSize: 13, cursor: 'pointer', border: '1px solid #e5e5e5', borderRadius: 8, background: 'transparent', color: '#888' }}
        >
          Sign out
        </button>
      </aside>
      <main style={{ flex: 1, padding: '2rem', overflowY: 'auto' }}>
        <Outlet />
      </main>
    </div>
  )
}