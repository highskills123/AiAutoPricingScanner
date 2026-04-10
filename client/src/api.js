import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  timeout: 30000,
});

// Inject session ID into every request
api.interceptors.request.use((config) => {
  const sessionId = localStorage.getItem('scanner_session_id');
  if (sessionId) {
    config.headers['x-session-id'] = sessionId;
  }
  return config;
});

export default api;
