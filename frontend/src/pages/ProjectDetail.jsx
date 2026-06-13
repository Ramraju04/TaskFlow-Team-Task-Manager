import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/Toast';
import Avatar from '../components/Avatar';
import { TaskModal } from '../components/TaskModal';

const COLUMNS = [
  { key: 'todo', label: 'To Do', color: 'var(--text-3)' },
  { key: 'in_progress', label: 'In Progress', color: 'var(--blue)' },
  { key: 'review', label: 'Review', color: 'var(--yellow)' },
  { key: 'done', label: 'Done', color: 'var(--green)' },
];

const PRIORITY_COLORS = { low: 'var(--green)', medium: 'var(--blue)', high: 'var(--orange)', critical: 'var(--red)' };
const PRIORITY_ICONS = { low: '▽', medium: '◇', high: '△', critical: '⚠' };

function AddMemberModal({ projectId, onClose, onAdd }) {
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('member');
  const [loading, setLoading] = useState(false);
  const toast = useToast();

  const handleAdd = async () => {
    if (!email.trim()) return;
    setLoading(true);
    try {
      const { member } = await api.addMember(projectId, { email: email.trim(), role });
      toast('Member added!');
      onAdd(member);
      onClose();
    } catch (e) { toast(e.message, 'error'); }
    finally { setLoading(false); }
  };

  return (
    <div className="overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal" style={{ maxWidth: 400 }}>
        <div className="modal-header">
          <h2 className="modal-title">Add Member</h2>
          <button className="btn btn-ghost btn-icon" onClick={onClose}>✕</button>
        </div>
        <div className="form-group">
          <label>User Email</label>
          <input className="input" type="email" placeholder="user@example.com"
            value={email} onChange={e => setEmail(e.target.value)} autoFocus />
        </div>
        <div className="form-group">
          <label>Role</label>
          <select className="input" value={role} onChange={e => setRole(e.target.value)}>
            <option value="member">Member</option>
            <option value="admin">Admin</option>
          </select>
        </div>
        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
          <button className="btn btn-ghost" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" onClick={handleAdd} disabled={loading}>
            {loading ? <div className="spinner" style={{ width: 14, height: 14 }} /> : 'Add Member'}
          </button>
        </div>
      </div>
    </div>
  );
}

function TaskCard({ task, onClick }) {
  const isOverdue = task.due_date && new Date(task.due_date) < new Date() && task.status !== 'done';
  return (
    <div onClick={onClick} style={{
      background: 'var(--bg-1)', border: '1px solid var(--border)',
      borderRadius: 8, padding: 12, cursor: 'pointer',
      transition: 'all 0.15s',
    }}
      onMouseOver={e => { e.currentTarget.style.borderColor = 'var(--border-light)'; e.currentTarget.style.transform = 'translateY(-1px)'; }}
      onMouseOut={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.transform = 'none'; }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8, marginBottom: 8 }}>
        <p style={{ fontSize: 13, fontWeight: 500, lineHeight: 1.4, flex: 1 }}>{task.title}</p>
        <span style={{ color: PRIORITY_COLORS[task.priority], fontSize: 12, flexShrink: 0 }}>
          {PRIORITY_ICONS[task.priority]}
        </span>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          {task.due_date && (
            <span style={{ fontSize: 10, color: isOverdue ? 'var(--red)' : 'var(--text-3)' }}>
              {isOverdue ? '⚠ ' : ''}
              {new Date(task.due_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
            </span>
          )}
        </div>
        {task.assignee_name
          ? <Avatar name={task.assignee_name} color={task.assignee_color} size={22} />
          : <div style={{ width: 22, height: 22, borderRadius: '50%', border: '1.5px dashed var(--border)' }} />}
      </div>
    </div>
  );
}

export default function ProjectDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const toast = useToast();
  const [project, setProject] = useState(null);
  const [members, setMembers] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedTask, setSelectedTask] = useState(null);
  const [showNewTask, setShowNewTask] = useState(false);
  const [showAddMember, setShowAddMember] = useState(false);
  const [activeTab, setActiveTab] = useState('board');

  useEffect(() => {
    Promise.all([
      api.getProject(id),
      api.getTasks({ project_id: id })
    ]).then(([{ project, members }, { tasks }]) => {
      setProject(project);
      setMembers(members);
      setTasks(tasks);
    }).catch(() => navigate('/projects'))
      .finally(() => setLoading(false));
  }, [id]);

  const tasksByStatus = COLUMNS.reduce((acc, col) => {
    acc[col.key] = tasks.filter(t => t.status === col.key);
    return acc;
  }, {});

  const handleTaskSave = (saved) => {
    setTasks(prev => {
      const idx = prev.findIndex(t => t.id === saved.id);
      if (idx >= 0) { const n = [...prev]; n[idx] = saved; return n; }
      return [saved, ...prev];
    });
  };

  const handleTaskDelete = (id) => setTasks(prev => prev.filter(t => t.id !== id));

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
      <div className="spinner" style={{ width: 28, height: 28 }} />
    </div>
  );

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <div style={{
        padding: '20px 32px', borderBottom: '1px solid var(--border)',
        background: 'var(--bg-1)', flexShrink: 0
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
          <button onClick={() => navigate('/projects')} style={{
            background: 'none', border: 'none', color: 'var(--text-3)', cursor: 'pointer', fontSize: 13, padding: 0
          }}>Projects</button>
          <span style={{ color: 'var(--text-3)' }}>/</span>
          <div style={{ width: 10, height: 10, borderRadius: 3, background: project?.color }} />
          <span style={{ fontSize: 13, color: 'var(--text-2)' }}>{project?.name}</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <h1 style={{ fontSize: 20, fontFamily: 'var(--font-mono)' }}>{project?.name}</h1>
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="btn btn-ghost btn-sm" onClick={() => setShowAddMember(true)}>+ Add Member</button>
            <button className="btn btn-primary btn-sm" onClick={() => setShowNewTask(true)}>+ New Task</button>
          </div>
        </div>
        {/* Tabs */}
        <div style={{ display: 'flex', gap: 4, marginTop: 16 }}>
          {[['board', 'Board'], ['members', `Members (${members.length})`]].map(([k, l]) => (
            <button key={k} onClick={() => setActiveTab(k)} style={{
              padding: '6px 14px', borderRadius: 6, border: '1px solid transparent',
              background: activeTab === k ? 'var(--bg-2)' : 'transparent',
              borderColor: activeTab === k ? 'var(--border)' : 'transparent',
              color: activeTab === k ? 'var(--text)' : 'var(--text-3)',
              fontSize: 13, cursor: 'pointer', transition: 'all 0.15s'
            }}>{l}</button>
          ))}
        </div>
      </div>

      {/* Content */}
      {activeTab === 'board' ? (
        <div style={{ flex: 1, overflow: 'auto', padding: 24 }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(240px, 1fr))', gap: 16, minWidth: 960 }}>
            {COLUMNS.map(col => (
              <div key={col.key}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={{ width: 8, height: 8, borderRadius: '50%', background: col.color }} />
                    <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-2)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                      {col.label}
                    </span>
                    <span style={{ background: 'var(--bg-2)', color: 'var(--text-3)', borderRadius: 100, padding: '1px 7px', fontSize: 11 }}>
                      {tasksByStatus[col.key].length}
                    </span>
                  </div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8, minHeight: 100 }}>
                  {tasksByStatus[col.key].map(task => (
                    <TaskCard key={task.id} task={task} onClick={() => setSelectedTask(task)} />
                  ))}
                  <button onClick={() => setShowNewTask(true)} style={{
                    background: 'transparent', border: '1px dashed var(--border)',
                    borderRadius: 8, padding: '10px 12px', color: 'var(--text-3)',
                    cursor: 'pointer', fontSize: 12, textAlign: 'left',
                    transition: 'all 0.15s'
                  }} onMouseOver={e => { e.currentTarget.style.borderColor = 'var(--accent)'; e.currentTarget.style.color = 'var(--accent)'; }}
                    onMouseOut={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.color = 'var(--text-3)'; }}>
                    + Add task
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div style={{ padding: 24, maxWidth: 600 }}>
          {members.map(m => (
            <div key={m.id} style={{
              display: 'flex', alignItems: 'center', gap: 12, padding: '12px 0',
              borderBottom: '1px solid var(--border)'
            }}>
              <Avatar name={m.name} color={m.avatar_color} size={36} />
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 14, fontWeight: 500 }}>{m.name}</div>
                <div style={{ fontSize: 12, color: 'var(--text-3)' }}>{m.email}</div>
              </div>
              <span style={{
                padding: '3px 10px', borderRadius: 100,
                background: m.role === 'admin' ? 'rgba(124,92,252,0.15)' : 'var(--bg-3)',
                color: m.role === 'admin' ? 'var(--accent-2)' : 'var(--text-3)',
                fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em'
              }}>{m.role}</span>
            </div>
          ))}
        </div>
      )}

      {/* Modals */}
      {selectedTask && (
        <TaskModal task={selectedTask} projectId={id} members={members}
          onClose={() => setSelectedTask(null)} onSave={handleTaskSave} onDelete={handleTaskDelete} />
      )}
      {showNewTask && (
        <TaskModal projectId={id} members={members}
          onClose={() => setShowNewTask(false)} onSave={handleTaskSave} onDelete={handleTaskDelete} />
      )}
      {showAddMember && (
        <AddMemberModal projectId={id} onClose={() => setShowAddMember(false)}
          onAdd={m => setMembers(prev => [...prev, m])} />
      )}
    </div>
  );
}
