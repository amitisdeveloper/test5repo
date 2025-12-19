import { Navigate } from 'react-router-dom';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

function ProtectedRoute({ children }: ProtectedRouteProps) {
  const token = localStorage.getItem('token');
  
  if (!token) {
    // Redirect to login if no token found
    return <Navigate to="/admin/login" replace />;
  }
  
  // Render children if authenticated
  return <>{children}</>;
}

export default ProtectedRoute;