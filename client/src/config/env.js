// Single source for build-time environment values (see .env / .env.example).
export const env = Object.freeze({
  apiUrl: (import.meta.env.VITE_API_URL || 'http://localhost:5050/api').replace(/\/+$/, ''),
  appName: import.meta.env.VITE_APP_NAME || 'MegaInfomatix',
  isDev: import.meta.env.DEV,
});
