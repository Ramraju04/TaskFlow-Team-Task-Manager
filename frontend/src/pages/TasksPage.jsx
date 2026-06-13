import { useState, useEffect } from 'react';
import { api } from '../api';
import { useAuth } from '../context/AuthContext';
import { TaskModal } from '../components/TaskModal';
import Avatar from '../components/Avatar';

const PRIORITY_COLORS = { low: 'var(--green)', medium: 'var(--blue)', high: 'var(--orange)', critical: 'var(--red)' };
const STATUS_LABELS = { todo: 'To Do', in_progress: 'In Progress', review: 'Review', done: 'Done' };
const STATUS_COLORS = { todo: 'var(--text-3)', in_progress: 'var(--blue)', review: 'var(--yellow)', done: 'var(--green)' };

export default function TasksPage() {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ status: '', priority: '' });
  const [selectedTask, setSelectedTask] = useState(null);
  const [showNewTask, setShowNewTask] = useState(false);
  const { user } = useAuth();

  const loadTasks = () => {
    const params = {};
    if (filters.status) params.status = filters.status;
    if (filters.priority) params.priority = filters.priority;
    api.getTasks(params).then(({ tasks }) => setTasks(tasks)).finally(() => setLoading(false));
  };

  useEffect(() => { loadTasks(); }, [filters]);

  const handleSave = (saved) => {
    setTasks(prev => {
      const idx = prev.findIndex(t => t.id === saved.id);
      if (idx >= 0) { const n = [...prev]; n[idx] = saved; return n; }
      return [saved, ...prev];
    });
  };

  const handleDelete = (id) => setTasks(prev => prev.filter(t => t.id !== id));

  return (
    <div style={{ padding: 32, maxWidth: 1100, margin: '0 auto' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 22, fontFamily: 'var(--font-mono)', marginBottom: 4 }}>All Tasks</h1>
          <p style={{ color: 'var(--text-3)', fontSize: 13 }}>{tasks.length} task{tasks.length !== 1 ? 's' : ''}</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowNewTask(true)}>+ New Task</button>
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
        <select className="input" style={{ width: 'auto' }} value={filters.status}
          onChange={e => setFilters(f => ({ ...f, status: e.target.value }))}>
          <option value="">All Statuses</option>
          <option value="todo">To Do</option>
          <option value="in_progress">In Progress</option>
          <option value="review">Review</option>
          <option value="done">Done</option>
        </select>
        <select className="input" style={{ width: 'auto' }} value={filters.priority}
          onChange={e => setFilters(f => ({ ...f, priority: e.target.value }))}>
          <option value="">All Priorities</option>
          <option value="low">Low</option>
          <option value="medium">Medium</option>
          <option value="high">High</option>
          <option value="critical">Critical</option>
        </select>
        {(filters.status || filters.priority) && (
          <button className="btn btn-ghost btn-sm" onClick={() => setFilters({ status: '', priority: '' })}>
            Clear filters
          </button>
        )}
      </div>

      {/* Table */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--border)' }}>
              {['Task', 'Project', 'Status', 'Priority', 'Assignee', 'Due Date'].map(h => (
                <th key={h} style={{
                  padding: '12px 16px', textAlign: 'left', fontSize: 11,
                  color: 'var(--text-3)', fontWeight: 600,
                  textTransform: 'uppercase', letterSpacing: '0.06em'
                }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={6} style={{ padding: 40, textAlign: 'center' }}>
                <div className="spinner" style={{ margin: '0 auto' }} />
              </td></tr>
            ) : tasks.length === 0 ? (
              <tr><td colSpan={6}>
                <div className="empty-state"><h3>No tasks found</h3><p>Create a task to get started</p></div>
              </td></tr>
            ) : tasks.map(task => {
              const isOverdue = task.due_date && new Date(task.due_date) < new Date() && task.status !== 'done';
              return (
                <tr key={task.id} onClick={() => setSelectedTask(task)}
                  style={{ borderBottom: '1px solid var(--border)', cursor: 'pointer', transition: 'background 0.1s' }}
                  onMouseOver={e => e.currentTarget.style.background = 'var(--bg-2)'}
                  onMouseOut={e => e.currentTarget.style.background = 'transparent'}>
                  <td style={{ padding: '12px 16px', maxWidth: 300 }}>
                    <div style={{ fontSize: 13, fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {task.title}
                    </div>
                  </td>
                  <td style={{ padding: '12px 16px' }}>
                    <span style={{
                      background: (task.project_color || '#6366f1') + '22',
                      color: task.project_color || '#6366f1',
                      padding: '3px 8px', borderRadius: 5, fontSize: 11, fontWeight: 500,
                      whiteSpace: 'nowrap'
                    }}>{task.project_name}</span>
                  </td>
                  <td style={{ padding: '12px 16px' }}>
                    <span style={{ color: STATUS_COLORS[task.status], fontSize: 12, fontWeight: 500 }}>
                      {STATUS_LABELS[task.status]}
                    </span>
                  </td>
                  <td style={{ padding: '12px 16px' }}>
                    <span style={{ color: PRIORITY_COLORS[task.priority], fontSize: 13 }}>
                      ● <span style={{ fontSize: 12 }}>{task.priority}</span>
                    </span>
                  </td>
                  <td style={{ padding: '12px 16px' }}>
                    {task.assignee_name
                      ? <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <Avatar name={task.assignee_name} color={task.assignee_color} size={24} />
                          <span style={{ fontSize: 12, color: 'var(--text-2)' }}>{task.assignee_name}</span>
                        </div>
                      : <span style={{ color: 'var(--text-3)', fontSize: 12 }}>—</span>}
                  </td>
                  <td style={{ padding: '12px 16px' }}>
                    <span style={{ fontSize: 12, color: isOverdue ? 'var(--red)' : 'var(--text-3)' }}>
                      {task.due_date ? new Date(task.due_date).toLocaleDateString() : '—'}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {selectedTask && (
        <TaskModal task={selectedTask} onClose={() => setSelectedTask(null)}
          onSave={handleSave} onDelete={handleDelete} />
      )}
      {showNewTask && (
        <TaskModal onClose={() => setShowNewTask(false)} onSave={handleSave} onDelete={handleDelete} />
      )}
    </div>
  );
}
