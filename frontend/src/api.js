import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const authApi = {
  login: (email, password) => {
    const params = new URLSearchParams();
    params.append('username', email);
    params.append('password', password);
    return api.post('/auth/token', params);
  },
  signup: (email, password, name) => api.post('/auth/signup', { email, password, name }),
  verifyEmail: (token) => api.get(`/auth/verify-email?token=${token}`),
  me: () => api.get('/users/me'),
  updateMe: (data) => api.put('/users/me', data),
};

export const eventApi = {
  list: () => api.get('/events/'),
  shared: () => api.get('/events/shared'),
  get: (id) => api.get(`/events/${id}`),
  create: (data) => api.post('/events/', data),
  update: (id, data) => api.put(`/events/${id}`, data),
  delete: (id) => api.delete(`/events/${id}`),
  updateShares: (id, emails) => api.post(`/events/${id}/shares`, { emails }),
};

export const giftApi = {
  add: (eventId, data) => api.post(`/events/${eventId}/gifts`, data),
  update: (id, data) => api.put(`/gifts/${id}`, data),
  delete: (id) => api.delete(`/gifts/${id}`),
};

export default api;
