import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Avatar from './Avatar';

const NavItem = ({ to, icon, label }) => (
  <NavLink to={to} end={to === '/'} style={({ isActive }) => ({
    display: 'flex', alignItems: 'center', gap: 10,
    padding: '9px 12px', borderRadius: 8,
    color: isActive ? 'var(--text)' : 'var(--text-3)',
    background: isActive ? 'var(--bg-2)' : 'transparent',
    fontSize: 13, fontWeight: isActive ? 500 : 400,
    transition: 'all 0.15s', textDecoration: 'none',
    border: isActive ? '1px solid var(--border)' : '1px solid transparent',
  })}>
    <span style={{ fontSize: 16 }}>{icon}</span>
    {label}
  </NavLink>
);

export default function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => { logout(); navigate('/auth'); };

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden' }}>
      {/* Sidebar */}
      <aside style={{
        width: 220, flexShrink: 0,
        background: 'var(--bg-1)',
        borderRight: '1px solid var(--border)',
        display: 'flex', flexDirection: 'column',
        padding: '20px 12px',
      }}>
        {/* Logo */}
        <div style={{ padding: '4px 12px 24px', borderBottom: '1px solid var(--border)', marginBottom: 16 }}>
          <div style={{
            fontFamily: 'var(--font-mono)', fontSize: 15, fontWeight: 700,
            color: 'var(--text)', letterSpacing: '-0.02em',
            display: 'flex', alignItems: 'center', gap: 8
          }}>
            <div style={{
              width: 28, height: 28, background: 'var(--accent)',
              borderRadius: 7, display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 14
            }}>⚡</div>
            TaskFlow
          </div>
        </div>

        {/* Nav */}
        <nav style={{ display: 'flex', flexDirection: 'column', gap: 2, flex: 1 }}>
          <NavItem to="/" icon="◉" label="Dashboard" />
          <NavItem to="/projects" icon="⬡" label="Projects" />
          <NavItem to="/tasks" icon="⊡" label="All Tasks" />
          {user?.role === 'admin' && <NavItem to="/users" icon="◎" label="Users" />}
        </nav>

        {/* User profile */}
        <div style={{
          borderTop: '1px solid var(--border)', paddingTop: 16,
          display: 'flex', alignItems: 'center', gap: 10
        }}>
          <Avatar name={user?.name} color={user?.avatar_color} size={32} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 13, fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {user?.name}
            </div>
            <div style={{ fontSize: 11, color: 'var(--text-3)', textTransform: 'capitalize' }}>
              {user?.role}
            </div>
          </div>
          <button onClick={handleLogout} style={{
            background: 'none', border: 'none', color: 'var(--text-3)',
            cursor: 'pointer', fontSize: 16, padding: 4, borderRadius: 4,
            transition: 'color 0.15s',
          }} title="Logout" onMouseOver={e => e.target.style.color = 'var(--red)'}
            onMouseOut={e => e.target.style.color = 'var(--text-3)'}>⏻</button>
        </div>
      </aside>

      {/* Main content */}
      <main style={{ flex: 1, overflow: 'auto', background: 'var(--bg)' }}>
        <Outlet />
      </main>
    </div>
  );
}
