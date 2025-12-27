import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const defaultPathForRole = (role) => {
  const r = String(role || '').toLowerCase();
  if (r === 'admin') return '/dashboard';
  if (r === 'technician') return '/requests';
  if (r === 'employee') return '/requests';
  return '/login';
};

export default function RequireRole({ allowedRoles, children }) {
  const { isAuthenticated, user } = useAuth();
  const location = useLocation();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  if (!allowedRoles || allowedRoles.length === 0) return children;

  const role = String(user?.role || '').toLowerCase();
  const allowed = allowedRoles.map((r) => String(r).toLowerCase());
  if (!allowed.includes(role)) {
    return <Navigate to={defaultPathForRole(role)} replace />;
  }

  return children;
}
