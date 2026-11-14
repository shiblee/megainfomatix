import { api } from './api';

export const systemService = {
  getHealth: async (options) => (await api.get('/health', options)).data,
};
