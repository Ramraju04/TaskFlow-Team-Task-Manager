import { useState, useEffect } from 'react';
import { api } from '../api';
import { useToast } from '../components/Toast';
import Avatar from '../components/Avatar';

export default function UsersPage() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const toast = useToast();

  useEffect(() => {
    const t = setTimeout(() => {
      api.getUsers(search).then(({ users }) => setUsers(users)).finally(() => setLoading(false));
    }, 300);
    return () => clearTimeout(t);
  }, [search]);

  const handleRoleChange = async (id, role) => {
    try {
      await api.updateRole(id, role);
      setUsers(prev => prev.map(u => u.id === id ? { ...u, role } : u));
      toast('Role updated!');
    } catch (e) { toast(e.message, 'error'); }
  };

  return (
    <div style={{ padding: 32, maxWidth: 900, margin: '0 auto' }}>
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 22, fontFamily: 'var(--font-mono)', marginBottom: 4 }}>Users</h1>
        <p style={{ color: 'var(--text-3)', fontSize: 13 }}>Manage user roles across the platform</p>
      </div>

      <div style={{ marginBottom: 16 }}>
        <input className="input" style={{ maxWidth: 300 }} placeholder="🔍 Search by name or email..."
          value={search} onChange={e => setSearch(e.target.value)} />
      </div>

      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--border)' }}>
              {['User', 'Email', 'Role', 'Joined'].map(h => (
                <th key={h} style={{ padding: '12px 16px', textAlign: 'left', fontSize: 11, color: 'var(--text-3)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={4} style={{ padding: 40, textAlign: 'center' }}>
                <div className="spinner" style={{ margin: '0 auto' }} />
              </td></tr>
            ) : users.map(u => (
              <tr key={u.id} style={{ borderBottom: '1px solid var(--border)' }}>
                <td style={{ padding: '12px 16px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <Avatar name={u.name} color={u.avatar_color} size={36} />
                    <span style={{ fontSize: 14, fontWeight: 500 }}>{u.name}</span>
                  </div>
                </td>
                <td style={{ padding: '12px 16px', color: 'var(--text-3)', fontSize: 13 }}>{u.email}</td>
                <td style={{ padding: '12px 16px' }}>
                  <select
                    value={u.role}
                    onChange={e => handleRoleChange(u.id, e.target.value)}
                    style={{
                      background: u.role === 'admin' ? 'rgba(124,92,252,0.1)' : 'var(--bg-2)',
                      color: u.role === 'admin' ? 'var(--accent-2)' : 'var(--text-2)',
                      border: `1px solid ${u.role === 'admin' ? 'rgba(124,92,252,0.3)' : 'var(--border)'}`,
                      borderRadius: 6, padding: '4px 8px', fontSize: 12, fontWeight: 600,
                      cursor: 'pointer', outline: 'none', textTransform: 'uppercase', letterSpacing: '0.04em'
                    }}>
                    <option value="member">Member</option>
                    <option value="admin">Admin</option>
                  </select>
                </td>
                <td style={{ padding: '12px 16px', color: 'var(--text-3)', fontSize: 12 }}>
                  {new Date(u.created_at).toLocaleDateString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
