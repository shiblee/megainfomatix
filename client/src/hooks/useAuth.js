import { useContext } from 'react';
import { AuthContext } from '../context/AuthContext';

/** Access auth state/actions: const { user, isAuthenticated, login, logout } = useAuth(); */
export default function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used inside <AuthProvider>');
  return context;
}
