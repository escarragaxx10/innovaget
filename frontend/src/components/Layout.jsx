import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useTheme } from "../context/ThemeContext";
import api from "../api/axios";

const menuAdmin = [
  { icon: "📊", label: "Dashboard", path: "/dashboard" },
  { icon: "📈", label: "Reportes", path: "/reportes" },
  { icon: "🛍️", label: "Productos", path: "/productos" },
  { icon: "🏷️", label: "Categorías", path: "/categorias" },
  { icon: "💰", label: "Cajas", path: "/cajas" },
  { icon: "🖥️", label: "Punto de Venta", path: "/caja" },
  { icon: "🏧", label: "Historial Cajas", path: "/historial-cajas" },
  { icon: "🧾", label: "Historial Ventas", path: "/ventas" },
  { icon: "📦", label: "Inventario", path: "/inventario" },
  { icon: "🛒", label: "Compras", path: "/compras" },
  { icon: "🏢", label: "Sucursales", path: "/sucursales" },
  { icon: "🚚", label: "Proveedores", path: "/proveedores" },
  { icon: "👥", label: "Clientes", path: "/clientes" },
  { icon: "👨‍💼", label: "Empleados", path: "/empleados" },
  { icon: "👤", label: "Mi Perfil", path: "/perfil" },
];

const menuCajero = [
  { icon: "📊", label: "Dashboard", path: "/dashboard" },
  { icon: "💰", label: "Cajas", path: "/cajas" },
  { icon: "🖥️", label: "Punto de Venta", path: "/caja" },
  { icon: "👤", label: "Mi Perfil", path: "/perfil" },
];

function parseJwt(token) {
  try {
    const base64 = token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/");
    return JSON.parse(atob(base64));
  } catch {
    return null;
  }
}

export default function Layout({ children }) {
  const navigate = useNavigate();
  const location = useLocation();
  const token = localStorage.getItem("token");
  const payload = parseJwt(token);
  const role = payload?.role || "";
  const [collapsed, setCollapsed] = useState(false);
  const theme = useTheme();

  const [alertas, setAlertas] = useState([]);
  const [mostrarAlertas, setMostrarAlertas] = useState(false);

  const cargarAlertas = async () => {
    try {
      const res = await api.get("/inventario/stock-critico?limite=5");
      setAlertas(res.data);
    } catch { setAlertas([]); }
  };

  useEffect(() => {
    if (role === "admin") {
      cargarAlertas();
      const interval = setInterval(cargarAlertas, 300000);
      return () => clearInterval(interval);
    }
  }, []);

  const menuItems = role === "admin" ? menuAdmin : menuCajero;

  const handleLogout = () => {
    theme.resetTheme();
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
        <div style={{ display: "flex", alignItems: "center", gap: "12px", padding: "24px 16px 20px", borderBottom: "1px solid rgba(255,255,255,0.1)" }}>
          <div style={{ width: "38px", height: "38px", background: "rgba(255,255,255,0.15)", border: "1.5px solid rgba(255,255,255,0.3)", borderRadius: "8px", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <span style={{ fontSize: "14px", fontWeight: "bold", color: "#fff" }}>IG</span>
          </div>
          {!collapsed && (
            <div>
              <p style={{ fontSize: "15px", fontWeight: "700", margin: 0 }}>
                <span style={{ color: "#ffffff" }}>Innova</span>
                <span style={{ color: "#4ade80" }}>get</span>
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

      <div style={{ flex: 1, overflowY: "auto", backgroundColor: theme.bg, transition: "background-color 0.3s", display: "flex", flexDirection: "column" }}>
        <div style={{
          display: "flex", justifyContent: "flex-end", alignItems: "center",
          padding: "12px 32px", borderBottom: `1px solid ${theme.border}`,
          backgroundColor: theme.bgCard, gap: "12px", flexShrink: 0
        }}>
          {role === "admin" && (
            <div style={{ position: "relative" }}>
              <button onClick={() => setMostrarAlertas(!mostrarAlertas)}
                style={{
                  position: "relative", background: alertas.length > 0 ? "#fef2f2" : theme.bgHover,
                  border: alertas.length > 0 ? "1px solid #fecaca" : `1px solid ${theme.border}`,
                  borderRadius: "10px", padding: "8px 12px", cursor: "pointer",
                  display: "flex", alignItems: "center", gap: "6px", fontSize: "14px",
                  color: alertas.length > 0 ? "#dc2626" : theme.textMuted,
                }}>
                <span style={{ fontSize: "18px" }}>🔔</span>
                {alertas.length > 0 && (
                  <span style={{
                    backgroundColor: "#dc2626", color: "#fff",
                    borderRadius: "50%", width: "20px", height: "20px",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: "11px", fontWeight: "700"
                  }}>
                    {alertas.length}
                  </span>
                )}
                {!collapsed && alertas.length === 0 && (
                  <span style={{ fontSize: "12px" }}>Sin alertas</span>
                )}
              </button>

              {mostrarAlertas && (
                <div style={{
                  position: "absolute", right: 0, top: "48px",
                  backgroundColor: theme.bgCard, border: `1px solid ${theme.border}`,
                  borderRadius: "12px", width: "320px", boxShadow: "0 10px 25px rgba(0,0,0,0.15)",
                  zIndex: 1000, overflow: "hidden"
                }}
                  onMouseLeave={() => setMostrarAlertas(false)}>
                  <div style={{ padding: "14px 16px", borderBottom: `1px solid ${theme.border}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ fontWeight: "700", fontSize: "14px", color: theme.text }}>⚠️ Stock crítico</span>
                    <button onClick={() => { navigate("/inventario"); setMostrarAlertas(false); }}
                      style={{ background: "none", border: "none", color: "#16a34a", cursor: "pointer", fontSize: "12px", fontWeight: "600" }}>
                      Ver inventario →
                    </button>
                  </div>

                  {alertas.length === 0 ? (
                    <div style={{ padding: "20px", textAlign: "center", color: theme.textMuted, fontSize: "14px" }}>
                      ✅ Todos los productos tienen stock suficiente
                    </div>
                  ) : (
                    <div style={{ maxHeight: "300px", overflowY: "auto" }}>
                      {alertas.map((p, i) => (
                        <div key={i} style={{
                          padding: "12px 16px", borderBottom: `1px solid ${theme.border}`,
                          display: "flex", justifyContent: "space-between", alignItems: "center"
                        }}>
                          <div>
                            <p style={{ fontSize: "13px", fontWeight: "600", color: theme.text, margin: "0 0 2px 0" }}>{p.nombre}</p>
                            <p style={{ fontSize: "11px", color: theme.textMuted, margin: 0 }}>{p.sucursal_nombre}</p>
                          </div>
                          <span style={{
                            padding: "3px 10px", borderRadius: "20px", fontSize: "12px", fontWeight: "700",
                            backgroundColor: p.stock <= 0 ? "#fef2f2" : "#fffbeb",
                            color: p.stock <= 0 ? "#dc2626" : "#f59e0b"
                          }}>
                            {p.stock <= 0 ? "Agotado" : `${p.stock} uds`}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}

                  <div style={{ padding: "10px 16px", textAlign: "center" }}>
                    <button onClick={cargarAlertas}
                      style={{ background: "none", border: "none", color: theme.textMuted, cursor: "pointer", fontSize: "12px" }}>
                      🔄 Actualizar
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          <div style={{
            padding: "6px 14px", borderRadius: "10px",
            backgroundColor: theme.bgHover, border: `1px solid ${theme.border}`,
            fontSize: "13px", color: theme.textMuted, display: "flex", alignItems: "center", gap: "8px"
          }}>
            <span>👤</span>
            <span style={{ color: theme.text, fontWeight: "600" }}>
              {role === "admin" ? "Administrador" : "Cajero"}
            </span>
          </div>
        </div>

        <div style={{ flex: 1, overflowY: "auto", padding: "32px" }}>
          {children}
        </div>
      </div>
    </div>
  );
}