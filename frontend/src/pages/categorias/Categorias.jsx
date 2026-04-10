import { useState, useEffect } from "react";
import Layout from "../../components/Layout";
import api from "../../api/axios";

export default function Categorias() {
  const [categorias, setCategorias] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalAbierto, setModalAbierto] = useState(false);
  const [nombre, setNombre] = useState("");
  const [error, setError] = useState("");
  const [guardando, setGuardando] = useState(false);

  const cargarDatos = async () => {
    try { const res = await api.get("/categorias/"); setCategorias(res.data); }
    catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  useEffect(() => { cargarDatos(); }, []);

  const handleGuardar = async (e) => {
    e.preventDefault(); setGuardando(true); setError("");
    try {
      await api.post("/categorias/", { nombre });
      setModalAbierto(false); setNombre(""); cargarDatos();
    } catch (err) { setError(err.response?.data?.detail || "Error al guardar"); }
    finally { setGuardando(false); }
  };

  const handleEliminar = async (id) => {
    if (!confirm("¿Eliminar esta categoría?")) return;
    try { await api.delete(`/categorias/${id}`); cargarDatos(); }
    catch (err) { alert(err.response?.data?.detail || "Error al eliminar"); }
  };

  const colores = ["#16a34a", "#0369a1", "#7c3aed", "#dc2626", "#d97706", "#0891b2", "#be185d", "#65a30d"];

  return (
    <Layout>
      <div style={styles.header}>
        <div>
          <h1 style={styles.title}>Categorías</h1>
          <p style={styles.subtitle}>{categorias.length} categorías registradas</p>
        </div>
        <button onClick={() => { setModalAbierto(true); setError(""); setNombre(""); }} style={styles.btnPrimario}>
          + Nueva categoría
        </button>
      </div>

      {loading ? (
        <div style={styles.empty}>Cargando categorías...</div>
      ) : categorias.length === 0 ? (
        <div style={styles.emptyCard}>
          <p style={{ fontSize: "48px", margin: "0 0 12px 0" }}>🏷️</p>
          <p>No hay categorías registradas</p>
          <p style={{ fontSize: "13px", color: "#9ca3af" }}>Las categorías te permiten organizar tus productos</p>
          <button onClick={() => setModalAbierto(true)} style={styles.btnPrimario}>Crear primera categoría</button>
        </div>
      ) : (
        <div style={styles.grid}>
          {categorias.map((cat, i) => (
            <div key={cat.id} style={{ ...styles.card, borderTop: `4px solid ${colores[i % colores.length]}` }}>
              <div style={styles.cardHeader}>
                <div style={{ ...styles.catIcon, backgroundColor: colores[i % colores.length] + "20", color: colores[i % colores.length] }}>
                  🏷️
                </div>
                <button onClick={() => handleEliminar(cat.id)} style={styles.btnEliminar}>🗑️</button>
              </div>
              <h3 style={styles.catNombre}>{cat.nombre}</h3>
              <p style={styles.catId}>ID: {cat.id}</p>
            </div>
          ))}
          <button onClick={() => { setModalAbierto(true); setError(""); setNombre(""); }} style={styles.cardNueva}>
            <span style={{ fontSize: "32px", color: "#9ca3af" }}>+</span>
            <span style={{ fontSize: "14px", color: "#9ca3af", fontWeight: "600" }}>Nueva categoría</span>
          </button>
        </div>
      )}

      {modalAbierto && (
        <div style={styles.overlay} onClick={() => setModalAbierto(false)}>
          <div style={styles.modal} onClick={e => e.stopPropagation()}>
            <div style={styles.modalHeader}>
              <h2 style={styles.modalTitle}>Nueva categoría</h2>
              <button onClick={() => setModalAbierto(false)} style={styles.closeBtn}>✕</button>
            </div>
            <form onSubmit={handleGuardar} style={styles.form}>
              <div style={styles.fieldGroup}>
                <label style={styles.label}>Nombre de la categoría</label>
                <input type="text" value={nombre} onChange={(e) => setNombre(e.target.value)}
                  placeholder="Ej: Calzado, Ropa, Electrónica..." required style={styles.input}
                  onFocus={(e) => (e.target.style.borderColor = "#16a34a")}
                  onBlur={(e) => (e.target.style.borderColor = "#d1d5db")} autoFocus />
              </div>
              {error && <div style={styles.errorBox}>⚠ {error}</div>}
              <div style={styles.modalFooter}>
                <button type="button" onClick={() => setModalAbierto(false)} style={styles.btnCancelar}>Cancelar</button>
                <button type="submit" disabled={guardando} style={{ ...styles.btnPrimario, opacity: guardando ? 0.7 : 1 }}>
                  {guardando ? "Guardando..." : "Crear categoría"}
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
  empty: { padding: "60px", textAlign: "center", color: "#6b7280" },
  emptyCard: { backgroundColor: "#fff", borderRadius: "12px", border: "1px solid #e5e7eb", padding: "60px", textAlign: "center", color: "#6b7280", display: "flex", flexDirection: "column", alignItems: "center", gap: "12px" },
  grid: { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: "16px" },
  card: { backgroundColor: "#fff", borderRadius: "12px", border: "1px solid #e5e7eb", padding: "20px", display: "flex", flexDirection: "column", gap: "10px" },
  cardHeader: { display: "flex", justifyContent: "space-between", alignItems: "center" },
  catIcon: { width: "40px", height: "40px", borderRadius: "10px", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "18px" },
  btnEliminar: { background: "none", border: "none", cursor: "pointer", fontSize: "16px", color: "#dc2626" },
  catNombre: { fontSize: "16px", fontWeight: "700", color: "#111827", margin: 0 },
  catId: { fontSize: "12px", color: "#9ca3af", margin: 0 },
  cardNueva: { backgroundColor: "#f9fafb", borderRadius: "12px", border: "2px dashed #d1d5db", padding: "20px", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "8px", cursor: "pointer", minHeight: "120px" },
  overlay: { position: "fixed", inset: 0, backgroundColor: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 },
  modal: { backgroundColor: "#fff", borderRadius: "16px", padding: "32px", width: "100%", maxWidth: "420px" },
  modalHeader: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" },
  modalTitle: { fontSize: "20px", fontWeight: "700", color: "#14532d", margin: 0 },
  closeBtn: { background: "none", border: "none", fontSize: "18px", cursor: "pointer", color: "#6b7280" },
  form: { display: "flex", flexDirection: "column", gap: "16px" },
  fieldGroup: { display: "flex", flexDirection: "column", gap: "6px" },
  label: { fontSize: "12px", fontWeight: "600", color: "#374151", textTransform: "uppercase", letterSpacing: "0.5px" },
  input: { padding: "10px 14px", fontSize: "14px", border: "1.5px solid #d1d5db", borderRadius: "8px", outline: "none", transition: "border-color 0.2s" },
  errorBox: { padding: "10px 14px", backgroundColor: "#fef2f2", border: "1px solid #fecaca", borderRadius: "8px", color: "#dc2626", fontSize: "13px" },
  modalFooter: { display: "flex", justifyContent: "flex-end", gap: "12px" },
  btnCancelar: { padding: "10px 18px", backgroundColor: "#f3f4f6", color: "#374151", border: "none", borderRadius: "8px", cursor: "pointer", fontSize: "14px", fontWeight: "600" },
};