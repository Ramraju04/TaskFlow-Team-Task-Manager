const BASE_URL = import.meta.env.VITE_API_URL || '/api';

const getToken = () => localStorage.getItem('taskflow_token');

const request = async (method, path, body = null) => {
  const headers = { 'Content-Type': 'application/json' };
  const token = getToken();
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(`${BASE_URL}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : null,
  });

  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Request failed');
  return data;
};

export const api = {
  // Auth
  signup: (data) => request('POST', '/auth/signup', data),
  login: (data) => request('POST', '/auth/login', data),
  me: () => request('GET', '/auth/me'),

  // Projects
  getProjects: () => request('GET', '/projects'),
  getProject: (id) => request('GET', `/projects/${id}`),
  createProject: (data) => request('POST', '/projects', data),
  updateProject: (id, data) => request('PUT', `/projects/${id}`, data),
  deleteProject: (id) => request('DELETE', `/projects/${id}`),
  addMember: (projectId, data) => request('POST', `/projects/${projectId}/members`, data),
  removeMember: (projectId, userId) => request('DELETE', `/projects/${projectId}/members/${userId}`),

  // Tasks
  getTasks: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return request('GET', `/tasks${query ? '?' + query : ''}`);
  },
  getDashboard: () => request('GET', '/tasks/dashboard'),
  createTask: (data) => request('POST', '/tasks', data),
  updateTask: (id, data) => request('PUT', `/tasks/${id}`, data),
  deleteTask: (id) => request('DELETE', `/tasks/${id}`),
  getComments: (taskId) => request('GET', `/tasks/${taskId}/comments`),
  addComment: (taskId, content) => request('POST', `/tasks/${taskId}/comments`, { content }),

  // Users
  getUsers: (search = '') => request('GET', `/users${search ? '?search=' + search : ''}`),
  updateRole: (id, role) => request('PUT', `/users/${id}/role`, { role }),
};
