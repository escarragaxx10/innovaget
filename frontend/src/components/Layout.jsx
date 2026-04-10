import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useTheme } from "../context/ThemeContext";

// ✅ Menú filtrado por rol
const menuAdmin = [
  { icon: "📊", label: "Dashboard", path: "/dashboard" },
  { icon: "📈", label: "Reportes", path: "/reportes" },
  { icon: "🛍️", label: "Productos", path: "/productos" },
  { icon: "🏷️", label: "Categorías", path: "/categorias" },
  { icon: "💰", label: "Cajas", path: "/cajas" },
  { icon: "🖥️", label: "Punto de Venta", path: "/caja" },
  { icon: "🧾", label: "Historial Ventas", path: "/ventas" },
  { icon: "🏧", label: "Historial Cajas", path: "/historial-cajas" },
  { icon: "📦", label: "Inventario", path: "/inventario" },
  { icon: "🛒", label: "Compras", path: "/compras" },
  { icon: "🚚", label: "Proveedores", path: "/proveedores" },
  { icon: "🏢", label: "Sucursales", path: "/sucursales" },
  { icon: "👨‍💼", label: "Empleados", path: "/empleados" },
  { icon: "👥", label: "Clientes", path: "/clientes" },
  { icon: "👤", label: "Mi Perfil", path: "/perfil" },
];

const menuCajero = [
  { icon: "💰", label: "Cajas", path: "/cajas" },
  { icon: "🖥️", label: "Punto de Venta", path: "/caja" },
  { icon: "👥", label: "Clientes", path: "/clientes" },
  { icon: "👤", label: "Mi Perfil", path: "/perfil" },
];

export default function Layout({ children }) {
  const navigate = useNavigate();
  const location = useLocation();
  const role = localStorage.getItem("role");
  const [collapsed, setCollapsed] = useState(false);
  const theme = useTheme();

  // ✅ Seleccionar menú según rol
  const menuItems = role === "admin" ? menuAdmin : menuCajero;

  const handleLogout = () => {
    localStorage.clear();
    navigate("/login");
  };

  return (
    <div style={{ display: "flex", height: "100vh", fontFamily: "'Georgia', serif", backgroundColor: theme.bg, transition: "background-color 0.3s" }}>
      {/* SIDEBAR */}
      <div style={{
        width: collapsed ? "70px" : "240px",
        background: theme.sidebar,
        display: "flex", flexDirection: "column",
        transition: "width 0.25s ease",
        overflow: "hidden", flexShrink: 0
      }}>
        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", gap: "12px", padding: "24px 16px 20px", borderBottom: "1px solid rgba(255,255,255,0.1)" }}>
          <div style={{ width: "38px", height: "38px", background: "rgba(255,255,255,0.15)", border: "1.5px solid rgba(255,255,255,0.3)", borderRadius: "8px", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <span style={{ fontSize: "14px", fontWeight: "bold", color: "#fff" }}>IG</span>
          </div>
          {!collapsed && (
            <div>
              <p style={{ fontSize: "15px", fontWeight: "700", margin: 0 }}>
                <span style={{ color: "#ffffff" }}>Innova</span>
                <span style={{ color: "#4ade80" }}>gét</span>
              </p>
              <p style={{ fontSize: "10px", color: "#4ade80", letterSpacing: "1.5px", margin: 0 }}>
                {role === "admin" ? "ADMINISTRADOR" : "CAJERO"}
              </p>
            </div>
          )}
          <button onClick={() => setCollapsed(!collapsed)}
            style={{ marginLeft: "auto", background: "none", border: "none", color: "rgba(255,255,255,0.5)", cursor: "pointer", fontSize: "14px", flexShrink: 0 }}>
            {collapsed ? "→" : "←"}
          </button>
        </div>

        {/* Menú filtrado por rol */}
        <nav style={{ flex: 1, padding: "12px 8px", display: "flex", flexDirection: "column", gap: "2px", overflowY: "auto" }}>
          {menuItems.map((item) => {
            const active = location.pathname === item.path;
            return (
              <button key={item.path} onClick={() => navigate(item.path)}
                style={{
                  display: "flex", alignItems: "center", gap: "12px",
                  padding: "10px 12px", borderRadius: "8px", border: "none",
                  cursor: "pointer", textAlign: "left", width: "100%", fontSize: "14px",
                  backgroundColor: active ? "rgba(74, 222, 128, 0.15)" : "transparent",
                  borderLeft: active ? "3px solid #4ade80" : "3px solid transparent",
                  color: active ? "#4ade80" : "rgba(255,255,255,0.65)",
                  transition: "all 0.15s",
                }}>
                <span style={{ fontSize: "16px", flexShrink: 0 }}>{item.icon}</span>
                {!collapsed && <span style={{ whiteSpace: "nowrap" }}>{item.label}</span>}
              </button>
            );
          })}
        </nav>

        {/* Footer sidebar */}
        <div style={{ padding: "16px 8px", borderTop: "1px solid rgba(255,255,255,0.1)", display: "flex", flexDirection: "column", gap: "8px" }}>
          <button onClick={theme.toggleDarkMode}
            style={{ display: "flex", alignItems: "center", gap: "12px", padding: "10px 12px", borderRadius: "8px", border: "none", background: "rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.8)", cursor: "pointer", width: "100%", fontSize: "14px" }}>
            <span style={{ flexShrink: 0 }}>{theme.darkMode ? "☀️" : "🌙"}</span>
            {!collapsed && <span>{theme.darkMode ? "Modo claro" : "Modo oscuro"}</span>}
          </button>
          <button onClick={handleLogout}
            style={{ display: "flex", alignItems: "center", gap: "12px", padding: "10px 12px", borderRadius: "8px", border: "none", background: "rgba(239,68,68,0.15)", color: "#fca5a5", cursor: "pointer", width: "100%", fontSize: "14px" }}>
            <span>🚪</span>
            {!collapsed && <span>Cerrar sesión</span>}
          </button>
        </div>
      </div>

      {/* CONTENIDO */}
      <div style={{ flex: 1, overflowY: "auto", padding: "32px", backgroundColor: theme.bg, transition: "background-color 0.3s" }}>
        {children}
      </div>
    </div>
  );
}