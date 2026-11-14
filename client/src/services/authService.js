import { api } from './api';

export const authService = {
  login: async (credentials) => (await api.post('/auth/login', credentials)).data,
  register: async (details) => (await api.post('/auth/register', details)).data,
  me: async (options) => (await api.get('/auth/me', options)).data,
};
