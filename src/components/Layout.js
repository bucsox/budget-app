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
    <div style={{ display: 'flex', minHeight: '100vh', flexDirection: 'column' }}>
      <style>{`
        .sidebar { display: flex; }
        .bottom-nav { display: none; }
        .main-content { margin-left: 210px; padding: 2rem; flex: 1; overflow-y: auto; }
        @media (max-width: 768px) {
          .sidebar { display: none; }
          .bottom-nav { display: flex; }
          .main-content { margin-left: 0; padding: 1rem; padding-bottom: 80px; }
        }
      `}</style>

      <aside className="sidebar" style={{ width: 210, background: '#fff', borderRight: '1px solid #e5e5e5', flexDirection: 'column', padding: '1.5rem 0', position: 'fixed', top: 0, left: 0, height: '100vh', zIndex: 100 }}>
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

      <main className="main-content">
        <Outlet />
      </main>

      <nav className="bottom-nav" style={{ position: 'fixed', bottom: 0, left: 0, right: 0, background: '#fff', borderTop: '1px solid #e5e5e5', zIndex: 100, justifyContent: 'space-around', alignItems: 'center', height: 64, paddingBottom: 4 }}>
        {links.map(l => (
          <NavLink
            key={l.to}
            to={l.to}
            end={l.to === '/'}
            style={({ isActive }) => ({
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 2,
              fontSize: 10,
              color: isActive ? '#2457a0' : '#aaa',
              fontWeight: isActive ? 600 : 400,
              textDecoration: 'none',
              flex: 1,
              padding: '6px 0'
            })}
          >
            <span style={{ fontSize: 20 }}>{l.icon}</span>
            <span>{l.label}</span>
          </NavLink>
        ))}
      </nav>
    </div>
  )
}