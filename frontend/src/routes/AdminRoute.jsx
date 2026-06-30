import { Navigate } from "react-router-dom";

import { useAuth }
  from "../context/AuthContext";

export default function AdminRoute({ children }) {
  const { user, loading } = useAuth();

  if (loading) return <p>Cargando...</p>;

  // Si no es admin, no lo mandes a '/dashboard' (que es de cliente), 
  // mándalo al login o a la home de usuario, pero no fuerces el dashboard de cliente.
  if (user?.role !== "admin") {
    return <Navigate to="/" replace />; 
  }

  return children;
}