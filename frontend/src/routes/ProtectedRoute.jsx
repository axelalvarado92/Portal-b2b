import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function ProtectedRoute({
  children,
}) {

  const { isAuthenticated } = useAuth();

  console.log(
    "PROTECTED ROUTE:",
    isAuthenticated
  );

  if (!isAuthenticated) {

    console.log("REDIRECT LOGIN");

    return <Navigate to="/" replace />;
  }

  console.log("RENDER CHILDREN");

  return children;
}