import { Navigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

export default function ProtectedRoute({ children }: { children: JSX.Element }) {
  const { user, loading } = useAuth();

  if (loading) return <div className="text-center mt-12">Cargando...</div>;
  if (!user || !(user.email_confirmed_at || user.confirmed_at)) {
    return <Navigate to="/login" replace />;
  }
  return children;
}
