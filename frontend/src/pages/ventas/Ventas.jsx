import { useState, useEffect } from "react";
import Layout from "../../components/Layout";
import api from "../../api/axios";

export default function Ventas() {
  const [ventas, setVentas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [ventaDetalle, setVentaDetalle] = useState(null);
  const [fechaDesde, setFechaDesde] = useState("");
  const [fechaHasta, setFechaHasta] = useState("");
  const [busqueda, setBusqueda] = useState("");

  const cargarDatos = async () => {
    setLoading(true);
    try {
      const res = await api.get("/ventas/");
      setVentas(res.data);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  useEffect(() => { cargarDatos(); }, []);

  const handleAnular = async (id) => {
    if (!confirm("¿Anular esta venta? El stock será restaurado.")) return;
    try { await api.post(`/ventas/anular/${id}`); cargarDatos(); }
    catch (err) { alert(err.response?.data?.detail || "Error al anular"); }
  };

  const formatCOP = (val) => `$${Number(val).toLocaleString("es-CO")}`;
  const formatFecha = (f) => new Date(f).toLocaleString("es-CO", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" });

  const getEstadoStyle = (estado) => estado === "COMPLETADA"
    ? { color: "#16a34a", bg: "#f0fdf4" }
    : { color: "#dc2626", bg: "#fef2f2" };

  // ✅ FILTRO POR FECHA Y BÚSQUEDA
  const ventasFiltradas = ventas.filter(v => {
    const fechaVenta = new Date(v.fecha);
    const desde = fechaDesde ? new Date(fechaDesde) : null;
    const hasta = fechaHasta ? new Date(fechaHasta + "T23:59:59") : null;
    const matchFecha = (!desde || fechaVenta >= desde) && (!hasta || fechaVenta <= hasta);
    const matchBusqueda = String(v.id).includes(busqueda) || v.medio_pago.toLowerCase().includes(busqueda.toLowerCase());
    return matchFecha && matchBusqueda;
  });

  const totalFiltrado = ventasFiltradas.filter(v => v.estado === "COMPLETADA").reduce((s, v) => s + v.total, 0);

  const limpiarFiltros = () => { setFechaDesde(""); setFechaHasta(""); setBusqueda(""); };

  return (
    <Layout>
      <div style={styles.header}>
        <div>
          <h1 style={styles.title}>Historial de Ventas</h1>
          <p style={styles.subtitle}>{ventasFiltradas.length} ventas encontradas</p>
        </div>
        <div style={styles.totalBox}>
          <span style={styles.totalLabel}>Total filtrado</span>
          <span style={styles.totalValor}>{formatCOP(totalFiltrado)}</span>
        </div>
      </div>

      {/* ✅ FILTROS */}
      <div style={styles.filtrosCard}>
        <div style={styles.filtrosRow}>
          <div style={styles.filtroGroup}>
            <label style={styles.label}>🔍 Buscar</label>
            <input type="text" placeholder="# Factura o medio de pago..." value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)} style={styles.input} />
          </div>
          <div style={styles.filtroGroup}>
            <label style={styles.label}>📅 Desde</label>
            <input type="date" value={fechaDesde} onChange={(e) => setFechaDesde(e.target.value)} style={styles.input} />
          </div>
          <div style={styles.filtroGroup}>
            <label style={styles.label}>📅 Hasta</label>
            <input type="date" value={fechaHasta} onChange={(e) => setFechaHasta(e.target.value)} style={styles.input} />
          </div>
          <button onClick={limpiarFiltros} style={styles.btnLimpiar}>✕ Limpiar</button>
        </div>
      </div>

      <div style={styles.tableCard}>
        {loading ? <div style={styles.empty}>Cargando ventas...</div>
          : ventasFiltradas.length === 0 ? (
            <div style={styles.empty}>
              <p style={{ fontSize: "48px", margin: "0 0 12px 0" }}>🧾</p>
              <p>No hay ventas con estos filtros</p>
              <button onClick={limpiarFiltros} style={styles.btnPrimario}>Limpiar filtros</button>
            </div>
          ) : (
            <table style={styles.table}>
              <thead>
                <tr>{["# Factura", "Fecha", "Total", "Descuento", "Medio pago", "Estado", "Acciones"].map(h => <th key={h} style={styles.th}>{h}</th>)}</tr>
              </thead>
              <tbody>
                {ventasFiltradas.map((v, i) => {
                  const { color, bg } = getEstadoStyle(v.estado);
                  const tieneDescuento = (v.descuento_porcentaje > 0) || (v.descuento_valor > 0);
                  return (
                    <tr key={v.id} style={{ backgroundColor: i % 2 === 0 ? "#f9fafb" : "#fff" }}>
                      <td style={styles.td}><span style={styles.facturaId}>#{v.id}</span></td>
                      <td style={styles.td}>{formatFecha(v.fecha)}</td>
                      <td style={{ ...styles.td, fontWeight: "700", color: "#16a34a" }}>{formatCOP(v.total)}</td>
                      <td style={styles.td}>
                        {tieneDescuento ? (
                          <span style={styles.descuentoBadge}>
                            {v.descuento_porcentaje > 0 ? `${v.descuento_porcentaje}%` : formatCOP(v.descuento_valor)}
                          </span>
                        ) : <span style={{ color: "#9ca3af" }}>—</span>}
                      </td>
                      <td style={styles.td}><span style={styles.badge}>{v.medio_pago}</span></td>
                      <td style={styles.td}><span style={{ ...styles.estadoBadge, color, backgroundColor: bg }}>{v.estado}</span></td>
                      <td style={styles.td}>
                        <div style={styles.acciones}>
                          <button onClick={() => setVentaDetalle(v)} style={styles.btnVer}>👁️ Ver</button>
                          {v.estado === "COMPLETADA" && (
                            <button onClick={() => handleAnular(v.id)} style={styles.btnAnular}>❌ Anular</button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
      </div>

      {/* MODAL DETALLE */}
      {ventaDetalle && (
        <div style={styles.overlay} onClick={() => setVentaDetalle(null)}>
          <div style={styles.modal} onClick={e => e.stopPropagation()}>
            <div style={styles.modalHeader}>
              <h2 style={styles.modalTitle}>Factura #{ventaDetalle.id}</h2>
              <button onClick={() => setVentaDetalle(null)} style={styles.closeBtn}>✕</button>
            </div>
            <div style={styles.facturaInfo}>
              <div style={styles.facturaRow}><span>Fecha:</span><span>{formatFecha(ventaDetalle.fecha)}</span></div>
              <div style={styles.facturaRow}><span>Medio de pago:</span><span>{ventaDetalle.medio_pago}</span></div>
              <div style={styles.facturaRow}><span>Estado:</span><span>{ventaDetalle.estado}</span></div>
              {ventaDetalle.pago_con > 0 && <div style={styles.facturaRow}><span>Pago con:</span><span>{formatCOP(ventaDetalle.pago_con)}</span></div>}
              {ventaDetalle.cambio > 0 && <div style={styles.facturaRow}><span>Cambio:</span><span>{formatCOP(ventaDetalle.cambio)}</span></div>}
              {ventaDetalle.descuento_porcentaje > 0 && <div style={styles.facturaRow}><span style={{ color: "#f59e0b" }}>Descuento:</span><span style={{ color: "#f59e0b" }}>{ventaDetalle.descuento_porcentaje}%</span></div>}
              {ventaDetalle.descuento_valor > 0 && <div style={styles.facturaRow}><span style={{ color: "#f59e0b" }}>Descuento:</span><span style={{ color: "#f59e0b" }}>{formatCOP(ventaDetalle.descuento_valor)}</span></div>}
            </div>
            <table style={{ ...styles.table, marginTop: "16px" }}>
              <thead><tr>{["Producto", "Cantidad", "P. Unitario", "Subtotal"].map(h => <th key={h} style={styles.th}>{h}</th>)}</tr></thead>
              <tbody>
                {ventaDetalle.detalles?.map((d, i) => (
                  <tr key={i} style={{ backgroundColor: i % 2 === 0 ? "#f9fafb" : "#fff" }}>
                    <td style={styles.td}>Producto #{d.producto_id}</td>
                    <td style={styles.td}>{d.cantidad}</td>
                    <td style={styles.td}>{formatCOP(d.precio_unitario)}</td>
                    <td style={{ ...styles.td, fontWeight: "700", color: "#16a34a" }}>{formatCOP(d.subtotal)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div style={styles.facturaTotal}>
              <span style={{ fontWeight: "700", fontSize: "16px" }}>TOTAL</span>
              <span style={{ fontWeight: "700", fontSize: "20px", color: "#16a34a" }}>{formatCOP(ventaDetalle.total)}</span>
            </div>
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
  totalBox: { backgroundColor: "#052e16", borderRadius: "10px", padding: "12px 24px", display: "flex", flexDirection: "column", alignItems: "flex-end" },
  totalLabel: { fontSize: "11px", color: "rgba(255,255,255,0.6)", textTransform: "uppercase", letterSpacing: "1px" },
  totalValor: { fontSize: "22px", fontWeight: "700", color: "#4ade80" },
  filtrosCard: { backgroundColor: "#fff", borderRadius: "12px", border: "1px solid #e5e7eb", padding: "16px 20px", marginBottom: "16px" },
  filtrosRow: { display: "flex", alignItems: "flex-end", gap: "12px", flexWrap: "wrap" },
  filtroGroup: { display: "flex", flexDirection: "column", gap: "6px", flex: 1, minWidth: "150px" },
  label: { fontSize: "11px", fontWeight: "600", color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.5px" },
  input: { padding: "8px 12px", border: "1.5px solid #d1d5db", borderRadius: "8px", fontSize: "14px", outline: "none" },
  btnLimpiar: { padding: "8px 16px", backgroundColor: "#f3f4f6", color: "#6b7280", border: "none", borderRadius: "8px", cursor: "pointer", fontSize: "13px", fontWeight: "600", alignSelf: "flex-end" },
  btnPrimario: { padding: "10px 20px", backgroundColor: "#16a34a", color: "#fff", border: "none", borderRadius: "8px", cursor: "pointer", fontSize: "14px", fontWeight: "600" },
  tableCard: { backgroundColor: "#fff", borderRadius: "12px", border: "1px solid #e5e7eb", overflow: "hidden" },
  table: { width: "100%", borderCollapse: "collapse" },
  th: { textAlign: "left", padding: "12px 16px", fontSize: "11px", fontWeight: "700", color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.5px", borderBottom: "2px solid #e5e7eb", backgroundColor: "#f9fafb" },
  td: { padding: "12px 16px", fontSize: "14px", color: "#374151", borderBottom: "1px solid #f3f4f6" },
  facturaId: { fontWeight: "700", color: "#14532d", fontSize: "15px" },
  badge: { padding: "3px 10px", backgroundColor: "#f0fdf4", color: "#16a34a", borderRadius: "20px", fontSize: "12px", fontWeight: "600" },
  descuentoBadge: { padding: "3px 10px", backgroundColor: "#fffbeb", color: "#f59e0b", borderRadius: "20px", fontSize: "12px", fontWeight: "700" },
  estadoBadge: { padding: "3px 10px", borderRadius: "20px", fontSize: "12px", fontWeight: "700" },
  acciones: { display: "flex", gap: "8px" },
  btnVer: { padding: "5px 10px", backgroundColor: "#f0f9ff", color: "#0369a1", border: "1px solid #bae6fd", borderRadius: "6px", cursor: "pointer", fontSize: "12px" },
  btnAnular: { padding: "5px 10px", backgroundColor: "#fef2f2", color: "#dc2626", border: "1px solid #fecaca", borderRadius: "6px", cursor: "pointer", fontSize: "12px" },
  empty: { padding: "60px", textAlign: "center", color: "#6b7280", fontSize: "15px" },
  overlay: { position: "fixed", inset: 0, backgroundColor: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 },
  modal: { backgroundColor: "#fff", borderRadius: "16px", padding: "32px", width: "100%", maxWidth: "560px", maxHeight: "90vh", overflowY: "auto" },
  modalHeader: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" },
  modalTitle: { fontSize: "20px", fontWeight: "700", color: "#14532d", margin: 0 },
  closeBtn: { background: "none", border: "none", fontSize: "18px", cursor: "pointer", color: "#6b7280" },
  facturaInfo: { display: "flex", flexDirection: "column", gap: "8px", backgroundColor: "#f9fafb", borderRadius: "10px", padding: "16px" },
  facturaRow: { display: "flex", justifyContent: "space-between", fontSize: "14px", color: "#374151" },
  facturaTotal: { display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "16px", padding: "16px", backgroundColor: "#f0fdf4", borderRadius: "10px" },
};