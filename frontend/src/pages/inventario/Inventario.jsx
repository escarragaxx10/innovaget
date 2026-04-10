import { useState, useEffect } from "react";
import Layout from "../../components/Layout";
import api from "../../api/axios";

export default function Inventario() {
  const [stockCritico, setStockCritico] = useState([]);
  const [historial, setHistorial] = useState([]);
  const [productos, setProductos] = useState([]);
  const [productoSeleccionado, setProductoSeleccionado] = useState("");
  const [loading, setLoading] = useState(true);
  const [loadingHistorial, setLoadingHistorial] = useState(false);
  const [modalAjuste, setModalAjuste] = useState(false);
  const [error, setError] = useState("");
  const [guardando, setGuardando] = useState(false);
  const [tab, setTab] = useState("critico"); // "critico" | "kardex" | "ajuste"

  const [formAjuste, setFormAjuste] = useState({
    producto_id: "", tipo: "ENTRADA", cantidad: "", motivo: ""
  });

  const cargarDatos = async () => {
    try {
      const [criticoRes, prodRes] = await Promise.all([
        api.get("/inventario/stock-critico?limite=10"),
        api.get("/productos/"),
      ]);
      setStockCritico(criticoRes.data);
      setProductos(prodRes.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const cargarHistorial = async (productoId) => {
    if (!productoId) return;
    setLoadingHistorial(true);
    try {
      const res = await api.get(`/inventario/historial/${productoId}`);
      setHistorial(res.data);
    } catch (err) {
      setHistorial([]);
    } finally {
      setLoadingHistorial(false);
    }
  };

  useEffect(() => { cargarDatos(); }, []);

  useEffect(() => {
    if (productoSeleccionado) cargarHistorial(productoSeleccionado);
  }, [productoSeleccionado]);

  const handleAjuste = async (e) => {
    e.preventDefault();
    setGuardando(true);
    setError("");
    try {
      await api.post("/inventario/ajuste", {
        producto_id: parseInt(formAjuste.producto_id),
        tipo: formAjuste.tipo,
        cantidad: parseInt(formAjuste.cantidad),
        motivo: formAjuste.motivo,
      });
      setModalAjuste(false);
      setFormAjuste({ producto_id: "", tipo: "ENTRADA", cantidad: "", motivo: "" });
      cargarDatos();
      if (productoSeleccionado) cargarHistorial(productoSeleccionado);
    } catch (err) {
      setError(err.response?.data?.detail || "Error al realizar el ajuste");
    } finally {
      setGuardando(false);
    }
  };

  const getStockColor = (stock) => {
    if (stock <= 0) return { color: "#dc2626", bg: "#fef2f2" };
    if (stock <= 5) return { color: "#f59e0b", bg: "#fffbeb" };
    return { color: "#16a34a", bg: "#f0fdf4" };
  };

  const getTipoColor = (tipo) => {
    if (tipo === "ENTRADA") return { color: "#16a34a", bg: "#f0fdf4" };
    if (tipo === "SALIDA") return { color: "#dc2626", bg: "#fef2f2" };
    return { color: "#f59e0b", bg: "#fffbeb" };
  };

  const formatFecha = (fecha) => new Date(fecha).toLocaleString("es-CO", {
    day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit"
  });

  return (
    <Layout>
      {/* HEADER */}
      <div style={styles.header}>
        <div>
          <h1 style={styles.title}>Gestión de Inventario</h1>
          <p style={styles.subtitle}>Control de stock y movimientos</p>
        </div>
        <button onClick={() => setModalAjuste(true)} style={styles.btnPrimario}>
          ⚖️ Ajuste manual
        </button>
      </div>

      {/* RESUMEN STOCK CRÍTICO */}
      {stockCritico.length > 0 && (
        <div style={styles.alertaBanner}>
          <span style={styles.alertaIcon}>⚠️</span>
          <span style={styles.alertaTexto}>
            <strong>{stockCritico.length} producto(s)</strong> con stock crítico (≤10 unidades)
          </span>
        </div>
      )}

      {/* TABS */}
      <div style={styles.tabs}>
        {[
          { key: "critico", label: "⚠️ Stock crítico", count: stockCritico.length },
          { key: "kardex", label: "📋 Kardex", count: null },
        ].map(t => (
          <button key={t.key} onClick={() => setTab(t.key)}
            style={{ ...styles.tab, borderBottom: tab === t.key ? "3px solid #16a34a" : "3px solid transparent", color: tab === t.key ? "#16a34a" : "#6b7280", fontWeight: tab === t.key ? "700" : "400" }}>
            {t.label}
            {t.count !== null && <span style={{ ...styles.tabBadge, backgroundColor: t.count > 0 ? "#dc2626" : "#e5e7eb", color: t.count > 0 ? "#fff" : "#6b7280" }}>{t.count}</span>}
          </button>
        ))}
      </div>

      {/* TAB: STOCK CRÍTICO */}
      {tab === "critico" && (
        <div style={styles.tableCard}>
          {loading ? (
            <div style={styles.emptyBox}>Cargando inventario...</div>
          ) : stockCritico.length === 0 ? (
            <div style={styles.emptyBox}>
              <p style={{ fontSize: "48px", margin: "0 0 12px 0" }}>✅</p>
              <p>¡Todos los productos tienen stock suficiente!</p>
            </div>
          ) : (
            <table style={styles.table}>
              <thead>
                <tr>
                  {["Producto", "Sucursal", "Stock actual", "Estado"].map(h => (
                    <th key={h} style={styles.th}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {stockCritico.map((p, i) => {
                  const { color, bg } = getStockColor(p.stock);
                  return (
                    <tr key={i} style={{ backgroundColor: i % 2 === 0 ? "#f9fafb" : "#fff" }}>
                      <td style={styles.td}>
                        <span style={styles.prodNombre}>{p.nombre}</span>
                      </td>
                      <td style={styles.td}>{p.sucursal_nombre}</td>
                      <td style={styles.td}>
                        <span style={{ ...styles.stockBadge, color, backgroundColor: bg }}>
                          {p.stock} uds
                        </span>
                      </td>
                      <td style={styles.td}>
                        <span style={{ fontSize: "13px", color }}>
                          {p.stock <= 0 ? "🔴 Agotado" : "🟡 Stock bajo"}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* TAB: KARDEX */}
      {tab === "kardex" && (
        <div style={styles.kardexBox}>
          <div style={styles.kardexSelector}>
            <label style={styles.label}>Selecciona un producto para ver su historial:</label>
            <select value={productoSeleccionado} onChange={(e) => setProductoSeleccionado(e.target.value)} style={styles.select}>
              <option value="">Seleccionar producto...</option>
              {productos.map(p => <option key={p.id} value={p.id}>{p.nombre}</option>)}
            </select>
          </div>

          {!productoSeleccionado ? (
            <div style={styles.emptyBox}>Selecciona un producto para ver su Kardex</div>
          ) : loadingHistorial ? (
            <div style={styles.emptyBox}>Cargando historial...</div>
          ) : historial.length === 0 ? (
            <div style={styles.emptyBox}>No hay movimientos registrados para este producto</div>
          ) : (
            <div style={styles.tableCard}>
              <table style={styles.table}>
                <thead>
                  <tr>
                    {["Fecha", "Tipo", "Cantidad", "Motivo"].map(h => (
                      <th key={h} style={styles.th}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {historial.map((mov, i) => {
                    const { color, bg } = getTipoColor(mov.tipo);
                    return (
                      <tr key={mov.id} style={{ backgroundColor: i % 2 === 0 ? "#f9fafb" : "#fff" }}>
                        <td style={styles.td}>{formatFecha(mov.fecha)}</td>
                        <td style={styles.td}>
                          <span style={{ ...styles.stockBadge, color, backgroundColor: bg }}>{mov.tipo}</span>
                        </td>
                        <td style={styles.td}>
                          <span style={{ fontWeight: "700", color: mov.tipo === "ENTRADA" ? "#16a34a" : "#dc2626" }}>
                            {mov.tipo === "ENTRADA" ? "+" : "-"}{mov.cantidad}
                          </span>
                        </td>
                        <td style={styles.td}>{mov.motivo || "—"}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* MODAL AJUSTE */}
      {modalAjuste && (
        <div style={styles.overlay} onClick={() => setModalAjuste(false)}>
          <div style={styles.modal} onClick={e => e.stopPropagation()}>
            <div style={styles.modalHeader}>
              <h2 style={styles.modalTitle}>Ajuste manual de stock</h2>
              <button onClick={() => setModalAjuste(false)} style={styles.closeBtn}>✕</button>
            </div>
            <form onSubmit={handleAjuste} style={styles.modalForm}>
              <div style={styles.fieldGroup}>
                <label style={styles.label}>Producto</label>
                <select value={formAjuste.producto_id} onChange={(e) => setFormAjuste({ ...formAjuste, producto_id: e.target.value })} required style={styles.select}>
                  <option value="">Seleccionar...</option>
                  {productos.map(p => <option key={p.id} value={p.id}>{p.nombre} (Stock: {p.stock})</option>)}
                </select>
              </div>
              <div style={styles.row}>
                <div style={{ ...styles.fieldGroup, flex: 1 }}>
                  <label style={styles.label}>Tipo de ajuste</label>
                  <select value={formAjuste.tipo} onChange={(e) => setFormAjuste({ ...formAjuste, tipo: e.target.value })} style={styles.select}>
                    <option value="ENTRADA">➕ Entrada</option>
                    <option value="SALIDA">➖ Salida</option>
                    <option value="AJUSTE">⚖️ Ajuste</option>
                  </select>
                </div>
                <div style={{ ...styles.fieldGroup, flex: 1 }}>
                  <label style={styles.label}>Cantidad</label>
                  <input type="number" value={formAjuste.cantidad} onChange={(e) => setFormAjuste({ ...formAjuste, cantidad: e.target.value })}
                    placeholder="0" required min="1" style={styles.input}
                    onFocus={(e) => (e.target.style.borderColor = "#16a34a")}
                    onBlur={(e) => (e.target.style.borderColor = "#d1d5db")} />
                </div>
              </div>
              <div style={styles.fieldGroup}>
                <label style={styles.label}>Motivo</label>
                <input type="text" value={formAjuste.motivo} onChange={(e) => setFormAjuste({ ...formAjuste, motivo: e.target.value })}
                  placeholder="Ej: Merma, daño, conteo físico..." style={styles.input}
                  onFocus={(e) => (e.target.style.borderColor = "#16a34a")}
                  onBlur={(e) => (e.target.style.borderColor = "#d1d5db")} />
              </div>
              {error && <div style={styles.errorBox}>⚠ {error}</div>}
              <div style={styles.modalFooter}>
                <button type="button" onClick={() => setModalAjuste(false)} style={styles.btnCancelar}>Cancelar</button>
                <button type="submit" disabled={guardando} style={{ ...styles.btnPrimario, opacity: guardando ? 0.7 : 1 }}>
                  {guardando ? "Guardando..." : "Aplicar ajuste"}
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
  header: { display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "20px" },
  title: { fontSize: "26px", fontWeight: "700", color: "#14532d", margin: "0 0 4px 0" },
  subtitle: { fontSize: "13px", color: "#6b7280", margin: 0 },
  btnPrimario: { padding: "10px 20px", backgroundColor: "#16a34a", color: "#fff", border: "none", borderRadius: "8px", cursor: "pointer", fontSize: "14px", fontWeight: "600" },
  alertaBanner: { display: "flex", alignItems: "center", gap: "12px", padding: "12px 20px", backgroundColor: "#fffbeb", border: "1px solid #fde68a", borderRadius: "10px", marginBottom: "20px" },
  alertaIcon: { fontSize: "20px" },
  alertaTexto: { fontSize: "14px", color: "#92400e" },
  tabs: { display: "flex", gap: "4px", borderBottom: "1px solid #e5e7eb", marginBottom: "20px" },
  tab: { padding: "10px 20px", background: "none", border: "none", cursor: "pointer", fontSize: "14px", display: "flex", alignItems: "center", gap: "8px" },
  tabBadge: { padding: "2px 8px", borderRadius: "20px", fontSize: "11px", fontWeight: "700" },
  tableCard: { backgroundColor: "#fff", borderRadius: "12px", border: "1px solid #e5e7eb", overflow: "hidden" },
  table: { width: "100%", borderCollapse: "collapse" },
  th: { textAlign: "left", padding: "12px 16px", fontSize: "11px", fontWeight: "700", color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.5px", borderBottom: "2px solid #e5e7eb", backgroundColor: "#f9fafb" },
  td: { padding: "12px 16px", fontSize: "14px", color: "#374151", borderBottom: "1px solid #f3f4f6" },
  prodNombre: { fontWeight: "600", color: "#111827" },
  stockBadge: { padding: "4px 12px", borderRadius: "20px", fontSize: "12px", fontWeight: "700" },
  emptyBox: { padding: "60px", textAlign: "center", color: "#6b7280", fontSize: "15px" },
  kardexBox: { display: "flex", flexDirection: "column", gap: "16px" },
  kardexSelector: { backgroundColor: "#fff", borderRadius: "12px", border: "1px solid #e5e7eb", padding: "20px", display: "flex", flexDirection: "column", gap: "10px" },
  label: { fontSize: "12px", fontWeight: "600", color: "#374151", textTransform: "uppercase", letterSpacing: "0.5px" },
  select: { padding: "10px 14px", fontSize: "14px", border: "1.5px solid #d1d5db", borderRadius: "8px", outline: "none", backgroundColor: "#fff" },
  overlay: { position: "fixed", inset: 0, backgroundColor: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 },
  modal: { backgroundColor: "#fff", borderRadius: "16px", padding: "32px", width: "100%", maxWidth: "480px" },
  modalHeader: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" },
  modalTitle: { fontSize: "20px", fontWeight: "700", color: "#14532d", margin: 0 },
  closeBtn: { background: "none", border: "none", fontSize: "18px", cursor: "pointer", color: "#6b7280" },
  modalForm: { display: "flex", flexDirection: "column", gap: "16px" },
  fieldGroup: { display: "flex", flexDirection: "column", gap: "6px" },
  row: { display: "flex", gap: "12px" },
  input: { padding: "10px 14px", fontSize: "14px", border: "1.5px solid #d1d5db", borderRadius: "8px", outline: "none", transition: "border-color 0.2s" },
  errorBox: { padding: "10px 14px", backgroundColor: "#fef2f2", border: "1px solid #fecaca", borderRadius: "8px", color: "#dc2626", fontSize: "13px" },
  modalFooter: { display: "flex", justifyContent: "flex-end", gap: "12px", marginTop: "8px" },
  btnCancelar: { padding: "10px 18px", backgroundColor: "#f3f4f6", color: "#374151", border: "none", borderRadius: "8px", cursor: "pointer", fontSize: "14px", fontWeight: "600" },
};