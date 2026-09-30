// App/src/auth/roleGuard.tsx
import React, { useEffect, useState } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { authStore, UserRole } from './authStore';

interface RoleGuardProps {
  allowedRole: UserRole;
  children?: React.ReactNode;
}

export default function RoleGuard({ allowedRole, children }: RoleGuardProps) {
  const [state, setState] = useState(authStore.getState());

  useEffect(() => {
    return authStore.subscribe(() => {
      setState({ ...authStore.getState() });
    });
  }, []);

  if (!state.isAuthenticated) {
    return <Navigate to={allowedRole === 'worker' ? '/worker/login' : '/patient/login'} replace />;
  }

  if (state.role !== allowedRole) {
    return <Navigate to={state.role === 'worker' ? '/worker' : '/patient'} replace />;
  }

  return children ? <>{children}</> : <Outlet />;
}
