import { useState, useEffect } from "react";
import Layout from "../../components/Layout";
import api from "../../api/axios";

export default function Empleados() {
  const [empleados, setEmpleados] = useState([]);
  const [sucursales, setSucursales] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busqueda, setBusqueda] = useState("");
  const [modalAbierto, setModalAbierto] = useState(false);
  const [empleadoEditando, setEmpleadoEditando] = useState(null);
  const [error, setError] = useState("");
  const [guardando, setGuardando] = useState(false);

  const [form, setForm] = useState({
    email: "", password: "", role: "cajero", sucursal_id: ""
  });

  const roles = [
    { value: "cajero", label: "Cajero", color: "#0369a1", bg: "#f0f9ff" },
    { value: "gerente", label: "Gerente", color: "#7c3aed", bg: "#faf5ff" },
    { value: "empleado", label: "Empleado", color: "#d97706", bg: "#fffbeb" },
  ];

  const cargarDatos = async () => {
    try {
      const [empRes, sucRes] = await Promise.all([
        api.get("/usuarios/mis-empleados"),
        api.get("/sucursales/"),
      ]);
      setEmpleados(empRes.data);
      setSucursales(sucRes.data);
    } catch (err) {
      console.error("Error cargando empleados:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { cargarDatos(); }, []);

  const abrirModalCrear = () => {
    setEmpleadoEditando(null);
    setForm({ email: "", password: "", role: "cajero", sucursal_id: "" });
    setError("");
    setModalAbierto(true);
  };

  const abrirModalEditar = (emp) => {
    setEmpleadoEditando(emp);
    setForm({ email: emp.email, password: "", role: emp.role, sucursal_id: emp.sucursal_id || "" });
    setError("");
    setModalAbierto(true);
  };

  const handleGuardar = async (e) => {
    e.preventDefault();
    setGuardando(true);
    setError("");
    try {
      const datos = { ...form, sucursal_id: parseInt(form.sucursal_id) };
      if (empleadoEditando) {
        await api.put(`/usuarios/${empleadoEditando.id}`, datos);
      } else {
        await api.post("/usuarios/crear-empleado", datos);
      }
      setModalAbierto(false);
      cargarDatos();
    } catch (err) {
      setError(err.response?.data?.detail || "Error al guardar el empleado");
    } finally {
      setGuardando(false);
    }
  };

  const handleEliminar = async (id) => {
    if (!confirm("¿Seguro que deseas eliminar este empleado?")) return;
    try {
      await api.delete(`/usuarios/${id}`);
      cargarDatos();
    } catch (err) {
      alert(err.response?.data?.detail || "Error al eliminar");
    }
  };

  const getRol = (role) => roles.find(r => r.value === role) || { label: role, color: "#6b7280", bg: "#f3f4f6" };

  const empleadosFiltrados = empleados.filter(e =>
    e.email.toLowerCase().includes(busqueda.toLowerCase())
  );

  return (
    <Layout>
      {/* HEADER */}
      <div style={styles.header}>
        <div>
          <h1 style={styles.title}>Gestión de Empleados</h1>
          <p style={styles.subtitle}>{empleados.length} empleados registrados</p>
        </div>
        <button onClick={abrirModalCrear} style={styles.btnPrimario}>+ Nuevo empleado</button>
      </div>

      {/* STATS ROLES */}
      <div style={styles.statsGrid}>
        {roles.map(r => (
          <div key={r.value} style={{ ...styles.statCard, backgroundColor: r.bg, borderColor: r.color + "40" }}>
            <span style={{ ...styles.statNum, color: r.color }}>
              {empleados.filter(e => e.role === r.value).length}
            </span>
            <span style={styles.statLabel}>{r.label}s</span>
          </div>
        ))}
        <div style={{ ...styles.statCard, backgroundColor: "#f0fdf4", borderColor: "#16a34a40" }}>
          <span style={{ ...styles.statNum, color: "#16a34a" }}>{empleados.length}</span>
          <span style={styles.statLabel}>Total</span>
        </div>
      </div>

      {/* BÚSQUEDA */}
      <div style={styles.searchBar}>
        <span>🔍</span>
        <input type="text" placeholder="Buscar por correo..." value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)} style={styles.searchInput} />
      </div>

      {/* TABLA */}
      <div style={styles.tableCard}>
        {loading ? (
          <div style={styles.emptyBox}>Cargando empleados...</div>
        ) : empleadosFiltrados.length === 0 ? (
          <div style={styles.emptyBox}>
            <p style={{ fontSize: "48px", margin: "0 0 12px 0" }}>👨‍💼</p>
            <p>No hay empleados registrados</p>
            <button onClick={abrirModalCrear} style={styles.btnPrimario}>Crear primer empleado</button>
          </div>
        ) : (
          <table style={styles.table}>
            <thead>
              <tr>
                {["Empleado", "Rol", "Sucursal", "Acciones"].map(h => (
                  <th key={h} style={styles.th}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {empleadosFiltrados.map((emp, i) => {
                const rol = getRol(emp.role);
                const sucursal = sucursales.find(s => s.id === emp.sucursal_id);
                return (
                  <tr key={emp.id} style={{ backgroundColor: i % 2 === 0 ? "#f9fafb" : "#fff" }}>
                    <td style={styles.td}>
                      <div style={styles.empAvatar}>
                        <div style={{ ...styles.avatar, backgroundColor: rol.color + "20", color: rol.color }}>
                          {emp.email[0].toUpperCase()}
                        </div>
                        <div>
                          <div style={styles.empEmail}>{emp.email}</div>
                          <div style={styles.empId}>ID: {emp.id}</div>
                        </div>
                      </div>
                    </td>
                    <td style={styles.td}>
                      <span style={{ ...styles.rolBadge, backgroundColor: rol.bg, color: rol.color }}>
                        {rol.label}
                      </span>
                    </td>
                    <td style={styles.td}>
                      {sucursal ? (
                        <span style={styles.sucursalBadge}>{sucursal.nombre}</span>
                      ) : (
                        <span style={{ color: "#9ca3af", fontSize: "13px" }}>Sin asignar</span>
                      )}
                    </td>
                    <td style={styles.td}>
                      <div style={styles.acciones}>
                        <button onClick={() => abrirModalEditar(emp)} style={styles.btnEditar}>✏️ Editar</button>
                        <button onClick={() => handleEliminar(emp.id)} style={styles.btnEliminar}>🗑️</button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* MODAL */}
      {modalAbierto && (
        <div style={styles.overlay} onClick={() => setModalAbierto(false)}>
          <div style={styles.modal} onClick={e => e.stopPropagation()}>
            <div style={styles.modalHeader}>
              <h2 style={styles.modalTitle}>{empleadoEditando ? "Editar empleado" : "Nuevo empleado"}</h2>
              <button onClick={() => setModalAbierto(false)} style={styles.closeBtn}>✕</button>
            </div>

            <form onSubmit={handleGuardar} style={styles.modalForm}>
              <div style={styles.fieldGroup}>
                <label style={styles.label}>Correo electrónico</label>
                <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })}
                  placeholder="empleado@empresa.com" required disabled={!!empleadoEditando} style={{ ...styles.input, backgroundColor: empleadoEditando ? "#f9fafb" : "#fff" }}
                  onFocus={(e) => (e.target.style.borderColor = "#16a34a")}
                  onBlur={(e) => (e.target.style.borderColor = "#d1d5db")} />
              </div>

              <div style={styles.fieldGroup}>
                <label style={styles.label}>{empleadoEditando ? "Nueva contraseña (opcional)" : "Contraseña"}</label>
                <input type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })}
                  placeholder="Mínimo 8 caracteres" required={!empleadoEditando} style={styles.input}
                  onFocus={(e) => (e.target.style.borderColor = "#16a34a")}
                  onBlur={(e) => (e.target.style.borderColor = "#d1d5db")} />
              </div>

              <div style={styles.row}>
                <div style={{ ...styles.fieldGroup, flex: 1 }}>
                  <label style={styles.label}>Rol</label>
                  <select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })} style={styles.select}>
                    {roles.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
                  </select>
                </div>
                <div style={{ ...styles.fieldGroup, flex: 1 }}>
                  <label style={styles.label}>Sucursal</label>
                  <select value={form.sucursal_id} onChange={(e) => setForm({ ...form, sucursal_id: e.target.value })} required style={styles.select}>
                    <option value="">Seleccionar...</option>
                    {sucursales.map(s => <option key={s.id} value={s.id}>{s.nombre}</option>)}
                  </select>
                </div>
              </div>

              {/* Info de roles */}
              <div style={styles.rolesInfo}>
                <p style={styles.rolesInfoTitle}>Permisos por rol:</p>
                <p style={styles.rolesInfoItem}>🔵 <strong>Cajero:</strong> Ventas, clientes, caja</p>
                <p style={styles.rolesInfoItem}>🟣 <strong>Gerente:</strong> Todo + reportes y dashboard</p>
                <p style={styles.rolesInfoItem}>🟡 <strong>Empleado:</strong> Ventas y clientes básico</p>
              </div>

              {error && <div style={styles.errorBox}>⚠ {error}</div>}

              <div style={styles.modalFooter}>
                <button type="button" onClick={() => setModalAbierto(false)} style={styles.btnCancelar}>Cancelar</button>
                <button type="submit" disabled={guardando} style={{ ...styles.btnPrimario, opacity: guardando ? 0.7 : 1 }}>
                  {guardando ? "Guardando..." : empleadoEditando ? "Actualizar" : "Crear empleado"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </Layout>
  );
}

const styles = {
  header: { display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "24px" },
  title: { fontSize: "26px", fontWeight: "700", color: "#14532d", margin: "0 0 4px 0" },
  subtitle: { fontSize: "13px", color: "#6b7280", margin: 0 },
  btnPrimario: { padding: "10px 20px", backgroundColor: "#16a34a", color: "#fff", border: "none", borderRadius: "8px", cursor: "pointer", fontSize: "14px", fontWeight: "600" },
  statsGrid: { display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "12px", marginBottom: "20px" },
  statCard: { padding: "16px 20px", borderRadius: "10px", border: "1.5px solid", display: "flex", flexDirection: "column", gap: "4px" },
  statNum: { fontSize: "28px", fontWeight: "700" },
  statLabel: { fontSize: "12px", color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.5px" },
  searchBar: { display: "flex", alignItems: "center", gap: "10px", backgroundColor: "#fff", border: "1px solid #e5e7eb", borderRadius: "10px", padding: "10px 16px", marginBottom: "16px" },
  searchInput: { border: "none", outline: "none", fontSize: "14px", flex: 1 },
  tableCard: { backgroundColor: "#fff", borderRadius: "12px", border: "1px solid #e5e7eb", overflow: "hidden" },
  table: { width: "100%", borderCollapse: "collapse" },
  th: { textAlign: "left", padding: "12px 16px", fontSize: "11px", fontWeight: "700", color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.5px", borderBottom: "2px solid #e5e7eb", backgroundColor: "#f9fafb" },
  td: { padding: "12px 16px", fontSize: "14px", color: "#374151", borderBottom: "1px solid #f3f4f6" },
  empAvatar: { display: "flex", alignItems: "center", gap: "12px" },
  avatar: { width: "36px", height: "36px", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "16px", fontWeight: "700", flexShrink: 0 },
  empEmail: { fontSize: "14px", fontWeight: "600", color: "#111827" },
  empId: { fontSize: "11px", color: "#9ca3af" },
  rolBadge: { padding: "4px 12px", borderRadius: "20px", fontSize: "12px", fontWeight: "700" },
  sucursalBadge: { padding: "4px 12px", backgroundColor: "#f0fdf4", color: "#16a34a", borderRadius: "20px", fontSize: "12px", fontWeight: "600" },
  acciones: { display: "flex", gap: "8px" },
  btnEditar: { padding: "5px 10px", backgroundColor: "#f0fdf4", color: "#16a34a", border: "1px solid #bbf7d0", borderRadius: "6px", cursor: "pointer", fontSize: "12px" },
  btnEliminar: { padding: "5px 10px", backgroundColor: "#fef2f2", color: "#dc2626", border: "1px solid #fecaca", borderRadius: "6px", cursor: "pointer", fontSize: "12px" },
  emptyBox: { padding: "60px", textAlign: "center", color: "#6b7280", fontSize: "15px" },
  overlay: { position: "fixed", inset: 0, backgroundColor: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 },
  modal: { backgroundColor: "#fff", borderRadius: "16px", padding: "32px", width: "100%", maxWidth: "500px", maxHeight: "90vh", overflowY: "auto" },
  modalHeader: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" },
  modalTitle: { fontSize: "20px", fontWeight: "700", color: "#14532d", margin: 0 },
  closeBtn: { background: "none", border: "none", fontSize: "18px", cursor: "pointer", color: "#6b7280" },
  modalForm: { display: "flex", flexDirection: "column", gap: "16px" },
  fieldGroup: { display: "flex", flexDirection: "column", gap: "6px" },
  row: { display: "flex", gap: "12px" },
  label: { fontSize: "12px", fontWeight: "600", color: "#374151", textTransform: "uppercase", letterSpacing: "0.5px" },
  input: { padding: "10px 14px", fontSize: "14px", border: "1.5px solid #d1d5db", borderRadius: "8px", outline: "none", transition: "border-color 0.2s" },
  select: { padding: "10px 14px", fontSize: "14px", border: "1.5px solid #d1d5db", borderRadius: "8px", outline: "none", backgroundColor: "#fff" },
  rolesInfo: { backgroundColor: "#f9fafb", borderRadius: "8px", padding: "12px 16px" },
  rolesInfoTitle: { fontSize: "12px", fontWeight: "700", color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.5px", margin: "0 0 8px 0" },
  rolesInfoItem: { fontSize: "13px", color: "#374151", margin: "4px 0" },
  errorBox: { padding: "10px 14px", backgroundColor: "#fef2f2", border: "1px solid #fecaca", borderRadius: "8px", color: "#dc2626", fontSize: "13px" },
  modalFooter: { display: "flex", justifyContent: "flex-end", gap: "12px", marginTop: "8px" },
  btnCancelar: { padding: "10px 18px", backgroundColor: "#f3f4f6", color: "#374151", border: "none", borderRadius: "8px", cursor: "pointer", fontSize: "14px", fontWeight: "600" },
};