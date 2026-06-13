import { useState, useEffect } from 'react';
import { api } from '../api';
import { useToast } from './Toast';
import Avatar from './Avatar';

const STATUSES = ['todo', 'in_progress', 'review', 'done'];
const PRIORITIES = ['low', 'medium', 'high', 'critical'];
const STATUS_LABELS = { todo: 'To Do', in_progress: 'In Progress', review: 'Review', done: 'Done' };
const PRIORITY_ICONS = { low: '▽', medium: '◇', high: '△', critical: '⚠' };
const PRIORITY_COLORS = { low: 'var(--green)', medium: 'var(--blue)', high: 'var(--orange)', critical: 'var(--red)' };

export function TaskModal({ task, projectId, members = [], onClose, onSave, onDelete }) {
  const isEdit = !!task;
  const [form, setForm] = useState({
    title: task?.title || '',
    description: task?.description || '',
    status: task?.status || 'todo',
    priority: task?.priority || 'medium',
    assignee_id: task?.assignee_id || '',
    due_date: task?.due_date || '',
    project_id: task?.project_id || projectId || '',
  });
  const [projects, setProjects] = useState([]);
  const [projectMembers, setProjectMembers] = useState(members);
  const [comments, setComments] = useState([]);
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(false);
  const [commentLoading, setCommentLoading] = useState(false);
  const toast = useToast();

  useEffect(() => {
    if (!projectId && !task?.project_id) {
      api.getProjects().then(({ projects }) => setProjects(projects));
    }
    if (isEdit) {
      api.getComments(task.id).then(({ comments }) => setComments(comments));
    }
  }, []);

  useEffect(() => {
    if (form.project_id && !projectId) {
      api.getProject(form.project_id).then(({ members }) => setProjectMembers(members));
    }
  }, [form.project_id]);

  const update = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleSave = async () => {
    if (!form.title.trim()) return toast('Title is required', 'error');
    setLoading(true);
    try {
      const payload = { ...form, assignee_id: form.assignee_id || null };
      let saved;
      if (isEdit) {
        const { task: t } = await api.updateTask(task.id, payload);
        saved = t;
      } else {
        const { task: t } = await api.createTask(payload);
        saved = t;
      }
      toast(isEdit ? 'Task updated!' : 'Task created!');
      onSave(saved);
      onClose();
    } catch (e) {
      toast(e.message, 'error');
    } finally { setLoading(false); }
  };

  const handleDelete = async () => {
    if (!confirm('Delete this task?')) return;
    try {
      await api.deleteTask(task.id);
      toast('Task deleted');
      onDelete(task.id);
      onClose();
    } catch (e) { toast(e.message, 'error'); }
  };

  const handleComment = async () => {
    if (!comment.trim()) return;
    setCommentLoading(true);
    try {
      const { comment: c } = await api.addComment(task.id, comment);
      setComments(prev => [...prev, c]);
      setComment('');
    } catch (e) { toast(e.message, 'error'); }
    finally { setCommentLoading(false); }
  };

  return (
    <div className="overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal" style={{ maxWidth: 600 }}>
        <div className="modal-header">
          <h2 className="modal-title">{isEdit ? 'Edit Task' : 'New Task'}</h2>
          <div style={{ display: 'flex', gap: 8 }}>
            {isEdit && <button className="btn btn-danger btn-sm" onClick={handleDelete}>Delete</button>}
            <button className="btn btn-ghost btn-icon" onClick={onClose}>✕</button>
          </div>
        </div>

        <div className="form-group">
          <label>Title *</label>
          <input className="input" placeholder="Task title" value={form.title}
            onChange={e => update('title', e.target.value)} autoFocus />
        </div>

        <div className="form-group">
          <label>Description</label>
          <textarea className="input" style={{ resize: 'vertical', minHeight: 70 }}
            placeholder="Describe this task..." value={form.description}
            onChange={e => update('description', e.target.value)} />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <div className="form-group">
            <label>Status</label>
            <select className="input" value={form.status} onChange={e => update('status', e.target.value)}>
              {STATUSES.map(s => <option key={s} value={s}>{STATUS_LABELS[s]}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label>Priority</label>
            <select className="input" value={form.priority} onChange={e => update('priority', e.target.value)}>
              {PRIORITIES.map(p => <option key={p} value={p}>{PRIORITY_ICONS[p]} {p.charAt(0).toUpperCase() + p.slice(1)}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label>Assignee</label>
            <select className="input" value={form.assignee_id} onChange={e => update('assignee_id', e.target.value)}>
              <option value="">Unassigned</option>
              {projectMembers.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label>Due Date</label>
            <input className="input" type="date" value={form.due_date}
              onChange={e => update('due_date', e.target.value)} />
          </div>
        </div>

        {!projectId && !isEdit && projects.length > 0 && (
          <div className="form-group">
            <label>Project *</label>
            <select className="input" value={form.project_id} onChange={e => update('project_id', e.target.value)}>
              <option value="">Select project...</option>
              {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </div>
        )}

        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 8, marginBottom: isEdit ? 16 : 0 }}>
          <button className="btn btn-ghost" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" onClick={handleSave} disabled={loading}>
            {loading ? <div className="spinner" style={{ width: 14, height: 14 }} /> : (isEdit ? 'Save Changes' : 'Create Task')}
          </button>
        </div>

        {/* Comments (edit mode) */}
        {isEdit && (
          <>
            <div className="divider" />
            <h4 style={{ fontSize: 13, fontWeight: 600, marginBottom: 12 }}>
              Comments ({comments.length})
            </h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 12, maxHeight: 200, overflowY: 'auto' }}>
              {comments.map(c => (
                <div key={c.id} style={{ display: 'flex', gap: 10 }}>
                  <Avatar name={c.user_name} color={c.avatar_color} size={28} />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 12, color: 'var(--text-2)', marginBottom: 3 }}>
                      <strong>{c.user_name}</strong>
                      <span style={{ color: 'var(--text-3)', marginLeft: 6 }}>
                        {new Date(c.created_at).toLocaleDateString()}
                      </span>
                    </div>
                    <div style={{ fontSize: 13, color: 'var(--text)', lineHeight: 1.5 }}>{c.content}</div>
                  </div>
                </div>
              ))}
              {comments.length === 0 && <div style={{ color: 'var(--text-3)', fontSize: 12 }}>No comments yet.</div>}
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <input className="input" placeholder="Add a comment..." value={comment}
                onChange={e => setComment(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleComment()} />
              <button className="btn btn-ghost" onClick={handleComment} disabled={commentLoading}>
                {commentLoading ? <div className="spinner" style={{ width: 14, height: 14 }} /> : 'Post'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
