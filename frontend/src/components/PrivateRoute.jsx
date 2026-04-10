import { Navigate } from "react-router-dom";

export default function PrivateRoute({ children, roles = [] }) {
  const token = localStorage.getItem("token");
  const role = localStorage.getItem("role");

  // Si no hay token, redirigir al login
  if (!token) {
    return <Navigate to="/login" replace />;
  }

  // Si se especifican roles y el usuario no tiene el rol correcto
  if (roles.length > 0 && !roles.includes(role)) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
}