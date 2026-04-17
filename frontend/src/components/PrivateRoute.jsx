import { Navigate } from "react-router-dom";

function parseJwt(token) {
  try {
    const base64 = token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/");
    return JSON.parse(atob(base64));
  } catch {
    return null;
  }
}

export default function PrivateRoute({ children, roles = [] }) {
  const token = localStorage.getItem("token");

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  const payload = parseJwt(token);

  if (!payload) {
    localStorage.clear();
    return <Navigate to="/login" replace />;
  }

  // Verificar expiración
  const ahora = Math.floor(Date.now() / 1000);
  if (payload.exp && ahora > payload.exp) {
    localStorage.clear();
    return <Navigate to="/login" replace />;
  }

  const role = (payload.role || "").toLowerCase().trim();

  if (roles.length > 0 && !roles.map(r => r.toLowerCase()).includes(role)) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
}