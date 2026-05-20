import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:5000/api',
  timeout: 30000,
});

const TOKEN_KEY = 'cad_token';

export const getToken = () => localStorage.getItem(TOKEN_KEY);
export const setToken = (t) => {
  if (t) localStorage.setItem(TOKEN_KEY, t);
  else localStorage.removeItem(TOKEN_KEY);
};

// Attach Bearer token to every request automatically
api.interceptors.request.use((config) => {
  const t = getToken();
  if (t) config.headers.Authorization = `Bearer ${t}`;
  return config;
});

// Auto-logout on 401 — handled by App.jsx through this callback
let onUnauthorized = null;
export const setUnauthorizedHandler = (fn) => { onUnauthorized = fn; };
api.interceptors.response.use(
  (r) => r,
  (err) => {
    if (err.response?.status === 401 && onUnauthorized) onUnauthorized();
    return Promise.reject(err);
  }
);

export const login = (username, password) =>
  api.post('/login', { username, password }).then(r => r.data);

export const logout = () => api.post('/logout').then(r => r.data).catch(() => {});

export const runQuery = (question) =>
  api.post('/query', { question }).then(r => r.data);

export const getHistory = () => api.get('/history').then(r => r.data);

export const sendFeedback = (query_id) =>
  api.post('/feedback', { query_id }).then(r => r.data);

// CSV needs the token in the URL since it's a plain <a href> download.
export const csvUrl = (query_id) =>
  `http://localhost:5000/api/export/csv?query_id=${query_id}&token=${encodeURIComponent(getToken() || '')}`;

export default api;
