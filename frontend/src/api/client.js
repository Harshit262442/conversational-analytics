import axios from 'axios';

// In production we hit the absolute Render URL; in dev we use the Vite proxy.
const API_BASE = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '') + '/api';

const api = axios.create({
  baseURL: API_BASE,
  timeout: 90000,   // 90s — Render free tier can cold-start for 30-50s
});

// Fire-and-forget ping to wake the backend from Render's idle suspend.
// Returns a promise so the caller can `await` if they want to gate the UI.
export const wakeBackend = () =>
  axios.get(`${API_BASE}/health`, { timeout: 90000 })
       .then(r => r.data)
       .catch(() => null);

// Kept for backwards-compat — currently unused but Login still gets a token
// in the response, we just don't enforce it.
const TOKEN_KEY = 'cad_token';
export const getToken = () => localStorage.getItem(TOKEN_KEY);
export const setToken = (t) => {
  if (t) localStorage.setItem(TOKEN_KEY, t);
  else localStorage.removeItem(TOKEN_KEY);
};

let onUnauthorized = null;
export const setUnauthorizedHandler = (fn) => { onUnauthorized = fn; };

export const login = (username, password) =>
  api.post('/login', { username, password }).then(r => r.data);

export const logout = () => Promise.resolve();   // no-op now

export const runQuery = (question, user) =>
  api.post('/query', {
    question,
    username: user?.username,
    department: user?.department,
  }).then(r => r.data);

export const getHistory = () => api.get('/history').then(r => r.data);

export const sendFeedback = (query_id) =>
  api.post('/feedback', { query_id }).then(r => r.data);

export const getInsights = ({ question, columns, rows }) =>
  api.post('/insights', { question, columns, rows }).then(r => r.data);

export const getDashboard = () => api.get('/dashboard').then(r => r.data);

export const getFollowups = ({ question, columns, rows }) =>
  api.post('/followups', { question, columns, rows }).then(r => r.data);

export const csvUrl = (query_id) => `/api/export/csv?query_id=${query_id}`;

export default api;
