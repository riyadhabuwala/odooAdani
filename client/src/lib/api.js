import axios from 'axios';

const baseURL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export const api = axios.create({
  baseURL,
  timeout: 15000,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('mms_token');
  if (token) {
    config.headers = config.headers || {};
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export async function loginRequest({ email, password }) {
  const res = await api.post('/api/auth/login', { email, password });
  return res.data;
}

export async function signupRequest({ full_name, email, password }) {
  const res = await api.post('/api/auth/signup', { full_name, email, password });
  return res.data;
}
