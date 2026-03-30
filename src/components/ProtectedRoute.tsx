import { Navigate } from 'react-router-dom';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: string[];
}

function ProtectedRoute({ children, allowedRoles }: ProtectedRouteProps) {
  const token = localStorage.getItem('token');
  const role = localStorage.getItem('role');
  
  if (!token) {
    // Redirect to login if no token found
    return <Navigate to="/admin/login" replace />;
  }

  if (allowedRoles && allowedRoles.length > 0) {
    if (!role) {
      localStorage.removeItem('token');
      return <Navigate to="/admin/login" replace />;
    }

    if (!allowedRoles.includes(role)) {
      return <Navigate to={role === 'admin' ? '/admin/dashboard' : '/admin/game-results'} replace />;
    }
  }
  
  // Render children if authenticated
  return <>{children}</>;
}

export default ProtectedRoute;
