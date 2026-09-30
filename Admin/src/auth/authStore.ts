// Admin/src/auth/authStore.ts
import { useState, useEffect } from 'react';

interface AdminAuthState {
  isAuthenticated: boolean;
  token: string | null;
  user: { name: string; role: 'Doctor' | 'Admin' } | null;
}

let authState: AdminAuthState = {
  isAuthenticated: !!localStorage.getItem('healorithm_token'),
  token: localStorage.getItem('healorithm_token'),
  user: { name: 'Dr. Arjun Verma', role: 'Doctor' }
};

const listeners = new Set<() => void>();

export function useAdminAuth() {
  const [state, setState] = useState(authState);

  useEffect(() => {
    const listener = () => setState({ ...authState });
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  }, []);

  const login = (email: string, pass: string) => {
    const dummyToken = 'jwt_sample_token_' + Date.now();
    localStorage.setItem('healorithm_token', dummyToken);
    authState = {
      isAuthenticated: true,
      token: dummyToken,
      user: { name: 'Dr. Arjun Verma', role: 'Doctor' }
    };
    listeners.forEach(l => l());
  };

  const logout = () => {
    localStorage.removeItem('healorithm_token');
    authState = {
      isAuthenticated: false,
      token: null,
      user: null
    };
    listeners.forEach(l => l());
  };

  return { ...state, login, logout };
}
