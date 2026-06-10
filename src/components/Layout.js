import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { supabase } from '../supabaseClient'

const links = [
  { to: '/', label: 'Dashboard', icon: '📊' },
  { to: '/transactions', label: 'Transactions', icon: '💸' },
  { to: '/budgets', label: 'Budgets', icon: '🎯' },
  { to: '/accounts', label: 'Accounts', icon: '🏦' },
  { to: '/recurring', label: 'Recurring', icon: '🔁' },
  { to: '/reports', label: 'Reports', icon: '📈' },
  { to: '/analytics', label: 'Analytics', icon: '🔍' },
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
        .nav-link-item { display: flex; align-items: center; gap: 10px; padding: 9px 1.25rem; font-size: 14px; text-decoration: none; border-right: 3px solid transparent; font-weight: 400; color: var(--text2); }
        .nav-link-item:hover { background: var(--bg3); }
        .nav-link-item.active { color: var(--blue); background: var(--bg3); border-right-color: var(--blue); font-weight: 500; }
        .bottom-nav-link { display: flex; flex-direction: column; align-items: center; gap: 2px; font-size: 10px; text-decoration: none; flex: 1; padding: 6px 0; color: var(--text4); }
        .bottom-nav-link.active { color: var(--blue); font-weight: 600; }
        .sidebar-inner { width: 210px; background: var(--bg2); border-right: 1px solid var(--border); display: flex; flex-direction: column; padding: 1.5rem 0; position: fixed; top: 0; left: 0; height: 100vh; z-index: 100; }
        .bottom-nav-inner { position: fixed; bottom: 0; left: 0; right: 0; background: var(--bg2); border-top: 1px solid var(--border); z-index: 100; display: flex; justify-content: space-around; align-items: center; height: 64px; padding-bottom: 4px; }
        .signout-btn { margin: 0 1rem; padding: 8px; font-size: 13px; cursor: pointer; border: 1px solid var(--border); border-radius: 8px; background: transparent; color: var(--text3); }
        @media (max-width: 768px) {
          .sidebar { display: none; }
          .bottom-nav { display: flex; }
          .main-content { margin-left: 0; padding: 1rem; padding-bottom: 80px; }
        }
      `}</style>

      <aside className="sidebar">
        <div className="sidebar-inner">
          <div style={{ padding: '0 1.25rem 1.5rem', fontSize: 18, fontWeight: 600, color: 'var(--text)' }}>
            💰 BudgetApp
          </div>
          <nav style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 2 }}>
            {links.map(l => (
              <NavLink key={l.to} to={l.to} end={l.to === '/'} className={({ isActive }) => `nav-link-item${isActive ? ' active' : ''}`}>
                <span>{l.icon}</span> {l.label}
              </NavLink>
            ))}
          </nav>
          <button className="signout-btn" onClick={handleLogout}>Sign out</button>
        </div>
      </aside>

      <main className="main-content">
        <Outlet />
      </main>

      <nav className="bottom-nav">
        <div className="bottom-nav-inner">
          {links.map(l => (
            <NavLink key={l.to} to={l.to} end={l.to === '/'} className={({ isActive }) => `bottom-nav-link${isActive ? ' active' : ''}`}>
              <span style={{ fontSize: 20 }}>{l.icon}</span>
              <span>{l.label}</span>
            </NavLink>
          ))}
        </div>
      </nav>
    </div>
  )
}