import { useState, useEffect } from "react";
import Layout from "../../components/Layout";
import api from "../../api/axios";

export default function Proveedores() {
  const [proveedores, setProveedores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busqueda, setBusqueda] = useState("");
  const [modalAbierto, setModalAbierto] = useState(false);
  const [proveedorEditando, setProveedorEditando] = useState(null);
  const [error, setError] = useState("");
  const [guardando, setGuardando] = useState(false);
  const empresa_id = parseInt(localStorage.getItem("empresa_id"));

  const [form, setForm] = useState({ nombre: "", nit: "", telefono: "", email: "", contacto: "", empresa_id });

  const cargarDatos = async () => {
    try { const res = await api.get("/proveedores/"); setProveedores(res.data); }
    catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  useEffect(() => { cargarDatos(); }, []);

  const abrirCrear = () => {
    setProveedorEditando(null);
    setForm({ nombre: "", nit: "", telefono: "", email: "", contacto: "", empresa_id });
    setError(""); setModalAbierto(true);
  };

  const abrirEditar = (p) => {
    setProveedorEditando(p);
    setForm({ nombre: p.nombre, nit: p.nit || "", telefono: p.telefono || "", email: p.email || "", contacto: p.contacto || "", empresa_id });
    setError(""); setModalAbierto(true);
  };

  const handleGuardar = async (e) => {
    e.preventDefault(); setGuardando(true); setError("");
    try {
      if (proveedorEditando) await api.put(`/proveedores/${proveedorEditando.id}`, form);
      else await api.post("/proveedores/", form);
      setModalAbierto(false); cargarDatos();
    } catch (err) { setError(err.response?.data?.detail || "Error al guardar"); }
    finally { setGuardando(false); }
  };

  const handleEliminar = async (id) => {
    if (!confirm("¿Eliminar este proveedor?")) return;
    try { await api.delete(`/proveedores/${id}`); cargarDatos(); }
    catch (err) { alert(err.response?.data?.detail || "Error al eliminar"); }
  };

  const filtrados = proveedores.filter(p => p.nombre.toLowerCase().includes(busqueda.toLowerCase()));

  return (
    <Layout>
      <div style={styles.header}>
        <div>
          <h1 style={styles.title}>Proveedores</h1>
          <p style={styles.subtitle}>{proveedores.length} proveedores registrados</p>
        </div>
        <button onClick={abrirCrear} style={styles.btnPrimario}>+ Nuevo proveedor</button>
      </div>

      <div style={styles.searchBar}>
        <span>🔍</span>
        <input type="text" placeholder="Buscar proveedor..." value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)} style={styles.searchInput} />
      </div>

      <div style={styles.tableCard}>
        {loading ? <div style={styles.empty}>Cargando...</div>
          : filtrados.length === 0 ? (
            <div style={styles.empty}>
              <p style={{ fontSize: "48px", margin: "0 0 12px 0" }}>🚚</p>
              <p>No hay proveedores registrados</p>
              <button onClick={abrirCrear} style={styles.btnPrimario}>Crear primer proveedor</button>
            </div>
          ) : (
            <table style={styles.table}>
              <thead><tr>{["Proveedor", "NIT", "Contacto", "Teléfono", "Correo", "Acciones"].map(h => <th key={h} style={styles.th}>{h}</th>)}</tr></thead>
              <tbody>
                {filtrados.map((p, i) => (
                  <tr key={p.id} style={{ backgroundColor: i % 2 === 0 ? "#f9fafb" : "#fff" }}>
                    <td style={styles.td}><span style={styles.nombre}>{p.nombre}</span></td>
                    <td style={styles.td}><span style={styles.badge}>{p.nit || "—"}</span></td>
                    <td style={styles.td}>{p.contacto || "—"}</td>
                    <td style={styles.td}>{p.telefono || "—"}</td>
                    <td style={styles.td}>{p.email || "—"}</td>
                    <td style={styles.td}>
                      <div style={styles.acciones}>
                        <button onClick={() => abrirEditar(p)} style={styles.btnEditar}>✏️</button>
                        <button onClick={() => handleEliminar(p.id)} style={styles.btnEliminar}>🗑️</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
      </div>

      {modalAbierto && (
        <div style={styles.overlay} onClick={() => setModalAbierto(false)}>
          <div style={styles.modal} onClick={e => e.stopPropagation()}>
            <div style={styles.modalHeader}>
              <h2 style={styles.modalTitle}>{proveedorEditando ? "Editar proveedor" : "Nuevo proveedor"}</h2>
              <button onClick={() => setModalAbierto(false)} style={styles.closeBtn}>✕</button>
            </div>
            <form onSubmit={handleGuardar} style={styles.form}>
              {[
                { label: "Nombre empresa", key: "nombre", type: "text", placeholder: "Distribuidora XYZ", required: true },
                { label: "NIT", key: "nit", type: "text", placeholder: "900123456-1" },
                { label: "Persona de contacto", key: "contacto", type: "text", placeholder: "Carlos Gómez" },
                { label: "Teléfono", key: "telefono", type: "text", placeholder: "3001234567" },
                { label: "Correo", key: "email", type: "email", placeholder: "proveedor@email.com" },
              ].map(f => (
                <div key={f.key} style={styles.fieldGroup}>
                  <label style={styles.label}>{f.label}</label>
                  <input type={f.type} value={form[f.key]} placeholder={f.placeholder} required={f.required}
                    onChange={(e) => setForm({ ...form, [f.key]: e.target.value })} style={styles.input}
                    onFocus={(e) => (e.target.style.borderColor = "#16a34a")}
                    onBlur={(e) => (e.target.style.borderColor = "#d1d5db")} />
                </div>
              ))}
              {error && <div style={styles.errorBox}>⚠ {error}</div>}
              <div style={styles.modalFooter}>
                <button type="button" onClick={() => setModalAbierto(false)} style={styles.btnCancelar}>Cancelar</button>
                <button type="submit" disabled={guardando} style={{ ...styles.btnPrimario, opacity: guardando ? 0.7 : 1 }}>
                  {guardando ? "Guardando..." : proveedorEditando ? "Actualizar" : "Crear proveedor"}
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
  searchBar: { display: "flex", alignItems: "center", gap: "10px", backgroundColor: "#fff", border: "1px solid #e5e7eb", borderRadius: "10px", padding: "10px 16px", marginBottom: "16px" },
  searchInput: { border: "none", outline: "none", fontSize: "14px", flex: 1 },
  tableCard: { backgroundColor: "#fff", borderRadius: "12px", border: "1px solid #e5e7eb", overflow: "hidden" },
  table: { width: "100%", borderCollapse: "collapse" },
  th: { textAlign: "left", padding: "12px 16px", fontSize: "11px", fontWeight: "700", color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.5px", borderBottom: "2px solid #e5e7eb", backgroundColor: "#f9fafb" },
  td: { padding: "12px 16px", fontSize: "14px", color: "#374151", borderBottom: "1px solid #f3f4f6" },
  nombre: { fontWeight: "600", color: "#111827" },
  badge: { padding: "3px 10px", backgroundColor: "#f0fdf4", color: "#16a34a", borderRadius: "20px", fontSize: "12px", fontWeight: "600" },
  acciones: { display: "flex", gap: "8px" },
  btnEditar: { padding: "5px 10px", backgroundColor: "#f0fdf4", color: "#16a34a", border: "1px solid #bbf7d0", borderRadius: "6px", cursor: "pointer", fontSize: "12px" },
  btnEliminar: { padding: "5px 10px", backgroundColor: "#fef2f2", color: "#dc2626", border: "1px solid #fecaca", borderRadius: "6px", cursor: "pointer", fontSize: "12px" },
  empty: { padding: "60px", textAlign: "center", color: "#6b7280", fontSize: "15px" },
  overlay: { position: "fixed", inset: 0, backgroundColor: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 },
  modal: { backgroundColor: "#fff", borderRadius: "16px", padding: "32px", width: "100%", maxWidth: "460px", maxHeight: "90vh", overflowY: "auto" },
  modalHeader: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" },
  modalTitle: { fontSize: "20px", fontWeight: "700", color: "#14532d", margin: 0 },
  closeBtn: { background: "none", border: "none", fontSize: "18px", cursor: "pointer", color: "#6b7280" },
  form: { display: "flex", flexDirection: "column", gap: "16px" },
  fieldGroup: { display: "flex", flexDirection: "column", gap: "6px" },
  label: { fontSize: "12px", fontWeight: "600", color: "#374151", textTransform: "uppercase", letterSpacing: "0.5px" },
  input: { padding: "10px 14px", fontSize: "14px", border: "1.5px solid #d1d5db", borderRadius: "8px", outline: "none", transition: "border-color 0.2s" },
  errorBox: { padding: "10px 14px", backgroundColor: "#fef2f2", border: "1px solid #fecaca", borderRadius: "8px", color: "#dc2626", fontSize: "13px" },
  modalFooter: { display: "flex", justifyContent: "flex-end", gap: "12px", marginTop: "8px" },
  btnCancelar: { padding: "10px 18px", backgroundColor: "#f3f4f6", color: "#374151", border: "none", borderRadius: "8px", cursor: "pointer", fontSize: "14px", fontWeight: "600" },
};