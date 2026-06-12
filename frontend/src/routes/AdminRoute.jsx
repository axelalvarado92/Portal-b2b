import { Navigate } from "react-router-dom";

import { useAuth }
  from "../context/AuthContext";

export default function AdminRoute({
  children,
}) {

  const {
    user,
    loading,
  } = useAuth();

  if (loading) {

    return <p>Cargando...</p>;

  }

  if (
    user?.role !== "admin"
  ) {

    return (
      <Navigate
        to="/dashboard"
        replace
      />
    );

  }

  return children;

}