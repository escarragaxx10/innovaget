import { useState, useEffect } from "react";
import Layout from "../../components/Layout";
import api from "../../api/axios";

export default function Sucursales() {
  const [sucursales, setSucursales] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalAbierto, setModalAbierto] = useState(false);
  const [sucursalEditando, setSucursalEditando] = useState(null);
  const [error, setError] = useState("");
  const [guardando, setGuardando] = useState(false);

  const [form, setForm] = useState({ nombre: "", direccion: "", ciudad: "" });

  const cargarDatos = async () => {
    console.log("FORM:", form);
    try {
      const res = await api.get("/sucursales/");
      setSucursales(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { cargarDatos(); }, []);

  const abrirModalCrear = () => {
    setSucursalEditando(null);
    setForm({ nombre: "", direccion: "", ciudad: "" });
    setError("");
    setModalAbierto(true);
  };

  const abrirModalEditar = (suc) => {
    setSucursalEditando(suc);
    setForm({ nombre: suc.nombre, direccion: suc.direccion, ciudad: suc.ciudad });
    setError("");
    setModalAbierto(true);
  };

const handleGuardar = async (e) => {
  e.preventDefault();
  setGuardando(true);
  setError("");
  try {
    if (sucursalEditando) {
      await api.put(`/sucursales/${sucursalEditando.id}`, form);
    } else {
      await api.post("/sucursales/", form);
    }
    setModalAbierto(false);
    cargarDatos();
  } catch (err) {
    setError(
      typeof err.response?.data?.detail === "string"
        ? err.response.data.detail
        : err.response?.data?.detail?.[0]?.msg || "Error al guardar la sucursal"
    );
  } finally {
    setGuardando(false);
  }
};

  const handleEliminar = async (id) => {
    if (!confirm("¿Seguro que deseas eliminar esta sucursal?")) return;
    try {
      await api.delete(`/sucursales/${id}`);
      cargarDatos();
    } catch (err) {
      alert(err.response?.data?.detail || "Error al eliminar");
    }
  };

  return (
    <Layout>
      {/* HEADER */}
      <div style={styles.header}>
        <div>
          <h1 style={styles.title}>Sucursales</h1>
          <p style={styles.subtitle}>{sucursales.length} sede(s) registradas</p>
        </div>
        <button onClick={abrirModalCrear} style={styles.btnPrimario}>+ Nueva sucursal</button>
      </div>

      {/* TARJETAS */}
      {loading ? (
        <div style={styles.emptyBox}>Cargando sucursales...</div>
      ) : sucursales.length === 0 ? (
        <div style={styles.emptyBox}>
          <p style={{ fontSize: "48px", margin: "0 0 12px 0" }}>🏢</p>
          <p>No hay sucursales registradas</p>
          <button onClick={abrirModalCrear} style={styles.btnPrimario}>Crear primera sucursal</button>
        </div>
      ) : (
        <div style={styles.cardsGrid}>
          {sucursales.map((suc) => (
            <div key={suc.id} style={styles.card}>
              <div style={styles.cardHeader}>
                <div style={styles.cardIcon}>🏪</div>
                <div style={styles.cardActions}>
                  <button onClick={() => abrirModalEditar(suc)} style={styles.btnEditar}>✏️</button>
                  <button onClick={() => handleEliminar(suc.id)} style={styles.btnEliminar}>🗑️</button>
                </div>
              </div>
              <h3 style={styles.cardNombre}>{suc.nombre}</h3>
              <div style={styles.cardInfo}>
                <div style={styles.infoRow}>
                  <span style={styles.infoIcon}>📍</span>
                  <span style={styles.infoText}>{suc.direccion}</span>
                </div>
                <div style={styles.infoRow}>
                  <span style={styles.infoIcon}>🏙️</span>
                  <span style={styles.infoText}>{suc.ciudad}</span>
                </div>
              </div>
              <div style={styles.cardFooter}>
                
                <span style={styles.activaBadge}>✅ Activa</span>
              </div>
            </div>
          ))}

          {/* Tarjeta para agregar nueva */}
          <button onClick={abrirModalCrear} style={styles.cardNueva}>
            <span style={styles.cardNuevaIcon}>+</span>
            <span style={styles.cardNuevaText}>Agregar sucursal</span>
          </button>
        </div>
      )}

      {/* MODAL */}
      {modalAbierto && (
        <div style={styles.overlay} onClick={() => setModalAbierto(false)}>
          <div style={styles.modal} onClick={e => e.stopPropagation()}>
            <div style={styles.modalHeader}>
              <h2 style={styles.modalTitle}>{sucursalEditando ? "Editar sucursal" : "Nueva sucursal"}</h2>
              <button onClick={() => setModalAbierto(false)} style={styles.closeBtn}>✕</button>
            </div>
            <form onSubmit={handleGuardar} style={styles.modalForm}>
              <div style={styles.fieldGroup}>
                <label style={styles.label}>Nombre de la sucursal</label>
                <input type="text" value={form.nombre} onChange={(e) => setForm({ ...form, nombre: e.target.value })}
                  placeholder="Ej: Sede Centro" required style={styles.input}
                  onFocus={(e) => (e.target.style.borderColor = "#16a34a")}
                  onBlur={(e) => (e.target.style.borderColor = "#d1d5db")} />
              </div>
              <div style={styles.fieldGroup}>
                <label style={styles.label}>Dirección</label>
                <input type="text" value={form.direccion} onChange={(e) => setForm({ ...form, direccion: e.target.value })}
                  placeholder="Ej: Calle 10 #5-23" required style={styles.input}
                  onFocus={(e) => (e.target.style.borderColor = "#16a34a")}
                  onBlur={(e) => (e.target.style.borderColor = "#d1d5db")} />
              </div>
              <div style={styles.fieldGroup}>
                <label style={styles.label}>Ciudad</label>
                <input type="text" value={form.ciudad} onChange={(e) => setForm({ ...form, ciudad: e.target.value })}
                  placeholder="Ej: Sincelejo" required style={styles.input}
                  onFocus={(e) => (e.target.style.borderColor = "#16a34a")}
                  onBlur={(e) => (e.target.style.borderColor = "#d1d5db")} />
              </div>
              {error && <div style={styles.errorBox}>⚠ {error}</div>}
              <div style={styles.modalFooter}>
                <button type="button" onClick={() => setModalAbierto(false)} style={styles.btnCancelar}>Cancelar</button>
                <button type="submit" disabled={guardando} style={{ ...styles.btnPrimario, opacity: guardando ? 0.7 : 1 }}>
                  {guardando ? "Guardando..." : sucursalEditando ? "Actualizar" : "Crear sucursal"}
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
  header: { display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "28px" },
  title: { fontSize: "26px", fontWeight: "700", color: "#14532d", margin: "0 0 4px 0" },
  subtitle: { fontSize: "13px", color: "#6b7280", margin: 0 },
  btnPrimario: { padding: "10px 20px", backgroundColor: "#16a34a", color: "#fff", border: "none", borderRadius: "8px", cursor: "pointer", fontSize: "14px", fontWeight: "600" },
  emptyBox: { padding: "80px", textAlign: "center", color: "#6b7280", fontSize: "15px", backgroundColor: "#fff", borderRadius: "12px", border: "1px solid #e5e7eb" },
  cardsGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "20px" },
  card: { backgroundColor: "#fff", borderRadius: "14px", border: "1px solid #e5e7eb", padding: "24px", display: "flex", flexDirection: "column", gap: "12px" },
  cardHeader: { display: "flex", justifyContent: "space-between", alignItems: "center" },
  cardIcon: { fontSize: "32px" },
  cardActions: { display: "flex", gap: "8px" },
  btnEditar: { padding: "6px 10px", backgroundColor: "#f0fdf4", color: "#16a34a", border: "1px solid #bbf7d0", borderRadius: "6px", cursor: "pointer", fontSize: "14px" },
  btnEliminar: { padding: "6px 10px", backgroundColor: "#fef2f2", color: "#dc2626", border: "1px solid #fecaca", borderRadius: "6px", cursor: "pointer", fontSize: "14px" },
  cardNombre: { fontSize: "18px", fontWeight: "700", color: "#111827", margin: 0 },
  cardInfo: { display: "flex", flexDirection: "column", gap: "8px" },
  infoRow: { display: "flex", alignItems: "center", gap: "8px" },
  infoIcon: { fontSize: "14px" },
  infoText: { fontSize: "14px", color: "#6b7280" },
  cardFooter: { display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "4px", paddingTop: "12px", borderTop: "1px solid #f3f4f6" },
  idBadge: { fontSize: "12px", color: "#9ca3af" },
  activaBadge: { fontSize: "12px", color: "#16a34a", fontWeight: "600" },
  cardNueva: { backgroundColor: "#f9fafb", borderRadius: "14px", border: "2px dashed #d1d5db", padding: "24px", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "12px", cursor: "pointer", minHeight: "180px" },
  cardNuevaIcon: { fontSize: "32px", color: "#9ca3af" },
  cardNuevaText: { fontSize: "14px", color: "#9ca3af", fontWeight: "600" },
  overlay: { position: "fixed", inset: 0, backgroundColor: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 },
  modal: { backgroundColor: "#fff", borderRadius: "16px", padding: "32px", width: "100%", maxWidth: "460px" },
  modalHeader: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" },
  modalTitle: { fontSize: "20px", fontWeight: "700", color: "#14532d", margin: 0 },
  closeBtn: { background: "none", border: "none", fontSize: "18px", cursor: "pointer", color: "#6b7280" },
  modalForm: { display: "flex", flexDirection: "column", gap: "16px" },
  fieldGroup: { display: "flex", flexDirection: "column", gap: "6px" },
  label: { fontSize: "12px", fontWeight: "600", color: "#374151", textTransform: "uppercase", letterSpacing: "0.5px" },
  input: { padding: "10px 14px", fontSize: "14px", border: "1.5px solid #d1d5db", borderRadius: "8px", outline: "none", transition: "border-color 0.2s" },
  errorBox: { padding: "10px 14px", backgroundColor: "#fef2f2", border: "1px solid #fecaca", borderRadius: "8px", color: "#dc2626", fontSize: "13px" },
  modalFooter: { display: "flex", justifyContent: "flex-end", gap: "12px", marginTop: "8px" },
  btnCancelar: { padding: "10px 18px", backgroundColor: "#f3f4f6", color: "#374151", border: "none", borderRadius: "8px", cursor: "pointer", fontSize: "14px", fontWeight: "600" },
};