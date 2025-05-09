// src/routes/NavigateToRoleDashboard.jsx
import { useSelector } from 'react-redux';
import { Navigate } from 'react-router-dom';

export default function NavigateToRoleDashboard() {
  const { user } = useSelector(s => s.auth);

  switch (user.role) {
    case 'admin':
      return <Navigate to="/admin/dashboard" replace />;
    case 'agent':
      return <Navigate to="/agent/dashboard" replace />;
    case 'user':
      return <Navigate to="/user/dashboard" replace />;
    default:
      return <Navigate to="/login" replace />;
  }
}
