import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api';
import { useAuth } from '../context/AuthContext';
import Avatar from '../components/Avatar';

const PRIORITY_COLORS = { low: 'var(--green)', medium: 'var(--blue)', high: 'var(--orange)', critical: 'var(--red)' };
const STATUS_LABELS = { todo: 'To Do', in_progress: 'In Progress', review: 'Review', done: 'Done' };
const STATUS_COLORS = { todo: 'var(--text-3)', in_progress: 'var(--blue)', review: 'var(--yellow)', done: 'var(--green)' };

const StatCard = ({ label, value, color, icon }) => (
  <div className="card" style={{ textAlign: 'center', padding: '20px 16px' }}>
    <div style={{ fontSize: 28, marginBottom: 4 }}>{icon}</div>
    <div style={{ fontSize: 28, fontWeight: 700, fontFamily: 'var(--font-mono)', color: color || 'var(--text)' }}>
      {value ?? <div className="spinner" style={{ margin: '0 auto', width: 20, height: 20 }} />}
    </div>
    <div style={{ fontSize: 12, color: 'var(--text-3)', marginTop: 4 }}>{label}</div>
  </div>
);

export default function Dashboard() {
  const [data, setData] = useState(null);
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    api.getDashboard().then(setData).catch(console.error);
  }, []);

  const s = data?.stats;

  return (
    <div style={{ padding: 32, maxWidth: 1100, margin: '0 auto' }}>
      {/* Header */}
      <div style={{ marginBottom: 32 }}>
        <h1 style={{ fontSize: 24, fontFamily: 'var(--font-mono)', marginBottom: 6 }}>
          Good {new Date().getHours() < 12 ? 'morning' : 'afternoon'}, {user?.name?.split(' ')[0]} 👋
        </h1>
        <p style={{ color: 'var(--text-3)', fontSize: 14 }}>
          {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
        </p>
      </div>

      {/* Stats grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 12, marginBottom: 32 }}>
        <StatCard icon="⬡" label="Total Tasks" value={s?.total} />
        <StatCard icon="◌" label="To Do" value={s?.todo} color="var(--text-2)" />
        <StatCard icon="◍" label="In Progress" value={s?.in_progress} color="var(--blue)" />
        <StatCard icon="◎" label="Review" value={s?.review} color="var(--yellow)" />
        <StatCard icon="◉" label="Done" value={s?.done} color="var(--green)" />
        <StatCard icon="⚠" label="Overdue" value={s?.overdue} color="var(--red)" />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
        {/* My Tasks */}
        <div className="card" style={{ padding: 0 }}>
          <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <h3 style={{ fontSize: 14, fontWeight: 600 }}>My Open Tasks</h3>
            <button className="btn btn-ghost btn-sm" onClick={() => navigate('/tasks?assignee=me')}>View all</button>
          </div>
          <div style={{ padding: '8px 0' }}>
            {!data ? <div style={{ padding: 24, display: 'flex', justifyContent: 'center' }}><div className="spinner" /></div>
              : data.myTasks.length === 0 ? (
                <div className="empty-state" style={{ padding: 24 }}>
                  <div style={{ fontSize: 32, marginBottom: 8 }}>🎉</div>
                  <div style={{ color: 'var(--text-3)', fontSize: 13 }}>No open tasks assigned to you!</div>
                </div>
              ) : data.myTasks.map(task => (
                <div key={task.id} style={{
                  padding: '10px 20px', display: 'flex', alignItems: 'center', gap: 12,
                  borderBottom: '1px solid var(--border)', cursor: 'pointer', transition: 'background 0.1s',
                }} onMouseOver={e => e.currentTarget.style.background = 'var(--bg-2)'}
                  onMouseOut={e => e.currentTarget.style.background = 'transparent'}>
                  <div style={{ width: 6, height: 6, borderRadius: '50%', background: PRIORITY_COLORS[task.priority], flexShrink: 0 }} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{task.title}</div>
                    <div style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 2, display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span style={{ background: task.project_color + '22', color: task.project_color, padding: '1px 6px', borderRadius: 4, fontSize: 10 }}>{task.project_name}</span>
                      {task.due_date && <span style={{ color: new Date(task.due_date) < new Date() ? 'var(--red)' : 'var(--text-3)' }}>
                        Due {new Date(task.due_date).toLocaleDateString()}
                      </span>}
                    </div>
                  </div>
                  <span style={{ fontSize: 11, color: STATUS_COLORS[task.status], fontWeight: 500 }}>
                    {STATUS_LABELS[task.status]}
                  </span>
                </div>
              ))}
          </div>
        </div>

        {/* Recent Activity */}
        <div className="card" style={{ padding: 0 }}>
          <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)' }}>
            <h3 style={{ fontSize: 14, fontWeight: 600 }}>Recent Tasks</h3>
          </div>
          <div style={{ padding: '8px 0' }}>
            {!data ? <div style={{ padding: 24, display: 'flex', justifyContent: 'center' }}><div className="spinner" /></div>
              : data.recentTasks.length === 0 ? (
                <div className="empty-state" style={{ padding: 24 }}>
                  <div style={{ color: 'var(--text-3)', fontSize: 13 }}>No tasks yet.</div>
                </div>
              ) : data.recentTasks.map(task => (
                <div key={task.id} style={{
                  padding: '10px 20px', display: 'flex', alignItems: 'center', gap: 12,
                  borderBottom: '1px solid var(--border)',
                }}>
                  <div style={{
                    width: 28, height: 28, borderRadius: 6, flexShrink: 0,
                    background: task.project_color + '22',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 12, color: task.project_color
                  }}>⊡</div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{task.title}</div>
                    <div style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 2 }}>{task.project_name}</div>
                  </div>
                  {task.assignee_name ? (
                    <Avatar name={task.assignee_name} color={task.assignee_color} size={24} />
                  ) : <div style={{ width: 24, height: 24, borderRadius: '50%', border: '1.5px dashed var(--border)', flexShrink: 0 }} />}
                  <div style={{
                    width: 8, height: 8, borderRadius: '50%',
                    background: STATUS_COLORS[task.status], flexShrink: 0
                  }} />
                </div>
              ))}
          </div>
        </div>
      </div>
    </div>
  );
}
